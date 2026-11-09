import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { runMigrations, type DB } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { DEMO_PLANNER_EMAIL, DEMO_VENDOR_EMAIL } from "@/lib/demo";
import { InvalidTransitionError } from "@/lib/domain/status";
import { ForbiddenError } from "@/lib/services/access";
import { acceptQuote, createBookingRequests, payDeposit, runMaintenanceTick, sendQuote } from "@/lib/services/bookings";
import { seedDatabase } from "@/supabase/seed";

const { bookingRequests, events, messages, mockPayments, profiles, quotes, services, vendorBlockedDates, vendors } = schema;

let client: PGlite;
let db: DB;

beforeAll(async () => {
  client = await PGlite.create({ extensions: { pg_trgm } });
  db = drizzle(client, { schema }) as unknown as DB;
  await runMigrations({ db, exec: (sql) => client.exec(sql) });
  await seedDatabase(db);
});

afterAll(async () => {
  await client?.close();
});

async function profile(email: string) {
  const [p] = await db.select().from(profiles).where(eq(profiles.email, email));
  return p!;
}

describe("booking flow (PGlite)", () => {
  it("seeds the demo world", async () => {
    expect((await db.select().from(vendors)).length).toBeGreaterThanOrEqual(60);
  });

  it("request → auto-quote → accept → mock GCash deposit → confirmed", async () => {
    const bea = await profile(DEMO_PLANNER_EMAIL);
    const [event] = await db.select().from(events).where(eq(events.plannerId, bea.id));
    const [lechon] = await db.select().from(vendors).where(eq(vendors.name, "Lechon ni Inday"));
    const svcs = await db.select().from(services).where(eq(services.vendorId, lechon!.id)).orderBy(asc(services.sort));

    const [created] = await createBookingRequests(db, bea, {
      eventId: event!.id,
      requests: [{ vendorId: lechon!.id, serviceSelections: svcs.slice(0, 2).map((s) => ({ serviceId: s.id, qty: 1 })) }],
    });
    let [req] = await db.select().from(bookingRequests).where(eq(bookingRequests.id, created!.requestId));
    expect(req!.status).toBe("requested");
    expect(req!.autoReplyAt).not.toBeNull();

    await db.update(bookingRequests).set({ autoReplyAt: new Date(Date.now() - 1000) }).where(eq(bookingRequests.id, req!.id));
    await runMaintenanceTick(db);
    await runMaintenanceTick(db);

    [req] = await db.select().from(bookingRequests).where(eq(bookingRequests.id, req!.id));
    expect(req!.status).toBe("quoted");
    const sent = await db.select().from(quotes).where(eq(quotes.bookingRequestId, req!.id));
    expect(sent).toHaveLength(1);
    const quote = sent[0]!;
    expect(quote.totalPhp).toBe(svcs[0]!.pricePhp + svcs[1]!.pricePhp);
    expect(quote.depositPct).toBe(30);

    await acceptQuote(db, bea, quote.id);
    const result = await payDeposit(db, bea, quote.id, "gcash");
    expect(result.reference).toMatch(/^DEMO-GC-/);

    [req] = await db.select().from(bookingRequests).where(eq(bookingRequests.id, req!.id));
    expect(req!.status).toBe("confirmed");
    const [payment] = await db.select().from(mockPayments).where(eq(mockPayments.quoteId, quote.id));
    expect(payment!.amountPhp).toBe(Math.round(quote.totalPhp * 0.3));
    const blocked = await db
      .select()
      .from(vendorBlockedDates)
      .where(and(eq(vendorBlockedDates.vendorId, lechon!.id), eq(vendorBlockedDates.date, event!.date)));
    expect(blocked).toHaveLength(1);
    const systemMsgs = await db.select().from(messages).where(and(eq(messages.threadId, created!.threadId), eq(messages.senderRole, "system")));
    expect(systemMsgs.some((m) => m.body.includes("Booking confirmed"))).toBe(true);

    await expect(acceptQuote(db, bea, quote.id)).rejects.toThrow();
    expect((await payDeposit(db, bea, quote.id, "gcash")).alreadyPaid).toBe(true);
  });

  it("only the owning vendor can quote a request", async () => {
    const inday = await profile(DEMO_VENDOR_EMAIL);
    const [indayVendor] = await db.select().from(vendors).where(eq(vendors.ownerId, inday.id));
    const [foreign] = await db
      .select()
      .from(bookingRequests)
      .where(and(eq(bookingRequests.status, "quoted")))
      .limit(50)
      .then((rows) => rows.filter((r) => r.vendorId !== indayVendor!.id));
    const quote = { items: [{ label: "x", qty: 1, unitPricePhp: 100 }], depositPct: 30, validUntil: "2099-01-01" };
    await expect(sendQuote(db, inday, foreign!.id, quote)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses invalid transitions", async () => {
    const inday = await profile(DEMO_VENDOR_EMAIL);
    const [indayVendor] = await db.select().from(vendors).where(eq(vendors.ownerId, inday.id));
    const [confirmed] = await db
      .select()
      .from(bookingRequests)
      .where(and(eq(bookingRequests.vendorId, indayVendor!.id), eq(bookingRequests.status, "confirmed")));
    const quote = { items: [{ label: "x", qty: 1, unitPricePhp: 100 }], depositPct: 30, validUntil: "2099-01-01" };
    await expect(sendQuote(db, inday, confirmed!.id, quote)).rejects.toBeInstanceOf(InvalidTransitionError);
  });
});
