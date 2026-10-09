import { useState, type FormEvent } from "react";
import campusLogo from "../../../assets/campus-logo.png";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-campus-background text-campus-ink">
      <header className="flex items-center gap-3 border-b border-campus-line bg-white px-6 py-5 sm:px-10">
        <img alt="" src={campusLogo} className="h-10 w-10 object-contain" />
        <span className="text-lg font-semibold">CampusHub</span>
        <span className="ml-auto text-xs text-campus-muted">Dashboard</span>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <section aria-labelledby="login-title" className="w-full max-w-[420px] rounded-lg border border-campus-line bg-white p-6 sm:p-8">
        <img alt="" src={campusLogo} className="mb-6 h-14 w-14 object-contain" />
        <h1 id="login-title" className="mb-2 text-2xl font-semibold text-campus-ink">
          Dashboard sign in
        </h1>
        <p className="text-sm leading-6 text-campus-muted">
          Student, vendor and administrator accounts.
        </p>

        <form className="mt-7 grid gap-5" onSubmit={handleSubmit} aria-busy={submitting}>
          <label className="grid gap-2 text-sm font-medium text-campus-ink" htmlFor="login-email">
            Email address
            <input
              id="login-email"
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={submitting}
              className="h-12 rounded-md border border-campus-line bg-white px-3 text-sm font-normal outline-none transition focus:border-campus-ink focus:ring-2 focus:ring-campus-ink/10 disabled:opacity-60"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <div className="grid gap-2 text-sm font-medium text-campus-ink">
            <label htmlFor="login-password">Password</label>
            <div className="relative">
            <input
              id="login-password"
              name="password"
              autoComplete="current-password"
              disabled={submitting}
              className="h-12 w-full rounded-md border border-campus-line bg-white pl-3 pr-20 text-sm font-normal outline-none transition focus:border-campus-ink focus:ring-2 focus:ring-campus-ink/10 disabled:opacity-60"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
            <button className="absolute right-1 top-1 h-10 min-w-16 rounded px-2 text-xs font-medium text-campus-muted hover:text-campus-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-campus-ink" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          {error ? (
            <p
              className="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm leading-5 text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="mt-1 h-12 rounded-md bg-campus-ink px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-ink disabled:cursor-wait disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

      </section>
      </div>
      <footer className="pb-6 text-center text-xs text-campus-muted">CampusHub Community Store</footer>
    </main>
  );
}
