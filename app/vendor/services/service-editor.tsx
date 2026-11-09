"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { UNIT_LABEL } from "@/lib/domain/pricing";
import type { Unit } from "@/lib/domain/types";
import { formatPeso } from "@/lib/format";
import { deleteServiceAction, saveServiceAction, type VendorFormState } from "@/app/actions/vendor";

const UNIT_OPTIONS: Record<Unit, string> = { per_item: "Per item", per_pax: "Per guest (pax)", flat: "Flat package", per_hour: "Per hour" };

type Service = { id: string; name: string; description: string; pricePhp: number; unit: Unit };

export function ServiceEditor({ service }: { service?: Service }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<VendorFormState, FormData>(async (prev, fd) => {
    const res = await saveServiceAction(prev, fd);
    if (res.ok) setEditing(false);
    return res;
  }, {});

  if (!editing) {
    if (!service)
      return (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink/30 bg-white/60 p-4 font-bold text-ube"
        >
          <Plus className="size-5" /> Add a service
        </button>
      );
    return (
      <div className="flex items-center gap-3 rounded-3xl border-2 border-ink bg-white p-4 shadow-pop-sm">
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold">{service.name}</p>
          {service.description && <p className="truncate text-xs text-muted">{service.description}</p>}
          <p className="mt-0.5 text-sm font-bold">
            {formatPeso(service.pricePhp)} <span className="font-medium text-muted">{UNIT_LABEL[service.unit]}</span>
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${service.name}`} className="flex size-9 items-center justify-center rounded-full hover:bg-ink/5">
          <Pencil className="size-4" />
        </button>
        <form action={deleteServiceAction}>
          <input type="hidden" name="id" value={service.id} />
          <button type="submit" aria-label={`Delete ${service.name}`} className="flex size-9 items-center justify-center rounded-full text-muted hover:text-sunset">
            <Trash2 className="size-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3 rounded-3xl border-2 border-ink bg-white p-4 shadow-pop">
      <input type="hidden" name="id" value={service?.id ?? ""} />
      <div>
        <Label htmlFor={`name-${service?.id ?? "new"}`}>Service name</Label>
        <Input id={`name-${service?.id ?? "new"}`} name="name" defaultValue={service?.name} required placeholder="Whole lechon (regular)" />
      </div>
      <div>
        <Label htmlFor={`desc-${service?.id ?? "new"}`}>Short description</Label>
        <Textarea id={`desc-${service?.id ?? "new"}`} name="description" rows={2} defaultValue={service?.description} placeholder="Good for 40–50 guests" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`price-${service?.id ?? "new"}`}>Price (₱)</Label>
          <Input id={`price-${service?.id ?? "new"}`} name="pricePhp" type="number" inputMode="numeric" min={0} defaultValue={service?.pricePhp} required />
        </div>
        <div>
          <Label htmlFor={`unit-${service?.id ?? "new"}`}>Unit</Label>
          <Select id={`unit-${service?.id ?? "new"}`} name="unit" defaultValue={service?.unit ?? "per_item"}>
            {(Object.keys(UNIT_OPTIONS) as Unit[]).map((u) => (
              <option key={u} value={u}>
                {UNIT_OPTIONS[u]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-sunset">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        <SubmitButton className="flex-1" pendingText="Saving…">
          Save service
        </SubmitButton>
      </div>
    </form>
  );
}
