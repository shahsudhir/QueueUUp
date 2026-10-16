import { cn } from "../../lib/cn";
import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700",
  secondary: "bg-white text-ink ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
  ghost: "text-brand-600 hover:bg-brand-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "bg-red-50 text-pole ring-1 ring-inset ring-red-100 hover:bg-red-100",
  dangerSolid: "bg-pole text-white hover:bg-red-700",
};

const SIZES = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm [&_svg]:size-4",
  md: "h-11 gap-2 rounded-xl px-4 text-sm [&_svg]:size-4",
  lg: "h-14 gap-2 rounded-2xl px-6 text-base [&_svg]:size-5",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold transition active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30",
        "disabled:pointer-events-none disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
