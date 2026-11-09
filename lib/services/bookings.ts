import { and, asc, eq, inArray, isNotNull, lt, lte, sql } from "drizzle-orm";
import { config } from "@/lib/config";
import type { DB } from "@/lib/db";
import {
  areas,
  bookingRequests,
  categories,
  events,
  messages,
  profiles,
  quoteItems,
  quotes,
  services,
  threads,
  vendorBlockedDates,
  vendors,
} from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth/session";
import { AUTO_REPLY_STAGGER_SECONDS, buildAutoQuote } from "@/lib/domain/auto-responder";
import { quoteTotals } from "@/lib/domain/pricing";
import { assertTransition, type BookingStatus } from "@/lib/domain/status";
import type { QuoteLine, RequestedService } from "@/lib/domain/types";
import { formatPeso, todayISO } from "@/lib/format";
import { paymentProvider } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/domain/payments";
import { ForbiddenError, requireOwnEvent, requireOwnedVendor, requireThreadParticipant } from "./access";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export async function ensureThread(db: DB | Tx, eventId: string, vendorId: string, plannerId: string) {
  const [existing] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.eventId, eventId), eq(threads.vendorId, vendorId)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(threads)
    .values({ eventId, vendorId, plannerId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [raced] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.eventId, eventId), eq(threads.vendorId, vendorId)));
  return raced!;
}

async function postMessage(
  db: DB | Tx,
  msg: Omit<typeof messages.$inferInsert, "createdAt"> & { createdAt?: Date },
) {
  const createdAt = msg.createdAt ?? new Date();
  await db.insert(messages).values({ ...msg, createdAt });
  await db.update(threads).set({ lastMessageAt: createdAt }).where(eq(threads.id, msg.threadId));
}

export type NewRequest = {
  vendorId: string;
  serviceSelections: { serviceId: string; qty: number }[];
  timeText?: string | null;
  budgetPhp?: number | null;
  deliveryAreaId?: number | null;
  venueText?: string | null;
  notes?: string | null;
  pax?: number;
  date?: string;
};

