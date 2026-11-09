import { and, eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { events, threads, vendors } from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth/session";

export class ForbiddenError extends Error {
  constructor(message = "You don't have access to this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function ownedVendor(db: DB, viewer: Viewer) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.ownerId, viewer.id)).limit(1);
  return vendor ?? null;
}

export async function requireOwnedVendor(db: DB, viewer: Viewer) {
  const vendor = await ownedVendor(db, viewer);
  if (!vendor) throw new ForbiddenError("Set up your shop first");
  return vendor;
}

export async function requireOwnEvent(db: DB, viewer: Viewer, eventId: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.plannerId, viewer.id)))
    .limit(1);
  if (!event) throw new ForbiddenError("Event not found");
  return event;
}

/** Returns the thread and which side of it the viewer is on. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(id: string) {
  if (!UUID_RE.test(id)) throw new ForbiddenError("Not found");
}

export async function requireThreadParticipant(db: DB, viewer: Viewer, threadId: string) {
  assertUuid(threadId);
  const [row] = await db
    .select({ thread: threads, vendorOwnerId: vendors.ownerId })
    .from(threads)
    .innerJoin(vendors, eq(vendors.id, threads.vendorId))
    .where(eq(threads.id, threadId))
    .limit(1);
  if (!row) throw new ForbiddenError("Conversation not found");
  if (row.thread.plannerId === viewer.id) return { thread: row.thread, side: "planner" as const };
  if (row.vendorOwnerId === viewer.id) return { thread: row.thread, side: "vendor" as const };
  throw new ForbiddenError("Conversation not found");
}
