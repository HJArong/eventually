import { AppHeader } from "@/components/app-header";
import { RequestRow } from "@/components/request-row";
import { ChipLink, EmptyState } from "@/components/ui";
import type { BookingStatus } from "@/lib/domain/status";
import { getCatalog } from "@/lib/queries/catalog";
import { getVendorRequests } from "@/lib/queries/vendor-dashboard";
import { requireVendorShop } from "@/lib/vendor";

export const metadata = { title: "Requests" };

const FILTERS: Record<string, { label: string; statuses?: BookingStatus[] }> = {
  new: { label: "New", statuses: ["requested"] },
  quoted: { label: "Quoted", statuses: ["quoted", "accepted"] },
  booked: { label: "Booked", statuses: ["deposit_paid", "confirmed"] },
  all: { label: "All" },
};

export default async function VendorRequests({ searchParams }: PageProps<"/vendor/requests">) {
  const { vendor } = await requireVendorShop();
  const { status } = await searchParams;
  const key = typeof status === "string" && status in FILTERS ? status : "new";
  const [rows, catalog] = await Promise.all([getVendorRequests(vendor.id, FILTERS[key]!.statuses), getCatalog()]);
  return (
    <main>
      <AppHeader title="Requests" subtitle="Date, pax and budget up front" />
      <div className="flex gap-2 px-5 pt-4">
        {Object.entries(FILTERS).map(([k, f]) => (
          <ChipLink key={k} href={`/vendor/requests?status=${k}`} selected={k === key}>
            {f.label}
          </ChipLink>
        ))}
      </div>
      <div className="grid gap-3 px-5 pt-4 pb-6">
        {rows.length ? rows.map((r) => <RequestRow key={r.request.id} row={r} catalog={catalog} />) : <EmptyState title="Nothing here" />}
      </div>
    </main>
  );
}
