import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookingRequests, events, profiles, quotes, threads } from "@/lib/db/schema";
import type { BookingStatus } from "@/lib/domain/status";

export async function getVendorRequests(vendorId: string, statuses?: BookingStatus[]) {
  const db = await getDb();
  const rows = await db
    .select({
      request: bookingRequests,
      event: events,
      planner: { id: profiles.id, displayName: profiles.displayName },
      threadId: threads.id,
    })
    .from(bookingRequests)
    .innerJoin(events, eq(events.id, bookingRequests.eventId))
    .innerJoin(profiles, eq(profiles.id, events.plannerId))
    .leftJoin(threads, and(eq(threads.eventId, bookingRequests.eventId), eq(threads.vendorId, bookingRequests.vendorId)))
    .where(and(eq(bookingRequests.vendorId, vendorId), statuses ? inArray(bookingRequests.status, statuses) : undefined))
    .orderBy(desc(bookingRequests.createdAt));
  const quoteRows = rows.length
    ? await db
        .select()
        .from(quotes)
        .where(inArray(quotes.bookingRequestId, rows.map((r) => r.request.id)))
        .orderBy(desc(quotes.createdAt))
    : [];
  return rows.map((r) => ({
    ...r,
    latestQuote: quoteRows.find((q) => q.bookingRequestId === r.request.id) ?? null,
  }));
}

export type VendorRequestRow = Awaited<ReturnType<typeof getVendorRequests>>[number];

export async function getVendorStats(vendorId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      newRequests: sql<number>`count(*) filter (where ${bookingRequests.status} = 'requested')::int`,
      booked: sql<number>`count(*) filter (where ${bookingRequests.status} in ('confirmed', 'deposit_paid'))::int`,
    })
    .from(bookingRequests)
    .where(eq(bookingRequests.vendorId, vendorId));
  const [q] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(quotes)
    .innerJoin(bookingRequests, eq(bookingRequests.id, quotes.bookingRequestId))
    .where(and(eq(bookingRequests.vendorId, vendorId)));
  return { newRequests: row?.newRequests ?? 0, booked: row?.booked ?? 0, quotesSent: q?.n ?? 0 };
}

export async function getVendorRequest(vendorId: string, requestId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ request: bookingRequests, event: events, planner: { displayName: profiles.displayName }, threadId: threads.id })
    .from(bookingRequests)
    .innerJoin(events, eq(events.id, bookingRequests.eventId))
    .innerJoin(profiles, eq(profiles.id, events.plannerId))
    .leftJoin(threads, and(eq(threads.eventId, bookingRequests.eventId), eq(threads.vendorId, bookingRequests.vendorId)))
    .where(and(eq(bookingRequests.id, requestId), eq(bookingRequests.vendorId, vendorId)));
  if (!row) return null;
  const quoteRows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.bookingRequestId, requestId))
    .orderBy(asc(quotes.createdAt));
  return { ...row, quotes: quoteRows };
}
