import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Ticket } from "lucide-react";
import IconButton from "../components/ui/IconButton";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ShopImage from "../components/customer/ShopImage";
import QueueInfo from "../components/customer/QueueInfo";
import ServiceSelector from "../components/customer/ServiceSelector";
import { useQueue } from "../context/QueueContext";
import { resolveService } from "../config/business";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const base = `/s/${slug}`;
  const { customers, me, shop } = useQueue();
  const [selectedService, setSelectedService] = useState(() => resolveService(location.state?.service));

  return (
    <>
      <header className="flex items-center justify-between">
        <IconButton label="Back to start" onClick={() => navigate("/")}>
          <ArrowLeft />
        </IconButton>
        <span className="font-display text-xl font-extrabold text-brand-600">QueueUp</span>
        <IconButton label="My ticket" onClick={() => navigate(`${base}/token`)}>
          <Ticket />
        </IconButton>
      </header>

      <Card className="mt-5 overflow-hidden p-0">
        <ShopImage alt={`Inside ${shop.name}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">{shop.name}</h1>
              {shop.address && (
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="size-4 shrink-0" /> {shop.address}
                </p>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Queue open
            </span>
          </div>
          <div className="mt-5">
            <QueueInfo customers={customers} />
          </div>
        </div>
      </Card>

      {me ? (
        <Card className="mt-6 flex items-center gap-4 bg-brand-600 text-white ring-0">
          <div className="flex-1">
            <p className="text-sm text-white/80">You're already in line</p>
            <p className="font-display text-2xl font-bold">Token #{me.token}</p>
          </div>
          <Link
            to={`${base}/token`}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            View ticket
          </Link>
        </Card>
      ) : (
        <>
          <section className="mt-8" aria-labelledby="services-heading">
            <h2 id="services-heading" className="text-xl font-bold text-ink">Pick a service</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">It helps us estimate your wait more accurately.</p>
            <ServiceSelector value={selectedService} onChange={setSelectedService} />
          </section>

          <div className="mt-6">
            <Button
              size="lg"
              fullWidth
              onClick={() => navigate(`${base}/join`, { state: { service: selectedService } })}
            >
              Join the queue
            </Button>
            <p className="mt-3 text-center text-sm text-slate-500">No app to install. You'll get a digital ticket.</p>
          </div>
        </>
      )}
    </>
  );
}
