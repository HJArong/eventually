/**
 * pnpm db:check     connect with DATABASE_URL and report what's wrong, if anything
 * pnpm db:migrate   apply supabase/migrations/*.sql
 * pnpm db:seed      migrate, then wipe and load the Cebu demo data
 */
import { config } from "@/lib/config";
import { getHandle, runMigrations } from "@/lib/db";
import { describeDbError, describeTarget, isSupabasePooler, parseDatabaseUrl } from "@/lib/db/connection";
import { seedDatabase } from "@/supabase/seed";

async function main() {
  const cmd = process.argv[2];
  process.env.EVENTUALLY_SKIP_AUTO_INIT = "true";
  if (config.databaseUrl) {
    const url = parseDatabaseUrl(config.databaseUrl);
    console.log(`Target: ${describeTarget(url)} as ${url.user}`);
    if (cmd !== "check" && isSupabasePooler(url.host) && url.port === 6543) {
      console.log("Tip: migrations and seeding are faster and safer through the session pooler (same host, port 5432).");
    }
  } else {
    console.log("Target: local PGlite (DATABASE_URL is not set)");
  }
  const handle = await getHandle();
  try {
    if (cmd === "check") {
      const { rows } = await handle.db.execute<{ v: string; t: string | null; n: number | null }>(
        "select current_setting('server_version') as v, to_regclass('public.profiles')::text as t, (select count(*)::int from pg_namespace where nspname = 'auth') as n",
      );
      const r = rows[0]!;
      console.log(`Connected: Postgres ${r.v}${r.n ? " (Supabase auth schema present)" : ""}`);
      if (!r.t) {
        console.log("No Eventually tables yet: run pnpm db:seed (or db:migrate).");
      } else {
        const { rows: c } = await handle.db.execute<{ n: number }>("select count(*)::int as n from profiles where is_demo");
        console.log(`Schema present; ${c[0]?.n ?? 0} demo profiles.`);
      }
      return;
    }
    const ran = await runMigrations(handle);
    console.log(ran.length ? `Applied migrations: ${ran.join(", ")}` : "Migrations up to date");
    if (cmd === "seed") {
      const started = Date.now();
      const summary = await seedDatabase(handle.db);
      console.log(`Seeded in ${Date.now() - started}ms`, summary);
    }
  } finally {
    await handle.close();
  }
}

main().catch((err) => {
  console.error(`Database ${process.argv[2] ?? "command"} failed: ${describeDbError(err)}`);
  process.exit(1);
});
