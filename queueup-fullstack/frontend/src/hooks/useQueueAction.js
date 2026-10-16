import { useCallback, useState } from "react";
import { useToast } from "../context/ToastContext";

/** Runs a queue action with a pending key, success toast and error toast. */
export function useQueueAction() {
  const toast = useToast();
  const [pending, setPending] = useState(null);

  const run = useCallback(
    async (key, action, successMessage) => {
      setPending(key);
      try {
        await action();
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (err) {
        toast.error(err?.message || "That didn't work. Check your connection and try again.");
        return false;
      } finally {
        setPending(null);
      }
    },
    [toast]
  );

  return { pending, run };
}
