import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/** Finds or creates the profile for a signed-in identity. With Supabase, `id` is auth.users.id. */
export async function upsertProfile(db: DB, input: { email: string; id?: string; displayName?: string | null }) {
  const email = input.email.toLowerCase();
  const [existing] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  if (existing) return existing;
  const fallbackName = email.split("@")[0]!.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const [created] = await db
    .insert(profiles)
    .values({ ...(input.id ? { id: input.id } : {}), email, displayName: input.displayName || fallbackName })
    .returning();
  return created!;
}
