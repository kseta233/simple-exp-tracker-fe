"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const PUBLIC_PATHS = new Set(["/sign-in"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const isPublic = useMemo(() => PUBLIC_PATHS.has(pathname), [pathname]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading || isPublic) {
      return;
    }

    if (!session) {
      router.replace("/sign-in");
    }
  }, [isPublic, loading, router, session]);

  if (loading && !isPublic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-muted)]">
          Checking your session...
        </div>
      </main>
    );
  }

  if (!isPublic && !session) {
    return null;
  }

  return <>{children}</>;
}
