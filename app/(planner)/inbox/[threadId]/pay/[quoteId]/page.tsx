import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getDb } from "@/lib/db";
import { bookingRequests, events, quotes, threads, vendors } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/session";
import { quoteTotals } from "@/lib/domain/pricing";
import { assertUuid, ForbiddenError } from "@/lib/services/access";
import { PaySheet } from "./pay-sheet";

export const metadata = { title: "Pay deposit" };

export default async function PayDeposit({ params }: PageProps<"/inbox/[threadId]/pay/[quoteId]">) {
  const viewer = await requireRole("planner");
  const { threadId, quoteId } = await params;
  try {
    assertUuid(threadId);
    assertUuid(quoteId);
  } catch (e) {
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }
  const db = await getDb();
  const [row] = await db
    .select({ quote: quotes, request: bookingRequests, event: events, vendor: vendors })
    .from(quotes)
    .innerJoin(bookingRequests, eq(bookingRequests.id, quotes.bookingRequestId))
    .innerJoin(events, eq(events.id, bookingRequests.eventId))
    .innerJoin(vendors, eq(vendors.id, bookingRequests.vendorId))
    .innerJoin(threads, and(eq(threads.id, threadId), eq(threads.eventId, events.id), eq(threads.vendorId, vendors.id)))
    .where(eq(quotes.id, quoteId));
  if (!row || row.event.plannerId !== viewer.id) notFound();
  if (["deposit_paid", "confirmed"].includes(row.request.status)) redirect(`/inbox/${threadId}`);
  if (!["accepted", "quoted"].includes(row.request.status)) redirect(`/inbox/${threadId}`);

  const { deposit, balance, total } = quoteTotals([{ label: "", qty: 1, unitPricePhp: row.quote.totalPhp }], row.quote.depositPct);
  return (
    <main className="min-h-dvh bg-ink/60">
      <AppHeader title="Pay deposit" back={`/inbox/${threadId}`} />
      <PaySheet
        threadId={threadId}
        quoteId={quoteId}
        vendorName={row.vendor.name}
        eventTitle={row.event.title}
        deposit={deposit}
        balance={balance}
        total={total}
        depositPct={row.quote.depositPct}
      />
    </main>
  );
}
