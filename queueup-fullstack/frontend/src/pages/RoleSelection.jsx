import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, QrCode, Store } from "lucide-react";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { toShopSlug } from "../lib/validation";

export default function RoleSelection() {
  const navigate = useNavigate();
  const { isAuthenticated, session } = useAuth();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(null);

  function openShop(event) {
    event.preventDefault();
    const slug = toShopSlug(code);
    if (!slug) {
      setCodeError("Enter the shop code from the QR poster, for example abc-barber.");
      return;
    }
    navigate(`/s/${slug}`);
  }

  return (
    <main className="relative isolate flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="absolute -right-24 top-0 -z-10 h-[140%] w-40 rotate-12 bg-[repeating-linear-gradient(160deg,var(--color-brand-600)_0_22px,transparent_22px_44px,var(--color-pole)_44px_66px,transparent_66px_88px)] opacity-[0.07]"
      />
      <div className="mx-auto w-full max-w-sm">
        <Logo size="lg" />
        <h1 className="mt-8 text-5xl font-extrabold leading-[1.02] tracking-tight text-ink">
          Wait for your turn, not in the shop.
        </h1>
        <p className="mt-4 text-lg text-slate-600">QueueUp keeps your place in line while you get on with your day.</p>

        {/* ---------- Customers ---------- */}
        <section className="mt-10 rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-900/5" aria-labelledby="customer-heading">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <QrCode className="size-6" />
            </span>
            <div>
              <h2 id="customer-heading" className="font-display text-lg font-bold text-ink">I'm getting a haircut</h2>
              <p className="text-sm text-slate-500">Scan the QR code at the shop, or enter its code.</p>
            </div>
          </div>
          <form onSubmit={openShop} noValidate className="mt-4 flex gap-2">
            <label htmlFor="shop-code" className="sr-only">Shop code</label>
            <input
              id="shop-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError(null);
              }}
              placeholder="e.g. abc-barber"
              autoCapitalize="none"
              autoCorrect="off"
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? "shop-code-error" : undefined}
              className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
            <Button type="submit" size="md" className="h-12" aria-label="Open shop">
              <ArrowRight />
            </Button>
          </form>
          {codeError && (
            <p id="shop-code-error" className="mt-2 text-sm font-medium text-red-600">{codeError}</p>
          )}
        </section>

        {/* ---------- Shop owners ---------- */}
        <section className="mt-3 rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-900/5" aria-labelledby="owner-heading">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Store className="size-6" />
            </span>
            <div>
              <h2 id="owner-heading" className="font-display text-lg font-bold text-ink">I run a shop</h2>
              <p className="text-sm text-slate-500">
                {isAuthenticated ? `Signed in to ${session.shopName}.` : "Manage your queue and your staff."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              variant="primary"
              onClick={() => navigate(isAuthenticated ? "/business-dashboard" : "/business-login")}
            >
              {isAuthenticated ? "Open dashboard" : "Sign in"}
            </Button>
            <Link
              to="/business-signup"
              className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-brand-600 ring-1 ring-inset ring-slate-200 transition hover:bg-brand-50"
            >
              Create your shop
            </Link>
          </div>
        </section>

        <p className="mt-12 text-sm text-slate-400">© {new Date().getFullYear()} QueueUp</p>
      </div>
    </main>
  );
}
