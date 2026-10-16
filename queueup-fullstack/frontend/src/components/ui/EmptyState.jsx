import { cn } from "../../lib/cn";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {Icon && (
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="size-7" />
        </span>
      )}
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
