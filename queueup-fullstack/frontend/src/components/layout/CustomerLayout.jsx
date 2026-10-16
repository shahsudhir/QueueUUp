import { Link, Outlet, useParams } from "react-router-dom";
import { Store } from "lucide-react";
import BottomNav from "./BottomNav";
import EmptyState from "../ui/EmptyState";
import PageLoader from "../ui/PageLoader";
import { QueueProvider, useQueue } from "../../context/QueueContext";

// Every customer page lives under /s/:slug. The slug picks the shop.
export default function CustomerLayout() {
  const { slug } = useParams();
  // key={slug}: switching to another shop starts a fresh provider (fresh queue, fresh "my ticket")
  return (
    <QueueProvider key={slug} mode="public" slug={slug}>
      <CustomerShell slug={slug} />
    </QueueProvider>
  );
}

function CustomerShell({ slug }) {
  const { shop, shopError } = useQueue();

  if (shopError) {
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-4">
        <EmptyState
          icon={Store}
          title="We couldn't open this shop"
          description={`${shopError.message} Check the QR code or the shop code "${slug}".`}
          action={
            <Link to="/" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 font-semibold text-white">
              Go to start
            </Link>
          }
        />
      </main>
    );
  }

  if (!shop) return <PageLoader />;

  return (
    <>
      <main className="mx-auto w-full max-w-md px-4 pb-36 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav role="customer" slug={slug} />
    </>
  );
}
