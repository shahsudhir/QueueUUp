import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-8xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">This page doesn't exist</h1>
        <p className="mt-2 text-slate-500">Check the link, or start again from the home page.</p>
        <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-xl bg-brand-600 px-6 font-semibold text-white">
          Go to start
        </Link>
      </div>
    </main>
  );
}
