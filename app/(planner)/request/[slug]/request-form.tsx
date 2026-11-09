"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Minus, Plus, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoNote, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { UNIT_LABEL, defaultQty } from "@/lib/domain/pricing";
import type { Unit } from "@/lib/domain/types";
import { formatPeso } from "@/lib/format";
import { sendRequestAction, type ActionState } from "@/app/actions/bookings";

type Service = { id: string; name: string; pricePhp: number; unit: Unit; minQty: number | null; maxQty: number | null };

export function RequestForm({
  vendor,
  services,
  preselect,
  event,
  areas,
}: {
  vendor: { id: string; name: string; coverUrl: string | null; category: string };
  services: Service[];
  preselect: string | null;
  event: { title: string; date: string; pax: number; venueText: string; areaId: number };
  areas: { id: number; name: string }[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(sendRequestAction, {});
  const [pax, setPax] = useState(event.pax);
  const [selected, setSelected] = useState<Record<string, number>>(() => {
    const s = services.find((x) => x.id === preselect);
    return s ? { [s.id]: defaultQty(s, event.pax) } : {};
  });

  const toggle = (s: Service) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[s.id]) delete next[s.id];
      else next[s.id] = defaultQty(s, pax);
      return next;
    });
  const bump = (s: Service, delta: number) =>
    setSelected((prev) => ({ ...prev, [s.id]: Math.max(1, Math.min(s.maxQty ?? 5000, (prev[s.id] ?? 1) + delta)) }));

  const estimate = services.reduce((sum, s) => sum + (selected[s.id] ? selected[s.id]! * s.pricePhp : 0), 0);
  const payload = JSON.stringify(Object.entries(selected).map(([serviceId, qty]) => ({ serviceId, qty })));
  const cheapest = services.length ? Math.min(...services.map((s) => s.pricePhp)) : 0;

  return (
    <form action={action} className="grid gap-5 px-5 pt-4 pb-6">
      <input type="hidden" name="vendorId" value={vendor.id} />
      <input type="hidden" name="services" value={payload} />

      <div className="card flex items-center gap-3 rounded-2xl p-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-line">
          {vendor.coverUrl && <Image src={vendor.coverUrl} alt="" fill sizes="56px" className="object-cover" />}
        </div>
        <div>
          <p className="font-display text-lg leading-tight font-semibold">{vendor.name}</p>
          <p className="text-sm text-muted">
            {vendor.category} · from {formatPeso(cheapest)}
          </p>
        </div>
      </div>

      <div>
        <Label>Event</Label>
        <Input value={event.title} readOnly aria-label="Event" className="bg-sand/60 font-semibold" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input name="date" type="date" defaultValue={event.date} aria-label="Date" required />
          <Input name="timeText" placeholder="Deliver by 5 pm" aria-label="Time" />
          <Input
            name="pax"
            type="number"
            inputMode="numeric"
            value={pax}
            min={1}
            onChange={(e) => setPax(Number(e.target.value) || 1)}
            aria-label="Guests"
            required
          />
          <Input name="budgetPhp" type="number" inputMode="numeric" placeholder="Budget ₱ (optional)" aria-label="Budget" />
        </div>
      </div>

      <div>
        <Label>Services</Label>
        <div className="grid gap-2">
          {services.map((s) => {
            const on = Boolean(selected[s.id]);
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition",
                  on ? "border-rose-300 bg-rose-50" : "border-line bg-white",
                )}
              >
                <button type="button" onClick={() => toggle(s)} aria-pressed={on} className="min-w-0 flex-1 text-left">
                  <span className="block font-semibold">{s.name}</span>
                  <span className="text-sm text-muted">
                    {formatPeso(s.pricePhp)}
                    {UNIT_LABEL[s.unit]}
                  </span>
                </button>
                {on && s.unit !== "flat" ? (
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => bump(s, -1)} className="flex size-8 items-center justify-center rounded-full border border-line bg-white" aria-label={`Fewer ${s.name}`}>
                      <Minus className="size-4" />
                    </button>
                    <span className="w-9 text-center font-semibold tabular-nums" aria-live="polite">
                      {selected[s.id]}
                    </span>
                    <button type="button" onClick={() => bump(s, 1)} className="flex size-8 items-center justify-center rounded-full border border-line bg-white" aria-label={`More ${s.name}`}>
                      <Plus className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    className={cn("rounded-full border border-line px-3 py-1 text-xs font-semibold", on ? "border-rose-200 bg-rose-50 text-rose-700" : "bg-white text-ink-soft")}
                  >
                    {on ? "Added" : "Add"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {estimate > 0 && (
          <p className="mt-2 text-sm font-semibold text-muted">
            Estimate at listed prices: <span className="font-semibold text-ink">{formatPeso(estimate)}</span>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="venueText">Venue / delivery</Label>
        <Input id="venueText" name="venueText" defaultValue={event.venueText} placeholder="Casa Mahogany, Lahug, Cebu City" />
        <Select name="deliveryAreaId" defaultValue={String(event.areaId)} aria-label="Delivery area" className="mt-3">
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes for vendor</Label>
        <Textarea id="notes" name="notes" placeholder="One spicy, one regular please…" />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" pendingText="Sending…" disabled={!Object.keys(selected).length}>
        <Send className="size-5" /> Send request
      </SubmitButton>
      <DemoNote>No payment now. The vendor replies with a quote in your inbox.</DemoNote>
    </form>
  );
}
