"use client";

import { useActionState } from "react";
import { PhotoPicker } from "@/components/photo-picker";
import { RadioChips } from "@/components/radio-chips";
import { Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createPostAction, type VendorFormState } from "@/app/actions/vendor";

type Option = { value: string; label: string };

export function PostComposer({
  samples,
  eventTypes,
  areas,
  defaultAreaId,
  services,
}: {
  samples: string[];
  eventTypes: Option[];
  areas: Option[];
  defaultAreaId: string;
  services: Option[];
}) {
  const [state, action] = useActionState<VendorFormState, FormData>(createPostAction, {});
  return (
    <form action={action} className="grid gap-5 px-5 pt-5 pb-8">
      <div>
        <Label>Photos</Label>
        <PhotoPicker samples={samples} min={1} />
      </div>
      <div>
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" required placeholder="Two lechon for a debut in Lahug this weekend…" />
      </div>
      <div>
        <Label>Event type tags</Label>
        <RadioChips name="tags" type="checkbox" options={eventTypes} />
      </div>
      <div>
        <Label htmlFor="areaId">Area</Label>
        <Select id="areaId" name="areaId" defaultValue={defaultAreaId}>
          {areas.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="linkedServiceId">Link a service (optional)</Label>
        <Select id="linkedServiceId" name="linkedServiceId" defaultValue="">
          <option value="">No linked service</option>
          {services.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" pendingText="Publishing…">
        Publish to feed
      </SubmitButton>
    </form>
  );
}
