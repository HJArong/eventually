"use client";

import { useActionState } from "react";
import { PhotoPicker } from "@/components/photo-picker";
import { RadioChips } from "@/components/radio-chips";
import { Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createShopAction, type VendorFormState } from "@/app/actions/vendor";

type Option = { value: string; label: string };

export function ShopSetupForm({ categories, areas, samples }: { categories: Option[]; areas: Option[]; samples: string[] }) {
  const [state, action] = useActionState<VendorFormState, FormData>(createShopAction, {});
  return (
    <form action={action} className="grid gap-5 px-5 pt-5">
      <div>
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" required placeholder="e.g. Lechon ni Inday" />
      </div>
      <div>
        <Label htmlFor="link">Facebook or Instagram page</Label>
        <Input id="link" name="link" type="url" placeholder="https://facebook.com/yourpage" />
      </div>
      <div>
        <Label>Category</Label>
        <RadioChips name="categoryId" options={categories} required />
      </div>
      <div>
        <Label>Areas you serve</Label>
        <RadioChips name="areas" type="checkbox" options={areas} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="baseAreaId">Based in</Label>
          <Select id="baseAreaId" name="baseAreaId">
            {areas.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="startingPricePhp">Starting price ₱</Label>
          <Input id="startingPricePhp" name="startingPricePhp" type="number" inputMode="numeric" min={0} required placeholder="8500" />
        </div>
      </div>
      <div>
        <Label htmlFor="bio">About your business</Label>
        <Textarea id="bio" name="bio" placeholder="What makes you special? How long have you been doing this?" />
      </div>
      <div>
        <Label>Photos of your work (at least 3)</Label>
        <PhotoPicker samples={samples} min={3} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" pendingText="Saving…">
        Next: add services
      </SubmitButton>
    </form>
  );
}
