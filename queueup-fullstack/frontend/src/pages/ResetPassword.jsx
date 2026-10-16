import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Link2Off } from "lucide-react";
import Logo from "../components/ui/Logo";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../context/ToastContext";
import { resetPasswordWithToken } from "../services/authService";
import { validateResetPassword } from "../lib/validation";

const EMPTY = { newPassword: "", confirmPassword: "" };

// Step 2 of a password reset: opened from the emailed link /reset-password?token=...
export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const inputType = showPasswords ? "text" : "password";

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateResetPassword(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const result = await resetPasswordWithToken(token, values.newPassword);
      toast.success(result?.message || "Your password has been reset. You can sign in now.");
      navigate("/business-login", { replace: true });
    } catch (err) {
      setErrors({ form: err?.message || "Couldn't reset the password. Try again." });
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-12">
      <div className="mx-auto w-full max-w-sm">
        {!token ? (
          <EmptyState
            icon={Link2Off}
            title="This reset link is incomplete"
            description="Open the link from your email again, or request a new one."
            action={
              <Link to="/forgot-password" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 font-semibold text-white">
                Request a new link
              </Link>
            }
          />
        ) : (
          <>
            <Logo size="lg" />
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Choose a new password</h1>
            <p className="mt-2 text-slate-500">Use at least 6 characters. You'll sign in with it straight after.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-4">
              {errors.form && (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errors.form}{" "}
                  <Link to="/forgot-password" className="underline">Request a new link</Link>
                </div>
              )}
              <Field id="newPassword" type={inputType} label="New password" icon={KeyRound} autoComplete="new-password"
                value={values.newPassword} onChange={update("newPassword")} error={errors.newPassword} />
              <Field id="confirmPassword" type={inputType} label="Confirm new password" icon={KeyRound} autoComplete="new-password"
                value={values.confirmPassword} onChange={update("confirmPassword")} error={errors.confirmPassword} />

              <button type="button" onClick={() => setShowPasswords((s) => !s)}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
                {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showPasswords ? "Hide passwords" : "Show passwords"}
              </button>

              <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-2">
                {submitting ? "Saving" : "Reset password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
