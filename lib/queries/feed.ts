import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { follows, likes, media, postTags, posts, saves, services, vendors } from "@/lib/db/schema";

export type FeedTab = "for-you" | "following" | "near";

export async function getFeed(opts: {
  viewerId: string | null;
  tab?: FeedTab;
  areaId?: number | null;
  eventType?: string | null;
  vendorId?: string;
  savedOnly?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  const viewer = opts.viewerId;
  const conds: SQL[] = [];
  const isFollowing = viewer
    ? sql<boolean>`exists (select 1 from ${follows} f where f.profile_id = ${viewer} and f.vendor_id = ${posts.vendorId})`
    : sql<boolean>`false`;

  if (opts.tab === "following") conds.push(isFollowing);
  if (opts.tab === "near" && opts.areaId) conds.push(eq(posts.areaId, opts.areaId));
  if (opts.eventType) {
    conds.push(
      sql`exists (select 1 from ${postTags} pt where pt.post_id = ${posts.id} and pt.event_type = ${opts.eventType})`,
    );
  }
  if (opts.vendorId) conds.push(eq(posts.vendorId, opts.vendorId));
  if (opts.savedOnly && viewer) {
    conds.push(sql`exists (select 1 from ${saves} s where s.profile_id = ${viewer} and s.post_id = ${posts.id})`);
  }

  // Ranking: vendors you follow first, then recency.
  const rows = await db
    .select({
      post: posts,
      vendor: {
        id: vendors.id,
        name: vendors.name,
        slug: vendors.slug,
        categoryId: vendors.categoryId,
        coverUrl: vendors.coverUrl,
        isCurated: vendors.isCurated,
      },
      following: isFollowing,
    })
    .from(posts)
    .innerJoin(vendors, eq(vendors.id, posts.vendorId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(...(opts.tab === "for-you" && viewer ? [desc(isFollowing)] : []), desc(posts.createdAt))
    .limit(opts.limit ?? 30);

  const ids = rows.map((r) => r.post.id);
  if (!ids.length) return [];
  const serviceIds = rows.map((r) => r.post.linkedServiceId).filter((x): x is string => Boolean(x));
  const [imgs, tags, likeCounts, myLikes, mySaves, linked] = await Promise.all([
    db
      .select()
      .from(media)
      .where(and(eq(media.ownerType, "post"), inArray(media.ownerId, ids)))
      .orderBy(asc(media.sort)),
    db.select().from(postTags).where(inArray(postTags.postId, ids)),
    db
      .select({ postId: likes.postId, n: sql<number>`count(*)::int` })
      .from(likes)
      .where(inArray(likes.postId, ids))
      .groupBy(likes.postId),
    viewer
      ? db.select({ postId: likes.postId }).from(likes).where(and(eq(likes.profileId, viewer), inArray(likes.postId, ids)))
      : Promise.resolve([] as { postId: string }[]),
    viewer
      ? db.select({ postId: saves.postId }).from(saves).where(and(eq(saves.profileId, viewer), inArray(saves.postId, ids)))
      : Promise.resolve([] as { postId: string }[]),
    serviceIds.length ? db.select().from(services).where(inArray(services.id, serviceIds)) : Promise.resolve([]),
  ]);
  const liked = new Set(myLikes.map((l) => l.postId));
  const saved = new Set(mySaves.map((s) => s.postId));
  const counts = new Map(likeCounts.map((l) => [l.postId, l.n]));

  return rows.map((r) => ({
    ...r.post,
    vendor: r.vendor,
    following: Boolean(r.following),
    images: imgs.filter((m) => m.ownerId === r.post.id).map((m) => m.url),
    tags: tags.filter((t) => t.postId === r.post.id).map((t) => t.eventType),
    likeCount: r.post.seedLikes + (counts.get(r.post.id) ?? 0),
    liked: liked.has(r.post.id),
    saved: saved.has(r.post.id),
    linkedService: linked.find((s) => s.id === r.post.linkedServiceId) ?? null,
  }));
}

export type FeedPost = Awaited<ReturnType<typeof getFeed>>[number];
