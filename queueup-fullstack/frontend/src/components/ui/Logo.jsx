import { cn } from "../../lib/cn";

export default function Logo({ size = "md", className }) {
  const box = size === "lg" ? "size-16 rounded-2xl" : "size-9 rounded-xl";
  return (
    <span className={cn("grid place-items-center bg-brand-600 text-white shadow-lg shadow-brand-600/30", box, className)}>
      <svg viewBox="0 0 64 64" className="size-3/5" aria-hidden="true">
        <circle cx="30" cy="30" r="14" fill="none" stroke="currentColor" strokeWidth="6" />
        <path d="M38 38l10 10" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
