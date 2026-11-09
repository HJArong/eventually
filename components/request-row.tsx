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
    <div className="flex min-w-0 items-center gap-3 rounded-3xl border-2 border-ink bg-white p-3 shadow-pop-sm">
      <Avatar name={planner.displayName} size={44} />
      <Link href={row.threadId ? `/vendor/inbox/${row.threadId}` : `/vendor/requests/${request.id}/quote`} className="min-w-0 flex-1">
        <p className="truncate font-display font-extrabold">
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
          className="shrink-0 rounded-full border-2 border-ink bg-mango px-3 py-1.5 text-xs font-extrabold shadow-pop-sm press"
        >
          Quote
        </Link>
      ) : (
        <StatusPill status={request.status} />
      )}
    </div>
  );
}
