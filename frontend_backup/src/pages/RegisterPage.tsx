import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../features/auth/AuthContext";
import { useAuth } from "../features/auth/useAuth";

function readRedirect(search: string) {
  const redirect = new URLSearchParams(search).get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/";
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate(readRedirect(location.search), { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to create your account right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-quantix.bg px-4 py-10 text-quantix.text">
      <div className="glass-card w-full max-w-2xl rounded-3xl border border-quantix.border/70 p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.24em] text-quantix.primary">Create account</p>
        <h1 className="mt-3 font-heading text-4xl">Start your CryptoSage workspace.</h1>
        <p className="mt-3 text-sm leading-6 text-quantix.muted">
          Your account gives you one place to track holdings, explore DeFi protocols, and ask educational
          questions without juggling multiple tools.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-quantix.muted">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-quantix.border bg-quantix.card/70 px-4 py-3 text-sm text-quantix.text"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-quantix.muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-quantix.border bg-quantix.card/70 px-4 py-3 text-sm text-quantix.text"
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
              className="w-full rounded-xl border border-quantix.border bg-quantix.card/70 px-4 py-3 text-sm text-quantix.text"
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-quantix.muted">
          Already have an account?{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(readRedirect(location.search))}`}
            className="text-quantix.primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
