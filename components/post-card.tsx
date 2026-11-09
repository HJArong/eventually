"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Bookmark, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { UNIT_LABEL } from "@/lib/domain/pricing";
import type { Unit } from "@/lib/domain/types";
import { formatPeso } from "@/lib/format";
import { toggleLike, toggleSave } from "@/app/actions/social";
import { FollowButton } from "./follow-button";
import { Avatar } from "./ui";

export type PostCardData = {
  id: string;
  caption: string;
  images: string[];
  tags: string[];
  likeCount: number;
  liked: boolean;
  saved: boolean;
  following: boolean;
  timeAgo: string;
  areaName: string | null;
  categoryName: string;
  vendor: { id: string; name: string; slug: string; coverUrl: string | null };
  linkedService: { id: string; name: string; pricePhp: number; unit: Unit } | null;
};

export function PostCard({ post, interactive = true, tagNames }: { post: PostCardData; interactive?: boolean; tagNames: Record<string, string> }) {
  const [liked, setLiked] = useOptimistic(post.liked);
  const [saved, setSaved] = useOptimistic(post.saved);
  const [, start] = useTransition();
  const [slide, setSlide] = useState(0);
  const [burst, setBurst] = useState(false);

  const like = () =>
    start(async () => {
      setLiked(!liked);
      if (!liked) setBurst(true);
      await toggleLike(post.id);
    });
  const save = () =>
    start(async () => {
      setSaved(!saved);
      await toggleSave(post.id);
    });
  const likeCount = post.likeCount + (liked === post.liked ? 0 : liked ? 1 : -1);

  return (
    <article id={`post-${post.id}`} className="card scroll-mt-20 overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 p-3">
        <Link href={`/vendors/${post.vendor.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={post.vendor.name} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-display font-semibold">{post.vendor.name}</span>
            <span className="block truncate text-xs text-muted">
              {post.categoryName}
              {post.areaName && (
                <>
                  {" · "}
                  <MapPin className="inline size-3" /> {post.areaName}
                </>
              )}
              {" · "}
              {post.timeAgo}
            </span>
          </span>
        </Link>
        {interactive && <FollowButton vendorId={post.vendor.id} following={post.following} />}
      </header>

      <div className="relative">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          onDoubleClick={interactive && !liked ? like : undefined}
        >
          {post.images.map((src, i) => (
            <div key={src + i} className="relative aspect-[4/3] w-full shrink-0 snap-center">
              <Image src={src} alt={`${post.vendor.name} post photo ${i + 1}`} fill sizes="440px" className="object-cover" />
            </div>
          ))}
        </div>
        {post.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {post.images.map((_, i) => (
              <span key={i} className={cn("size-1.5 rounded-full", i === slide ? "bg-white" : "bg-white/50")} />
            ))}
          </div>
        )}
        {burst && (
          <Heart
            className="pointer-events-none absolute top-1/2 left-1/2 size-20 -translate-1/2 animate-pop-in fill-white text-white drop-shadow"
            onAnimationEnd={() => setTimeout(() => setBurst(false), 300)}
            aria-hidden
          />
        )}
      </div>

      <div className="p-3">
        {interactive && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={like} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className="flex items-center gap-1.5 rounded-full px-2 py-1 font-medium">
              <Heart className={cn("size-6", liked && "fill-rose-600 text-rose-600")} strokeWidth={1.8} />
              <span className="text-sm tabular-nums">{likeCount}</span>
            </button>
            <button type="button" onClick={save} aria-pressed={saved} aria-label={saved ? "Unsave" : "Save"} className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium">
              <Bookmark className={cn("size-6", saved && "fill-rose-600 text-rose-600")} strokeWidth={1.8} />
              {saved ? "Saved" : "Save"}
            </button>
            {post.linkedService && (
              <Link
                href={`/request/${post.vendor.slug}?service=${post.linkedService.id}`}
                className="ml-auto rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 press"
              >
                View service
              </Link>
            )}
          </div>
        )}
        <p className="mt-1.5 text-sm text-ink-soft">{post.caption}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-ink-soft">
              #{(tagNames[t] ?? t).toLowerCase().replace(/\s+/g, "")}
            </span>
          ))}
        </div>
        {post.linkedService && (
          <p className="mt-2 text-xs text-muted">
            {post.linkedService.name} · {formatPeso(post.linkedService.pricePhp)}
            {UNIT_LABEL[post.linkedService.unit]}
          </p>
        )}
      </div>
    </article>
  );
}
