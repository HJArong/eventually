export type BookingStatus =
  | "draft"
  | "requested"
  | "quoted"
  | "accepted"
  | "deposit_paid"
  | "confirmed"
  | "declined"
  | "expired"
  | "cancelled";

export type Actor = "planner" | "vendor" | "system";

/**
 * draft → requested → quoted → accepted → deposit_paid (mock) → confirmed,
 * with side exits declined (vendor), expired (quote passed valid-until) and cancelled (planner).
 */
const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, Actor[]>>> = {
  draft: { requested: ["planner"], cancelled: ["planner"] },
  requested: { quoted: ["vendor", "system"], declined: ["vendor"], cancelled: ["planner"] },
  quoted: {
    quoted: ["vendor", "system"], // revised quote
    accepted: ["planner"],
    declined: ["vendor"],
    cancelled: ["planner"],
    expired: ["system"],
  },
  accepted: { deposit_paid: ["system"], cancelled: ["planner"] },
  deposit_paid: { confirmed: ["system"] },
  confirmed: {},
  declined: {},
  expired: { quoted: ["vendor", "system"], cancelled: ["planner"] },
  cancelled: {},
};

export function canTransition(from: BookingStatus, to: BookingStatus, actor: Actor): boolean {
  return TRANSITIONS[from]?.[to]?.includes(actor) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus, actor: Actor) {
    super(`Booking cannot go from "${from}" to "${to}" (by ${actor})`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) throw new InvalidTransitionError(from, to, actor);
}

export function isTerminal(status: BookingStatus): boolean {
  return Object.keys(TRANSITIONS[status]).length === 0;
}

export function isOpen(status: BookingStatus): boolean {
  return !["declined", "expired", "cancelled"].includes(status);
}

/** A sent quote whose valid-until date has passed is expired. */
export function isQuoteExpired(validUntilIso: string, todayIso: string): boolean {
  return validUntilIso < todayIso;
}

export type SlotStatus = "find" | "requested" | "quote_in" | "booked";

const SLOT_RANK: Record<SlotStatus, number> = { find: 0, requested: 1, quote_in: 2, booked: 3 };

export function slotStatusFor(status: BookingStatus): SlotStatus {
  switch (status) {
    case "deposit_paid":
    case "confirmed":
      return "booked";
    case "quoted":
    case "accepted":
      return "quote_in";
    case "draft":
    case "requested":
      return "requested";
    default:
      return "find";
  }
}

/** The dashboard slot for a category shows the most advanced request in it. */
export function bestSlotStatus(statuses: BookingStatus[]): SlotStatus {
  return statuses
    .map(slotStatusFor)
    .reduce<SlotStatus>((best, s) => (SLOT_RANK[s] > SLOT_RANK[best] ? s : best), "find");
}

export const SLOT_LABEL: Record<SlotStatus, string> = {
  find: "Find",
  requested: "Requested",
  quote_in: "Quote in",
  booked: "Booked",
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  quoted: "Quote in",
  accepted: "Accepted",
  deposit_paid: "Deposit paid",
  confirmed: "Booked",
  declined: "Declined",
  expired: "Expired",
  cancelled: "Cancelled",
};
