"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, SectionCard } from "@/components/app-shell";
import {
  type DuplicateConflictStrategy,
  downloadSnapshotFromCloudAndMerge,
  signOutFromSupabase,
  syncSnapshotToCloud
} from "@/lib/supabase/cloud-sync";
import { useAppStore } from "@/providers/app-store";

export default function SettingsPage() {
  const { actions } = useAppStore();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"sync" | "download" | "signout" | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<DuplicateConflictStrategy>("keep-local");

  async function runSync() {
    setLoadingAction("sync");
    setMessage(null);
    setError(null);

    try {
      const result = await syncSnapshotToCloud();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function runDownloadAndMerge() {
    setLoadingAction("download");
    setMessage(null);
    setError(null);

    try {
      const result = await downloadSnapshotFromCloudAndMerge(conflictStrategy);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      await actions.refreshData();
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download and merge backup.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function runSignOut() {
    setLoadingAction("signout");
    setMessage(null);
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
      setLoadingAction(null);
    }
  }

  return (
    <AppShell title="Settings" eyebrow="Cloud Sync">
      <SectionCard className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--ink)]">Backup</h3>
        <p className="text-sm text-[var(--ink-muted)]">
          Save your local database to cloud backup or download cloud backup and merge into current local data.
        </p>

        <div className="grid grid-cols-1 gap-2">
          <button type="button" className="cta-primary w-full" onClick={runSync} disabled={loadingAction !== null}>
            {loadingAction === "sync" ? "Syncing..." : "Sync to Cloud"}
          </button>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--ink-muted)]">Duplicate strategy on download</span>
            <select
              className="select"
              value={conflictStrategy}
              onChange={(event) => setConflictStrategy(event.target.value as DuplicateConflictStrategy)}
              disabled={loadingAction !== null}
            >
              <option value="keep-local">Keep local (skip cloud duplicates)</option>
              <option value="prefer-cloud">Prefer cloud (replace local duplicate)</option>
              <option value="keep-both">Keep both entries</option>
            </select>
          </label>
          <button type="button" className="cta-secondary w-full" onClick={runDownloadAndMerge} disabled={loadingAction !== null}>
            {loadingAction === "download" ? "Downloading..." : "Download from Cloud"}
          </button>
        </div>

        <div className="border-t border-[var(--line)] pt-3">
          <button type="button" className="cta-secondary w-full" onClick={runSignOut} disabled={loadingAction !== null}>
            {loadingAction === "signout" ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {message ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
