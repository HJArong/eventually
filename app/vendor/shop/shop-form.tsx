"use client";

import { useActionState } from "react";
import { RadioChips } from "@/components/radio-chips";
import { Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updateShopAction, type VendorFormState } from "@/app/actions/vendor";

type ShopFields = { name: string; tagline: string; bio: string; fbUrl: string; igUrl: string };

export function ShopForm({
  vendor,
  areas,
  selectedAreas,
}: {
  vendor: ShopFields;
  areas: { value: string; label: string }[];
  selectedAreas: string[];
}) {
  const [state, action] = useActionState<VendorFormState, FormData>(updateShopAction, {});
  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="name">Shop name</Label>
        <Input id="name" name="name" defaultValue={vendor.name} required />
      </div>
      <div>
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={vendor.tagline} maxLength={80} />
      </div>
      <div>
        <Label htmlFor="bio">About</Label>
        <Textarea id="bio" name="bio" defaultValue={vendor.bio} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fbUrl">Facebook</Label>
          <Input id="fbUrl" name="fbUrl" defaultValue={vendor.fbUrl} placeholder="facebook.com/…" />
        </div>
        <div>
          <Label htmlFor="igUrl">Instagram</Label>
          <Input id="igUrl" name="igUrl" defaultValue={vendor.igUrl} placeholder="instagram.com/…" />
        </div>
      </div>
      <div>
        <Label>Areas served</Label>
        <RadioChips name="areas" type="checkbox" options={areas} defaultValue={selectedAreas} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm font-semibold text-success">Saved.</p>}
      <SubmitButton pendingText="Saving…">Save shop</SubmitButton>
    </form>
  );
}
