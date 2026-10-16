import { apiRequest } from "./api";

// Admin only. The admin's token is attached automatically by apiRequest,
// and the backend limits everything to the admin's own shop.

export function listUsers() {
  return apiRequest("/api/users");
}

export function createUser({ email, password, role }) {
  return apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password, role }),
  });
}

export function resetUserPassword(id, newPassword) {
  return apiRequest(`/api/users/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ newPassword }),
  });
}

export function deleteUser(id) {
  return apiRequest(`/api/users/${id}`, { method: "DELETE" });
}
