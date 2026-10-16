import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Lock, Mail, MapPin, Store } from "lucide-react";
import Logo from "../components/ui/Logo";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { validateShopSignup } from "../lib/validation";

const EMPTY = { shopName: "", address: "", email: "", password: "", confirmPassword: "" };

// Anyone can create a shop. Whoever creates it becomes its admin.
export default function BusinessSignup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, isAuthenticated } = useAuth();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (and not in the middle of creating a shop): go to the dashboard.
  // The !submitting check lets a brand-new shop go to its QR page instead.
  if (isAuthenticated && !submitting) return <Navigate to="/business-dashboard" replace />;

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateShopSignup(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const session = await register(values);
      toast.success(`${session.shopName} is ready. Your shop code is ${session.shopSlug}.`);
      navigate("/business-qr", { replace: true });
    } catch (err) {
      setErrors({ form: err?.message || "Couldn't create your shop. Try again." });
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
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Create your shop</h1>
        <p className="mt-2 text-slate-500">You'll be the shop's admin, and get your own QR code for customers.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-4">
          {errors.form && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errors.form}
            </p>
          )}

          <Field
            id="shopName"
            label="Shop name"
            icon={Store}
            autoComplete="organization"
            placeholder="e.g. ABC Barber"
            value={values.shopName}
            onChange={update("shopName")}
            error={errors.shopName}
            maxLength={80}
          />
          <Field
            id="address"
            label="Address"
            optional
            icon={MapPin}
            autoComplete="street-address"
            placeholder="e.g. New Road, Kathmandu"
            value={values.address}
            onChange={update("address")}
            error={errors.address}
            maxLength={150}
          />
          <Field
            id="email"
            type="email"
            label="Your email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@yourshop.com"
            value={values.email}
            onChange={update("email")}
            error={errors.email}
            hint="You'll sign in with this."
          />
          <Field
            id="password"
            type="password"
            label="Password"
            icon={Lock}
            autoComplete="new-password"
            value={values.password}
            onChange={update("password")}
            error={errors.password}
            hint="At least 6 characters."
          />
          <Field
            id="confirmPassword"
            type="password"
            label="Confirm password"
            icon={KeyRound}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
          />

          <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-2">
            {submitting ? "Creating your shop" : "Create shop"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have a shop?{" "}
          <Link to="/business-login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
