"use client";

import { useActionState, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { quoteTotals } from "@/lib/domain/pricing";
import type { QuoteLine } from "@/lib/domain/types";
import { formatPeso } from "@/lib/format";
import { declineRequestAction, sendQuoteAction, type ActionState } from "@/app/actions/bookings";

const DEPOSITS = [20, 30, 50];

export function QuoteComposer({
  requestId,
  initialItems,
  validUntil,
  minDate,
}: {
  requestId: string;
  initialItems: QuoteLine[];
  validUntil: string;
  minDate: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(sendQuoteAction, {});
  const [items, setItems] = useState<QuoteLine[]>(initialItems.length ? initialItems : [{ label: "", qty: 1, unitPricePhp: 0 }]);
  const [deposit, setDeposit] = useState(30);
  const totals = quoteTotals(items, deposit);
  const update = (i: number, patch: Partial<QuoteLine>) => setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  return (
    <div className="px-5 pt-5 pb-8">
      <form action={action} className="grid gap-5">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="items" value={JSON.stringify(items.filter((i) => i.label.trim()))} />
        <input type="hidden" name="depositPct" value={deposit} />
        <div>
          <Label>Line items</Label>
          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_3.5rem_5.5rem_2rem] gap-2 px-1 text-xs font-medium text-muted">
              <span>Item</span>
              <span>Qty</span>
              <span>Unit ₱</span>
              <span />
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_3.5rem_5.5rem_2rem] items-center gap-2">
                <Input aria-label="Item" value={item.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Whole lechon (regular)" className="px-3 py-2.5 text-sm" />
                <Input
                  aria-label="Quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={item.qty}
                  onChange={(e) => update(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  className="px-2 py-2.5 text-center text-sm"
                />
                <Input
                  aria-label="Unit price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={item.unitPricePhp}
                  onChange={(e) => update(i, { unitPricePhp: Math.max(0, Number(e.target.value) || 0) })}
                  className="px-2 py-2.5 text-right text-sm"
                />
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, k) => k !== i))}
                  aria-label="Remove line"
                  className="flex size-8 items-center justify-center text-muted hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { label: "", qty: 1, unitPricePhp: 0 }])}
              className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-rose-600"
            >
              <Plus className="size-4" /> Add line
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card">
          <span className="font-display text-lg font-semibold">Total</span>
          <span className="font-display text-2xl font-semibold tabular-nums" aria-live="polite">
            {formatPeso(totals.total)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Deposit</Label>
            <div className="flex gap-1.5">
              {DEPOSITS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeposit(d)}
                  aria-pressed={deposit === d}
                  className={cn(
                    "h-10 flex-1 rounded-full border text-sm font-semibold",
                    deposit === d ? "border-rose-200 bg-rose-50 text-rose-700" : "border-line bg-white text-ink-soft",
                  )}
                >
                  {d}%
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">{formatPeso(totals.deposit)} to lock the date</p>
          </div>
          <div>
            <Label htmlFor="validUntil">Valid until</Label>
            <Input id="validUntil" name="validUntil" type="date" defaultValue={validUntil} min={minDate} required className="px-3" />
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" defaultValue="Salamat sa inquiry! Here's our quote po." />
        </div>

        {state.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {state.error}
          </p>
        )}
        <SubmitButton size="lg" pendingText="Sending…" disabled={totals.total <= 0}>
          <Send className="size-4" /> Send quote
        </SubmitButton>
      </form>
      <form action={declineRequestAction} className="mt-3">
        <input type="hidden" name="requestId" value={requestId} />
        <SubmitButton variant="danger" className="w-full">
          Decline request
        </SubmitButton>
      </form>
    </div>
  );
}
