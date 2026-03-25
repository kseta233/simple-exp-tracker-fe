"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, SectionCard } from "@/components/app-shell";
import { signOutFromSupabase } from "@/lib/supabase/cloud-sync";
import { supabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("Signed-in user");
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      if (!supabase) {
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!mounted) {
        return;
      }

      setUserEmail(data.user?.email ?? "Signed-in user");
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function runSignOut() {
    setSigningOut(true);
    setError(null);

    try {
      const result = await signOutFromSupabase();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.replace("/sign-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <AppShell title="Settings" eyebrow="Account">
      <SectionCard className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">User</p>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <p className="text-sm text-[var(--ink-muted)]">Signed in as</p>
          <p className="mt-1 text-base font-semibold text-[var(--ink)]">{userEmail}</p>
        </div>
      </SectionCard>

      <SectionCard className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Menu</p>
        <div className="grid grid-cols-1 gap-2">
          <Link href="/settings/cloud-sync" className="cta-secondary w-full text-center">
            Cloud Sync
          </Link>
          <Link href="/categories" className="cta-secondary w-full text-center">
            Category Setting
          </Link>
          <button type="button" className="cta-danger w-full" onClick={runSignOut} disabled={signingOut}>
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </SectionCard>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </AppShell>
  );
}
