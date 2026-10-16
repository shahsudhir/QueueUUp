import { NavLink } from "react-router-dom";
import { Activity, CirclePlus, House, LayoutDashboard, ListOrdered, QrCode, Ticket } from "lucide-react";
import { cn } from "../../lib/cn";
import { useQueue } from "../../context/QueueContext";

function customerItems(slug) {
  const base = `/s/${slug}`;
  return [
    { to: base, label: "Home", icon: House, end: true },
    { to: `${base}/join`, label: "Join", icon: CirclePlus },
    { to: `${base}/queue`, label: "Queue", icon: ListOrdered },
    { to: `${base}/token`, label: "Ticket", icon: Ticket, showBadge: true },
    { to: `${base}/qr`, label: "QR", icon: QrCode },
  ];
}

const BUSINESS_ITEMS = [
  { to: "/business-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live-queue", label: "Live queue", icon: Activity },
  { to: "/business-qr", label: "QR code", icon: QrCode },
];

export default function BottomNav({ role = "customer", slug }) {
  const { me } = useQueue();
  const items = role === "business" ? BUSINESS_ITEMS : customerItems(slug);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-md gap-1 rounded-2xl border border-white/70 bg-white/85 p-1.5 shadow-[0_10px_30px_-8px_rgb(23_21_59/0.25)] backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon, showBadge, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30",
                  isActive ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:text-ink"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                  <span>{label}</span>
                  {showBadge && me && (
                    <span className="absolute right-[calc(50%-18px)] top-2 size-2 rounded-full bg-pole ring-2 ring-white">
                      <span className="sr-only">You have an active ticket</span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
