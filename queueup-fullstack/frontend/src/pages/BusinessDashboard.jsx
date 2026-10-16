import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, KeyRound, LogOut, QrCode, RefreshCw, Trash2, Users } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ServingPanel from "../components/business/ServingPanel";
import BusinessHistory from "../components/business/BusinessHistory";
import StaffPerformance from "../components/business/StaffPerformance";
import { useAuth } from "../context/AuthContext";
import { useQueue } from "../context/QueueContext";
import { useToast } from "../context/ToastContext";
import { useQueueAction } from "../hooks/useQueueAction";
import { formatMinutes, minutesUntilTurn, timeAgo } from "../lib/queue";
import { cn } from "../lib/cn";

// "ROLE_ADMIN" -> "admin", "ROLE_STAFF" -> "staff"
function roleLabel(role) {
  return role ? role.replace("ROLE_", "").toLowerCase() : "";
}

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, logout } = useAuth();
  const { shop, customers, serving, waiting, loading, refresh, serve, skip, remove } = useQueue();
  const { pending, run } = useQueueAction();

  const [refreshing, setRefreshing] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isAdmin = session?.role === "ROLE_ADMIN";
  const shopName = shop?.name ?? session?.shopName ?? "Dashboard";

  async function handleRefresh() {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  }

  const handleSkip = (c) => run(`skip:${c.token}`, () => skip(c.token), `#${c.token} moved to the back of the line.`);
  const handleServe = (c) => run(`serve:${c.token}`, () => serve(c.token), `#${c.token} marked as served.`);

  async function handleRemove() {
    const c = toRemove;
    const ok = await run(`remove:${c.token}`, () => remove(c.token), `#${c.token} removed from the queue.`);
    if (ok) setToRemove(null);
  }

  async function handleLogout() {
    await logout();
    toast.info("Signed out.");
    navigate("/", { replace: true });
  }

  if (loading) return <PageLoader />;

  const clearIn = minutesUntilTurn(customers);
  const subtitle = session?.email
    ? `Signed in as ${session.email}${session.role ? ` (${roleLabel(session.role)})` : ""}`
    : "Manage your queue";

  return (
    <>
      <PageHeader
        title={shopName}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing} aria-label="Refresh queue">
              <RefreshCw className={cn(refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Only admins see the Staff button */}
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => navigate("/staff")} aria-label="Manage staff">
                <Users />
                <span className="hidden sm:inline">Staff</span>
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={() => navigate("/change-password")} aria-label="Change password">
              <KeyRound />
              <span className="hidden sm:inline">Password</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmLogout(true)} aria-label="Sign out">
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </>
        }
      />

      {/* ---------- Page content ---------- */}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Waiting" value={waiting.length} tone="brand" />
        <Stat label="In queue" value={customers.length} />
        <Stat label="Clears in" value={customers.length ? `~${formatMinutes(clearIn)}` : "–"} />
      </div>

      <div className="mt-5">
        <ServingPanel customer={serving} pending={pending} onSkip={handleSkip} onServe={handleServe} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          to="/live-queue"
          className="flex items-center gap-3 rounded-2xl bg-brand-600 p-4 text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
        >
          <Activity className="size-6" />
          <span>
            <span className="block font-semibold">Open live queue</span>
            <span className="text-sm text-white/80">Serve and skip in order</span>
          </span>
        </Link>
        <Link
          to="/business-qr"
          className="flex items-center gap-3 rounded-2xl bg-white p-4 text-ink shadow-card ring-1 ring-slate-900/5 transition hover:ring-brand-600"
        >
          <QrCode className="size-6 text-brand-600" />
          <span>
            <span className="block font-semibold">Your QR code</span>
            <span className="text-sm text-slate-500">
              Shop code: {shop?.slug ?? session?.shopSlug}
            </span>
          </span>
        </Link>
      </div>

      <Card className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink">Up next</h2>
          <Link to="/live-queue" className="text-sm font-semibold text-brand-600 hover:underline">
            See all
          </Link>
        </div>
        {waiting.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No one is waiting.</p>
        ) : (
          <ol className="mt-2 divide-y divide-slate-100">
            {waiting.slice(0, 3).map((c) => (
              <li key={c.token} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-brand-600">#{c.token}</p>
                  <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                </div>
                <span className="shrink-0 text-sm text-slate-500">{c.service}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="mt-5">
        <h2 className="text-lg font-bold text-ink">Everyone in the queue</h2>
        {customers.length === 0 ? (
          <EmptyState icon={Users} title="The queue is empty" description="Customers who scan your QR code will show up here." />
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {customers.map((c) => (
              <li key={c.token} className="flex items-start gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-brand-600">#{c.token}</p>
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {c.service}, joined {timeAgo(c.joinedAt)}
                  </p>
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="text-sm font-medium text-brand-600 hover:underline">
                      {c.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">No phone number</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={c.status} />
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={Boolean(pending)}
                    onClick={() => setToRemove(c)}
                    aria-label={`Remove #${c.token} ${c.name}`}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Admin only: customers served by each staff member.
          refreshKey changes whenever the queue changes, so the numbers update after each "Served". */}
      {isAdmin && (
        <div className="mt-5">
          <StaffPerformance refreshKey={customers.map((c) => c.token).join(",")} />
        </div>
      )}

      {/* Daily served history */}
      <div className="mt-5">
        <BusinessHistory />
      </div>

      {/* ---------- Dialogs (shown on top of the page when open) ---------- */}

      <ConfirmDialog
        open={Boolean(toRemove)}
        title={toRemove ? `Remove #${toRemove.token} ${toRemove.name}?` : ""}
        description="They'll lose their place in line. This can't be undone."
        confirmLabel="Remove"
        loading={Boolean(toRemove) && pending === `remove:${toRemove.token}`}
        onConfirm={handleRemove}
        onCancel={() => setToRemove(null)}
      />

      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        description="The queue keeps running. Sign in again to manage it."
        confirmLabel="Sign out"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
