import { AppHeader } from "@/components/app-header";
import { PackageCard } from "@/components/cards";
import { ChipLink, EmptyState } from "@/components/ui";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { listPackages } from "@/lib/queries/packages";

export const metadata = { title: "Packages" };

export default async function Packages({ searchParams }: PageProps<"/packages">) {
  const { event } = await requirePlannerEvent();
  const { type } = await searchParams;
  const catalog = await getCatalog();
  const selected = typeof type === "string" ? type : undefined;
  const pkgs = await listPackages({ eventType: selected });
  const usedTypes = new Set((await listPackages()).map((p) => p.eventType));

  return (
    <main>
      <AppHeader title="Packages" subtitle="Curated by Eventually · estimates, final price via quotes" back="/home" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4 pb-1">
        <ChipLink href="/packages" selected={!selected}>
          All
        </ChipLink>
        {catalog.eventTypes
          .filter((e) => usedTypes.has(e.slug))
          .map((e) => (
            <ChipLink key={e.slug} href={`/packages?type=${e.slug}`} selected={selected === e.slug}>
              {e.name}
              {e.slug === event.eventType && <span className="size-1.5 rounded-full bg-rose-500" aria-label="your event type" />}
            </ChipLink>
          ))}
      </div>
      <div className="grid gap-4 px-5 pt-4 pb-6">
        {pkgs.length ? (
          pkgs.map((p) => <PackageCard key={p.id} pkg={p} catalog={catalog} wide />)
        ) : (
          <EmptyState title="No packages for this event type yet" body="Our curators are building more. Try another type." />
        )}
      </div>
    </main>
  );
}