/** Sends one structured request per vendor. Returns the thread id per vendor. */
export async function createBookingRequests(
  db: DB,
  viewer: Viewer,
  input: { eventId: string; packageId?: string | null; requests: NewRequest[] },
) {
  const event = await requireOwnEvent(db, viewer, input.eventId);
  if (!input.requests.length) throw new Error("Pick at least one vendor");

  const vendorIds = [...new Set(input.requests.map((r) => r.vendorId))];
  const vendorRows = await db.select().from(vendors).where(inArray(vendors.id, vendorIds));
  const serviceIds = input.requests.flatMap((r) => r.serviceSelections.map((s) => s.serviceId));
  const serviceRows = serviceIds.length
    ? await db.select().from(services).where(inArray(services.id, serviceIds))
    : [];

  const now = new Date();
  const result: { vendorId: string; threadId: string; requestId: string }[] = [];

  await db.transaction(async (tx) => {
    for (const [i, req] of input.requests.entries()) {
      const vendor = vendorRows.find((v) => v.id === req.vendorId);
      if (!vendor) throw new Error("Vendor not found");
      const requested: RequestedService[] = req.serviceSelections.map((sel) => {
        const svc = serviceRows.find((s) => s.id === sel.serviceId && s.vendorId === vendor.id);
        if (!svc) throw new Error("Service not found for this vendor");
        return {
          serviceId: svc.id,
          name: svc.name,
          qty: Math.max(1, Math.round(sel.qty)),
          unit: svc.unit,
          pricePhp: svc.pricePhp,
        };
      });
      const thread = await ensureThread(tx, event.id, vendor.id, viewer.id);
      const autoReplyAt =
        config.autoResponder && vendor.autoRespond
          ? new Date(now.getTime() + (config.autoReplyDelaySeconds + i * AUTO_REPLY_STAGGER_SECONDS) * 1000)
          : null;
      const [request] = await tx
        .insert(bookingRequests)
        .values({
          eventId: event.id,
          vendorId: vendor.id,
          packageId: input.packageId ?? null,
          status: "requested",
          requestedServices: requested,
          date: req.date ?? event.date,
          timeText: req.timeText || null,
          pax: req.pax ?? event.pax,
          budgetPhp: req.budgetPhp ?? null,
          deliveryAreaId: req.deliveryAreaId ?? event.areaId,
          venueText: req.venueText || event.venueText,
          notes: req.notes || null,
          autoReplyAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      await postMessage(tx, {
        threadId: thread.id,
        senderId: viewer.id,
        senderRole: "planner",
        kind: "request",
        body: req.notes ?? "",
        bookingRequestId: request!.id,
        createdAt: now,
      });
      result.push({ vendorId: vendor.id, threadId: thread.id, requestId: request!.id });
    }
  });
  return result;
}

export type QuoteInput = { items: QuoteLine[]; depositPct: number; validUntil: string; message?: string | null };

async function insertQuote(
  tx: Tx,
  request: typeof bookingRequests.$inferSelect,
  input: QuoteInput,
  actor: "vendor" | "system",
  senderId: string | null,
  greeting?: string,
) {
  assertTransition(request.status, "quoted", actor);
  const items = input.items.filter((i) => i.label.trim() && i.qty > 0);
  if (!items.length) throw new Error("Add at least one line item");
  const { total } = quoteTotals(items, input.depositPct);
  const thread = await ensureThread(tx, request.eventId, request.vendorId, (await eventPlanner(tx, request.eventId))!);

  await tx
    .update(quotes)
    .set({ status: "superseded" })
    .where(and(eq(quotes.bookingRequestId, request.id), eq(quotes.status, "sent")));
  const [quote] = await tx
    .insert(quotes)
    .values({
      bookingRequestId: request.id,
      totalPhp: total,
      depositPct: input.depositPct,
      validUntil: input.validUntil,
      message: input.message || null,
      status: "sent",
    })
    .returning();
  await tx
    .insert(quoteItems)
    .values(items.map((item, k) => ({ quoteId: quote!.id, label: item.label.trim(), qty: item.qty, unitPricePhp: item.unitPricePhp, sort: k })));
  await tx
    .update(bookingRequests)
    .set({ status: "quoted", autoReplyAt: null, updatedAt: new Date() })
    .where(eq(bookingRequests.id, request.id));
  const at = Date.now();
  if (greeting) {
    await postMessage(tx, { threadId: thread.id, senderId, senderRole: "vendor", kind: "text", body: greeting, createdAt: new Date(at) });
  }
  await postMessage(tx, {
    threadId: thread.id,
    senderId,
    senderRole: "vendor",
    kind: "quote",
    body: input.message ?? "",
    quoteId: quote!.id,
    bookingRequestId: request.id,
    createdAt: new Date(at + 1),
  });
  return { quote: quote!, threadId: thread.id };
}

async function eventPlanner(db: DB | Tx, eventId: string) {
  const [e] = await db.select({ plannerId: events.plannerId }).from(events).where(eq(events.id, eventId));
  return e?.plannerId;
}

async function requireVendorRequest(db: DB, viewer: Viewer, requestId: string) {
  const vendor = await requireOwnedVendor(db, viewer);
  const [request] = await db
    .select()
    .from(bookingRequests)
    .where(and(eq(bookingRequests.id, requestId), eq(bookingRequests.vendorId, vendor.id)));
  if (!request) throw new ForbiddenError("Request not found");
  return { vendor, request };
}

export async function sendQuote(db: DB, viewer: Viewer, requestId: string, input: QuoteInput) {
  const { request } = await requireVendorRequest(db, viewer, requestId);
  return db.transaction((tx) => insertQuote(tx, request, input, "vendor", viewer.id));
}

export async function declineRequest(db: DB, viewer: Viewer, requestId: string, reason?: string) {
  const { request } = await requireVendorRequest(db, viewer, requestId);
  assertTransition(request.status, "declined", "vendor");
  await db.transaction(async (tx) => {
    await tx
      .update(bookingRequests)
      .set({ status: "declined", autoReplyAt: null, updatedAt: new Date() })
      .where(eq(bookingRequests.id, request.id));
    await tx.update(quotes).set({ status: "declined" }).where(and(eq(quotes.bookingRequestId, request.id), eq(quotes.status, "sent")));
    const thread = await ensureThread(tx, request.eventId, request.vendorId, (await eventPlanner(tx, request.eventId))!);
    await postMessage(tx, {
      threadId: thread.id,
      senderRole: "system",
      kind: "system",
      body: reason ? `The vendor declined this request: “${reason}”` : "The vendor can't take this booking.",
      bookingRequestId: request.id,
    });
  });
}

async function requirePlannerQuote(db: DB, viewer: Viewer, quoteId: string) {
  const [row] = await db
    .select({ quote: quotes, request: bookingRequests, event: events })
    .from(quotes)
    .innerJoin(bookingRequests, eq(bookingRequests.id, quotes.bookingRequestId))
    .innerJoin(events, eq(events.id, bookingRequests.eventId))
    .where(eq(quotes.id, quoteId));
  if (!row || row.event.plannerId !== viewer.id) throw new ForbiddenError("Quote not found");
  return row;
}

export async function acceptQuote(db: DB, viewer: Viewer, quoteId: string) {
  const { quote, request } = await requirePlannerQuote(db, viewer, quoteId);
  if (request.status === "accepted" && quote.status === "accepted") return { requestId: request.id };
  if (quote.status !== "sent") throw new Error("This quote is no longer open");
  if (quote.validUntil < todayISO()) throw new Error("This quote has expired. Ask the vendor for a new one.");
  assertTransition(request.status, "accepted", "planner");
  await db.transaction(async (tx) => {
    await tx.update(quotes).set({ status: "accepted" }).where(eq(quotes.id, quote.id));
    await tx.update(bookingRequests).set({ status: "accepted", updatedAt: new Date() }).where(eq(bookingRequests.id, request.id));
    const thread = await ensureThread(tx, request.eventId, request.vendorId, viewer.id);
    await postMessage(tx, {
      threadId: thread.id,
      senderRole: "system",
      kind: "system",
      body: `${viewer.displayName || "The planner"} accepted the ${formatPeso(quote.totalPhp)} quote. Waiting for the deposit.`,
      bookingRequestId: request.id,
    });
  });
  return { requestId: request.id };
}

export async function declineQuote(db: DB, viewer: Viewer, quoteId: string) {
  const { quote, request } = await requirePlannerQuote(db, viewer, quoteId);
  if (quote.status !== "sent") throw new Error("This quote is no longer open");
  assertTransition(request.status, "cancelled", "planner");
  await db.transaction(async (tx) => {
    await tx.update(quotes).set({ status: "declined" }).where(eq(quotes.id, quote.id));
    await tx.update(bookingRequests).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookingRequests.id, request.id));
    const thread = await ensureThread(tx, request.eventId, request.vendorId, viewer.id);
    await postMessage(tx, {
      threadId: thread.id,
      senderRole: "system",
      kind: "system",
      body: `${viewer.displayName || "The planner"} passed on this quote.`,
      bookingRequestId: request.id,
    });
  });
}

