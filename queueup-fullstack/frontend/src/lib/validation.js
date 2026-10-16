// Shared patterns
const PHONE_RE = /^\+?[\d\s-]{7,16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Join queue form (JoinQueue.jsx)
export function validateCustomer({ name, phone }) {
  const errors = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = "Enter your name so the barber can call you.";
  else if (trimmed.length < 2) errors.name = "Name needs at least 2 characters.";
  else if (trimmed.length > 50) errors.name = "Name can be at most 50 characters.";

  if (phone.trim() && !PHONE_RE.test(phone.trim())) {
    errors.phone = "Enter a valid phone number, for example +977 9812345678.";
  }
  return errors;
}

// Business login form (BusinessLogin.jsx)
export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your business email.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That email address doesn't look right.";
  if (!password) errors.password = "Enter your password.";
  else if (password.length < 6) errors.password = "Password needs at least 6 characters.";
  return errors;
}

// Create your shop form (BusinessSignup.jsx)
export function validateShopSignup({ shopName, address, email, password, confirmPassword }) {
  const errors = {};
  if (!shopName.trim()) errors.shopName = "Enter your shop's name.";
  else if (shopName.trim().length > 80) errors.shopName = "Shop name can be at most 80 characters.";
  if (address.trim().length > 150) errors.address = "Address can be at most 150 characters.";

  if (!email.trim()) errors.email = "Enter your email.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That email address doesn't look right.";

  if (!password) errors.password = "Choose a password.";
  else if (password.length < 6) errors.password = "Password needs at least 6 characters.";

  if (!confirmPassword) errors.confirmPassword = "Type the password again.";
  else if (confirmPassword !== password) errors.confirmPassword = "The two passwords don't match.";
  return errors;
}

// Change password form (ChangePassword.jsx)
export function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = "Enter your current password.";

  if (!newPassword) errors.newPassword = "Enter a new password.";
  else if (newPassword.length < 6) errors.newPassword = "New password needs at least 6 characters.";
  else if (newPassword === currentPassword) errors.newPassword = "New password must be different from the current one.";

  if (!confirmPassword) errors.confirmPassword = "Type the new password again.";
  else if (confirmPassword !== newPassword) errors.confirmPassword = "The two new passwords don't match.";

  return errors;
}

// Add an account form (StaffManagement.jsx)
export function validateNewUser({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter an email.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That email address doesn't look right.";
  if (!password) errors.password = "Enter a password.";
  else if (password.length < 6) errors.password = "Password needs at least 6 characters.";
  return errors;
}

// Reset someone's password (StaffManagement.jsx)
export function validateNewPassword(newPassword) {
  if (!newPassword) return "Enter a new password.";
  if (newPassword.length < 6) return "New password needs at least 6 characters.";
  return null;
}

// Turns what a customer types (a code or a pasted link) into a shop slug
export function toShopSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^.*\/s\//, "")   // pasted link: keep what comes after /s/
    .replace(/[/?#].*$/, "");  // drop anything after the slug
}

// Forgot password form (ForgotPassword.jsx)
export function validateForgotPassword({ email }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter the email you sign in with.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That email address doesn't look right.";
  return errors;
}

// Choose a new password from a reset link (ResetPassword.jsx)
export function validateResetPassword({ newPassword, confirmPassword }) {
  const errors = {};
  if (!newPassword) errors.newPassword = "Choose a new password.";
  else if (newPassword.length < 6) errors.newPassword = "Password needs at least 6 characters.";
  if (!confirmPassword) errors.confirmPassword = "Type the new password again.";
  else if (confirmPassword !== newPassword) errors.confirmPassword = "The two passwords don't match.";
  return errors;
}
