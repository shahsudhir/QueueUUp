import { useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import ServingPanel from "../components/business/ServingPanel";
import QueueCustomer from "../components/business/QueueCustomer";
import { useQueue } from "../context/QueueContext";
import { useQueueAction } from "../hooks/useQueueAction";
import { minutesUntilTurn } from "../lib/queue";
import { cn } from "../lib/cn";

export default function LiveQueue() {
  const { customers, serving, waiting, loading, refresh, serve, skip } = useQueue();
  const { pending, run } = useQueueAction();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  }

  const handleSkip = (c) => run(`skip:${c.token}`, () => skip(c.token), `#${c.token} moved to the back of the line.`);
  const handleServe = (c) => run(`serve:${c.token}`, () => serve(c.token), `#${c.token} marked as served.`);

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Live queue"
        subtitle="See who's waiting and who's up next"
        actions={
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn(refreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="mt-6">
        <ServingPanel customer={serving} pending={pending} onSkip={handleSkip} onServe={handleServe} />
      </div>

      <section className="mt-8" aria-labelledby="up-next-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="up-next-heading" className="text-xl font-bold text-ink">Up next</h2>
          <span className="text-sm text-slate-500">
            {waiting.length} {waiting.length === 1 ? "person" : "people"} waiting
          </span>
        </div>

        {waiting.length === 0 ? (
          <Card className="mt-3">
            <EmptyState
              icon={Users}
              title="No one is waiting"
              description="Share your QR code so customers can join from their phones."
            />
          </Card>
        ) : (
          <ol className="mt-3 grid gap-3">
            {waiting.map((customer, index) => (
              <QueueCustomer
                key={customer.token}
                customer={customer}
                position={index + 1}
                waitMinutes={minutesUntilTurn(customers, customer.token)}
                pending={pending}
                onSkip={handleSkip}
                onServe={handleServe}
              />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
