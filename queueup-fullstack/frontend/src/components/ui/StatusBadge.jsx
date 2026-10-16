import { cn } from "../../lib/cn";

const STYLES = {
  serving: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  waiting: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
        STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-current", status === "serving" && "animate-pulse")} />
      {status}
    </span>
  );
}
