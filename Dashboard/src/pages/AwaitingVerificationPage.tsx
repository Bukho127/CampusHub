import { useAuth } from "../contexts/AuthContext";

export default function AwaitingVerificationPage() {
  const { user } = useAuth();

  return (
    <section className="mx-auto grid min-h-[calc(100vh-68px)] w-full max-w-[760px] place-items-center px-4 py-10 sm:px-6">
      <article className="w-full rounded-2xl border border-campus-line bg-campus-surface p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-campus-accent-soft text-2xl text-campus-accent">
          …
        </div>

        <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">
          VENDOR APPLICATION
        </p>
        <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-campus-ink">
          Your application is being reviewed
        </h1>
        <p className="mx-auto max-w-[480px] text-sm leading-6 text-campus-muted">
          Hi {user?.displayName}. Your vendor account is awaiting verification.
          We’ll unlock your vendor dashboard after an administrator reviews
          your application.
        </p>

        <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-900">
          <span className="h-2 w-2 rounded-full bg-campus-accent" />
          Verification pending
        </div>
      </article>
    </section>
  );
}