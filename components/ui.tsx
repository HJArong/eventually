import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

type Variant = "primary" | "mango" | "ube" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white pop-sm press",
  mango: "bg-mango text-ink pop-sm press",
  ube: "bg-ube text-white pop-sm press",
  outline: "bg-white text-ink pop-sm press",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-white text-sunset pop-sm press",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full",
  md: "h-11 px-5 text-[15px] rounded-full",
  lg: "h-14 px-6 text-base rounded-2xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-bold whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function chipClass(selected = false, className?: string) {
  return cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
    selected ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink/40",
    className,
  );
}

export function ChipLink({ selected, className, ...props }: ComponentProps<typeof Link> & { selected?: boolean }) {
  return <Link className={chipClass(selected, className)} aria-current={selected ? "true" : undefined} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("pop rounded-3xl", className)} {...props} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 className="text-lg font-extrabold leading-tight">{children}</h2>
      {action}
    </div>
  );
}

const AVATAR_COLORS = ["bg-mango", "bg-sunset-100", "bg-ube-100", "bg-calamansi-100", "bg-mango-100", "bg-sunset"];

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const color = AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink font-display font-extrabold text-ink",
        !src && color,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", className)}>
      <Star className="size-4 fill-mango text-ink" strokeWidth={1.5} aria-hidden />
      {value.toFixed(1)}
      {count != null && <span className="font-normal text-muted">({count})</span>}
    </span>
  );
}

export function CuratedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex -rotate-2 items-center gap-1 rounded-full border-2 border-ink bg-mango px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase",
        className,
      )}
      title="Eventually-curated: reviewed by our team"
    >
      <BadgeCheck className="size-3.5" aria-hidden /> Curated
    </span>
  );
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-ink/20 bg-white/60 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-ube">{icon}</div>}
      <p className="font-display text-lg font-extrabold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-xs font-extrabold tracking-wider text-ink-soft uppercase", className)}>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border-2 border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "min-h-24 resize-none", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClass, "appearance-none", className)} {...props} />;
}

export function DemoNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("rounded-xl bg-sunset-50 px-3 py-2 text-xs font-medium text-sunset", className)}>{children}</p>
  );
}
