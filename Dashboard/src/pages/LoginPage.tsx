import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-campus-background px-4 py-8">
      <section className="w-full max-w-[420px] rounded-2xl border border-campus-line bg-campus-surface p-7 shadow-xl shadow-campus-ink/5 sm:p-9">
        <div className="mb-6 grid h-10 w-10 place-items-center rounded-[13px] bg-campus-accent text-xl font-extrabold text-white">
          C
        </div>

        <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">
          COMMUNITY STORE
        </p>
        <h1 className="mb-2 text-[27px] font-extrabold tracking-tight text-campus-ink">
          Welcome back
        </h1>
        <p className="text-[13px] leading-6 text-campus-muted">
          Sign in with your student, admin or vendor account.
        </p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-xs font-bold text-campus-ink">
            Email address
            <input
              autoComplete="email"
              className="h-11 rounded-lg border border-campus-line bg-white px-3 text-[13px] font-normal outline-none transition focus:border-campus-accent focus:ring-4 focus:ring-campus-accent/10"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="grid gap-2 text-xs font-bold text-campus-ink">
            Password
            <input
              autoComplete="current-password"
              className="h-11 rounded-lg border border-campus-line bg-white px-3 text-[13px] font-normal outline-none transition focus:border-campus-accent focus:ring-4 focus:ring-campus-accent/10"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? (
            <p
              className="m-0 rounded-lg bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="mt-1 min-h-11 rounded-lg bg-campus-accent px-4 text-xs font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-70"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 border-t border-campus-line pt-4 text-center text-[11px] text-campus-muted">
          Use the same credentials as your CampusHub mobile account.
        </p>
      </section>
    </main>
  );
}
