"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeftRight, Check, Star, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoNote, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { UNIT_LABEL, estimatePackage, packageLineQty } from "@/lib/domain/pricing";
import type { Unit } from "@/lib/domain/types";
import { formatPeso } from "@/lib/format";
import { requestPackageQuotes, type ActionState } from "@/app/actions/bookings";

type Option = {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  coverUrl: string | null;
  rating: number;
  areaName: string;
  serviceId: string;
  serviceName: string;
  pricePhp: number;
  unit: Unit;
  minQty: number | null;
  maxQty: number | null;
};

type Slot = { category: string; qtyRule: "per_pax" | "fixed"; qty: number; current: Option; alternatives: Option[] };

export function PackageBuilder({
  packageId,
  defaultPax,
  eventTitle,
  slots,
}: {
  packageId: string;
  defaultPax: number;
  eventTitle: string;
  slots: Slot[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(requestPackageQuotes, {});
  const [chosen, setChosen] = useState<Option[]>(() => slots.map((s) => s.current));
  const [swapping, setSwapping] = useState<number | null>(null);
  const pax = defaultPax;

  const lines = chosen.map((o, i) => ({
    pricePhp: o.pricePhp,
    unit: o.unit,
    qtyRule: slots[i]!.qtyRule,
    qty: slots[i]!.qty,
    minQty: o.minQty,
    maxQty: o.maxQty,
  }));
  const estimate = estimatePackage(lines, pax);
  const items = chosen.map((o, i) => ({ vendorId: o.vendorId, serviceId: o.serviceId, qty: packageLineQty(lines[i]!, pax) }));

  return (
    <form action={action} className="px-5 pt-5 pb-8">
      <input type="hidden" name="packageId" value={packageId} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <Label>What’s included</Label>
      <ul className="grid gap-3">
        {chosen.map((o, i) => {
          const slot = slots[i]!;
          const qty = packageLineQty(lines[i]!, pax);
          const swapped = o.vendorId !== slot.current.vendorId;
          return (
            <li key={slot.category + i} className="card animate-rise min-w-0 rounded-2xl p-2.5">
              <div className="flex gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                  {o.coverUrl && <Image src={o.coverUrl} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-rose-600">
                    {slot.category} {swapped && <span className="ml-1 rounded-full bg-rose-50 px-1.5 text-rose-700">swapped</span>}
                  </p>
                  <Link href={`/vendors/${o.vendorSlug}`} className="text-base leading-tight font-semibold hover:underline">
                    {o.vendorName}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {o.serviceName} · {formatPeso(o.pricePhp)}
                    {UNIT_LABEL[o.unit]}
                    {qty > 1 && ` × ${qty}`}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">{formatPeso(estimate.lines[i]!.total)}</span>
                    {slot.alternatives.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSwapping(swapping === i ? null : i)}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-soft press"
                        aria-expanded={swapping === i}
                      >
                        <ArrowLeftRight className="size-3.5" /> Swap
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {swapping === i && (
                <div className="mt-3 grid gap-2 border-t border-dashed border-line pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted">Other {slot.category.toLowerCase()} vendors</p>
                    <button type="button" onClick={() => setSwapping(null)} aria-label="Close" className="text-muted">
                      <X className="size-4" />
                    </button>
                  </div>
                  {[slot.current, ...slot.alternatives].map((alt) => {
                    const active = alt.vendorId === o.vendorId;
                    return (
                      <button
                        type="button"
                        key={alt.vendorId}
                        data-alternative
                        onClick={() => {
                          setChosen((prev) => prev.map((p, k) => (k === i ? alt : p)));
                          setSwapping(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2 text-left",
                          active ? "border-rose-200 bg-rose-50" : "border-line bg-white",
                        )}
                      >
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-sand">
                          {alt.coverUrl && <Image src={alt.coverUrl} alt="" fill sizes="40px" className="object-cover" />}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{alt.vendorName}</span>
                          <span className="block truncate text-xs text-muted">
                            <Star className="inline size-3 fill-rose-500 text-rose-500" /> {alt.rating.toFixed(1)} · {alt.areaName} · {formatPeso(alt.pricePhp)}
                            {UNIT_LABEL[alt.unit]}
                          </span>
                        </span>
                        {active && <Check className="size-4 shrink-0 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-rose-50 p-4">
        <div>
          <p className="text-base leading-tight font-semibold">Est. total for {pax} pax</p>
          <p className="text-xs text-muted">Estimate only. Final price via vendor quotes.</p>
        </div>
        <p className="font-display text-2xl font-semibold" aria-live="polite">
          {formatPeso(estimate.total)}
        </p>
      </div>

      <input type="hidden" name="notes" value={`Hi! Requesting a quote for ${eventTitle} (${pax} pax) through the Eventually package.`} />
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" className="mt-4 w-full" pendingText="Sending requests…">
        Request quotes from all {chosen.length}
      </SubmitButton>
      <DemoNote className="mt-3">One request goes to each vendor. Nothing is booked until you accept a quote.</DemoNote>
    </form>
  );
}
