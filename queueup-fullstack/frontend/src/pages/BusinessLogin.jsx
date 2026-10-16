import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Logo from "../components/ui/Logo";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { validateLogin } from "../lib/validation";

export default function BusinessLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/business-dashboard";
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const session = await login(values.email, values.password);
      toast.success(`Signed in to ${session.shopName}.`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors({ form: err?.message || "Couldn't sign in. Check your details and try again." });
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-12">
      <div className="mx-auto w-full max-w-sm">
        <button
          onClick={() => navigate("/")}
          className="mb-10 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <Logo size="lg" />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Sign in to your shop</h1>
        <p className="mt-2 text-slate-500">Owners and staff use the same sign-in.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-4">
          {errors.form && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errors.form}
            </p>
          )}
          <Field
            id="email"
            type="email"
            label="Email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@yourshop.com"
            value={values.email}
            onChange={update("email")}
            error={errors.email}
          />
          <Field
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="At least 6 characters"
            value={values.password}
            onChange={update("password")}
            error={errors.password}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            }
          />
          <div className="-mt-1 flex justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
            {submitting ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to QueueUp?{" "}
          <Link to="/business-signup" className="font-semibold text-brand-600 hover:underline">
            Create your shop
          </Link>
        </p>
      </div>
    </main>
  );
}
