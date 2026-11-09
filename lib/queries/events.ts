import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookingRequests, eventTasks, events, quotes, threads, vendors } from "@/lib/db/schema";
import { budgetSummary } from "@/lib/domain/pricing";
import { bestSlotStatus, type SlotStatus } from "@/lib/domain/status";
import { checklistProgress } from "@/lib/domain/checklist";
import { getCatalog } from "./catalog";

export async function getCurrentEvent(plannerId: string) {
  const db = await getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.plannerId, plannerId))
    .orderBy(desc(events.createdAt))
    .limit(1);
  return event ?? null;
}

export type PlannerEvent = NonNullable<Awaited<ReturnType<typeof getCurrentEvent>>>;

export async function getEventOverview(event: PlannerEvent) {
  const db = await getDb();
  const catalog = await getCatalog();
  const [tasks, requests] = await Promise.all([
    db.select().from(eventTasks).where(eq(eventTasks.eventId, event.id)).orderBy(asc(eventTasks.sort)),
    db
      .select({ request: bookingRequests, vendor: vendors, threadId: threads.id })
      .from(bookingRequests)
      .innerJoin(vendors, eq(vendors.id, bookingRequests.vendorId))
      .leftJoin(threads, and(eq(threads.eventId, bookingRequests.eventId), eq(threads.vendorId, bookingRequests.vendorId)))
      .where(eq(bookingRequests.eventId, event.id))
      .orderBy(desc(bookingRequests.updatedAt)),
  ]);
  const quoteRows = requests.length
    ? await db
        .select()
        .from(quotes)
        .where(inArray(quotes.bookingRequestId, requests.map((r) => r.request.id)))
        .orderBy(desc(quotes.createdAt))
    : [];
  const latestQuote = (requestId: string) => quoteRows.find((q) => q.bookingRequestId === requestId) ?? null;

  const eventType = catalog.eventTypeBySlug.get(event.eventType);
  const slotCategoryIds = new Set<number>();
  for (const slug of eventType?.slotCategories ?? []) {
    const c = catalog.categoryBySlug.get(slug);
    if (c) slotCategoryIds.add(c.id);
  }
  for (const r of requests) slotCategoryIds.add(r.vendor.categoryId);

  const slots = [...slotCategoryIds]
    .map((categoryId) => catalog.categoryById.get(categoryId)!)
    .sort((a, b) => a.sort - b.sort)
    .map((category) => {
      const inCat = requests.filter((r) => r.vendor.categoryId === category.id);
      const status: SlotStatus = bestSlotStatus(inCat.map((r) => r.request.status));
      const lead =
        inCat.find((r) => ["confirmed", "deposit_paid"].includes(r.request.status)) ??
        inCat.find((r) => ["quoted", "accepted"].includes(r.request.status)) ??
        inCat.find((r) => r.request.status === "requested") ??
        null;
      const quote = lead ? latestQuote(lead.request.id) : null;
      return {
        category,
        status,
        vendorName: status === "find" ? null : (lead?.vendor.name ?? null),
        threadId: lead?.threadId ?? null,
        amountPhp: quote?.totalPhp ?? null,
        count: inCat.length,
      };
    });

  const budget = budgetSummary(
    event.budgetPhp,
    requests.map((r) => ({
      status: r.request.status,
      quoteTotalPhp: (() => {
        const q = latestQuote(r.request.id);
        return q && q.status !== "declined" && q.status !== "superseded" ? q.totalPhp : null;
      })(),
    })),
  );

  return {
    event,
    eventType,
    area: catalog.areaById.get(event.areaId),
    tasks,
    progress: checklistProgress(tasks),
    slots,
    budget,
    bookedCount: slots.filter((s) => s.status === "booked").length,
    quotesWaiting: requests.filter((r) => r.request.status === "quoted").length,
  };
}
