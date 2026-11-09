import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  bookingRequests,
  events,
  messages,
  profiles,
  quoteItems,
  quotes,
  threads,
  vendors,
} from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth/session";
import type { BookingStatus } from "@/lib/domain/status";
import { ownedVendor, requireThreadParticipant } from "@/lib/services/access";

export type Side = "planner" | "vendor";

function unreadCondition(side: Side) {
  return side === "planner"
    ? sql`${messages.senderRole} <> 'planner'`
    : sql`${messages.senderRole} = 'planner'`;
}

async function threadScope(viewer: Viewer, side: Side) {
  const db = await getDb();
  if (side === "planner") return eq(threads.plannerId, viewer.id);
  const vendor = await ownedVendor(db, viewer);
  return vendor ? eq(threads.vendorId, vendor.id) : sql`false`;
}

export async function getUnreadCount(viewer: Viewer, side: Side) {
  const db = await getDb();
  const scope = await threadScope(viewer, side);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(threads, eq(threads.id, messages.threadId))
    .where(and(scope, isNull(messages.readAt), unreadCondition(side)));
  return row?.n ?? 0;
}

export async function getInbox(viewer: Viewer, side: Side, filter: "all" | "quotes" | "unread" = "all") {
  const db = await getDb();
  const scope = await threadScope(viewer, side);
  const rows = await db
    .select({ thread: threads, vendor: vendors, event: events, planner: { id: profiles.id, displayName: profiles.displayName } })
    .from(threads)
    .innerJoin(vendors, eq(vendors.id, threads.vendorId))
    .innerJoin(events, eq(events.id, threads.eventId))
    .innerJoin(profiles, eq(profiles.id, threads.plannerId))
    .where(scope)
    .orderBy(desc(threads.lastMessageAt));
  const ids = rows.map((r) => r.thread.id);
  if (!ids.length) return [];

  const [lastMessages, unread, requestRows] = await Promise.all([
    db
      .selectDistinctOn([messages.threadId])
      .from(messages)
      .where(inArray(messages.threadId, ids))
      .orderBy(messages.threadId, desc(messages.createdAt)),
    db
      .select({ threadId: messages.threadId, n: sql<number>`count(*)::int` })
      .from(messages)
      .where(and(inArray(messages.threadId, ids), isNull(messages.readAt), unreadCondition(side)))
      .groupBy(messages.threadId),
    db
      .select({ eventId: bookingRequests.eventId, vendorId: bookingRequests.vendorId, status: bookingRequests.status, updatedAt: bookingRequests.updatedAt, id: bookingRequests.id })
      .from(bookingRequests)
      .where(inArray(bookingRequests.eventId, [...new Set(rows.map((r) => r.event.id))]))
      .orderBy(desc(bookingRequests.updatedAt)),
  ]);
  const latestQuotes = requestRows.length
    ? await db
        .select()
        .from(quotes)
        .where(inArray(quotes.bookingRequestId, requestRows.map((r) => r.id)))
        .orderBy(desc(quotes.createdAt))
    : [];

  const items = rows.map((r) => {
    const req = requestRows.find((x) => x.eventId === r.event.id && x.vendorId === r.vendor.id);
    const q = req ? latestQuotes.find((x) => x.bookingRequestId === req.id) : undefined;
    return {
      id: r.thread.id,
      vendor: r.vendor,
      event: r.event,
      planner: r.planner,
      lastMessage: lastMessages.find((m) => m.threadId === r.thread.id) ?? null,
      lastMessageAt: r.thread.lastMessageAt,
      unread: unread.find((u) => u.threadId === r.thread.id)?.n ?? 0,
      status: (req?.status ?? null) as BookingStatus | null,
      quoteTotalPhp: q?.totalPhp ?? null,
    };
  });
  if (filter === "quotes") return items.filter((i) => i.status === "quoted" || i.status === "accepted");
  if (filter === "unread") return items.filter((i) => i.unread > 0);
  return items;
}

export type InboxItem = Awaited<ReturnType<typeof getInbox>>[number];

export async function getThreadView(viewer: Viewer, threadId: string) {
  const db = await getDb();
  const { thread, side } = await requireThreadParticipant(db, viewer, threadId);
  const [[vendor], [event], [planner], msgs, requests] = await Promise.all([
    db.select().from(vendors).where(eq(vendors.id, thread.vendorId)),
    db.select().from(events).where(eq(events.id, thread.eventId)),
    db.select({ id: profiles.id, displayName: profiles.displayName }).from(profiles).where(eq(profiles.id, thread.plannerId)),
    db.select().from(messages).where(eq(messages.threadId, thread.id)).orderBy(asc(messages.createdAt)),
    db
      .select()
      .from(bookingRequests)
      .where(and(eq(bookingRequests.eventId, thread.eventId), eq(bookingRequests.vendorId, thread.vendorId)))
      .orderBy(asc(bookingRequests.createdAt)),
  ]);
  const quoteRows = requests.length
    ? await db.select().from(quotes).where(inArray(quotes.bookingRequestId, requests.map((r) => r.id)))
    : [];
  const itemRows = quoteRows.length
    ? await db.select().from(quoteItems).where(inArray(quoteItems.quoteId, quoteRows.map((q) => q.id))).orderBy(asc(quoteItems.sort))
    : [];
  const quotesById = new Map(
    quoteRows.map((q) => [q.id, { ...q, items: itemRows.filter((i) => i.quoteId === q.id) }]),
  );
  const requestsById = new Map(requests.map((r) => [r.id, r]));
  return {
    thread,
    side,
    vendor: vendor!,
    event: event!,
    planner: planner!,
    messages: msgs,
    quotesById,
    requestsById,
    latestRequest: requests[requests.length - 1] ?? null,
  };
}

export type ThreadView = Awaited<ReturnType<typeof getThreadView>>;
