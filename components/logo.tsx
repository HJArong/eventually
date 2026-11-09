import { cn } from "@/lib/cn";

/** Wordmark: a rounded rose tile with a lowercase "e", then "eventually". */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x="2" y="2" width="36" height="36" rx="11" fill="#d14672" />
      <path
        d="M26.5 21.3H14.2c.4 2.9 2.7 4.7 5.6 4.7 1.9 0 3.4-.7 4.5-1.9l2.1 1.8c-1.7 2-4 3.1-6.8 3.1-5 0-8.6-3.6-8.6-8.3 0-4.6 3.5-8.2 8.2-8.2 4.6 0 7.5 3.4 7.5 7.8l-.2 1Zm-12.2-2.7h9c-.4-2.4-2.2-4-4.5-4s-4 1.6-4.5 4Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-semibold tracking-tight text-ink" style={{ fontSize: size * 0.66 }}>
        eventually
      </span>
    </span>
  );
}
