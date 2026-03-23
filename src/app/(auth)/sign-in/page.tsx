import { NavShell } from "@/components/nav-shell";

export default function SignInPage() {
  return (
    <NavShell title="Sign In">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Supabase Auth placeholder</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Wire this page to Supabase email or magic-link auth. The environment contract is already
          prepared in `.env.example`.
        </p>
        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              type="email"
              placeholder="you@example.com"
            />
          </label>
          <button
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            type="button"
          >
            Continue
          </button>
        </form>
      </section>
    </NavShell>
  );
}

