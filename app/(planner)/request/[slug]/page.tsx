import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { getVendorProfile } from "@/lib/queries/vendors";
import { RequestForm } from "./request-form";

export const metadata = { title: "Request a quote" };

export default async function RequestQuote({ params, searchParams }: PageProps<"/request/[slug]">) {
  const { event } = await requirePlannerEvent();
  const { slug } = await params;
  const { service } = await searchParams;
  const [data, catalog] = await Promise.all([getVendorProfile(slug), getCatalog()]);
  if (!data) notFound();

  return (
    <main>
      <AppHeader title="Request a quote" back={`/vendors/${slug}`} />
      <RequestForm
        vendor={{
          id: data.vendor.id,
          name: data.vendor.name,
          coverUrl: data.vendor.coverUrl,
          category: catalog.categoryById.get(data.vendor.categoryId)?.name ?? "",
        }}
        services={data.services.map((s) => ({
          id: s.id,
          name: s.name,
          pricePhp: s.pricePhp,
          unit: s.unit,
          minQty: s.minQty,
          maxQty: s.maxQty,
        }))}
        preselect={typeof service === "string" ? service : (data.services[0]?.id ?? null)}
        event={{
          title: event.title,
          date: event.date,
          pax: event.pax,
          venueText: event.venueText ?? "",
          areaId: event.areaId,
        }}
        areas={catalog.areas.map((a) => ({ id: a.id, name: a.name }))}
      />
    </main>
  );
}
