import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

type Variant = "primary" | "soft" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-rose-600 text-white shadow-[0_1px_2px_rgb(209_70_114/0.25)] hover:bg-rose-700 press",
  soft: "bg-rose-50 text-rose-700 hover:bg-rose-100 press",
  outline: "bg-white text-ink border border-line hover:bg-sand/60 press",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-white text-danger border border-line hover:bg-danger-50 press",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full",
  md: "h-11 px-5 text-[15px] rounded-full",
  lg: "h-13 px-6 text-[15px] rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none",
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
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
    selected ? "border-rose-200 bg-rose-50 text-rose-700" : "border-line bg-white text-ink-soft hover:border-rose-200",
    className,
  );
}

export function ChipLink({ selected, className, ...props }: ComponentProps<typeof Link> & { selected?: boolean }) {
  return <Link className={chipClass(selected, className)} aria-current={selected ? "true" : undefined} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card rounded-2xl", className)} {...props} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 className="text-[17px] font-semibold leading-tight">{children}</h2>
      {action}
    </div>
  );
}

const AVATAR_COLORS = ["bg-rose-50 text-rose-700", "bg-sand text-ink-soft", "bg-rose-100 text-rose-700"];

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
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
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
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", className)}>
      <Star className="size-3.5 fill-rose-500 text-rose-500" strokeWidth={1.5} aria-hidden />
      {value.toFixed(1)}
      {count != null && <span className="font-normal text-muted">({count})</span>}
    </span>
  );
}

export function CuratedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-rose-700 shadow-card",
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
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-card">
      {icon && <div className="mb-3 text-rose-600">{icon}</div>}
      <p className="text-base font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-ink-soft", className)}>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted/80 transition-colors focus:border-rose-300 focus:ring-3 focus:ring-rose-100 focus:outline-none";

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
  return <p className={cn("rounded-xl bg-sand px-3 py-2 text-xs text-muted", className)}>{children}</p>;
}
