import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../features/auth/AuthContext";
import { useAuth } from "../features/auth/useAuth";

function readRedirect(search: string) {
  const redirect = new URLSearchParams(search).get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={readRedirect(location.search)} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(readRedirect(location.search), { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to sign in right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-quantix.bg px-4 py-10 text-quantix.text">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-card rounded-3xl border border-quantix.border/70 p-8 md:p-10">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.28em] text-quantix.primary">CryptoSage</p>
            <h1 className="mt-3 font-heading text-4xl">A calmer way to learn crypto.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-quantix.muted">
              Sign in to track your holdings, explore live market and DeFi data, and ask the assistant for
              grounded educational guidance.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-quantix.muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-quantix.border bg-quantix.card/70 px-4 py-3 text-sm text-quantix.text outline-none ring-0 placeholder:text-quantix.muted"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-quantix.muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-quantix.border bg-quantix.card/70 px-4 py-3 text-sm text-quantix.text outline-none ring-0 placeholder:text-quantix.muted"
                placeholder="At least 8 characters"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-quantix.primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>

        <aside className="glass-card rounded-3xl border border-quantix.border/70 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-quantix.muted">What you get</p>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-quantix.muted">
            <li>Live top-coin market data and searchable tables.</li>
            <li>DeFi protocol dashboards with TVL and risk context.</li>
            <li>Portfolio tracking with real-time P&amp;L.</li>
            <li>AI answers with warnings, sources, and telemetry.</li>
          </ul>

          <div className="mt-8 rounded-2xl border border-quantix.border/70 bg-quantix.card/60 p-5 text-sm">
            <div className="font-heading text-lg text-quantix.text">Need an account?</div>
            <p className="mt-2 text-quantix.muted">
              Create one in a few seconds and we’ll drop you straight back into the page you were trying to visit.
            </p>
            <Link
              to={`/register?redirect=${encodeURIComponent(readRedirect(location.search))}`}
              className="mt-4 inline-flex rounded-lg border border-quantix.border px-4 py-2 text-sm text-quantix.text hover:bg-quantix.surface/70"
            >
              Create account
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
