import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { StatusPill } from "@/components/status-pill";
import { addDays, firstName, formatDate, formatPeso, todayISO } from "@/lib/format";
import { getCatalog } from "@/lib/queries/catalog";
import { getVendorRequest } from "@/lib/queries/vendor-dashboard";
import { assertUuid, ForbiddenError } from "@/lib/services/access";
import { requireVendorShop } from "@/lib/vendor";
import { QuoteComposer } from "./quote-composer";

export const metadata = { title: "Send quote" };

export default async function QuotePage({ params }: PageProps<"/vendor/requests/[id]/quote">) {
  const { vendor } = await requireVendorShop();
  const { id } = await params;
  try {
    assertUuid(id);
  } catch (e) {
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }
  const [data, catalog] = await Promise.all([getVendorRequest(vendor.id, id), getCatalog()]);
  if (!data) notFound();
  const { request, event, planner } = data;
  const area = request.deliveryAreaId ? catalog.areaById.get(request.deliveryAreaId)?.name : null;
  const category = catalog.categoryById.get(vendor.categoryId)?.slug ?? "";
  const delivers = ["lechon", "catering", "cakes", "mobile-bar"].includes(category);
  const twoWeeks = addDays(todayISO(), 14);
  const dayBefore = addDays(request.date, -1);
  const validUntil = twoWeeks < dayBefore ? twoWeeks : dayBefore >= todayISO() ? dayBefore : todayISO();
  const canQuote = ["requested", "quoted", "expired"].includes(request.status);

  const initialItems = [
    ...request.requestedServices.map((s) => ({ label: s.name, qty: s.qty, unitPricePhp: s.pricePhp })),
    ...(delivers && area ? [{ label: `Delivery – ${area}`, qty: 1, unitPricePhp: 0 }] : []),
  ];

  return (
    <main>
      <AppHeader title="Send quote" back="/vendor/requests" right={<StatusPill status={request.status} />} />
      <div className="px-5 pt-4">
        <div className="rounded-3xl border-2 border-ink bg-sand p-4">
          <p className="font-display text-lg leading-tight font-extrabold">
            {firstName(planner.displayName)} · {event.title}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {formatDate(request.date, { weekday: true })}
              {request.timeText ? ` · ${request.timeText}` : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {request.pax} pax
            </span>
            {(request.venueText || area) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {[request.venueText, area].filter(Boolean).join(", ")}
              </span>
            )}
            {request.budgetPhp ? <span>Budget ~{formatPeso(request.budgetPhp)}</span> : null}
          </p>
          {request.notes && <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm">“{request.notes}”</p>}
        </div>
      </div>
      {canQuote ? (
        <QuoteComposer requestId={request.id} initialItems={initialItems} validUntil={validUntil} minDate={todayISO()} />
      ) : (
        <p className="px-5 pt-6 text-sm text-muted">This request is {request.status}; quotes can’t be changed now.</p>
      )}
    </main>
  );
}
