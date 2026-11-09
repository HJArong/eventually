"use client";

import { useActionState, useState } from "react";
import { CreditCard, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoNote } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatPeso } from "@/lib/format";
import { payDepositAction, type ActionState } from "@/app/actions/bookings";

export function PaySheet(props: {
  threadId: string;
  quoteId: string;
  vendorName: string;
  eventTitle: string;
  deposit: number;
  balance: number;
  total: number;
  depositPct: number;
}) {
  const [state, action] = useActionState<ActionState, FormData>(payDepositAction, {});
  const [method, setMethod] = useState<"gcash" | "card">("gcash");

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[440px] animate-rise rounded-t-[2rem] border-2 border-b-0 border-ink bg-cream px-5 pt-3 pb-8">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/20" />
      <p className="text-xs font-extrabold tracking-wider text-muted uppercase">Deposit to lock the date</p>
      <p className="mt-1 font-display text-4xl font-extrabold">{formatPeso(props.deposit)}</p>
      <p className="text-sm text-muted">
        {props.depositPct}% of {formatPeso(props.total)} for {props.vendorName} · balance {formatPeso(props.balance)} on the day
      </p>

      <form action={action} className="mt-5 grid gap-3">
        <input type="hidden" name="threadId" value={props.threadId} />
        <input type="hidden" name="quoteId" value={props.quoteId} />
        <input type="hidden" name="method" value={method} />
        <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-3">
          <button
            type="button"
            role="radio"
            aria-checked={method === "gcash"}
            onClick={() => setMethod("gcash")}
            className={cn("flex items-center gap-2 rounded-2xl border-2 p-3 text-left", method === "gcash" ? "border-ink bg-white shadow-pop-sm" : "border-ink/15 bg-white/60")}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gcash font-display text-lg font-extrabold text-white">G</span>
            <span>
              <span className="block text-sm font-extrabold">GCash</span>
              <span className="block text-[11px] text-muted">Demo wallet</span>
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={method === "card"}
            onClick={() => setMethod("card")}
            className={cn("flex items-center gap-2 rounded-2xl border-2 p-3 text-left", method === "card" ? "border-ink bg-white shadow-pop-sm" : "border-ink/15 bg-white/60")}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
              <CreditCard className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold">Card</span>
              <span className="block text-[11px] text-muted">Visa / Mastercard</span>
            </span>
          </button>
        </div>

        {method === "gcash" ? (
          <div className="rounded-2xl bg-gcash p-4 text-white">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Smartphone className="size-4" /> 0917 ••• 4321 · Demo account
            </p>
            <label className="mt-3 block text-xs font-semibold text-white/80" htmlFor="mpin">
              Enter any 4-digit MPIN (demo)
            </label>
            <input
              id="mpin"
              inputMode="numeric"
              maxLength={4}
              defaultValue="1234"
              type="password"
              className="mt-1 h-11 w-32 rounded-xl border-2 border-white/40 bg-white/10 px-3 text-center text-lg tracking-[0.5em] focus:border-white focus:outline-none"
            />
          </div>
        ) : (
          <div className="grid gap-2 rounded-2xl border-2 border-ink/15 bg-white p-4">
            <input aria-label="Card number" defaultValue="4242 4242 4242 4242" className="h-11 rounded-xl border-2 border-ink/15 px-3 font-mono" />
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Expiry" defaultValue="12/29" className="h-11 rounded-xl border-2 border-ink/15 px-3 font-mono" />
              <input aria-label="CVC" defaultValue="123" className="h-11 rounded-xl border-2 border-ink/15 px-3 font-mono" />
            </div>
          </div>
        )}

        {state.error && (
          <p role="alert" className="text-sm font-semibold text-sunset">
            {state.error}
          </p>
        )}
        <SubmitButton size="lg" variant={method === "gcash" ? "ube" : "primary"} pendingText="Processing…" className={method === "gcash" ? "bg-gcash" : ""}>
          <Lock className="size-4" /> Pay {formatPeso(props.deposit)}
        </SubmitButton>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="size-4" /> {props.eventTitle}
        </p>
        <DemoNote>Demo only: no money moves. A real PayMongo/Xendit adapter plugs into the same PaymentProvider interface.</DemoNote>
      </form>
    </div>
  );
}
