import { cn } from "../../lib/cn";

export default function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl bg-white text-ink shadow-card ring-1 ring-slate-900/5 transition hover:bg-slate-50 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 [&_svg]:size-5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
