"use client";

import Image from "next/image";
import { useActionState } from "react";
import { RadioChips } from "@/components/radio-chips";
import { Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { BUDGET_PRESETS } from "@/lib/domain/pricing";
import { createEventAction, type FormState } from "@/app/actions/events";

type Option = { value: string; label: string };

export function CreateEventForm({ eventTypes, areas }: { eventTypes: Option[]; areas: Option[] }) {
  const [state, action] = useActionState<FormState, FormData>(createEventAction, {});
  const err = (k: string) =>
    state.fieldErrors?.[k] ? (
      <p role="alert" className="mt-1.5 text-sm font-semibold text-sunset">
        {state.fieldErrors[k]}
      </p>
    ) : null;

  return (
    <form action={action} className="grid gap-6 px-5 pt-5">
      <div className="pop relative h-36 overflow-hidden rounded-3xl">
        <Image src="/seed/styling-roses.webp" alt="" fill sizes="440px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <p className="absolute bottom-3 left-4 right-4 font-display text-xl leading-tight font-extrabold text-white">
          Plan your Cebu celebration without the chaos
        </p>
      </div>

      <div>
        <Label>What are you planning?</Label>
        <RadioChips name="eventType" options={eventTypes} required />
        {err("eventType")}
      </div>

      <div>
        <Label htmlFor="celebrant">Whose event?</Label>
        <Input id="celebrant" name="celebrant" placeholder="e.g. Sofia" autoComplete="off" />
        <p className="mt-1 text-xs text-muted">We’ll call it “Sofia’s 18th Debut”.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">When?</Label>
          <Input id="date" name="date" type="date" required />
          {err("date")}
        </div>
        <div>
          <Label htmlFor="pax">Guests</Label>
          <Input id="pax" name="pax" type="number" inputMode="numeric" min={5} placeholder="120" required />
          {err("pax")}
        </div>
      </div>

      <div>
        <Label>Where in Cebu?</Label>
        <RadioChips name="areaId" options={areas} required />
        {err("areaId")}
        <Input name="venueText" placeholder="Venue or barangay (optional), e.g. Lahug" className="mt-3" />
      </div>

      <div>
        <Label>Budget</Label>
        <RadioChips name="budgetPhp" options={BUDGET_PRESETS.map((b) => ({ value: String(b.value), label: b.label }))} required />
        {err("budgetPhp")}
      </div>

      <SubmitButton size="lg" pendingText="Creating…" className="mt-2">
        Create my event
      </SubmitButton>
    </form>
  );
}
