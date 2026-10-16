import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useQueue } from "../context/QueueContext";
import { useToast } from "../context/ToastContext";

// Customer view: share this shop's queue with a friend standing next to you.
export default function QRJoinQueue() {
  const navigate = useNavigate();
  const toast = useToast();
  const { slug } = useParams();
  const base = `/s/${slug}`;
  const { waiting, shop } = useQueue();
  const qrRef = useRef(null);
  const joinUrl = `${window.location.origin}${base}`;
  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }

  async function shareLink() {
    try {
      await navigator.share({ title: `Join the queue at ${shop.name}`, url: joinUrl });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <PageHeader title="Scan to join" subtitle="Point a phone camera at the code" backTo={base} />

      <Card className="mt-6 text-center">
        <h2 className="text-xl font-bold text-ink">{shop.name}</h2>
        <div ref={qrRef} className="mx-auto mt-5 w-fit rounded-3xl bg-white p-4 ring-2 ring-brand-100">
          <QRCodeSVG value={joinUrl} size={220} level="M" fgColor="#17153b" title={`Join the queue at ${shop.name}`} />
        </div>
        <p className="mt-4 break-all text-sm text-slate-500">{joinUrl}</p>
        <p className="mt-1 text-sm text-slate-500">
          Shop code: <span className="font-semibold text-ink">{slug}</span>
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={copyLink}>
            <Copy />
            Copy link
          </Button>
          {canShare && (
            <Button variant="secondary" size="sm" onClick={shareLink}>
              <Share2 />
              Share
            </Button>
          )}
        </div>

        <Button className="mt-6" size="lg" fullWidth onClick={() => navigate(`${base}/join`)}>
          Join on this phone
        </Button>
      </Card>

      <Card className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-ink">Live queue</h2>
          <p className="text-sm text-slate-500">
            {waiting.length} {waiting.length === 1 ? "person" : "people"} waiting right now
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`${base}/queue`)}>
          View queue
        </Button>
      </Card>
    </>
  );
}
