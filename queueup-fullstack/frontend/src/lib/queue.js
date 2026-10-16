import { getServiceDuration } from "../config/business";

export const getServing = (customers) =>
  customers.find((c) => c.status === "serving") ?? null;

export const getWaiting = (customers) =>
  customers.filter((c) => c.status === "waiting");

// If nobody is being served, the first waiting customer is promoted.
export function promoteNext(customers) {
  if (customers.some((c) => c.status === "serving")) return customers;
  const firstWaiting = customers.findIndex((c) => c.status === "waiting");
  if (firstWaiting === -1) return customers;
  return customers.map((c, i) => (i === firstWaiting ? { ...c, status: "serving" } : c));
}

// People in front of `token`. Without a token: everyone currently in the queue.
export function peopleAhead(customers, token) {
  const serving = getServing(customers);
  if (serving && serving.token === token) return 0;
  const waiting = getWaiting(customers);
  const index = token ? waiting.findIndex((c) => c.token === token) : -1;
  const waitingAhead = index === -1 ? waiting.length : index;
  return waitingAhead + (serving ? 1 : 0);
}

// Minutes until `token` is called. Without a token: wait for someone joining now.
export function minutesUntilTurn(customers, token) {
  const serving = getServing(customers);
  if (serving && serving.token === token) return 0;
  const waiting = getWaiting(customers);
  const index = token ? waiting.findIndex((c) => c.token === token) : -1;
  const ahead = index === -1 ? waiting : waiting.slice(0, index);
  const servingTime = serving ? getServiceDuration(serving.service) : 0;
  return ahead.reduce((total, c) => total + getServiceDuration(c.service), servingTime);
}

// 0–100 progress for the ticket bar, based on position when the customer joined.
export function ticketProgress(customer, ahead) {
  if (!customer) return 0;
  if (customer.status === "serving") return 100;
  const start = Math.max(customer.positionAtJoin ?? ahead, ahead, 1);
  return Math.round(8 + ((start - ahead) / start) * 84);
}

export function formatMinutes(minutes) {
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const mins = Math.round((Date.now() - timestamp) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
