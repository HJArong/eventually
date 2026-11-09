"use server";

import { eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { packages } from "@/lib/db/schema";
import { endSession, requireRole, requireViewer } from "@/lib/auth/session";
import { seedDatabase } from "@/supabase/seed";

export async function resetDemoAction() {
  if (!config.demoMode) throw new Error("Demo reset is disabled");
  await requireViewer();
  await seedDatabase(await getDb());
  await endSession();
  redirect("/sign-in?reset=1#demo");
}

export async function togglePackagePublished(formData: FormData) {
  await requireRole("admin");
  const id = z.string().uuid().parse(formData.get("packageId"));
  const db = await getDb();
  await db.update(packages).set({ isPublished: not(packages.isPublished) }).where(eq(packages.id, id));
  revalidatePath("/admin");
}
