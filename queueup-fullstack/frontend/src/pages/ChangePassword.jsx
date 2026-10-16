import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { changePassword } from "../services/authService";
import { validateChangePassword } from "../lib/validation";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const inputType = showPasswords ? "text" : "password";

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateChangePassword(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const result = await changePassword(values.currentPassword, values.newPassword);
      // Changing the password signs this account out on every device (old tokens are revoked)
      await logout();
      toast.success(result?.message || "Password changed. Please sign in again.");
      navigate("/business-login", { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Change password" subtitle="You'll be signed out on every device and sign in again." backTo="/business-dashboard" />

      <Card className="mt-6 max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          {errors.form && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errors.form}
            </p>
          )}
          <Field id="currentPassword" type={inputType} label="Current password" icon={Lock} autoComplete="current-password"
            value={values.currentPassword} onChange={update("currentPassword")} error={errors.currentPassword} />
          <Field id="newPassword" type={inputType} label="New password" icon={KeyRound} autoComplete="new-password"
            value={values.newPassword} onChange={update("newPassword")} error={errors.newPassword}
            hint="At least 6 characters, different from your current password." />
          <Field id="confirmPassword" type={inputType} label="Confirm new password" icon={KeyRound} autoComplete="new-password"
            value={values.confirmPassword} onChange={update("confirmPassword")} error={errors.confirmPassword} />

          <button type="button" onClick={() => setShowPasswords((s) => !s)}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
            {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => navigate("/business-dashboard")} disabled={submitting}>Cancel</Button>
            <Button type="submit" loading={submitting}>{submitting ? "Saving" : "Change password"}</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
