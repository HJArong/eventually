import fs from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { config, serverless } from "@/lib/config";
import { describeDbError, describeTarget, parseDatabaseUrl, pgPoolConfig } from "./connection";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

type RawExec = (sql: string) => Promise<unknown>;
type Handle = {
  db: DB;
  exec: RawExec;
  close: () => Promise<void>;
  kind: "pglite" | "postgres";
  ephemeral: boolean;
  pool?: Pool;
};

const globalForDb = globalThis as unknown as { __eventuallyDb?: Promise<Handle> };

/** PGlite data dir, or null for in-memory when the configured dir can't be written (read-only host). */
function pgliteDataDir(): string | null {
  if (config.pgliteDir === "memory") return null;
  const dir = path.resolve(config.pgliteDir);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch (err) {
    console.warn(`[eventually] PGlite dir ${dir} is not writable (${(err as Error).message}); using an in-memory database.`);
    return null;
  }
}

async function connect(): Promise<Handle> {
  if (config.databaseUrl) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool(pgPoolConfig(config.databaseUrl, { serverless }));
    pool.on("error", (err) => console.warn(`[eventually] idle database connection dropped: ${describeDbError(err)}`));
    return {
      db: drizzle(pool, { schema }),
      exec: (sql) => pool.query(sql),
      close: () => pool.end(),
      kind: "postgres",
      ephemeral: false,
      pool,
    };
  }
  if (serverless && !config.demoMode) {
    throw new Error(
      "DATABASE_URL is not set. With DEMO_MODE=false a serverless deployment needs a hosted Postgres (Supabase or Neon): set DATABASE_URL and run `pnpm db:migrate`.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { pg_trgm } = await import("@electric-sql/pglite/contrib/pg_trgm");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dir = pgliteDataDir();
  if (!dir && serverless) {
    console.warn(
      "[eventually] DATABASE_URL is not set: serving the demo from an in-memory database. Changes reset on cold start and are not shared between instances.",
    );
  }
  const client = await PGlite.create(dir ?? "memory://", { extensions: { pg_trgm } });
  return {
    db: drizzle(client, { schema }) as unknown as DB,
    exec: (sql) => client.exec(sql),
    close: () => client.close(),
    kind: "pglite",
    ephemeral: !dir,
  };
}

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

/**
 * Applies pending migrations. Each file runs in its own transaction unless `inTransaction`, where the
 * caller already holds one (and an advisory lock) on a dedicated connection.
 */
export async function runMigrations(
  handle: Pick<Handle, "db" | "exec">,
  { inTransaction = false }: { inTransaction?: boolean } = {},
): Promise<string[]> {
  await handle.exec(
    "create table if not exists _eventually_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set(
    (await handle.db.execute<{ name: string }>("select name from _eventually_migrations")).rows.map((r) => r.name),
  );
  // Migrations applied by the Supabase CLI (supabase start / db push) are recorded by version prefix.
  // Checked with to_regclass, not a failing select, so an enclosing transaction isn't aborted.
  const { rows: cliTable } = await handle.db.execute<{ t: string | null }>(
    "select to_regclass('supabase_migrations.schema_migrations')::text as t",
  );
  const { rows: cli } = cliTable[0]?.t
    ? await handle.db.execute<{ version: string }>("select version from supabase_migrations.schema_migrations")
    : { rows: [] as { version: string }[] };
  const cliVersions = new Set(cli.map((r) => r.version));
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file) || cliVersions.has(file.split("_")[0]!)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const body = `${sql}\n;insert into _eventually_migrations (name) values ('${file}');`;
    await handle.exec(inTransaction ? body : `begin;\n${body}\ncommit;`);
    ran.push(file);
  }
  return ran;
}

async function seedIfEmpty(db: DB) {
  const { rows } = await db.execute<{ n: number }>("select count(*)::int as n from areas");
  if (rows[0]?.n === 0 && config.demoMode) {
    const { seedDatabase } = await import("@/supabase/seed");
    await seedDatabase(db);
  }
}

/**
 * Migrate and seed in one transaction under a transaction-scoped advisory lock, so concurrent cold starts
 * wait for each other instead of racing, and a timed-out seed rolls back instead of leaving partial data.
 * Transaction-scoped locks work through Supabase's transaction pooler; session-level locks would not.
 */
async function autoMigrateHosted(pool: Pool) {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext('eventually:auto-migrate'))");
    const db = drizzle(client, { schema });
    await runMigrations({ db, exec: (sql) => client.query(sql) }, { inTransaction: true });
    await seedIfEmpty(db);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function init(): Promise<Handle> {
  const handle = await connect();
  if (process.env.EVENTUALLY_SKIP_AUTO_INIT === "true") return handle;
  // Local PGlite is migrated and seeded on first use so `pnpm dev` works with zero setup.
  // Hosted Postgres is migrated explicitly (pnpm db:seed / db:migrate or the Supabase CLI) unless DB_AUTO_MIGRATE=true.
  if (handle.kind === "pglite") {
    await runMigrations(handle);
    await seedIfEmpty(handle.db);
  } else if (process.env.DB_AUTO_MIGRATE === "true") {
    await autoMigrateHosted(handle.pool!);
  } else {
    const { rows } = await handle.db.execute<{ t: string | null }>("select to_regclass('public.profiles')::text as t");
    if (!rows[0]?.t) {
      throw new Error(
        "the database has no Eventually tables; run `DATABASE_URL=<session pooler url> pnpm db:seed` (or db:migrate), or set DB_AUTO_MIGRATE=true",
      );
    }
  }
  return handle;
}

export function getHandle(): Promise<Handle> {
  if (!globalForDb.__eventuallyDb) {
    globalForDb.__eventuallyDb = init().catch((err) => {
      console.error(`[eventually] database init failed (${dbTarget()}): ${describeDbError(err)}`);
      globalForDb.__eventuallyDb = undefined;
      throw err;
    });
  }
  return globalForDb.__eventuallyDb;
}

function dbTarget(): string {
  if (!config.databaseUrl) return "PGlite";
  try {
    return describeTarget(parseDatabaseUrl(config.databaseUrl));
  } catch {
    return "DATABASE_URL";
  }
}

export async function getDb(): Promise<DB> {
  return (await getHandle()).db;
}

/** In-memory demo database: data resets on cold start and isn't shared across serverless instances. */
export async function isEphemeralDb(): Promise<boolean> {
  return (await getHandle()).ephemeral;
}

export { schema };
