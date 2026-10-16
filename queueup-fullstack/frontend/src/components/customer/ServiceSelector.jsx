import { SERVICES } from "../../config/business";
import { cn } from "../../lib/cn";

export default function ServiceSelector({ value, onChange }) {
  return (
    <fieldset className="grid gap-2.5">
      <legend className="sr-only">Choose a service</legend>
      {SERVICES.map((service) => {
        const checked = value === service.name;
        return (
          <label
            key={service.id}
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-inset transition",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500",
              checked ? "bg-brand-50/70 ring-2 ring-brand-600" : "ring-slate-200 hover:ring-slate-300"
            )}
          >
            <input
              type="radio"
              name="service"
              value={service.name}
              checked={checked}
              onChange={() => onChange(service.name)}
              className="sr-only"
            />
            <span className="grid size-11 place-items-center rounded-xl bg-paper text-xl" aria-hidden="true">
              {service.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{service.name}</span>
              <span className="text-sm text-slate-500">About {service.duration} min</span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 place-items-center rounded-full border-2 transition",
                checked ? "border-brand-600" : "border-slate-300"
              )}
            >
              {checked && <span className="size-2.5 rounded-full bg-brand-600" />}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
