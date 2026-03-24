"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState<"sign-in" | "register" | "google" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/expenses");
      }
    });
  }, [router]);

  async function handleSignIn() {
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoadingAction("sign-in");
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoadingAction(null);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/expenses");
  }

  async function handleRegister() {
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoadingAction("register");
    setError(null);
    setMessage(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    setLoadingAction(null);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
  }

  async function handleGoogleSignIn() {
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoadingAction("google");
    setError(null);
    setMessage(null);

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/expenses` : undefined;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });

    if (oauthError) {
      setLoadingAction(null);
      setError(oauthError.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <section className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-white p-5">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Use your email account to open the app.</p>

        <div className="mt-4 space-y-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--ink-muted)]">Email</span>
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--ink-muted)]">Password</span>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {message ? (
          <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button type="button" className="cta-primary w-full" disabled={loadingAction !== null} onClick={handleGoogleSignIn}>
            {loadingAction === "google" ? "Redirecting to Google..." : "Continue with Google"}
          </button>
          <button type="button" className="cta-primary w-full" disabled={loadingAction !== null} onClick={handleSignIn}>
            {loadingAction === "sign-in" ? "Please wait..." : "Sign in"}
          </button>
          <button type="button" className="cta-secondary w-full" disabled={loadingAction !== null} onClick={handleRegister}>
            {loadingAction === "register" ? "Please wait..." : "Register"}
          </button>
        </div>
      </section>
    </main>
  );
}

