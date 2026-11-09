"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { follows, likes, saves, vendors } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/queries/events";
import { ensureThread } from "@/lib/services/bookings";

const uuid = z.string().uuid();

export async function toggleFollow(vendorId: string) {
  const viewer = await requireRole("planner");
  const id = uuid.parse(vendorId);
  const db = await getDb();
  const where = and(eq(follows.profileId, viewer.id), eq(follows.vendorId, id));
  const [existing] = await db.select().from(follows).where(where);
  if (existing) await db.delete(follows).where(where);
  else await db.insert(follows).values({ profileId: viewer.id, vendorId: id }).onConflictDoNothing();
  revalidatePath("/feed");
  return !existing;
}

export async function toggleLike(postId: string) {
  const viewer = await requireRole("planner");
  const id = uuid.parse(postId);
  const db = await getDb();
  const where = and(eq(likes.profileId, viewer.id), eq(likes.postId, id));
  const [existing] = await db.select().from(likes).where(where);
  if (existing) await db.delete(likes).where(where);
  else await db.insert(likes).values({ profileId: viewer.id, postId: id }).onConflictDoNothing();
  return !existing;
}

export async function toggleSave(postId: string) {
  const viewer = await requireRole("planner");
  const id = uuid.parse(postId);
  const db = await getDb();
  const where = and(eq(saves.profileId, viewer.id), eq(saves.postId, id));
  const [existing] = await db.select().from(saves).where(where);
  if (existing) await db.delete(saves).where(where);
  else await db.insert(saves).values({ profileId: viewer.id, postId: id }).onConflictDoNothing();
  revalidatePath("/saved");
  return !existing;
}

export async function messageVendor(formData: FormData) {
  const viewer = await requireRole("planner");
  const vendorId = uuid.parse(formData.get("vendorId"));
  const db = await getDb();
  const event = await getCurrentEvent(viewer.id);
  if (!event) redirect("/onboarding/planner");
  const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, vendorId));
  if (!vendor) redirect("/search");
  const thread = await ensureThread(db, event.id, vendor.id, viewer.id);
  redirect(`/inbox/${thread.id}`);
}