export async function payDeposit(db: DB, viewer: Viewer, quoteId: string, method: PaymentMethod) {
  const { quote, request, event } = await requirePlannerQuote(db, viewer, quoteId);
  if (request.status === "confirmed") return { alreadyPaid: true };
  if (request.status === "quoted") await acceptQuote(db, viewer, quoteId);
  else assertTransition(request.status, "deposit_paid", "system");

  const { deposit } = quoteTotals([{ label: "total", qty: 1, unitPricePhp: quote.totalPhp }], quote.depositPct);
  const payment = await paymentProvider(db).createDeposit({ quoteId: quote.id, amountPhp: Math.max(1, deposit), method });
  if (payment.status !== "succeeded") throw new Error("Payment did not go through");

  await db.transaction(async (tx) => {
    const thread = await ensureThread(tx, request.eventId, request.vendorId, viewer.id);
    await tx.update(bookingRequests).set({ status: "deposit_paid", updatedAt: new Date() }).where(eq(bookingRequests.id, request.id));
    await postMessage(tx, {
      threadId: thread.id,
      senderRole: "system",
      kind: "system",
      body: `Deposit of ${formatPeso(payment.amountPhp)} paid via ${method === "gcash" ? "GCash" : "card"} (demo, ref ${payment.reference}).`,
      bookingRequestId: request.id,
    });
    assertTransition("deposit_paid", "confirmed", "system");
    await tx.update(bookingRequests).set({ status: "confirmed", updatedAt: new Date() }).where(eq(bookingRequests.id, request.id));
    await tx
      .insert(vendorBlockedDates)
      .values({ vendorId: request.vendorId, date: event.date, reason: "Booked via Eventually" })
      .onConflictDoNothing();
    await postMessage(tx, {
      threadId: thread.id,
      senderRole: "system",
      kind: "system",
      body: "Booking confirmed! The date is now blocked on the vendor's calendar.",
      bookingRequestId: request.id,
      createdAt: new Date(Date.now() + 1),
    });
  });
  return { alreadyPaid: false, reference: payment.reference };
}

