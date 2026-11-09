import fs from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { config } from "@/lib/config";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

type RawExec = (sql: string) => Promise<unknown>;
type Handle = { db: DB; exec: RawExec; close: () => Promise<void>; kind: "pglite" | "postgres" };

const globalForDb = globalThis as unknown as { __eventuallyDb?: Promise<Handle> };

async function connect(): Promise<Handle> {
  if (config.databaseUrl) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: config.databaseUrl, max: 5 });
    return {
      db: drizzle(pool, { schema }),
      exec: (sql) => pool.query(sql),
      close: () => pool.end(),
      kind: "postgres",
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { pg_trgm } = await import("@electric-sql/pglite/contrib/pg_trgm");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dir = path.resolve(config.pgliteDir);
  fs.mkdirSync(dir, { recursive: true });
  const client = await PGlite.create(dir, { extensions: { pg_trgm } });
  return {
    db: drizzle(client, { schema }) as unknown as DB,
    exec: (sql) => client.exec(sql),
    close: () => client.close(),
    kind: "pglite",
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
  }
  return handle;
}

export function getHandle(): Promise<Handle> {
  if (!globalForDb.__eventuallyDb) {
    globalForDb.__eventuallyDb = init().catch((err) => {
      globalForDb.__eventuallyDb = undefined;
      throw err;
    });
  }
  return globalForDb.__eventuallyDb;
}

export async function getDb(): Promise<DB> {
  return (await getHandle()).db;
}

export { schema };
