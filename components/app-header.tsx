import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function AppHeader({
  title,
  subtitle,
  back,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-2 border-b-2 border-ink/10 bg-cream/95 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur",
        className,
      )}
    >
      {back && (
        <Link
          href={back}
          className="-ml-1 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-ink/5"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" strokeWidth={2.5} />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[22px] leading-tight font-extrabold">{title}</h1>
        {subtitle && <p className="truncate text-xs font-medium text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
