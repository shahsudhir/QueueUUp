import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trophy, UserCheck } from "lucide-react";
import Card from "../ui/Card";
import { useAuth } from "../../context/AuthContext";
import { getStaffStats } from "../../services/queueService";
import { cn } from "../../lib/cn";

// "ROLE_ADMIN" -> "admin"
const roleLabel = (role) => (role ? role.replace("ROLE_", "").toLowerCase() : "");

// Admin only: how many customers each account served, today and in the last 30 days.
// refreshKey: change it to reload (the dashboard passes the queue length, so it updates after each serve).
export default function StaffPerformance({ refreshKey }) {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getStaffStats());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const staff = data?.staff ?? [];
  const topToday = staff.length && staff[0].servedToday > 0 ? staff[0].userId : null;
  const totalToday = staff.reduce((sum, s) => sum + s.servedToday, 0) + (data?.unassignedToday ?? 0);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <UserCheck className="size-5 text-brand-600" />
            Staff performance
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Customers each person marked as served. {data && `${totalToday} served today in total.`}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          aria-label="Refresh staff performance"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="py-6 text-center text-sm text-red-600">{error}</p>
      )}

      {!error && !data && loading && (
        <p role="status" className="py-6 text-center text-sm text-slate-400">Loading…</p>
      )}

      {!error && data && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-3 font-semibold">Staff member</th>
                <th className="py-3 pl-3 text-right font-semibold">Today</th>
                <th className="py-3 text-right font-semibold whitespace-nowrap">30 days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.userId}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">{s.email}</span>
                      {s.email === session?.email && <span className="text-xs text-slate-400">(you)</span>}
                      {s.userId === topToday && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          <Trophy className="size-3" />
                          Top today
                        </span>
                      )}
                    </div>
                    <span className="text-xs capitalize text-slate-500">{roleLabel(s.role)}</span>
                  </td>
                  <td className="py-3 text-right font-display text-lg font-bold tabular-nums text-brand-600">{s.servedToday}</td>
                  <td className="py-3 text-right font-semibold tabular-nums text-ink">{s.servedLast30Days}</td>
                </tr>
              ))}

              {data.unassignedLast30Days > 0 && (
                <tr>
                  <td className="py-3 pr-3">
                    <span className="font-medium text-slate-500">Not recorded</span>
                    <p className="text-xs text-slate-400">Served before tracking started, or by a removed account</p>
                  </td>
                  <td className="py-3 text-right tabular-nums text-slate-500">{data.unassignedToday}</td>
                  <td className="py-3 text-right tabular-nums text-slate-500">{data.unassignedLast30Days}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
