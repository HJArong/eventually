import Link from "next/link";
import { formatDate, formatPesoShort, firstName, timeAgo } from "@/lib/format";
import type { Catalog } from "@/lib/queries/catalog";
import type { VendorRequestRow } from "@/lib/queries/vendor-dashboard";
import { StatusPill } from "./status-pill";
import { Avatar } from "./ui";

export function RequestRow({ row, catalog }: { row: VendorRequestRow; catalog: Catalog }) {
  const { request, event, planner } = row;
  const area = request.deliveryAreaId ? catalog.areaById.get(request.deliveryAreaId)?.name : catalog.areaById.get(event.areaId)?.name;
  const type = catalog.eventTypeBySlug.get(event.eventType)?.name;
  const needsQuote = request.status === "requested";
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card">
      <Avatar name={planner.displayName} size={44} />
      <Link href={row.threadId ? `/vendor/inbox/${row.threadId}` : `/vendor/requests/${request.id}/quote`} className="min-w-0 flex-1">
        <p className="truncate font-display font-semibold">
          {firstName(planner.displayName)} · {type}
        </p>
        <p className="truncate text-xs font-semibold text-muted">
          {formatDate(request.date)} · {area} · {request.pax} pax{request.budgetPhp ? ` · ~${formatPesoShort(request.budgetPhp)}` : ""}
        </p>
        <p className="truncate text-xs text-muted">
          {request.requestedServices.map((s) => `${s.name}${s.qty > 1 ? ` ×${s.qty}` : ""}`).join(", ")} · {timeAgo(request.createdAt)}
        </p>
      </Link>
      {needsQuote ? (
        <Link
          href={`/vendor/requests/${request.id}/quote`}
          className="shrink-0 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white press"
        >
          Quote
        </Link>
      ) : (
        <StatusPill status={request.status} />
      )}
    </div>
  );
}
