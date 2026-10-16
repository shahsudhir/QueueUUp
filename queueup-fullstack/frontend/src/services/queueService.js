import { apiRequest } from "./api";

/* ---------- Customers (no login): one shop, chosen by its slug ---------- */

const shopPath = (slug) => `/api/public/shops/${encodeURIComponent(slug)}`;

// GET /api/public/shops/{slug} : name, address, slug
export function getShop(slug) {
  return apiRequest(shopPath(slug));
}

// GET /api/public/shops/{slug}/queue
export function getPublicQueue(slug) {
  return apiRequest(`${shopPath(slug)}/queue`);
}

// POST /api/public/shops/{slug}/queue : returns { queue, customer }
export function joinQueue(slug, customer) {
  return apiRequest(`${shopPath(slug)}/queue`, {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

// DELETE /api/public/shops/{slug}/queue/{token} : a customer leaves their OWN ticket.
// The secret ticket key (received when joining) proves it's theirs.
export function leaveQueue(slug, token, ticketKey) {
  return apiRequest(`${shopPath(slug)}/queue/${token}`, {
    method: "DELETE",
    headers: { "X-Ticket-Key": ticketKey ?? "" },
  });
}

/* ---------- Business (admin/staff): the backend uses the signed-in user's shop ---------- */

// GET /api/business/shop
export function getMyShop() {
  return apiRequest("/api/business/shop");
}

// GET /api/business/queue
export function getBusinessQueue() {
  return apiRequest("/api/business/queue");
}

export function serveCustomer(token) {
  return apiRequest(`/api/business/queue/${token}/serve`, { method: "POST" });
}

export function skipCustomer(token) {
  return apiRequest(`/api/business/queue/${token}/skip`, { method: "POST" });
}

export function removeCustomer(token) {
  return apiRequest(`/api/business/queue/${token}`, { method: "DELETE" });
}

// GET /api/business/queue/history : [{ date, count }]
export function getHistory() {
  return apiRequest("/api/business/queue/history");
}

// GET /api/business/stats/staff : served per staff member (admin only)
// { staff: [{ userId, email, role, servedToday, servedLast30Days }], unassignedToday, unassignedLast30Days }
export function getStaffStats() {
  return apiRequest("/api/business/stats/staff");
}
