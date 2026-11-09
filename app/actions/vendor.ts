"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { media, postTags, posts, services, vendorAreas, vendorBlockedDates, vendors } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/session";
import { ownedVendor, requireOwnedVendor } from "@/lib/services/access";
import { isFile, saveImage, UploadError } from "@/lib/storage";
import { slugify, todayISO } from "@/lib/format";

export type VendorFormState = { error?: string; ok?: boolean };

const SAMPLE_PREFIX = "/seed/";

async function collectPhotos(formData: FormData, field = "photos", sampleField = "samplePhotos") {
  const urls: string[] = [];
  for (const entry of formData.getAll(field)) if (isFile(entry)) urls.push(await saveImage(entry));
  for (const s of formData.getAll(sampleField)) {
    const v = String(s);
    if (v.startsWith(SAMPLE_PREFIX) && /^\/seed\/[a-z0-9-]+\.webp$/.test(v)) urls.push(v);
  }
  return urls;
}

const shopSchema = z.object({
  name: z.string().trim().min(2, "Shop name is required").max(80),
  link: z.string().trim().max(200).optional(),
  categoryId: z.coerce.number().int().positive("Pick a category"),
  baseAreaId: z.coerce.number().int().positive(),
  startingPricePhp: z.coerce.number().int().min(0).max(10_000_000),
  bio: z.string().trim().max(600).optional(),
});

export async function createShopAction(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  if (await ownedVendor(db, viewer)) redirect("/vendor");
  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const areaIds = formData.getAll("areas").map(Number).filter(Boolean);
  if (!areaIds.length) return { error: "Pick at least one area you serve" };
  let photos: string[];
  try {
    photos = await collectPhotos(formData);
  } catch (err) {
    return { error: err instanceof UploadError ? err.message : "Upload failed" };
  }
  if (photos.length < 3) return { error: "Add at least 3 photos of your work" };

  const d = parsed.data;
  const link = d.link || null;
  const base = slugify(d.name) || "shop";
  const [taken] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.slug, base));
  const slug = taken ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
  const price = d.startingPricePhp;
  await db.transaction(async (tx) => {
    const [vendor] = await tx
      .insert(vendors)
      .values({
        ownerId: viewer.id,
        name: d.name,
        slug,
        categoryId: d.categoryId,
        baseAreaId: areaIds.includes(d.baseAreaId) ? d.baseAreaId : areaIds[0]!,
        tagline: "New on Eventually",
        bio: d.bio ?? "",
        fbUrl: link?.includes("facebook") ? link : null,
        igUrl: link?.includes("instagram") ? link : null,
        startingPricePhp: price,
        priceBand: price < 10_000 ? 1 : price < 40_000 ? 2 : 3,
        coverUrl: photos[0],
        autoRespond: false,
      })
      .returning();
    await tx.insert(vendorAreas).values(areaIds.map((areaId) => ({ vendorId: vendor!.id, areaId })));
    await tx.insert(media).values(photos.map((url, i) => ({ ownerType: "vendor" as const, ownerId: vendor!.id, url, sort: i })));
  });
  redirect("/vendor/services?onboarding=1");
}

const serviceSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(2, "Name the service").max(100),
  description: z.string().trim().max(300).optional().default(""),
  pricePhp: z.coerce.number().int().min(0, "Price can't be negative").max(10_000_000),
  unit: z.enum(["per_pax", "per_item", "flat", "per_hour"]),
});

export async function saveServiceAction(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(services).set(data).where(and(eq(services.id, id), eq(services.vendorId, vendor.id)));
  } else {
    const existing = await db.select({ id: services.id }).from(services).where(eq(services.vendorId, vendor.id));
    await db.insert(services).values({ ...data, vendorId: vendor.id, sort: existing.length });
  }
  const all = await db.select({ p: services.pricePhp }).from(services).where(eq(services.vendorId, vendor.id));
  if (all.length) await db.update(vendors).set({ startingPricePhp: Math.min(...all.map((s) => s.p)) }).where(eq(vendors.id, vendor.id));
  revalidatePath("/vendor/services");
  return { ok: true };
}

