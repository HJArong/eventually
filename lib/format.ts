const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return pesoFormatter.format(Math.round(amount));
}

/** ₱120k, ₱1.2M, ₱850 */
export function formatPesoShort(amount: number): string {
  if (amount >= 1_000_000) return `₱${trimZero((amount / 1_000_000).toFixed(1))}M`;
  if (amount >= 1_000) return `₱${trimZero((amount / 1_000).toFixed(amount % 1000 === 0 ? 0 : 1))}k`;
  return `₱${amount}`;
}

function trimZero(s: string) {
  return s.replace(/\.0$/, "");
}

/** Dates are stored as YYYY-MM-DD strings and treated as calendar dates in Asia/Manila. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / 86_400_000);
}

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
}

export function formatDate(iso: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    weekday: opts.weekday ? "short" : undefined,
    year: opts.year ? "numeric" : undefined,
  }).format(parseISODate(iso));
}

export function timeAgo(date: Date, now: Date = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function clockTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
