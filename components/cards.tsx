import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, CalendarX, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { UNIT_LABEL } from "@/lib/domain/pricing";
import { formatPeso, formatPesoShort, timeAgo } from "@/lib/format";
import type { Catalog } from "@/lib/queries/catalog";
import type { FeedPost } from "@/lib/queries/feed";
import type { PackageListItem } from "@/lib/queries/packages";
import type { VendorCard } from "@/lib/queries/vendors";
import { CuratedBadge, Rating } from "./ui";

export function PackageCard({ pkg, catalog, wide }: { pkg: PackageListItem; catalog: Catalog; wide?: boolean }) {
  const area = pkg.areaId ? catalog.areaById.get(pkg.areaId)?.name : "Metro Cebu";
  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className={cn("pop press group block shrink-0 overflow-hidden rounded-3xl", wide ? "w-full" : "w-[220px]")}
    >
      <div className={cn("relative", wide ? "h-40" : "h-28")}>
        {pkg.coverUrl && <Image src={pkg.coverUrl} alt="" fill sizes={wide ? "440px" : "220px"} className="object-cover" />}
        <span className="absolute top-2 left-2 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-[11px] font-extrabold">
          {pkg.vendorCount} vendors
        </span>
      </div>
      <div className="p-3">
        <p className="font-display text-[17px] leading-tight font-extrabold">{pkg.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {area} · {pkg.paxMin}–{pkg.paxMax} pax
        </p>
        {wide && <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{pkg.tagline}</p>}
        <p className="mt-2 text-sm font-bold">
          from <span className="text-ube">{formatPesoShort(pkg.fromPricePhp)}</span>
        </p>
      </div>
    </Link>
  );
}

export function VendorListItem({ vendor, catalog }: { vendor: VendorCard; catalog: Catalog }) {
  const category = catalog.categoryById.get(vendor.categoryId);
  const area = catalog.areaById.get(vendor.baseAreaId);
  const svc = vendor.featuredService;
  return (
    <Link href={`/vendors/${vendor.slug}`} className="pop press flex gap-3 rounded-3xl p-2.5">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-ink">
        {vendor.coverUrl && <Image src={vendor.coverUrl} alt="" fill sizes="96px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-[17px] leading-tight font-extrabold">{vendor.name}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {category?.name} · {area?.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Rating value={vendor.ratingAvg} count={vendor.ratingCount} />
          {vendor.isCurated && <CuratedBadge />}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {svc && (
            <p className="truncate text-sm font-bold">
              from {formatPeso(svc.pricePhp)}
              <span className="font-medium text-muted">{UNIT_LABEL[svc.unit]}</span>
            </p>
          )}
          {vendor.availableOnDate != null &&
            (vendor.availableOnDate ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-calamansi">
                <CalendarCheck className="size-3.5" /> Free
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-sunset">
                <CalendarX className="size-3.5" /> Booked
              </span>
            ))}
        </div>
      </div>
    </Link>
  );
}

export function TrendingPost({ post, catalog }: { post: FeedPost; catalog: Catalog }) {
  const category = catalog.categoryById.get(post.vendor.categoryId);
  return (
    <Link href={`/feed#post-${post.id}`} className="pop press flex items-center gap-3 rounded-3xl p-2.5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-ink">
        {post.images[0] && <Image src={post.images[0]} alt="" fill sizes="80px" className="object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="font-display font-extrabold">{post.vendor.name}</p>
        <p className="line-clamp-2 text-sm text-ink-soft">{post.caption}</p>
        <p className="mt-0.5 text-xs text-muted">
          {category?.name} · {timeAgo(post.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export function PaxBadge({ pax }: { pax: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Users className="size-3.5" aria-hidden /> {pax} pax
    </span>
  );
}
