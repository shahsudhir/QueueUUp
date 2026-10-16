import { useCallback, useEffect, useRef, useState } from "react";

const supported = () => typeof window !== "undefined" && "Notification" in window;

/**
 * Vibrates and shows a system notification when the customer is next / being served.
 * Works while the page is open (any tab). Background push needs a server + service worker.
 */
export function useTurnAlerts(me, ahead, shopName = "QueueUp") {
  const [permission, setPermission] = useState(() =>
    supported() ? Notification.permission : "unsupported"
  );
  const lastAlert = useRef(null);

  const requestPermission = useCallback(async () => {
    if (!supported()) return;
    setPermission(await Notification.requestPermission());
  }, []);

  useEffect(() => {
    if (!me) return;
    const stage = me.status === "serving" ? "now" : ahead === 1 ? "next" : null;
    const key = stage && `${me.token}:${stage}`;
    if (!key || lastAlert.current === key) return;
    lastAlert.current = key;

    const body =
      stage === "now"
        ? "It's your turn. Please go to the counter."
        : "You're next. Start heading back to the shop.";

    navigator.vibrate?.([200, 100, 200]);
    if (permission === "granted" && document.visibilityState !== "visible") {
      try {
        new Notification(`${shopName}: token #${me.token}`, { body, tag: "queueup-turn" });
      } catch {
        /* some mobile browsers only allow notifications via a service worker */
      }
    }
  }, [me, ahead, permission, shopName]);

  return { permission, requestPermission };
}
