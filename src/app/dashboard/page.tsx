"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils/currency";
import { getCategoryBreakdown, getTransactionsByMonth } from "@/lib/utils/selectors";
import { useAppStore } from "@/providers/app-store";

const BAR_COLORS = ["#000b60", "#00714e", "#ea580c", "#7f1d1d", "#4955b3", "#6d28d9"];

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
    <AppShell title="Dashboard" eyebrow="Analytics Overview">
      <section className="rounded-xl border border-[var(--line)] bg-white p-4">
        <p className="text-sm text-[var(--ink-muted)]">Total Spend: Current Month</p>
        <p className="mt-2 text-3xl font-semibold text-[var(--ink)] sm:text-4xl">{formatCurrency(total)}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-low)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--ink-muted)]">Budget Left</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
              {formatCurrency(Math.max(0, 4000000 - total))}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-low)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--ink-muted)]">Transactions</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">{monthTransactions.length}</p>
          </div>
        </div>
      </section>

      <SectionCard className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center">
          <h3 className="text-xl font-semibold text-[var(--ink)]">Category Breakdown</h3>
          <Link className="text-base font-semibold text-[var(--primary)]" href="/expenses">
            View History
          </Link>
        </div>

        {breakdown.length === 0 ? (
          <EmptyState
            title="No more data found"
            description="You have no saved expenses for this month yet. Parse a receipt and confirm the draft cards."
            action={
              <Link className="cta-primary" href="/chat-add">
                Add your first expense
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {breakdown.map((item, index) => (
              <button
                key={item.categoryId}
                type="button"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left"
                onClick={() => {
                  actions.setCategoryFilter(item.categoryId);
                  router.push("/expenses");
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-[var(--ink)]">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                      {item.count} items
                    </p>
                  </div>
                  <div className="sm:text-right">
                      <p className="text-lg font-semibold text-[var(--ink)]">{item.formattedTotal}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--ink-muted)]">{item.percentage}% of total</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[var(--surface-low)]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(item.percentage, 4)}%`,
                      backgroundColor: BAR_COLORS[index % BAR_COLORS.length]
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
