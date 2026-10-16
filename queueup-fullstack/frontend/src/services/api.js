import { getSession, clearSession, SESSION_EXPIRED_EVENT } from "./session";

// The backend's address. Set VITE_API_URL in a .env file to change it (e.g. when deploying).
// An EMPTY value means "same origin" (production behind nginx: /api is proxied to the backend).
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// Public auth endpoints answer 401 for a wrong password; that must not log anyone out.
const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/register-shop",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// Every request to the backend goes through this one function.
export async function apiRequest(path, options = {}) {
  const session = getSession();

  // 1. Headers: always JSON; add the token when someone is signed in
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  // 2. Send the request
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Can't reach the QueueUp server. Is the backend running?");
  }

  const isPublicAuth = PUBLIC_AUTH_PATHS.includes(path);

  // 3. 401: not recognised (no token, expired or invalid): sign out
  if (response.status === 401 && !isPublicAuth) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new Error(session
      ? "Your session has expired. Please sign in again."
      : "Please sign in to your shop to do that.");
  }

  // 4. 403: recognised, but not allowed: stay signed in. Use the server's reason when it gives one
  //    (e.g. "This ticket belongs to someone else."); Spring Security's own 403s have no body.
  if (response.status === 403 && !isPublicAuth) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Your account doesn't have permission to do that.");
  }

  // 5. Any other error: use the backend's message if it sent one
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${response.status})`);
  }

  // 6. Success
  return response.status === 204 ? null : response.json();
}
