import type { QuoteLine, Unit } from "./types";

export const UNIT_LABEL: Record<Unit, string> = {
  per_pax: "/pax",
  per_item: "/item",
  flat: "",
  per_hour: "/hr",
};

export function clamp(n: number, min?: number | null, max?: number | null): number {
  let v = n;
  if (min != null) v = Math.max(v, min);
  if (max != null) v = Math.min(v, max);
  return v;
}

/** Default quantity when a planner adds a service to a request for an event with `pax` guests. */
export function defaultQty(
  service: { unit: Unit; minQty?: number | null; maxQty?: number | null },
  pax: number,
): number {
  if (service.unit === "per_pax") return clamp(pax, service.minQty, service.maxQty);
  return clamp(1, service.minQty, service.maxQty);
}

export type PackageLineInput = {
  pricePhp: number;
  unit: Unit;
  qtyRule: "per_pax" | "fixed";
  qty: number;
  minQty?: number | null;
  maxQty?: number | null;
};

export function packageLineQty(item: PackageLineInput, pax: number): number {
  if (item.unit === "flat") return 1;
  if (item.qtyRule === "per_pax") return clamp(pax, item.minQty, item.maxQty);
  return Math.max(1, item.qty);
}

/** Pax-based estimate only; final prices always come from vendor quotes. */
export function estimatePackage(items: PackageLineInput[], pax: number) {
  const lines = items.map((item) => {
    const qty = packageLineQty(item, pax);
    return { qty, total: qty * item.pricePhp };
  });
  return { lines, total: lines.reduce((sum, l) => sum + l.total, 0) };
}

export function depositAmount(totalPhp: number, depositPct: number): number {
  return Math.round((totalPhp * depositPct) / 100);
}

export function quoteTotals(items: QuoteLine[], depositPct: number) {
  const total = items.reduce((sum, i) => sum + i.qty * i.unitPricePhp, 0);
  const deposit = depositAmount(total, depositPct);
  return { total, deposit, balance: total - deposit };
}

export type BudgetRequest = { status: string; quoteTotalPhp: number | null };

const COMMITTED = new Set(["deposit_paid", "confirmed"]);
const PENDING = new Set(["quoted", "accepted"]);

export function budgetSummary(budgetPhp: number, requests: BudgetRequest[]) {
  let committed = 0;
  let pending = 0;
  for (const r of requests) {
    if (r.quoteTotalPhp == null) continue;
    if (COMMITTED.has(r.status)) committed += r.quoteTotalPhp;
    else if (PENDING.has(r.status)) pending += r.quoteTotalPhp;
  }
  const pct = (n: number) => (budgetPhp > 0 ? Math.min(100, Math.round((n / budgetPhp) * 100)) : 0);
  return {
    budget: budgetPhp,
    committed,
    pending,
    remaining: budgetPhp - committed,
    committedPct: pct(committed),
    pendingPct: Math.min(100 - pct(committed), pct(pending)),
    overBudget: committed > budgetPhp,
  };
}

export const PRICE_BANDS = [
  { band: 1, label: "₱", hint: "Budget-friendly" },
  { band: 2, label: "₱₱", hint: "Mid-range" },
  { band: 3, label: "₱₱₱", hint: "Premium" },
] as const;

export const BUDGET_PRESETS = [
  { label: "Under ₱50k", value: 40_000 },
  { label: "₱50–100k", value: 75_000 },
  { label: "₱100–200k", value: 150_000 },
  { label: "₱200–350k", value: 275_000 },
  { label: "₱350k+", value: 450_000 },
] as const;
