import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  media,
  postTags,
  posts,
  reviews,
  services,
  vendorAreas,
  vendorBlockedDates,
  vendors,
} from "@/lib/db/schema";

export type VendorSearch = {
  q?: string;
  categoryId?: number;
  areaId?: number;
  date?: string;
  priceBand?: number;
  minRating?: number;
  limit?: number;
};

export type VendorCard = Awaited<ReturnType<typeof vendorCards>>[number];

export async function vendorCards(ids: string[], opts: { date?: string } = {}) {
  if (!ids.length) return [];
  const db = await getDb();
  const [rows, svcRows, blocked] = await Promise.all([
    db.select().from(vendors).where(inArray(vendors.id, ids)),
    db.select().from(services).where(inArray(services.vendorId, ids)).orderBy(asc(services.sort)),
    opts.date
      ? db
          .select({ vendorId: vendorBlockedDates.vendorId })
          .from(vendorBlockedDates)
          .where(and(inArray(vendorBlockedDates.vendorId, ids), eq(vendorBlockedDates.date, opts.date)))
      : Promise.resolve([] as { vendorId: string }[]),
  ]);
  const blockedSet = new Set(blocked.map((b) => b.vendorId));
  const byId = new Map(rows.map((v) => [v.id, v]));
  return ids
    .map((id) => byId.get(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
    .map((v) => {
      const svcs = svcRows.filter((s) => s.vendorId === v.id);
      return {
        ...v,
        featuredService: svcs[0] ?? null,
        serviceCount: svcs.length,
        availableOnDate: opts.date ? !blockedSet.has(v.id) : null,
      };
    });
}

export async function searchVendors(filters: VendorSearch) {
  const db = await getDb();
  const conds: SQL[] = [];
  const q = filters.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    conds.push(
      or(
        ilike(vendors.name, like),
        ilike(vendors.tagline, like),
        sql`exists (select 1 from categories c where c.id = ${vendors.categoryId} and c.name ilike ${like})`,
        sql`exists (select 1 from services s where s.vendor_id = ${vendors.id} and s.name ilike ${like})`,
        sql`similarity(${vendors.name}, ${q}) > 0.3`,
      )!,
    );
  }
  if (filters.categoryId) conds.push(eq(vendors.categoryId, filters.categoryId));
  if (filters.areaId) {
    conds.push(
      sql`exists (select 1 from ${vendorAreas} va where va.vendor_id = ${vendors.id} and va.area_id = ${filters.areaId})`,
    );
  }
  if (filters.date) {
    conds.push(
      sql`not exists (select 1 from ${vendorBlockedDates} b where b.vendor_id = ${vendors.id} and b.date = ${filters.date})`,
    );
  }
  if (filters.priceBand) conds.push(eq(vendors.priceBand, filters.priceBand));
  if (filters.minRating) conds.push(gte(vendors.ratingAvg, filters.minRating));

  const ids = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(vendors.isCurated), desc(vendors.ratingAvg), desc(vendors.ratingCount), asc(vendors.name))
    .limit(filters.limit ?? 60);
  return vendorCards(
    ids.map((r) => r.id),
    { date: filters.date },
  );
}

export async function getVendorProfile(slug: string) {
  const db = await getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.slug, slug)).limit(1);
  if (!vendor) return null;
  const [svcs, gallery, reviewRows, areaRows, postRows, blocked] = await Promise.all([
    db.select().from(services).where(eq(services.vendorId, vendor.id)).orderBy(asc(services.sort)),
    db
      .select()
      .from(media)
      .where(and(eq(media.ownerType, "vendor"), eq(media.ownerId, vendor.id)))
      .orderBy(asc(media.sort)),
    db.select().from(reviews).where(eq(reviews.vendorId, vendor.id)).orderBy(desc(reviews.createdAt)),
    db.select({ areaId: vendorAreas.areaId }).from(vendorAreas).where(eq(vendorAreas.vendorId, vendor.id)),
    db.select().from(posts).where(eq(posts.vendorId, vendor.id)).orderBy(desc(posts.createdAt)).limit(12),
    db
      .select({ date: vendorBlockedDates.date })
      .from(vendorBlockedDates)
      .where(eq(vendorBlockedDates.vendorId, vendor.id))
      .orderBy(asc(vendorBlockedDates.date)),
  ]);
  const postIds = postRows.map((p) => p.id);
  const postMedia = postIds.length
    ? await db
        .select()
        .from(media)
        .where(and(eq(media.ownerType, "post"), inArray(media.ownerId, postIds)))
        .orderBy(asc(media.sort))
    : [];
  const tags = postIds.length ? await db.select().from(postTags).where(inArray(postTags.postId, postIds)) : [];
  return {
    vendor,
    services: svcs,
    gallery,
    reviews: reviewRows,
    areaIds: areaRows.map((a) => a.areaId),
    blockedDates: blocked.map((b) => b.date),
    posts: postRows.map((p) => ({
      ...p,
      images: postMedia.filter((m) => m.ownerId === p.id).map((m) => m.url),
      tags: tags.filter((t) => t.postId === p.id).map((t) => t.eventType),
    })),
  };
}

export async function incrementProfileViews(vendorId: string) {
  const db = await getDb();
  await db
    .update(vendors)
    .set({ profileViews: sql`${vendors.profileViews} + 1` })
    .where(eq(vendors.id, vendorId));
}
