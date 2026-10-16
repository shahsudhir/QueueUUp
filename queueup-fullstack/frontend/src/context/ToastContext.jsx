import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const ToastContext = createContext(null);
let nextId = 0;

const ICONS = {
  success: <CircleCheck className="size-5 shrink-0 text-emerald-400" />,
  error: <CircleAlert className="size-5 shrink-0 text-red-400" />,
  info: <Info className="size-5 shrink-0 text-brand-300" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = "info") => {
      const id = ++nextId;
      setToasts((list) => [...list.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      show,
      success: (m) => show(m, "success"),
      error: (m) => show(m, "error"),
      info: (m) => show(m, "info"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl"
          >
            {ICONS[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 text-white/60 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
