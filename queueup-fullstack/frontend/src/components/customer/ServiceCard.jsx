import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getService } from "../../config/business";
import Card from "../ui/Card";
import Button from "../ui/Button";

// changeTo: where "Change" goes (the shop's home page, e.g. /s/abc-barber)
export default function ServiceCard({ service, changeTo }) {
  const navigate = useNavigate();
  const details = getService(service);

  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-2xl" aria-hidden="true">
        {details.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">Selected service</p>
        <p className="font-display text-lg font-bold text-ink">{details.name}</p>
        <p className="text-sm text-slate-500">About {details.duration} min</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => navigate(changeTo, { state: { service } })}>
        <Pencil />
        Change
      </Button>
    </Card>
  );
}
