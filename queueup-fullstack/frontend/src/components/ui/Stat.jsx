import { cn } from "../../lib/cn";

/** Small number + label pair. `tone="brand"` colours the value. */
export default function Stat({ label, value, tone = "ink", className }) {
  return (
    <div className={cn("min-w-0 rounded-2xl bg-paper px-3.5 py-3.5", className)}>
      <p className="truncate text-sm text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 whitespace-nowrap font-display text-xl font-bold tabular-nums sm:text-2xl",
          tone === "brand" ? "text-brand-600" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}
