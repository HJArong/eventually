import { describe, expect, it } from "vitest";
import { budgetSummary, defaultQty, depositAmount, estimatePackage, quoteTotals } from "@/lib/domain/pricing";

describe("defaultQty", () => {
  it("uses guest count for per-pax services, clamped to min/max", () => {
    expect(defaultQty({ unit: "per_pax" }, 120)).toBe(120);
    expect(defaultQty({ unit: "per_pax", minQty: 50 }, 30)).toBe(50);
    expect(defaultQty({ unit: "per_pax", maxQty: 100 }, 120)).toBe(100);
  });
  it("defaults to one for other units", () => {
    expect(defaultQty({ unit: "per_item" }, 120)).toBe(1);
    expect(defaultQty({ unit: "per_hour", minQty: 3 }, 120)).toBe(3);
  });
});

describe("estimatePackage", () => {
  it("adds per-pax, fixed and flat lines", () => {
    const est = estimatePackage(
      [
        { pricePhp: 45_000, unit: "flat", qtyRule: "fixed", qty: 1 },
        { pricePhp: 450, unit: "per_pax", qtyRule: "per_pax", qty: 1, minQty: 50 },
        { pricePhp: 8_500, unit: "per_item", qtyRule: "fixed", qty: 2 },
      ],
      120,
    );
    expect(est.lines.map((l) => l.qty)).toEqual([1, 120, 2]);
    expect(est.total).toBe(45_000 + 54_000 + 17_000);
  });
  it("respects package minimums for small events", () => {
    expect(estimatePackage([{ pricePhp: 400, unit: "per_pax", qtyRule: "per_pax", qty: 1, minQty: 50 }], 20).total).toBe(20_000);
  });
});

describe("quote totals", () => {
  it("computes total, deposit and balance in whole pesos", () => {
    const t = quoteTotals(
      [
        { label: "Whole lechon (regular)", qty: 1, unitPricePhp: 8_500 },
        { label: "Whole lechon (spicy)", qty: 1, unitPricePhp: 9_500 },
        { label: "Delivery", qty: 1, unitPricePhp: 0 },
      ],
      30,
    );
    expect(t).toEqual({ total: 18_000, deposit: 5_400, balance: 12_600 });
  });
  it("rounds deposits", () => {
    expect(depositAmount(9_999, 30)).toBe(3_000);
  });
});

describe("budgetSummary", () => {
  it("separates committed (booked) from pending (quoted) spend", () => {
    const s = budgetSummary(150_000, [
      { status: "confirmed", quoteTotalPhp: 45_000 },
      { status: "quoted", quoteTotalPhp: 30_000 },
      { status: "requested", quoteTotalPhp: null },
      { status: "declined", quoteTotalPhp: 10_000 },
    ]);
    expect(s).toMatchObject({ committed: 45_000, pending: 30_000, remaining: 105_000, committedPct: 30, pendingPct: 20, overBudget: false });
  });
  it("flags over-budget and caps bar percentages at 100", () => {
    const s = budgetSummary(50_000, [
      { status: "confirmed", quoteTotalPhp: 60_000 },
      { status: "quoted", quoteTotalPhp: 10_000 },
    ]);
    expect(s.overBudget).toBe(true);
    expect(s.committedPct + s.pendingPct).toBeLessThanOrEqual(100);
  });
});
