import { useCallback, useEffect, useState } from "react";
import { Calendar, Users, RefreshCw } from "lucide-react";
import Card from "../ui/Card";
import { getHistory } from "../../services/queueService";
import { cn } from "../../lib/cn";

export default function BusinessHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/business/queue/history : my shop only, last 30 days
      const data = await getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "इतिहास लोड गर्न सकिएन।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const firstLoad = loading && history.length === 0;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Calendar className="size-5 text-brand-600" />
            Daily Served History
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">दैनिक सेवा पाएका ग्राहकहरूको विवरण (पछिल्लो ३० दिन)</p>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {firstLoad && (
        <div className="py-8 text-center text-sm text-slate-400" role="status">
          लोड हुँदैछ...
        </div>
      )}

      {error && (
        <div className="py-6 text-center text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {!firstLoad && !error && history.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          अहिलेसम्म कुनै पनि सम्पन्न (Completed) ग्राहकको रेकर्ड भेटिएन।
        </div>
      )}

      {!error && history.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 font-semibold">Date (मिति)</th>
                <th className="py-3 text-right font-semibold">Customers Served</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50/50">
                  <td className="py-3.5 font-medium text-slate-800">{row.date || "N/A"}</td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      <Users className="size-3" />
                      {row.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
