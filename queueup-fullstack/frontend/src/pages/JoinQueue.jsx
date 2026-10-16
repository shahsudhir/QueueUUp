import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Ticket } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import QueueInfo from "../components/customer/QueueInfo";
import ServiceCard from "../components/customer/ServiceCard";
import CustomerForm from "../components/customer/CustomerForm";
import { useQueue } from "../context/QueueContext";
import { useToast } from "../context/ToastContext";
import { resolveService } from "../config/business";
import { validateCustomer } from "../lib/validation";

export default function JoinQueue() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { slug } = useParams();
  const base = `/s/${slug}`;
  const { customers, me, join, shop } = useQueue();

  // Service can come from the shop's Home page or a link like /s/abc-barber/join?service=Haircut
  const service = resolveService(location.state?.service ?? params.get("service"));

  const [values, setValues] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateCustomer(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const customer = await join({ name: values.name.trim(), phone: values.phone.trim(), service });
      toast.success(`You're in line at ${shop.name}. Your token is #${customer.token}.`);
      navigate(`${base}/token`, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Couldn't join the queue. Try again.");
      setSubmitting(false);
    }
  }

  if (me) {
    return (
      <>
        <PageHeader title="Join the queue" backTo={base} />
        <EmptyState
          className="mt-8"
          icon={Ticket}
          title="You're already in line"
          description={`Your token is #${me.token}. Leave the queue first if you want a new ticket.`}
          action={<Button onClick={() => navigate(`${base}/token`)}>View my ticket</Button>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Join the queue"
        subtitle={shop.address ? `${shop.name}, ${shop.address}` : shop.name}
        backTo={base}
      />

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5">
        <QueueInfo customers={customers} />
        <ServiceCard service={service} changeTo={base} />
        <CustomerForm values={values} errors={errors} onChange={setValues} />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? "Getting your ticket" : "Get my ticket"}
        </Button>
      </form>
    </>
  );
}
