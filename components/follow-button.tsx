"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { toggleFollow } from "@/app/actions/social";

export function FollowButton({ vendorId, following, className }: { vendorId: string; following: boolean; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(following);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await toggleFollow(vendorId);
        })
      }
      aria-pressed={optimistic}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full border-2 border-ink px-3 text-xs font-extrabold press",
        optimistic ? "bg-ink text-white" : "bg-white shadow-pop-sm",
        className,
      )}
    >
      {optimistic ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
      {optimistic ? "Following" : "Follow"}
    </button>
  );
}
