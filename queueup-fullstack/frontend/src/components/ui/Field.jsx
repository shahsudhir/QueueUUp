import { cn } from "../../lib/cn";

export default function Field({ id, label, optional, hint, error, icon: Icon, trailing, className, ...inputProps }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-slate-400">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-xl border bg-white px-4 text-base text-ink transition placeholder:text-slate-400",
            "focus:outline-none focus:ring-4",
            Icon && "pl-11",
            trailing && "pr-12",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/15"
          )}
          {...inputProps}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
