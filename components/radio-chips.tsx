import { cn } from "@/lib/cn";

/** Chip-styled radios/checkboxes that work without client JS. */
export function RadioChips({
  name,
  options,
  defaultValue,
  type = "radio",
  required,
  className,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | string[];
  type?: "radio" | "checkbox";
  required?: boolean;
  className?: string;
}) {
  const defaults = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input
            type={type}
            name={name}
            value={o.value}
            defaultChecked={defaults.includes(o.value)}
            required={required && type === "radio"}
            className="peer sr-only"
          />
          <span className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3.5 text-sm font-medium text-ink-soft transition-colors peer-checked:border-rose-200 peer-checked:bg-rose-50 peer-checked:text-rose-700 peer-focus-visible:outline-2 peer-focus-visible:outline-rose-500">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}
