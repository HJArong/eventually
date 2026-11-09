import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, ExternalLink, MapPin, MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { CategoryIcon } from "@/components/category-icon";
import { FollowButton } from "@/components/follow-button";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, CuratedBadge, LinkButton, Rating, SectionTitle } from "@/components/ui";
import { getDb } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { getViewer } from "@/lib/auth/session";
import { UNIT_LABEL } from "@/lib/domain/pricing";
import { formatDate, formatPeso, timeAgo, todayISO } from "@/lib/format";
import { getCatalog } from "@/lib/queries/catalog";
import { getCurrentEvent } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/inbox";
import { getVendorProfile, incrementProfileViews } from "@/lib/queries/vendors";
import { messageVendor } from "@/app/actions/social";

export async function generateMetadata({ params }: PageProps<"/vendors/[slug]">) {
  const data = await getVendorProfile((await params).slug);
  if (!data) return { title: "Vendor not found" };
  return {
    title: data.vendor.name,
    description: `${data.vendor.tagline}. ${data.vendor.bio}`.slice(0, 160),
    openGraph: { images: data.vendor.coverUrl ? [data.vendor.coverUrl] : [] },
  };
}

export default async function VendorProfile({ params }: PageProps<"/vendors/[slug]">) {
  const { slug } = await params;
  const [data, viewer, catalog] = await Promise.all([getVendorProfile(slug), getViewer(), getCatalog()]);
  if (!data) notFound();
  const { vendor } = data;
  const isPlanner = viewer?.role === "planner";
  const isOwner = viewer && vendor.ownerId === viewer.id;
  if (!isOwner) await incrementProfileViews(vendor.id);

  const db = await getDb();
  const [event, following, unread] = isPlanner
    ? await Promise.all([
        getCurrentEvent(viewer.id),
        db
          .select()
          .from(follows)
          .where(and(eq(follows.profileId, viewer.id), eq(follows.vendorId, vendor.id)))
          .then((r) => r.length > 0),
        getUnreadCount(viewer, "planner"),
      ])
    : [null, false, 0];

  const category = catalog.categoryById.get(vendor.categoryId)!;
  const baseArea = catalog.areaById.get(vendor.baseAreaId)!;
  const served = data.areaIds.map((id) => catalog.areaById.get(id)?.name).filter(Boolean);
  const blockedOnEvent = event ? data.blockedDates.includes(event.date) : false;
  const upcomingBlocked = data.blockedDates.filter((d) => d >= todayISO()).slice(0, 4);

  return (
    <main className={isPlanner ? "pb-44" : "pb-28"}>
      <div className="relative h-60">
        {vendor.coverUrl && <Image src={vendor.coverUrl} alt="" fill priority sizes="440px" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-transparent" />
        <Link
          href={isPlanner ? "/search" : "/"}
          className="absolute top-[max(env(safe-area-inset-top),0.75rem)] left-3 flex size-10 items-center justify-center rounded-full border-2 border-ink bg-white"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" strokeWidth={2.5} />
        </Link>
      </div>

      <section className="relative -mt-10 px-5">
        <div className="pop rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <Avatar name={vendor.name} size={56} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight font-extrabold">{vendor.name}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <CategoryIcon icon={category.icon} className="size-3.5" /> {category.name} · <MapPin className="size-3.5" /> {baseArea.name}
              </p>
            </div>
          </div>
          <p className="mt-3 font-display text-[17px] font-bold">{vendor.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Rating value={vendor.ratingAvg} count={vendor.ratingCount} />
            {vendor.isCurated && <CuratedBadge />}
            {isPlanner && <FollowButton vendorId={vendor.id} following={following} className="ml-auto" />}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{vendor.bio}</p>
          <p className="mt-2 text-xs text-muted">Serves {served.join(", ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {vendor.fbUrl && (
              <a href={vendor.fbUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-ube">
                Facebook <ExternalLink className="size-3" />
              </a>
            )}
            {vendor.igUrl && (
              <a href={vendor.igUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-ube">
                Instagram <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {event && (
            <p
              className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${blockedOnEvent ? "bg-sunset-50 text-sunset" : "bg-calamansi-50 text-calamansi"}`}
            >
              {blockedOnEvent ? `Already booked on ${formatDate(event.date)}` : `Available on ${formatDate(event.date)} for ${event.title}`}
            </p>
          )}
        </div>
      </section>

      <nav className="no-scrollbar sticky top-0 z-20 mt-4 flex gap-2 overflow-x-auto bg-cream/95 px-5 py-2 backdrop-blur" aria-label="Sections">
        {["Services", "Gallery", "Posts", "Reviews"].map((s) => (
          <a key={s} href={`#${s.toLowerCase()}`} className="rounded-full border-2 border-ink/15 bg-white px-3.5 py-1.5 text-sm font-bold">
            {s}
          </a>
        ))}
      </nav>

      <section id="services" className="scroll-mt-14 px-5 pt-4">
        <SectionTitle>Services</SectionTitle>
        <div className="grid gap-2.5">
          {data.services.map((s) => (
            <div key={s.id} id={`service-${s.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-muted">{s.description}</p>
                <p className="mt-1 text-sm font-extrabold text-ube">
                  {formatPeso(s.pricePhp)}
                  <span className="font-semibold text-muted">{UNIT_LABEL[s.unit]}</span>
                </p>
              </div>
              {isPlanner && (
                <LinkButton href={`/request/${vendor.slug}?service=${s.id}`} variant="outline" size="sm" aria-label={`Request ${s.name}`}>
                  + Add
                </LinkButton>
              )}
            </div>
          ))}
        </div>
        {upcomingBlocked.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Unavailable: {upcomingBlocked.map((d) => formatDate(d)).join(", ")}
            {data.blockedDates.length > 4 ? "…" : ""}
          </p>
        )}
      </section>

      <section id="gallery" className="scroll-mt-14 px-5 pt-8">
        <SectionTitle>Gallery</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {data.gallery.map((m, i) => (
            <div key={m.id} className={`relative overflow-hidden rounded-2xl border-2 border-ink ${i === 0 ? "col-span-2 h-48" : "h-32"}`}>
              <Image src={m.url} alt={`${vendor.name} photo ${i + 1}`} fill sizes={i === 0 ? "400px" : "200px"} className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section id="posts" className="scroll-mt-14 px-5 pt-8">
        <SectionTitle>Posts</SectionTitle>
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
          {data.posts.map((p) => (
            <article key={p.id} className="w-52 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white">
              <div className="relative h-36">
                {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="208px" className="object-cover" />}
              </div>
              <p className="line-clamp-3 p-2.5 text-xs text-ink-soft">{p.caption}</p>
              <p className="px-2.5 pb-2.5 text-[11px] text-muted">{timeAgo(p.createdAt)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="reviews" className="scroll-mt-14 px-5 pt-8">
        <SectionTitle action={<Rating value={vendor.ratingAvg} count={vendor.ratingCount} />}>Reviews</SectionTitle>
        <div className="grid gap-2.5">
          {data.reviews.map((r) => (
            <figure key={r.id} className="rounded-2xl border-2 border-ink/10 bg-white p-3">
              <div className="flex items-center justify-between">
                <figcaption className="text-sm font-bold">{r.authorName}</figcaption>
                <span className="text-sm font-bold text-mango" aria-label={`${r.rating} stars`}>
                  {"★".repeat(r.rating)}
                  <span className="text-ink/15">{"★".repeat(5 - r.rating)}</span>
                </span>
              </div>
              <blockquote className="mt-1 text-sm text-ink-soft">{r.body}</blockquote>
              <p className="mt-1 text-[11px] text-muted">
                {catalog.eventTypeBySlug.get(r.eventType ?? "")?.name ?? "Event"} · {timeAgo(r.createdAt)}
              </p>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">Demo data: reviews are fictional samples.</p>
      </section>

      <div className={`fixed inset-x-0 z-30 mx-auto max-w-[440px] px-4 ${isPlanner ? "bottom-[76px]" : "bottom-4"}`}>
        {isPlanner ? (
          <div className="grid grid-cols-2 gap-3 rounded-3xl border-2 border-ink bg-white p-2.5 shadow-pop">
            <form action={messageVendor}>
              <input type="hidden" name="vendorId" value={vendor.id} />
              <SubmitButton variant="outline" className="w-full">
                <MessageCircle className="size-4" /> Message
              </SubmitButton>
            </form>
            <LinkButton href={`/request/${vendor.slug}`} variant="primary">
              Request a quote
            </LinkButton>
          </div>
        ) : !viewer ? (
          <LinkButton href="/sign-in" variant="primary" size="lg" className="w-full shadow-pop">
            Sign in to request a quote
          </LinkButton>
        ) : null}
      </div>
      {isPlanner && <BottomNav side="planner" unread={unread} />}
    </main>
  );
}
