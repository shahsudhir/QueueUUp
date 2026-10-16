import { cn } from "../../lib/cn";

export default function Card({ as: Tag = "section", className, children, ...props }) {
  return (
    <Tag className={cn("rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-900/5", className)} {...props}>
      {children}
    </Tag>
  );
}
