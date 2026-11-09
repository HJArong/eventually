import { describe, expect, it } from "vitest";
import { buildAutoQuote } from "@/lib/domain/auto-responder";
import { checklistProgress, eventTitle, taskDueDate, tasksFromTemplate } from "@/lib/domain/checklist";
import { MockPaymentProvider, type Deposit, type DepositStore } from "@/lib/domain/payments";
import { signSession, verifySession } from "@/lib/auth/session";
import { addDays, formatPeso, formatPesoShort } from "@/lib/format";

function memoryStore(): DepositStore {
  const rows = new Map<string, Deposit>();
  return {
    async insert(d) {
      const row = { ...d, id: `dep_${rows.size + 1}` };
      rows.set(row.id, row);
      return row;
    },
    async get(id) {
      return rows.get(id) ?? null;
    },
  };
}

describe("MockPaymentProvider", () => {
  it("succeeds immediately with a demo reference", async () => {
    const provider = new MockPaymentProvider(memoryStore());
    const dep = await provider.createDeposit({ quoteId: "q1", amountPhp: 5_400, method: "gcash" });
    expect(dep.status).toBe("succeeded");
    expect(dep.reference).toMatch(/^DEMO-GC-[0-9A-F]{8}$/);
    expect(await provider.getStatus(dep.id)).toBe("succeeded");
    expect(await provider.getStatus("missing")).toBeNull();
  });
  it("rejects non-positive or fractional amounts", async () => {
    const provider = new MockPaymentProvider(memoryStore());
    await expect(provider.createDeposit({ quoteId: "q1", amountPhp: 0, method: "card" })).rejects.toThrow();
    await expect(provider.createDeposit({ quoteId: "q1", amountPhp: 10.5, method: "card" })).rejects.toThrow();
  });
});

describe("buildAutoQuote", () => {
  const base = {
    fallbackService: { name: "Whole lechon (regular)", pricePhp: 8_500, unit: "per_item" as const },
    categorySlug: "lechon",
    plannerName: "Hazel",
    eventDateIso: "2027-03-14",
    todayIso: "2026-11-09",
    pax: 120,
    deliveryAreaName: "Cebu City",
    seed: 1,
  };

  it("quotes the requested services plus free delivery for food vendors", () => {
    const q = buildAutoQuote({
      ...base,
      requestedServices: [
        { serviceId: "a", name: "Whole lechon (regular)", qty: 1, unit: "per_item", pricePhp: 8_500 },
        { serviceId: "b", name: "Whole lechon (spicy)", qty: 1, unit: "per_item", pricePhp: 9_500 },
      ],
    });
    expect(q.items).toHaveLength(3);
    expect(q.items[2]).toEqual({ label: "Delivery – Cebu City", qty: 1, unitPricePhp: 0 });
    expect(q.depositPct).toBe(30);
    expect(q.validUntil).toBe("2026-11-23");
    expect(q.greeting).toContain("Hazel");
  });

  it("falls back to the first service and never expires after the event", () => {
    const q = buildAutoQuote({ ...base, requestedServices: [], categorySlug: "lights-sounds", eventDateIso: "2026-11-15" });
    expect(q.items).toEqual([{ label: "Whole lechon (regular)", qty: 1, unitPricePhp: 8_500 }]);
    expect(q.validUntil).toBe("2026-11-14");
  });

  it("uses pax for per-pax fallbacks", () => {
    const q = buildAutoQuote({ ...base, requestedServices: [], fallbackService: { name: "Buffet", pricePhp: 450, unit: "per_pax" } });
    expect(q.items[0]).toMatchObject({ qty: 120 });
  });
});

describe("checklist", () => {
  it("builds tasks and due dates from a template", () => {
    const tasks = tasksFromTemplate([
      { title: "Book venue", dueOffsetDays: 120 },
      { title: "Final headcount", dueOffsetDays: 7 },
      { title: "Enjoy!", dueOffsetDays: null },
    ]);
    expect(tasks.map((t) => t.sort)).toEqual([0, 1, 2]);
    expect(taskDueDate("2027-03-14", 7)).toBe("2027-03-07");
    expect(taskDueDate("2027-03-14", null)).toBeNull();
    expect(checklistProgress([{ done: true }, { done: false }, { done: true }, { done: false }])).toEqual({ done: 2, total: 4, pct: 50 });
  });
  it("titles events", () => {
    expect(eventTitle("debut", "Sofia")).toBe("Sofia's 18th Debut");
    expect(eventTitle("christening", "Lucas")).toBe("Lucas' Christening");
    expect(eventTitle("wedding", "")).toBe("Our Wedding");
    expect(eventTitle("wedding", "Hazel")).toBe("Hazel's Wedding");
  });
});

describe("format", () => {
  it("formats pesos", () => {
    expect(formatPeso(18_000)).toBe("₱18,000");
    expect(formatPesoShort(150_000)).toBe("₱150k");
  });
  it("adds days across month boundaries", () => {
    expect(addDays("2027-02-27", 2)).toBe("2027-03-01");
  });
});

describe("session cookie", () => {
  it("round-trips a signed session", () => {
    const token = signSession("00000000-0000-4000-8000-000000000001");
    expect(verifySession(token)).toBe("00000000-0000-4000-8000-000000000001");
  });
  it("rejects tampered tokens", () => {
    const token = signSession("user-a");
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "user-b", iat: Date.now() })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`)).toBeNull();
    expect(verifySession(`${payload}.x${sig}`)).toBeNull();
    expect(verifySession(undefined)).toBeNull();
  });
});
