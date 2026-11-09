import Link from "next/link";
import { BadgeCheck, CalendarDays, ClipboardList, MapPin, Receipt, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { quoteTotals } from "@/lib/domain/pricing";
import { clockTime, formatDate, formatPeso, todayISO } from "@/lib/format";
import type { Catalog } from "@/lib/queries/catalog";
import type { ThreadView } from "@/lib/queries/inbox";
import { acceptQuoteAction, declineQuoteAction } from "@/app/actions/bookings";
import { AppHeader } from "./app-header";
import { StatusPill } from "./status-pill";
import { SubmitButton } from "./submit-button";
import { Composer, ScrollToBottom } from "./thread-client";
import { DemoNote, LinkButton } from "./ui";

export function Thread({ view, catalog, basePath }: { view: ThreadView; catalog: Catalog; basePath: string }) {
  const { side, vendor, event, planner } = view;
  const title = side === "planner" ? vendor.name : planner.displayName;
  const status = view.latestRequest?.status;

  return (
    <main className="pb-40">
      <AppHeader
        title={title}
        subtitle={`Re: ${event.title} · ${formatDate(event.date)}`}
        back={basePath}
        right={
          <div className="flex items-center gap-2">
            {status && <StatusPill status={status} />}
            {side === "planner" && (
              <Link href={`/vendors/${vendor.slug}`} className="text-xs font-bold text-ube">
                Profile
              </Link>
            )}
          </div>
        }
      />
      <ol className="grid gap-3 px-4 pt-4" aria-label="Messages">
        {view.messages.length === 0 && (
          <li className="py-10 text-center text-sm text-muted">Say hi! Ask about availability, inclusions or anything else.</li>
        )}
        {view.messages.map((m) => {
          const mine = m.senderRole === side;
          if (m.kind === "system") {
            return (
              <li key={m.id} className="mx-auto max-w-[90%] animate-rise rounded-full bg-ink/5 px-3 py-1.5 text-center text-xs font-semibold text-ink-soft">
                {m.body}
              </li>
            );
          }
          if (m.kind === "request" && m.bookingRequestId) {
            const req = view.requestsById.get(m.bookingRequestId);
            if (!req) return null;
            const area = req.deliveryAreaId ? catalog.areaById.get(req.deliveryAreaId)?.name : null;
            const canQuote = side === "vendor" && ["requested", "quoted", "expired"].includes(req.status);
            return (
              <li key={m.id} className="animate-rise rounded-3xl border-2 border-ink bg-sand p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-ink-soft uppercase">
                  <ClipboardList className="size-3.5" /> Quote request
                  <span className="ml-auto font-semibold tracking-normal normal-case">{clockTime(m.createdAt)}</span>
                </p>
                <p className="mt-1 font-display text-[17px] leading-snug font-extrabold">
                  {req.requestedServices.map((s) => `${s.name}${s.qty > 1 ? ` ×${s.qty}` : ""}`).join(", ") || "General inquiry"}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {formatDate(req.date, { weekday: true })}
                    {req.timeText ? ` · ${req.timeText}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {req.pax} pax
                  </span>
                  {(req.venueText || area) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {[req.venueText, area].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {req.budgetPhp ? <span>Budget ~{formatPeso(req.budgetPhp)}</span> : null}
                </p>
                {m.body && <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm">“{m.body}”</p>}
                {canQuote && (
                  <div className="mt-3 flex gap-2">
                    <LinkButton href={`/vendor/requests/${req.id}/quote`} size="sm" variant="primary">
                      <Receipt className="size-4" /> {req.status === "requested" ? "Send quote" : "Revise quote"}
                    </LinkButton>
                  </div>
                )}
              </li>
            );
          }
          if (m.kind === "quote" && m.quoteId) {
            const q = view.quotesById.get(m.quoteId);
            const req = m.bookingRequestId ? view.requestsById.get(m.bookingRequestId) : undefined;
            if (!q || !req) return null;
            const totals = quoteTotals(
              q.items.map((i) => ({ label: i.label, qty: i.qty, unitPricePhp: i.unitPricePhp })),
              q.depositPct,
            );
            const open = q.status === "sent" && req.status === "quoted" && q.validUntil >= todayISO();
            const awaitingDeposit = q.status === "accepted" && req.status === "accepted";
            const booked = q.status === "accepted" && ["deposit_paid", "confirmed"].includes(req.status);
            return (
              <li key={m.id} className={cn("pop animate-pop-in rounded-3xl p-4", booked && "bg-calamansi-50")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold tracking-wider text-ink-soft uppercase">
                    Quote · valid until {formatDate(q.validUntil)}
                  </p>
                  {q.status !== "sent" && q.status !== "accepted" && (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-bold text-muted capitalize">{q.status}</span>
                  )}
                  {booked && (
                    <span className="inline-flex -rotate-3 items-center gap-1 rounded-full border-2 border-ink bg-calamansi px-2 py-0.5 text-[11px] font-extrabold text-white">
                      <BadgeCheck className="size-3.5" /> Booked
                    </span>
                  )}
                </div>
                {m.body && <p className="mt-1 text-sm text-ink-soft">{m.body}</p>}
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {q.items.map((i) => (
                      <tr key={i.id}>
                        <td className="py-0.5 pr-2 text-ink-soft">
                          {i.label}
                          {i.qty > 1 && <span className="text-muted"> × {i.qty}</span>}
                        </td>
                        <td className="py-0.5 text-right font-semibold tabular-nums">{formatPeso(i.qty * i.unitPricePhp)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink/10">
                      <td className="pt-2 font-display text-base font-extrabold">Total</td>
                      <td className="pt-2 text-right font-display text-lg font-extrabold tabular-nums">{formatPeso(totals.total)}</td>
                    </tr>
                    <tr>
                      <td className="text-xs text-muted">Deposit {q.depositPct}%</td>
                      <td className="text-right text-xs font-semibold text-muted tabular-nums">{formatPeso(totals.deposit)}</td>
                    </tr>
                  </tfoot>
                </table>
                {side === "planner" && open && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <form action={declineQuoteAction}>
                      <input type="hidden" name="quoteId" value={q.id} />
                      <SubmitButton variant="outline" className="w-full">
                        Decline
                      </SubmitButton>
                    </form>
                    <form action={acceptQuoteAction}>
                      <input type="hidden" name="quoteId" value={q.id} />
                      <input type="hidden" name="threadId" value={view.thread.id} />
                      <SubmitButton variant="primary" className="w-full" pendingText="Accepting…">
                        Accept & book
                      </SubmitButton>
                    </form>
                  </div>
                )}
                {side === "planner" && awaitingDeposit && (
                  <LinkButton href={`${basePath}/${view.thread.id}/pay/${q.id}`} variant="mango" className="mt-4 w-full">
                    Pay {formatPeso(totals.deposit)} deposit
                  </LinkButton>
                )}
                {side === "planner" && open && <DemoNote className="mt-3">Demo: the {q.depositPct}% deposit is “paid” via a mock GCash screen.</DemoNote>}
                {side === "vendor" && open && <p className="mt-3 text-xs font-semibold text-muted">Waiting for {planner.displayName.split(" ")[0]} to accept.</p>}
              </li>
            );
          }
          return (
            <li key={m.id} className={cn("flex animate-rise", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-3xl border-2 px-3.5 py-2 text-[15px]",
                  mine ? "rounded-br-md border-ink bg-ink text-white" : "rounded-bl-md border-ink/15 bg-white",
                )}
              >
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="Shared photo" className="mb-1.5 max-h-64 w-full rounded-2xl object-cover" />
                )}
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                <p className={cn("mt-0.5 text-right text-[10px]", mine ? "text-white/60" : "text-muted")}>{clockTime(m.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <ScrollToBottom count={view.messages.length} />
      <Composer threadId={view.thread.id} />
    </main>
  );
}
