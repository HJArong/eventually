import Link from "next/link";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { PackageCard, TrendingPost } from "@/components/cards";
import { ChipLink, SectionTitle } from "@/components/ui";
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
          <p className="text-sm font-semibold text-muted">Maayong adlaw!</p>
          <h1 className="text-[30px] leading-tight font-extrabold">Hi, {firstName(viewer.displayName) || "there"}</h1>
        </div>
        <Link href="/saved" className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-white shadow-pop-sm" aria-label="Saved posts and settings">
          <Sparkles className="size-5" />
        </Link>
      </header>

      {welcome && (
        <p className="mt-4 animate-pop-in rounded-2xl border-2 border-ink bg-calamansi-100 px-4 py-3 text-sm font-semibold">
          Your event is set! Start with a package below or search for a vendor.
        </p>
      )}

      <Link href="/event" className="pop press mt-5 block rounded-3xl bg-ube p-4 text-white">
        <p className="text-xs font-bold tracking-wider text-white/70 uppercase">Your event</p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="font-display text-xl leading-tight font-extrabold">{event.title}</p>
          <ChevronRight className="size-5 shrink-0" />
        </div>
        <p className="text-sm text-white/80">
          {formatDate(event.date, { weekday: true })} · {area.name} · {event.pax} pax
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
          <div className="h-full rounded-full bg-mango" style={{ width: `${Math.max(4, overview.progress.pct)}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold">
          {overview.progress.done} of {overview.progress.total} tasks done
          {overview.quotesWaiting > 0 && (
            <span className="ml-2 rounded-full bg-mango px-2 py-0.5 text-xs font-extrabold text-ink">
              {overview.quotesWaiting} {overview.quotesWaiting === 1 ? "quote" : "quotes"} waiting
            </span>
          )}
        </p>
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
          className="h-13 w-full rounded-2xl border-2 border-ink bg-white pr-4 pl-12 font-medium shadow-pop-sm placeholder:text-muted focus:outline-none"
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
            <Link href={`/packages?type=${event.eventType}`} className="text-sm font-bold text-ube">
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
            <Link href="/feed" className="text-sm font-bold text-ube">
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
