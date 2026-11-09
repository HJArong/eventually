/**
 * pnpm db:migrate   apply supabase/migrations/*.sql
 * pnpm db:seed      migrate, then wipe and load the Cebu demo data
 */
import { getHandle, runMigrations } from "@/lib/db";
import { seedDatabase } from "@/supabase/seed";

async function main() {
  const cmd = process.argv[2];
  process.env.EVENTUALLY_SKIP_AUTO_INIT = "true";
  const handle = await getHandle();
  try {
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
  console.error(err);
  process.exit(1);
});
