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
          <span className="inline-flex h-9 items-center rounded-full border-2 border-ink/15 bg-white px-3.5 text-sm font-semibold transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-ube">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}
