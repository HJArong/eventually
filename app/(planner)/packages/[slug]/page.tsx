import Image from "next/image";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { getPackageDetail } from "@/lib/queries/packages";
import { PackageBuilder } from "./package-builder";

export default async function PackageDetail({ params }: PageProps<"/packages/[slug]">) {
  const { event } = await requirePlannerEvent();
  const { slug } = await params;
  const [data, catalog] = await Promise.all([getPackageDetail(slug), getCatalog()]);
  if (!data) notFound();
  const { pkg } = data;
  const area = pkg.areaId ? catalog.areaById.get(pkg.areaId)?.name : "Metro Cebu";

  const toOption = (vendor: (typeof data.items)[number]["vendor"], service: (typeof data.items)[number]["service"]) => ({
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorSlug: vendor.slug,
    coverUrl: vendor.coverUrl,
    rating: vendor.ratingAvg,
    areaName: catalog.areaById.get(vendor.baseAreaId)?.name ?? "",
    serviceId: service.id,
    serviceName: service.name,
    pricePhp: service.pricePhp,
    unit: service.unit,
    minQty: service.minQty,
    maxQty: service.maxQty,
  });

  return (
    <main>
      <AppHeader title={pkg.title} back="/packages" />
      <div className="px-5 pt-4">
        <div className="card relative h-48 overflow-hidden rounded-2xl">
          {pkg.coverUrl && <Image src={pkg.coverUrl} alt="" fill priority sizes="440px" className="object-cover" />}
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-rose-700 shadow-card">
            Curated by Eventually
          </span>
        </div>
        <h2 className="mt-4 text-2xl leading-tight font-semibold">
          {pkg.title}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {catalog.eventTypeBySlug.get(pkg.eventType)?.name} · {area} · {pkg.paxMin}–{pkg.paxMax} pax
        </p>
        <p className="mt-2 text-sm text-ink-soft">{pkg.description}</p>
      </div>
      <PackageBuilder
        packageId={pkg.id}
        defaultPax={event.pax}
        eventTitle={event.title}
        slots={data.items.map((item) => ({
          category: catalog.categoryById.get(item.vendor.categoryId)?.name ?? "",
          qtyRule: item.qtyRule,
          qty: item.qty,
          current: toOption(item.vendor, item.service),
          alternatives: item.alternatives.map((a) => toOption(a.vendor, a.service)),
        }))}
      />
    </main>
  );
}
