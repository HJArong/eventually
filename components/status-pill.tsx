import { cn } from "@/lib/cn";
import { SLOT_LABEL, STATUS_LABEL, type BookingStatus, type SlotStatus } from "@/lib/domain/status";

const STATUS_STYLE: Record<BookingStatus, string> = {
  draft: "bg-sand text-muted",
  requested: "bg-sand text-ink-soft",
  quoted: "bg-rose-50 text-rose-700",
  accepted: "bg-warning-50 text-warning",
  deposit_paid: "bg-success-50 text-success",
  confirmed: "bg-success-50 text-success",
  declined: "bg-danger-50 text-danger",
  expired: "bg-sand text-muted",
  cancelled: "bg-sand text-muted",
};

const PILL = "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium";

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span className={cn(PILL, STATUS_STYLE[status], className)}>{status === "accepted" ? "Pay deposit" : STATUS_LABEL[status]}</span>
  );
}

const SLOT_STYLE: Record<SlotStatus, string> = {
  find: "bg-white text-ink-soft ring-1 ring-line",
  requested: "bg-sand text-ink-soft",
  quote_in: "bg-rose-50 text-rose-700",
  booked: "bg-success-50 text-success",
};

export function SlotPill({ status, className }: { status: SlotStatus; className?: string }) {
  return <span className={cn(PILL, SLOT_STYLE[status], className)}>{SLOT_LABEL[status]}</span>;
}
