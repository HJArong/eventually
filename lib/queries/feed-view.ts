import type { PostCardData } from "@/components/post-card";
import { timeAgo } from "@/lib/format";
import type { Catalog } from "./catalog";
import type { FeedPost } from "./feed";

export function toPostCard(post: FeedPost, catalog: Catalog): PostCardData {
  return {
    id: post.id,
    caption: post.caption,
    images: post.images,
    tags: post.tags,
    likeCount: post.likeCount,
    liked: post.liked,
    saved: post.saved,
    following: post.following,
    timeAgo: timeAgo(post.createdAt),
    areaName: post.areaId ? (catalog.areaById.get(post.areaId)?.name ?? null) : null,
    categoryName: catalog.categoryById.get(post.vendor.categoryId)?.name ?? "",
    vendor: { id: post.vendor.id, name: post.vendor.name, slug: post.vendor.slug, coverUrl: post.vendor.coverUrl },
    linkedService: post.linkedService
      ? { id: post.linkedService.id, name: post.linkedService.name, pricePhp: post.linkedService.pricePhp, unit: post.linkedService.unit }
      : null,
  };
}

export function tagNames(catalog: Catalog): Record<string, string> {
  return Object.fromEntries(catalog.eventTypes.map((e) => [e.slug, e.name]));
}
