import { readJSON, writeJSON, removeKey } from "./storage";

// v2: the session now also stores the user's shop.
// Old v1 sessions (no shop) are simply ignored, so users sign in again once.
export const SESSION_KEY = "queueup:session:v2";
export const SESSION_EXPIRED_EVENT = "queueup:session-expired";

// A JWT has three parts separated by dots: header.payload.signature
// The payload is readable JSON. "exp" is the expiry time, in seconds.
function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Save the login / sign-up result from the backend (AuthResponse)
export function saveSession({ token, email, role, shopName, shopSlug }) {
  const session = { token, email, role, shopName, shopSlug, expiresAt: tokenExpiry(token) };
  writeJSON(SESSION_KEY, session);
  return session;
}

// The current session, or null if there's no valid one
export function getSession() {
  const session = readJSON(SESSION_KEY, null);
  if (!session?.token) return null;
  if (session.expiresAt && Date.now() >= session.expiresAt) {
    removeKey(SESSION_KEY);   // expired: forget it
    return null;
  }
  return session;
}

export function clearSession() {
  removeKey(SESSION_KEY);
}
