import { getService } from "../../config/business";
import { cn } from "../../lib/cn";

/**
 * The ticket: styled like a paper tear-off queue ticket.
 * This is the one bold element in the design; everything else stays quiet.
 */
export default function TicketCard({ customer, progress, isYourTurn, shopName }) {
  const service = getService(customer.service);

  return (
    <article
      aria-label={`Your ticket, token number ${customer.token}`}
      className="relative overflow-hidden rounded-[28px] bg-white shadow-card ring-1 ring-slate-900/5"
    >
      <div
        className={cn(
          "px-6 pb-8 pt-6 text-white transition-colors",
          isYourTurn ? "bg-emerald-600" : "bg-brand-600"
        )}
      >
        <div className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
          <span className="truncate">{shopName}</span>
          <span className="shrink-0">{isYourTurn ? "Your turn" : "In queue"}</span>
        </div>
        <p className="mt-6 text-sm text-white/80">Token</p>
        <p className="font-display text-[88px] font-extrabold leading-[0.9] tracking-tight tabular-nums">
          {customer.token}
        </p>
        <p className="mt-3 font-medium">
          {customer.name} · {service.name}
        </p>
      </div>

      {/* Perforation with punched notches */}
      <div className="relative h-0" aria-hidden="true">
        <span className="absolute -left-4 -top-4 size-8 rounded-full bg-paper" />
        <span className="absolute -right-4 -top-4 size-8 rounded-full bg-paper" />
        <span className="absolute inset-x-6 top-0 border-t-2 border-dashed border-slate-200" />
      </div>

      <div className="px-6 pb-6 pt-7">
        <div
          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress through the queue"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700",
              isYourTurn ? "bg-emerald-500" : "bg-brand-600"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm font-medium text-slate-500">
          <span>Joined</span>
          <span>Your turn</span>
        </div>
      </div>
    </article>
  );
}
