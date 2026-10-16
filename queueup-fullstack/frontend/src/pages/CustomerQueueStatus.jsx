import { useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import QueueTimeline from "../components/customer/QueueTimeline";
import { useQueue } from "../context/QueueContext";
import { peopleAhead } from "../lib/queue";

export default function CustomerQueueStatus() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const base = `/s/${slug}`;
  const { customers, serving, waiting, me, loading, shop } = useQueue();

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title="Live queue" subtitle={`${shop.name} · updates automatically`} backTo={base} />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Serving" value={serving ? `#${serving.token}` : "None"} tone="brand" />
        <Stat label="Your token" value={me ? `#${me.token}` : "None"} />
        <Stat label="Ahead" value={me ? peopleAhead(customers, me.token) : "–"} tone="brand" />
      </div>

      <Card className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink">Who's in line</h2>
          <span className="text-sm text-slate-500">{customers.length} total</span>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nobody's waiting"
            description="Join now and you'll be called straight away."
            action={<Button onClick={() => navigate(base)}>Join the queue</Button>}
          />
        ) : (
          <QueueTimeline customers={customers} serving={serving} waiting={waiting} myToken={me?.token} />
        )}
      </Card>

      {!me && customers.length > 0 && (
        <Button className="mt-5" size="lg" fullWidth onClick={() => navigate(base)}>
          Join the queue
        </Button>
      )}
    </>
  );
}
