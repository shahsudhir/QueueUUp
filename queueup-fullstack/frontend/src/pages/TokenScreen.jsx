import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, BellRing, CircleCheck, ListOrdered, LogOut, Ticket } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TicketCard from "../components/customer/TicketCard";
import { useQueue } from "../context/QueueContext";
import { useToast } from "../context/ToastContext";
import { useTurnAlerts } from "../hooks/useTurnAlerts";
import { formatMinutes, minutesUntilTurn, peopleAhead, ticketProgress } from "../lib/queue";

export default function TokenScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { slug } = useParams();
  const base = `/s/${slug}`;
  const { customers, serving, me, myToken, loading, leave, clearMyToken, shop } = useQueue();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const ahead = me ? peopleAhead(customers, me.token) : 0;
  const { permission, requestPermission } = useTurnAlerts(me, ahead, shop?.name);

  if (loading) return <PageLoader />;

  // Had a ticket, but it's gone: served or removed by the shop.
  if (!me && myToken) {
    return (
      <EmptyState
        className="mt-12"
        icon={CircleCheck}
        title="Your visit is complete"
        description={`Token #${myToken} is no longer in the queue at ${shop.name}. Thanks for visiting!`}
        action={
          <Button
            onClick={() => {
              clearMyToken();
              navigate(base);
            }}
          >
            Join again
          </Button>
        }
      />
    );
  }

  if (!me) {
    return (
      <EmptyState
        className="mt-12"
        icon={Ticket}
        title="You don't have a ticket yet"
        description={`Join the queue at ${shop.name} and your ticket will appear here.`}
        action={<Button onClick={() => navigate(base)}>Join the queue</Button>}
      />
    );
  }

  const isYourTurn = me.status === "serving";
  const wait = minutesUntilTurn(customers, me.token);

  async function handleLeave() {
    setLeaving(true);
    try {
      await leave();
      toast.info("You left the queue.");
      navigate(base, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Couldn't leave the queue. Try again.");
      setLeaving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <h1 className="sr-only">Your ticket</h1>

      {isYourTurn && (
        <div role="alert" className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 ring-1 ring-emerald-200">
          It's your turn. Please go to the counter.
        </div>
      )}

      <TicketCard customer={me} progress={ticketProgress(me, ahead)} isYourTurn={isYourTurn} shopName={shop.name} />

      <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-3xl bg-white py-4 shadow-card ring-1 ring-slate-900/5">
        {[
          ["Now serving", serving ? `#${serving.token}` : "None"],
          ["Ahead of you", ahead],
          ["Your wait", isYourTurn ? "Now" : `~${formatMinutes(wait)}`],
        ].map(([label, value]) => (
          <div key={label} className="px-2 text-center">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-1 whitespace-nowrap font-display text-xl font-bold tabular-nums text-ink sm:text-2xl">{value}</dd>
          </div>
        ))}
      </dl>

      <Card className="mt-5 flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          {permission === "granted" ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        </span>
        <div className="flex-1">
          <h2 className="font-bold text-ink">Feel free to step away</h2>
          <p className="mt-1 text-sm text-slate-500">
            {permission === "granted"
              ? "Alerts are on. Keep this page open in a tab and we'll buzz you when you're next."
              : "Turn on alerts and we'll notify you when you're next. Keep this page open in a tab."}
          </p>
          {permission === "default" && (
            <Button variant="ghost" size="sm" className="-ml-3 mt-2" onClick={requestPermission}>
              Turn on alerts
            </Button>
          )}
          {permission === "denied" && (
            <p className="mt-2 text-sm text-slate-500">Alerts are blocked. Allow them in your browser settings.</p>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-3">
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(`${base}/queue`)}>
          <ListOrdered />
          See the full queue
        </Button>
        <Button variant="danger" size="lg" fullWidth onClick={() => setConfirmOpen(true)}>
          <LogOut />
          Leave queue
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Leave the queue?"
        description={`You'll lose token #${me.token}. If you join again, you'll go to the back of the line.`}
        confirmLabel="Leave queue"
        cancelLabel="Stay in line"
        loading={leaving}
        onConfirm={handleLeave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
