import { addDays, firstName, formatDate } from "@/lib/format";
import type { QuoteLine, RequestedService } from "./types";

/** Extra delay per request when several go out at once, so replies trickle in. */
export const AUTO_REPLY_STAGGER_SECONDS = 4;

const DELIVERY_CATEGORIES = new Set(["lechon", "catering", "cakes", "mobile-bar"]);

export type AutoQuoteInput = {
  requestedServices: RequestedService[];
  fallbackService: { name: string; pricePhp: number; unit: RequestedService["unit"] } | null;
  categorySlug: string;
  plannerName: string;
  eventDateIso: string;
  todayIso: string;
  pax: number;
  deliveryAreaName: string | null;
  seed: number;
};

export type AutoQuote = {
  greeting: string;
  items: QuoteLine[];
  depositPct: number;
  validUntil: string;
  message: string;
};

const GREETINGS = [
  (n: string) => `Maayong adlaw, ${n}! Salamat sa inquiry.`,
  (n: string) => `Hi ${n}! Thank you for reaching out po.`,
  (n: string) => `Maayong buntag, ${n}!`,
];

export function buildAutoQuote(input: AutoQuoteInput): AutoQuote {
  const name = firstName(input.plannerName) || "there";
  const greet = GREETINGS[Math.abs(input.seed) % GREETINGS.length](name);

  const items: QuoteLine[] = input.requestedServices.length
    ? input.requestedServices.map((s) => ({ label: s.name, qty: Math.max(1, s.qty), unitPricePhp: s.pricePhp }))
    : input.fallbackService
      ? [
          {
            label: input.fallbackService.name,
            qty: input.fallbackService.unit === "per_pax" ? input.pax : 1,
            unitPricePhp: input.fallbackService.pricePhp,
          },
        ]
      : [];

  const delivers = DELIVERY_CATEGORIES.has(input.categorySlug) && input.deliveryAreaName;
  if (delivers) items.push({ label: `Delivery – ${input.deliveryAreaName}`, qty: 1, unitPricePhp: 0 });

  // Valid for two weeks, but never past the day before the event.
  const twoWeeks = addDays(input.todayIso, 14);
  const dayBefore = addDays(input.eventDateIso, -1);
  const validUntil = twoWeeks < dayBefore ? twoWeeks : dayBefore < input.todayIso ? input.todayIso : dayBefore;

  const greeting = `${greet} Available mi on ${formatDate(input.eventDateIso)}.${delivers ? ` ${input.deliveryAreaName} delivery is free.` : ""}`;
  const message = "Here's our quote po. 30% deposit to lock the date, balance on the day. Salamat!";

  return { greeting, items, depositPct: 30, validUntil, message };
}
