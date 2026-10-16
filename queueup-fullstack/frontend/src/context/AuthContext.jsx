import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, loginBusiness, logoutBusiness, registerShop, SESSION_KEY } from "../services/authService";
import { SESSION_EXPIRED_EVENT } from "../services/session";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(() => getSession());

  const login = useCallback(async (email, password) => {
    const next = await loginBusiness(email, password);
    setSession(next);
    return next;
  }, []);

  // Create a shop: the new owner is signed in straight away
  const register = useCallback(async (details) => {
    const next = await registerShop(details);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await logoutBusiness();
    setSession(null);
  }, []);

  // 1. Keep sign-in state in sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_KEY) setSession(getSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 2. The server refused our token (api.js sends this event): log out in this tab
  useEffect(() => {
    const onExpired = () => setSession(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // 3. The token expired while the page was just sitting open: check every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setSession((current) => {
        if (current && !getSession()) {
          toast.info("Your session has expired. Please sign in again.");
          return null;
        }
        return current;
      });
    }, 30000);
    return () => clearInterval(id);
  }, [toast]);

  const value = useMemo(
    () => ({ session, isAuthenticated: Boolean(session), login, register, logout }),
    [session, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
