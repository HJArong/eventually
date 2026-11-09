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
        "sticky top-0 z-30 flex items-center gap-2 border-b border-line/70 bg-cream/90 px-5 pt-[max(env(safe-area-inset-top),0.875rem)] pb-3 backdrop-blur",
        className,
      )}
    >
      {back && (
        <Link
          href={back}
          className="-ml-1 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-ink/5"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl leading-tight font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
