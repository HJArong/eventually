import { cn } from "@/lib/cn";

/** Wordmark: a tilted ube "e" tile with a mango sparkle, then "eventually". */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <g transform="rotate(-6 20 20)">
        <rect x="4" y="6" width="30" height="30" rx="10" fill="#1d1233" />
        <rect x="2" y="4" width="30" height="30" rx="10" fill="#6b3fd4" stroke="#1d1233" strokeWidth="2.5" />
        <path
          d="M23.5 21.5h-11c.4 2.6 2.4 4.2 5 4.2 1.7 0 3-.6 4-1.7l1.9 1.6c-1.5 1.8-3.6 2.8-6.1 2.8-4.5 0-7.7-3.2-7.7-7.4 0-4.1 3.1-7.3 7.3-7.3 4.1 0 6.8 3 6.8 7 0 .3 0 .6-.2.8Zm-10.9-2.4h8c-.4-2.2-2-3.6-4-3.6s-3.6 1.4-4 3.6Z"
          fill="#fff"
        />
      </g>
      <path d="M33 2l1.4 3.6L38 7l-3.6 1.4L33 12l-1.4-3.6L28 7l3.6-1.4z" fill="#ffc23d" stroke="#1d1233" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-display font-extrabold tracking-tight" style={{ fontSize: size * 0.72 }}>
        eventually
      </span>
    </span>
  );
}
