import { apiRequest } from "./api";
import { saveSession, getSession, clearSession, SESSION_KEY } from "./session";

// Re-exported so AuthContext's imports keep working
export { getSession, SESSION_KEY };

// The backend's AuthResponse: { token, tokenType, email, role, shopName, shopSlug }
function storeAuthResponse(data) {
  return saveSession({
    token: data.token,
    email: data.email,
    role: data.role,
    shopName: data.shopName,
    shopSlug: data.shopSlug,
  });
}

// POST /api/auth/login
export async function loginBusiness(email, password) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  });
  return storeAuthResponse(data);
}

// POST /api/auth/register-shop : creates the shop + its admin, and signs them in
export async function registerShop({ shopName, address, email, password }) {
  const data = await apiRequest("/api/auth/register-shop", {
    method: "POST",
    body: JSON.stringify({
      shopName: shopName.trim(),
      address: address.trim(),
      email: email.trim(),
      password,
    }),
  });
  return storeAuthResponse(data);
}

// POST /api/auth/change-password (signed-in user)
export async function changePassword(currentPassword, newPassword) {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function isBusinessLoggedIn() {
  return Boolean(getSession());
}

export async function logoutBusiness() {
  clearSession();
}

// POST /api/auth/forgot-password : the answer is the same whether or not the email exists
export async function requestPasswordReset(email) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

// POST /api/auth/reset-password : token comes from the emailed link (?token=...)
export async function resetPasswordWithToken(token, newPassword) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
