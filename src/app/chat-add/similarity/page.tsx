"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { useAppStore } from "@/providers/app-store";

function ComparisonCard({
  title,
  merchant,
  amount,
  dateTrx,
  label
}: {
  title: string;
  merchant: string;
  amount: number | null;
  dateTrx: string;
  label: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</p>
      <div className="mt-3 space-y-3">
        <div>
          <p className="text-xs text-[var(--ink-muted)]">Title</p>
          <p className="text-sm font-semibold text-[var(--ink)]">{title || "Untitled"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--ink-muted)]">Merchant</p>
          <p className="text-sm font-semibold text-[var(--ink)]">{merchant || "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--ink-muted)]">Amount</p>
          <p className="text-sm font-semibold text-[var(--ink)]">{formatCurrency(amount ?? 0)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--ink-muted)]">Date</p>
          <p className="text-sm font-semibold text-[var(--ink)]">{dateTrx}</p>
        </div>
      </div>
    </article>
  );
}

export default function SimilarityReviewPage() {
  const { state, actions } = useAppStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveBothDraftIds, setSaveBothDraftIds] = useState<string[]>([]);

  const conflicts = useMemo(() => actions.getSimilarityConflicts(), [actions, state.draftTransactions, state.transactions]);

  const selectedDraftIds = useMemo(() => {
    const conflictedDraftIds = new Set(conflicts.map((conflict) => conflict.draft.id));
    const nonConflictingDraftIds = state.draftTransactions
      .filter((draft) => !conflictedDraftIds.has(draft.id))
      .map((draft) => draft.id);

    return [...nonConflictingDraftIds, ...saveBothDraftIds];
  }, [conflicts, saveBothDraftIds, state.draftTransactions]);

  useEffect(() => {
    if (state.draftTransactions.length === 0 || conflicts.length === 0) {
      router.replace("/chat-add");
    }
  }, [conflicts.length, router, state.draftTransactions.length]);

  if (state.draftTransactions.length === 0 || conflicts.length === 0) {
    return null;
  }

  async function handleSubmit() {
    setIsSaving(true);
    const ok = await actions.submitDrafts(selectedDraftIds);
    setIsSaving(false);

    if (!ok) {
      return;
    }

    router.replace("/expenses");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 pb-32 sm:px-5">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="sticky top-0 z-20 rounded-2xl border border-[var(--line)] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Similarity Review</p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--ink)]">Review matching transactions before saving</h1>
            </div>
            <button type="button" className="cta-secondary" onClick={() => router.back()} disabled={isSaving}>
              Back to Drafts
            </button>
          </div>
        </header>

        <section className="space-y-4">
          {conflicts.map((conflict) => {
            const checked = saveBothDraftIds.includes(conflict.draft.id);

            return (
              <article key={conflict.draft.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--ink)]">Potential duplicate detected</h2>
                    <p className="text-sm text-[var(--ink-muted)]">Matched on merchant, amount, date, and title.</p>
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSaveBothDraftIds((current) =>
                          event.target.checked
                            ? [...current, conflict.draft.id]
                            : current.filter((draftId) => draftId !== conflict.draft.id)
                        );
                      }}
                    />
                    Save both
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                  <ComparisonCard
                    label="Existing Transaction"
                    title={conflict.existing.title}
                    merchant={conflict.existing.merchant}
                    amount={conflict.existing.amount}
                    dateTrx={conflict.existing.dateTrx}
                  />
                  <div className="flex items-center justify-center text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    versus
                  </div>
                  <ComparisonCard
                    label="New Draft"
                    title={conflict.draft.title}
                    merchant={conflict.draft.merchant}
                    amount={conflict.draft.amount}
                    dateTrx={conflict.draft.dateTrx}
                  />
                </div>
              </article>
            );
          })}
        </section>

        {state.errorMessage ? (
          <p className="rounded-xl border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {state.errorMessage}
          </p>
        ) : null}

        <div className="sticky bottom-4 z-20 rounded-2xl border border-[var(--line)] bg-white px-4 py-4 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--ink-muted)]">
              Unchecked matches will keep the existing transaction only. Checked matches will save both transactions.
            </p>
            <button type="button" className="cta-primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Continue Save"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}