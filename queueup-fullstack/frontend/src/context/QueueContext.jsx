import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as queueService from "../services/queueService";
import { readJSON, writeJSON, removeKey } from "../services/storage";
import { getServing, getWaiting } from "../lib/queue";

const QueueContext = createContext(null);
const POLL_MS = 5000;

// "Which ticket is mine" (and its secret key) is remembered per shop on this device
const myTokenKey = (slug) => `queueup:my-token:${slug}`;
const ticketKeyKey = (slug) => `queueup:ticket-key:${slug}`;

/**
 * mode="public" + slug : a customer looking at one shop (from its QR link)
 * mode="business"      : signed-in admin/staff; the backend picks their own shop
 */
export function QueueProvider({ mode, slug, children }) {
  const isPublic = mode === "public";

  const [shop, setShop] = useState(null);
  const [shopError, setShopError] = useState(null);
  const [queue, setQueue] = useState({ customers: [], nextToken: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myToken, setMyTokenState] = useState(() =>
    isPublic ? readJSON(myTokenKey(slug), null) : null
  );

  const setMyToken = useCallback(
    (token) => {
      if (!isPublic) return;
      if (token) writeJSON(myTokenKey(slug), token);
      else {
        removeKey(myTokenKey(slug));
        removeKey(ticketKeyKey(slug));
      }
      setMyTokenState(token);
    },
    [isPublic, slug]
  );

  // Load the shop's details once (name, address, slug)
  useEffect(() => {
    let cancelled = false;
    const load = isPublic ? queueService.getShop(slug) : queueService.getMyShop();
    load
      .then((data) => {
        if (!cancelled) setShop(data);
      })
      .catch((err) => {
        if (!cancelled) setShopError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [isPublic, slug]);

  // Load the queue
  const refresh = useCallback(async () => {
    try {
      const data = isPublic
        ? await queueService.getPublicQueue(slug)
        : await queueService.getBusinessQueue();
      setQueue(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isPublic, slug]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  // Live updates: poll every 5 s while visible, refresh on return, sync "my ticket" across tabs
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh().catch(() => {});
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh().catch(() => {});
    };
    const onStorage = (e) => {
      if (isPublic && e.key === myTokenKey(slug)) setMyTokenState(readJSON(myTokenKey(slug), null));
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh, isPublic, slug]);

  /* ---------- Customer actions ---------- */

  const join = useCallback(
    async (details) => {
      const { queue: next, customer, ticketKey } = await queueService.joinQueue(slug, details);
      writeJSON(ticketKeyKey(slug), ticketKey);
      setQueue(next);
      setMyToken(customer.token);
      return customer;
    },
    [slug, setMyToken]
  );

  const leave = useCallback(async () => {
    if (myToken && queue.customers.some((c) => c.token === myToken)) {
      setQueue(await queueService.leaveQueue(slug, myToken, readJSON(ticketKeyKey(slug), null)));
    }
    setMyToken(null);
  }, [slug, myToken, queue.customers, setMyToken]);

  /* ---------- Business actions ---------- */

  const serve = useCallback(async (token) => setQueue(await queueService.serveCustomer(token)), []);
  const skip = useCallback(async (token) => setQueue(await queueService.skipCustomer(token)), []);
  const remove = useCallback(async (token) => setQueue(await queueService.removeCustomer(token)), []);

  const value = useMemo(() => {
    const { customers } = queue;
    return {
      mode,
      slug: isPublic ? slug : shop?.slug,
      shop,
      shopError,
      customers,
      serving: getServing(customers),
      waiting: getWaiting(customers),
      me: isPublic ? customers.find((c) => c.token === myToken) ?? null : null,
      myToken,
      loading,
      error,
      refresh,
      join,
      leave,
      serve,
      skip,
      remove,
      clearMyToken: () => setMyToken(null),
    };
  }, [mode, isPublic, slug, shop, shopError, queue, myToken, loading, error, refresh, join, leave, serve, skip, remove, setMyToken]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used inside <QueueProvider>");
  return ctx;
}
