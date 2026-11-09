import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { PackageCard, TrendingPost } from "@/components/cards";
import { Avatar, ChipLink, SectionTitle } from "@/components/ui";
import { formatDate, firstName } from "@/lib/format";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { getEventOverview } from "@/lib/queries/events";
import { getFeed } from "@/lib/queries/feed";
import { listPackages } from "@/lib/queries/packages";

export const metadata = { title: "Home" };

export default async function Home({ searchParams }: PageProps<"/home">) {
  const { viewer, event } = await requirePlannerEvent();
  const { welcome } = await searchParams;
  const catalog = await getCatalog();
  const [overview, pkgs, trending] = await Promise.all([
    getEventOverview(event),
    listPackages({ eventType: event.eventType }),
    getFeed({ viewerId: viewer.id, tab: "near", areaId: event.areaId, limit: 3 }),
  ]);
  const area = catalog.areaById.get(event.areaId)!;
  const eventType = catalog.eventTypeBySlug.get(event.eventType);
  // Packages in the event's area first.
  const ranked = [...pkgs].sort((a, b) => Number(b.areaId === event.areaId) - Number(a.areaId === event.areaId));
  const allPackages = ranked.length ? ranked : await listPackages();

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Maayong adlaw,</p>
          <h1 className="text-[26px] leading-tight font-semibold">{firstName(viewer.displayName) || "there"}</h1>
        </div>
        <Link href="/saved" className="card flex size-11 items-center justify-center overflow-hidden rounded-full" aria-label="Saved posts and settings">
          <Avatar name={viewer.displayName || "You"} size={44} className="bg-sand text-ink-soft" />
        </Link>
      </header>

      {welcome && (
        <p className="mt-4 animate-pop-in rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success">
          Your event is set. Start with a package below or search for a vendor.
        </p>
      )}

      <Link href="/event" className="card press mt-6 block rounded-2xl p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-rose-600">Your event</p>
            <p className="mt-1 text-lg leading-snug font-semibold">{event.title}</p>
            <p className="mt-0.5 text-sm text-muted">
              {formatDate(event.date, { weekday: true })} · {area.name} · {event.pax} pax
            </p>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted" />
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-rose-50">
          <div className="h-full rounded-full bg-rose-600" style={{ width: `${Math.max(4, overview.progress.pct)}%` }} />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-sm">
          <span className="text-ink-soft">
            {overview.progress.done} of {overview.progress.total} tasks done
          </span>
          {overview.quotesWaiting > 0 && (
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              {overview.quotesWaiting} {overview.quotesWaiting === 1 ? "quote" : "quotes"} waiting
            </span>
          )}
        </div>
      </Link>

      <form action="/search" className="relative mt-5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="home-search" className="sr-only">
          Search vendors
        </label>
        <input
          id="home-search"
          name="q"
          placeholder="Search lechon, venues, lights & sounds…"
          className="h-12 w-full rounded-xl border border-line bg-white pr-4 pl-12 shadow-card placeholder:text-muted focus:border-rose-300 focus:ring-3 focus:ring-rose-100 focus:outline-none"
        />
      </form>

      <section className="mt-6">
        <SectionTitle>Browse by category</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {catalog.categories.map((c) => (
            <ChipLink key={c.id} href={`/search?category=${c.slug}`}>
              <CategoryIcon icon={c.icon} /> {c.name}
            </ChipLink>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle
          action={
            <Link href={`/packages?type=${event.eventType}`} className="text-sm font-semibold text-rose-600">
              See all
            </Link>
          }
        >
          {eventType?.name ?? "Event"} packages in {area.name}
        </SectionTitle>
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pt-0.5 pb-2">
          {allPackages.map((p) => (
            <PackageCard key={p.id} pkg={p} catalog={catalog} />
          ))}
        </div>
      </section>

      <section className="mt-8 pb-4">
        <SectionTitle
          action={
            <Link href="/feed" className="text-sm font-semibold text-rose-600">
              Open feed
            </Link>
          }
        >
          Trending near you
        </SectionTitle>
        <div className="grid gap-3">
          {trending.map((p) => (
            <TrendingPost key={p.id} post={p} catalog={catalog} />
          ))}
        </div>
      </section>
    </main>
  );
}
