import fs from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { config, serverless } from "@/lib/config";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

type RawExec = (sql: string) => Promise<unknown>;
type Handle = { db: DB; exec: RawExec; close: () => Promise<void>; kind: "pglite" | "postgres"; ephemeral: boolean };

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
    const pool = new Pool({ connectionString: config.databaseUrl, max: serverless ? 2 : 5 });
    return {
      db: drizzle(pool, { schema }),
      exec: (sql) => pool.query(sql),
      close: () => pool.end(),
      kind: "postgres",
      ephemeral: false,
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

export async function runMigrations(handle: Handle): Promise<string[]> {
  await handle.exec(
    "create table if not exists _eventually_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set(
    (await handle.db.execute<{ name: string }>("select name from _eventually_migrations")).rows.map((r) => r.name),
  );
  // Migrations applied by the Supabase CLI (supabase start / db push) are recorded by version prefix.
  const { rows: cli } = await handle.db
    .execute<{ version: string }>("select version from supabase_migrations.schema_migrations")
    .catch(() => ({ rows: [] as { version: string }[] }));
  const cliVersions = new Set(cli.map((r) => r.version));
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file) || cliVersions.has(file.split("_")[0]!)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    await handle.exec(`begin;\n${sql}\n;insert into _eventually_migrations (name) values ('${file}');\ncommit;`);
    ran.push(file);
  }
  return ran;
}

async function init(): Promise<Handle> {
  const handle = await connect();
  if (process.env.EVENTUALLY_SKIP_AUTO_INIT === "true") return handle;
  // Local PGlite is migrated and seeded on first use so `pnpm dev` works with zero setup.
  // Hosted Postgres is migrated explicitly (pnpm db:migrate or the Supabase CLI) unless DB_AUTO_MIGRATE=true.
  const autoMigrate = handle.kind === "pglite" || process.env.DB_AUTO_MIGRATE === "true";
  if (autoMigrate) {
    await runMigrations(handle);
    const { rows } = await handle.db.execute<{ n: number }>("select count(*)::int as n from areas");
    if (rows[0]?.n === 0 && config.demoMode) {
      const { seedDatabase } = await import("@/supabase/seed");
      await seedDatabase(handle.db);
    }
  } else {
    const { rows } = await handle.db.execute<{ t: string | null }>("select to_regclass('public.profiles')::text as t");
    if (!rows[0]?.t) {
      throw new Error(
        "The database at DATABASE_URL has no Eventually tables. Run `DATABASE_URL=... pnpm db:seed` (or db:migrate), or set DB_AUTO_MIGRATE=true.",
      );
    }
  }
  return handle;
}

export function getHandle(): Promise<Handle> {
  if (!globalForDb.__eventuallyDb) {
    globalForDb.__eventuallyDb = init().catch((err) => {
      console.error("[eventually] database init failed:", err);
      globalForDb.__eventuallyDb = undefined;
      throw err;
    });
  }
  return globalForDb.__eventuallyDb;
}

export async function getDb(): Promise<DB> {
  return (await getHandle()).db;
}

/** In-memory demo database: data resets on cold start and isn't shared across serverless instances. */
export async function isEphemeralDb(): Promise<boolean> {
  return (await getHandle()).ephemeral;
}

export { schema };
