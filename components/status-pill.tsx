import { cn } from "@/lib/cn";
import { SLOT_LABEL, STATUS_LABEL, type BookingStatus, type SlotStatus } from "@/lib/domain/status";

const STATUS_STYLE: Record<BookingStatus, string> = {
  draft: "bg-white text-muted",
  requested: "bg-ube-50 text-ube-700",
  quoted: "bg-mango text-ink",
  accepted: "bg-mango-100 text-ink",
  deposit_paid: "bg-calamansi-100 text-ink",
  confirmed: "bg-calamansi text-white",
  declined: "bg-sunset-50 text-sunset",
  expired: "bg-sand text-muted",
  cancelled: "bg-sand text-muted",
};

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full border-2 border-ink px-2.5 text-xs font-extrabold",
        STATUS_STYLE[status],
        className,
      )}
    >
      {status === "accepted" ? "Pay deposit" : STATUS_LABEL[status]}
    </span>
  );
}

const SLOT_STYLE: Record<SlotStatus, string> = {
  find: "bg-white text-ink",
  requested: "bg-ube-50 text-ube-700",
  quote_in: "bg-mango text-ink",
  booked: "bg-calamansi text-white",
};

export function SlotPill({ status, className }: { status: SlotStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full border-2 border-ink px-3 text-xs font-extrabold",
        SLOT_STYLE[status],
        className,
      )}
    >
      {SLOT_LABEL[status]}
    </span>
  );
}
