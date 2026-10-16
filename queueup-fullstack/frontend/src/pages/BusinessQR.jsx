import { useRef } from "react";
import { Link } from "react-router-dom";
import { Copy, Download, ExternalLink, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageLoader from "../components/ui/PageLoader";
import { useQueue } from "../context/QueueContext";
import { useToast } from "../context/ToastContext";

// The signed-in shop's own QR code: print it and put it at the door.
export default function BusinessQR() {
  const toast = useToast();
  const { shop, shopError } = useQueue();
  const qrRef = useRef(null);

  if (shopError) {
    return <p role="alert" className="mt-10 text-center text-red-600">{shopError.message}</p>;
  }
  if (!shop) return <PageLoader />;

  const customerPath = `/s/${shop.slug}`;
  const joinUrl = `${window.location.origin}${customerPath}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `queueup-${shop.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Your QR code"
        subtitle="Print it and put it at the door. Customers scan it to join your queue."
        backTo="/business-dashboard"
      />

      <Card className="mt-6 text-center">
        <p className="text-sm font-medium text-slate-500">Scan to join the queue at</p>
        <h2 className="mt-1 text-2xl font-extrabold text-ink">{shop.name}</h2>

        <div ref={qrRef} className="mx-auto mt-5 w-fit rounded-3xl bg-white p-4 ring-2 ring-brand-100">
          <QRCodeSVG value={joinUrl} size={240} level="M" fgColor="#17153b" title={`Join the queue at ${shop.name}`} />
        </div>

        <p className="mt-4 break-all text-sm text-slate-500">{joinUrl}</p>
        <p className="mt-1 text-sm text-slate-500">
          Shop code: <span className="font-semibold text-ink">{shop.slug}</span>
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Button variant="secondary" onClick={downloadQr}>
            <Download />
            Download
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
          <Button variant="secondary" onClick={copyLink}>
            <Copy />
            Copy link
          </Button>
        </div>

        <Link
          to={customerPath}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
        >
          <ExternalLink className="size-4" />
          Open the customer page
        </Link>
      </Card>

      <Card className="mt-5">
        <h2 className="font-bold text-ink">How customers use it</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>They scan the code with their phone camera.</li>
          <li>Your shop's page opens: they pick a service and join.</li>
          <li>They wait anywhere; their ticket updates live and turns green on their turn.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-500">
          No camera? They can enter the shop code <span className="font-semibold text-ink">{shop.slug}</span> on the QueueUp start page.
        </p>
      </Card>
    </>
  );
}
