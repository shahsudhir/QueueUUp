import { Check, SkipForward } from "lucide-react";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import { formatMinutes } from "../../lib/queue";

export default function QueueCustomer({ customer, position, waitMinutes, pending, onSkip, onServe }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-12 min-w-12 place-items-center rounded-xl bg-brand-50 px-2 font-display text-base font-bold text-brand-600 tabular-nums">
          #{customer.token}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{customer.name}</p>
          <p className="truncate text-sm text-slate-500">
            {customer.service}, {position === 1 ? "next up" : `${position} in line`}, ~{formatMinutes(waitMinutes)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={customer.status} />
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={pending === `skip:${customer.token}`}
            disabled={Boolean(pending)}
            onClick={() => onSkip(customer)}
          >
            <SkipForward />
            Skip
          </Button>
          <Button
            size="sm"
            variant="success"
            loading={pending === `serve:${customer.token}`}
            disabled={Boolean(pending)}
            onClick={() => onServe(customer)}
          >
            <Check />
            Served
          </Button>
        </div>
      </div>
    </li>
  );
}
