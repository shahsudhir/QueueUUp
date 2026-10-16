import { cn } from "../../lib/cn";
import { formatMinutes, minutesUntilTurn } from "../../lib/queue";

export default function QueueTimeline({ customers, serving, waiting, myToken }) {
  const rows = [...(serving ? [serving] : []), ...waiting];

  return (
    <ol className="relative mt-4">
      {rows.map((c, i) => {
        const isMe = c.token === myToken;
        const isServing = c.status === "serving";
        const last = i === rows.length - 1;
        return (
          <li key={c.token} className="relative flex gap-4 pb-4 last:pb-0">
            {!last && (
              <span aria-hidden="true" className="absolute left-[11px] top-7 h-full w-0.5 bg-slate-200" />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-4 size-6 shrink-0 rounded-full border-4",
                isServing ? "border-emerald-500 bg-white" : isMe ? "border-brand-600 bg-white" : "border-slate-200 bg-white"
              )}
            />
            <div
              className={cn(
                "flex flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3",
                isMe ? "bg-brand-50 ring-2 ring-brand-600" : isServing ? "bg-emerald-50" : "bg-paper"
              )}
            >
              <div className="min-w-0">
                <p className={cn("font-display text-lg font-bold", isMe ? "text-brand-600" : "text-ink")}>
                  #{c.token}
                  {isMe && <span className="ml-2 font-sans text-sm font-semibold">You</span>}
                </p>
                <p className="truncate text-sm text-slate-600">
                  {c.name} · {c.service}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  isServing ? "text-emerald-700" : "text-slate-500"
                )}
              >
                {isServing ? "In the chair" : `~${formatMinutes(minutesUntilTurn(customers, c.token))}`}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
