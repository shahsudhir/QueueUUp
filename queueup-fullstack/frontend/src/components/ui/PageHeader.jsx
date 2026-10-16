import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import IconButton from "./IconButton";

export default function PageHeader({ title, subtitle, backTo, actions }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-3">
      {backTo && (
        <IconButton label="Go back" onClick={() => navigate(backTo)}>
          <ArrowLeft />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
