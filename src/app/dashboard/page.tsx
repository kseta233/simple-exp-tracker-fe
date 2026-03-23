"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils/currency";
import { getCategoryBreakdown, getTransactionsByMonth } from "@/lib/utils/selectors";
import { useAppStore } from "@/providers/app-store";

export default function DashboardPage() {
  const { state, actions } = useAppStore();
  const router = useRouter();

  const monthTransactions = useMemo(
    () => getTransactionsByMonth(state.transactions, state.filters.month),
    [state.filters.month, state.transactions]
  );
  const total = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const breakdown = useMemo(
    () => getCategoryBreakdown(state.transactions, state.categories, state.filters.month),
    [state.categories, state.filters.month, state.transactions]
  );

  return (
    <AppShell
      title="Dashboard"
      eyebrow="Category View"
      actions={
        <Link className="cta-primary" href="/chat-add">
          Add Expense
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Current month</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--ink-strong)]">{formatCurrency(total)}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Saved transactions</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--ink-strong)]">{monthTransactions.length}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Scope</p>
          <p className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">Current month only</p>
        </SectionCard>
      </section>

      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl text-[var(--ink-strong)]">Category breakdown</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Horizontal bars keep the MVP readable without a heavy chart dependency.
            </p>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No expense data yet"
              description="Save a few transactions first, then this screen will group the current month by category."
              action={
                <Link className="cta-primary" href="/chat-add">
                  Go to Add Expense
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {breakdown.map((item) => (
              <button
                key={item.categoryId}
                type="button"
                className="w-full rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-left shadow-[0_12px_32px_rgba(56,39,25,0.07)]"
                onClick={() => {
                  actions.setCategoryFilter(item.categoryId);
                  router.push("/expenses");
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[var(--ink-strong)]">{item.name}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{item.count} transaction{item.count === 1 ? "" : "s"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[var(--ink-strong)]">{item.formattedTotal}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{item.percentage}%</p>
                  </div>
                </div>
                <div className="mt-4 h-3 rounded-full bg-[rgba(125,95,74,0.08)]">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${Math.max(item.percentage, 8)}%`,
                      background: item.color ?? "var(--accent)"
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}