export async function deleteServiceAction(formData: FormData) {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  const id = z.string().uuid().parse(formData.get("id"));
  await db.delete(services).where(and(eq(services.id, id), eq(services.vendorId, vendor.id)));
  revalidatePath("/vendor/services");
}

const postSchema = z.object({
  caption: z.string().trim().min(3, "Write a short caption").max(600),
  areaId: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  linkedServiceId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
});

export async function createPostAction(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  let photos: string[];
  try {
    photos = await collectPhotos(formData);
  } catch (err) {
    return { error: err instanceof UploadError ? err.message : "Upload failed" };
  }
  if (!photos.length) return { error: "Add at least one photo" };
  if (photos.length > 8) return { error: "Up to 8 photos per post" };
  const tags = [...new Set(formData.getAll("tags").map(String))];
  const d = parsed.data;
  if (d.linkedServiceId) {
    const [svc] = await db.select().from(services).where(and(eq(services.id, d.linkedServiceId), eq(services.vendorId, vendor.id)));
    if (!svc) return { error: "Pick one of your services" };
  }
  await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(posts)
      .values({ vendorId: vendor.id, caption: d.caption, areaId: d.areaId ?? vendor.baseAreaId, linkedServiceId: d.linkedServiceId ?? null })
      .returning();
    await tx.insert(media).values(photos.map((url, i) => ({ ownerType: "post" as const, ownerId: post!.id, url, sort: i })));
    if (tags.length) await tx.insert(postTags).values(tags.map((eventType) => ({ postId: post!.id, eventType })));
  });
  redirect("/vendor/feed?posted=1");
}

const shopUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(80).optional().default(""),
  bio: z.string().trim().max(600).optional().default(""),
  fbUrl: z.string().trim().max(200).optional().default(""),
  igUrl: z.string().trim().max(200).optional().default(""),
});

export async function updateShopAction(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  const parsed = shopUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const areaIds = formData.getAll("areas").map(Number).filter(Boolean);
  const d = parsed.data;
  await db.transaction(async (tx) => {
    await tx
      .update(vendors)
      .set({ name: d.name, tagline: d.tagline, bio: d.bio, fbUrl: d.fbUrl || null, igUrl: d.igUrl || null })
      .where(eq(vendors.id, vendor.id));
    if (areaIds.length) {
      await tx.delete(vendorAreas).where(eq(vendorAreas.vendorId, vendor.id));
      await tx.insert(vendorAreas).values(areaIds.map((areaId) => ({ vendorId: vendor.id, areaId })));
    }
  });
  revalidatePath("/vendor/shop");
  return { ok: true };
}

export async function toggleAutoRespondAction() {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  await db.update(vendors).set({ autoRespond: !vendor.autoRespond }).where(eq(vendors.id, vendor.id));
  revalidatePath("/vendor");
  revalidatePath("/vendor/shop");
}

export async function addBlockedDateAction(formData: FormData) {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  const date = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d >= todayISO())
    .safeParse(formData.get("date"));
  if (!date.success) return;
  await db.insert(vendorBlockedDates).values({ vendorId: vendor.id, date: date.data, reason: "Blocked by vendor" }).onConflictDoNothing();
  revalidatePath("/vendor/shop");
}

export async function removeBlockedDateAction(formData: FormData) {
  const viewer = await requireRole("vendor");
  const db = await getDb();
  const vendor = await requireOwnedVendor(db, viewer);
  const dates = formData.getAll("date").map(String);
  if (!dates.length) return;
  await db.delete(vendorBlockedDates).where(and(eq(vendorBlockedDates.vendorId, vendor.id), inArray(vendorBlockedDates.date, dates)));
  revalidatePath("/vendor/shop");
}