export async function cancelRequest(db: DB, viewer: Viewer, requestId: string) {
  const [row] = await db
    .select({ request: bookingRequests, event: events })
    .from(bookingRequests)
    .innerJoin(events, eq(events.id, bookingRequests.eventId))
    .where(eq(bookingRequests.id, requestId));
  if (!row || row.event.plannerId !== viewer.id) throw new ForbiddenError("Request not found");
  assertTransition(row.request.status, "cancelled", "planner");
  await db.transaction(async (tx) => {
    await tx.update(bookingRequests).set({ status: "cancelled", autoReplyAt: null, updatedAt: new Date() }).where(eq(bookingRequests.id, requestId));
    const thread = await ensureThread(tx, row.request.eventId, row.request.vendorId, viewer.id);
    await postMessage(tx, { threadId: thread.id, senderRole: "system", kind: "system", body: "Request cancelled by the planner.", bookingRequestId: requestId });
  });
}

export async function sendMessage(db: DB, viewer: Viewer, threadId: string, body: string, imageUrl?: string | null) {
  const { thread, side } = await requireThreadParticipant(db, viewer, threadId);
  const text = body.trim().slice(0, 2000);
  if (!text && !imageUrl) return;
  await postMessage(db, {
    threadId: thread.id,
    senderId: viewer.id,
    senderRole: side,
    kind: imageUrl ? "image" : "text",
    body: text,
    imageUrl: imageUrl ?? null,
  });
}

export async function markThreadRead(db: DB, viewer: Viewer, threadId: string) {
  const { side } = await requireThreadParticipant(db, viewer, threadId);
  const others = side === "planner" ? ["vendor", "system"] : ["planner"];
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.threadId, threadId), sql`${messages.readAt} is null`, inArray(messages.senderRole, others as ("planner" | "vendor" | "system")[])));
}

/**
 * Background work done lazily on page loads and polls, so it also works on serverless hosts:
 * the demo auto-responder and quote expiry.
 */
export async function runMaintenanceTick(db: DB) {
  const now = new Date();
  const today = todayISO(now);

  await db.update(quotes).set({ status: "expired" }).where(and(eq(quotes.status, "sent"), lt(quotes.validUntil, today)));
  await db
    .update(bookingRequests)
    .set({ status: "expired", updatedAt: now })
    .where(
      and(
        eq(bookingRequests.status, "quoted"),
        sql`not exists (select 1 from quotes q where q.booking_request_id = ${bookingRequests.id} and q.status = 'sent')`,
      ),
    );

  if (!config.autoResponder) return;
  const due = await db
    .select({ id: bookingRequests.id })
    .from(bookingRequests)
    .where(and(isNotNull(bookingRequests.autoReplyAt), lte(bookingRequests.autoReplyAt, now), eq(bookingRequests.status, "requested")))
    .orderBy(asc(bookingRequests.autoReplyAt))
    .limit(10);

  for (const { id } of due) {
    // Claim the row so concurrent ticks don't answer twice.
    const [claimed] = await db
      .update(bookingRequests)
      .set({ autoReplyAt: null })
      .where(and(eq(bookingRequests.id, id), isNotNull(bookingRequests.autoReplyAt)))
      .returning();
    if (!claimed) continue;
    try {
      await autoReply(db, claimed, today);
    } catch (err) {
      console.error("auto-responder failed", err);
    }
  }
}

async function autoReply(db: DB, request: typeof bookingRequests.$inferSelect, today: string) {
  const [ctx] = await db
    .select({ vendor: vendors, categorySlug: categories.slug, plannerName: profiles.displayName })
    .from(vendors)
    .innerJoin(categories, eq(categories.id, vendors.categoryId))
    .innerJoin(events, eq(events.id, request.eventId))
    .innerJoin(profiles, eq(profiles.id, events.plannerId))
    .where(eq(vendors.id, request.vendorId));
  if (!ctx) return;
  const [firstService] = await db.select().from(services).where(eq(services.vendorId, request.vendorId)).orderBy(asc(services.sort)).limit(1);
  const [area] = request.deliveryAreaId
    ? await db.select({ name: areas.name }).from(areas).where(eq(areas.id, request.deliveryAreaId))
    : [];
  const auto = buildAutoQuote({
    requestedServices: request.requestedServices,
    fallbackService: firstService ? { name: firstService.name, pricePhp: firstService.pricePhp, unit: firstService.unit } : null,
    categorySlug: ctx.categorySlug,
    plannerName: ctx.plannerName,
    eventDateIso: request.date,
    todayIso: today,
    pax: request.pax,
    deliveryAreaName: area?.name ?? null,
    seed: request.id.charCodeAt(0),
  });
  if (!auto.items.length) return;
  await db.transaction((tx) =>
    insertQuote(tx, { ...request, status: "requested" as BookingStatus }, auto, "system", ctx.vendor.ownerId, auto.greeting),
  );
}
