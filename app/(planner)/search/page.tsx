import { Search, SlidersHorizontal, X } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { VendorListItem } from "@/components/cards";
import { CategoryIcon } from "@/components/category-icon";
import { ChipLink, EmptyState, LinkButton } from "@/components/ui";
import { PRICE_BANDS } from "@/lib/domain/pricing";
import { formatDate } from "@/lib/format";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { searchVendors } from "@/lib/queries/vendors";

export const metadata = { title: "Search vendors" };

type Params = { q?: string; category?: string; area?: string; date?: string; band?: string; rating?: string };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { event } = await requirePlannerEvent();
  const sp = (await searchParams) as Params;
  const catalog = await getCatalog();

  const category = sp.category ? catalog.categoryBySlug.get(sp.category) : undefined;
  const areaId = sp.area === "all" ? undefined : sp.area ? Number(sp.area) : event.areaId;
  const date = sp.date === "any" ? undefined : event.date;
  const band = sp.band ? Number(sp.band) : undefined;
  const rating = sp.rating ? Number(sp.rating) : undefined;

  const results = await searchVendors({
    q: sp.q,
    categoryId: category?.id,
    areaId,
    date,
    priceBand: band,
    minRating: rating,
  });

  const href = (patch: Partial<Params>) => {
    const next = { ...sp, ...patch };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `/search?${s}` : "/search";
  };

  const areaName = areaId ? catalog.areaById.get(areaId)?.name : "All of Cebu";

  return (
    <main>
      <AppHeader title="Search" subtitle={`${event.title} · ${formatDate(event.date)}`} />
      <div className="px-5 pt-4">
        <form action="/search" className="relative">
          {Object.entries(sp)
            .filter(([k, v]) => k !== "q" && v)
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q}
            placeholder="Lechon, venues, hosts…"
            className="h-12 w-full rounded-2xl border-2 border-ink bg-white pr-4 pl-12 font-medium shadow-pop-sm focus:outline-none"
          />
        </form>

        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          <ChipLink href={href({ area: areaId ? "all" : String(event.areaId) })} selected={Boolean(areaId)}>
            {areaName}
          </ChipLink>
          {catalog.areas
            .filter((a) => a.id !== areaId)
            .map((a) => (
              <ChipLink key={a.id} href={href({ area: String(a.id) })}>
                {a.name}
              </ChipLink>
            ))}
        </div>
        <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
          <ChipLink href={href({ date: date ? "any" : undefined })} selected={Boolean(date)}>
            Free {formatDate(event.date)}
          </ChipLink>
          {PRICE_BANDS.map((b) => (
            <ChipLink key={b.band} href={href({ band: band === b.band ? undefined : String(b.band) })} selected={band === b.band} title={b.hint}>
              {b.label}
            </ChipLink>
          ))}
          <ChipLink href={href({ rating: rating ? undefined : "4.5" })} selected={Boolean(rating)}>
            4.5+ stars
          </ChipLink>
        </div>
        <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
          {catalog.categories.map((c) => (
            <ChipLink key={c.id} href={href({ category: category?.id === c.id ? undefined : c.slug })} selected={category?.id === c.id}>
              <CategoryIcon icon={c.icon} /> {c.name}
            </ChipLink>
          ))}
        </div>

        <div className="mt-4 mb-3 flex items-center justify-between text-sm">
          <p className="font-semibold text-muted">
            <SlidersHorizontal className="mr-1 inline size-4" aria-hidden />
            {results.length} {results.length === 1 ? "vendor" : "vendors"}
            {date ? ` free on ${formatDate(date)}` : ""} · {areaName}
          </p>
          {(sp.q || sp.category || sp.band || sp.rating || sp.area || sp.date) && (
            <a href="/search" className="inline-flex items-center gap-1 font-bold text-ube">
              <X className="size-4" /> Clear
            </a>
          )}
        </div>

        {results.length ? (
          <div className="grid gap-3 pb-4">
            {results.map((v) => (
              <VendorListItem key={v.id} vendor={v} catalog={catalog} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No vendors match yet"
            body="Try another area or turn off the date filter."
            action={
              <LinkButton href="/search?area=all&date=any" variant="outline" size="sm">
                Show all of Cebu
              </LinkButton>
            }
          />
        )}
        <p className="mt-2 mb-4 text-center text-xs text-muted">Map view is coming later.</p>
      </div>
    </main>
  );
}
