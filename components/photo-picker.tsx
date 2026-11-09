"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, ImagePlus } from "lucide-react";
import { cn } from "@/lib/cn";

/** Upload photos, or pick demo sample photos (handy when demoing without files on hand). */
export function PhotoPicker({ samples, min = 1, max = 8 }: { samples: string[]; min?: number; max?: number }) {
  const [uploads, setUploads] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const total = uploads.length + picked.length;

  return (
    <div>
      <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-white text-sm font-medium text-ink-soft hover:border-rose-300">
        <ImagePlus className="size-6" />
        Add photos (up to {max})
        <input
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => setUploads(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
        />
      </label>
      {uploads.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {uploads.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" className="size-16 shrink-0 rounded-xl border border-line object-cover" />
          ))}
        </div>
      )}
      <p className="mt-3 mb-2 text-xs font-semibold text-muted">Or use sample photos (demo):</p>
      <div className="grid grid-cols-4 gap-2">
        {samples.map((src) => {
          const on = picked.includes(src);
          return (
            <label key={src} className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-sand">
              <input
                type="checkbox"
                name="samplePhotos"
                value={src}
                checked={on}
                onChange={() => setPicked((p) => (on ? p.filter((x) => x !== src) : [...p, src]))}
                className="peer sr-only"
              />
              <Image src={src} alt="Sample photo" fill sizes="100px" className="object-cover" />
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition peer-focus-visible:ring-4 peer-focus-visible:ring-rose-600",
                  on ? "bg-rose-600/50" : "bg-transparent",
                )}
              >
                {on && <Check className="size-6 text-white" strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
      <p className={cn("mt-2 text-xs font-semibold", total >= min ? "text-success" : "text-muted")}>
        {total} selected{min > 1 ? ` · at least ${min}` : ""}
      </p>
    </div>
  );
}
