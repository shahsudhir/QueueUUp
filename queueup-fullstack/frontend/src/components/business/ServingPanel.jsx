import { Check, Coffee, SkipForward } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { getService } from "../../config/business";
import { timeAgo } from "../../lib/queue";

export default function ServingPanel({ customer, pending, onSkip, onServe }) {
  if (!customer) {
    return (
      <Card className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-paper text-slate-500">
          <Coffee className="size-6" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">The chair is free</h2>
          <p className="text-sm text-slate-500">New customers are called automatically when they join.</p>
        </div>
      </Card>
    );
  }

  const service = getService(customer.service);

  return (
    <Card className="border-l-4 border-emerald-500">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-700">Now serving</p>
          <p className="mt-1 font-display text-5xl font-extrabold tracking-tight text-ink tabular-nums">
            #{customer.token}
          </p>
          <p className="mt-2 truncate text-lg font-semibold text-ink">{customer.name}</p>
          <p className="text-sm text-slate-500">
            {service.icon} {service.name}, about {service.duration} min
            {customer.joinedAt && <> · joined {timeAgo(customer.joinedAt)}</>}
          </p>
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="mt-1 inline-block text-sm font-semibold text-brand-600 hover:underline">
              {customer.phone}
            </a>
          )}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          loading={pending === `skip:${customer.token}`}
          disabled={Boolean(pending)}
          onClick={() => onSkip(customer)}
        >
          <SkipForward />
          Skip
        </Button>
        <Button
          variant="success"
          loading={pending === `serve:${customer.token}`}
          disabled={Boolean(pending)}
          onClick={() => onServe(customer)}
        >
          <Check />
          Served
        </Button>
      </div>
    </Card>
  );
}
