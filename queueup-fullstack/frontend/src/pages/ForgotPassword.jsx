import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck, Mail } from "lucide-react";
import Logo from "../components/ui/Logo";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { requestPasswordReset } from "../services/authService";
import { validateForgotPassword } from "../lib/validation";

// Step 1 of a password reset: ask for the account's email.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForgotPassword({ email });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setSentMessage(result?.message || "If that email has an account, we've sent a reset link.");
    } catch (err) {
      setErrors({ form: err?.message || "Couldn't send the reset link. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-12">
      <div className="mx-auto w-full max-w-sm">
        <button
          onClick={() => navigate("/business-login")}
          className="mb-10 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </button>

        <Logo size="lg" />

        {sentMessage ? (
          <>
            <span className="mt-6 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MailCheck className="size-6" />
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">Check your email</h1>
            <p className="mt-2 text-slate-600">{sentMessage}</p>
            <p className="mt-2 text-sm text-slate-500">The link works once and expires in 30 minutes. Check your spam folder too.</p>
            {import.meta.env.DEV && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Running locally without email set up? The reset link is printed in the backend terminal.
              </p>
            )}
            <div className="mt-6 grid gap-2">
              <Button variant="secondary" onClick={() => setSentMessage(null)}>Send another link</Button>
              <Link to="/business-login" className="text-center text-sm font-semibold text-brand-600 hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Forgot your password?</h1>
            <p className="mt-2 text-slate-500">Enter the email you sign in with, and we'll send you a link to choose a new password.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-4">
              {errors.form && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.form}</p>
              )}
              <Field
                id="email"
                type="email"
                label="Email"
                icon={Mail}
                autoComplete="email"
                placeholder="you@yourshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-2">
                {submitting ? "Sending link" : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Staff members can also ask their shop's admin to reset their password.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
