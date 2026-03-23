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
      <section className="panel-hero relative overflow-hidden rounded-[2rem] p-7 text-white">
        <p className="text-sm text-white/70">Total Spend: Current Month</p>
        <p className="mt-2 text-6xl font-extrabold tracking-[-0.04em]">{formatCurrency(total)}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white/12 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.15em] text-white/70">Budget Left</p>
            <p className="mt-1 text-4xl font-bold tracking-[-0.03em]">{formatCurrency(Math.max(0, 4000000 - total))}</p>
          </div>
          <div className="rounded-3xl bg-white/12 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.15em] text-white/70">Transactions</p>
            <p className="mt-1 text-4xl font-bold tracking-[-0.03em]">{monthTransactions.length}</p>
          </div>
        </div>
      </section>

      <SectionCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-4xl tracking-[-0.03em] text-[var(--ink)]">Category Breakdown</h3>
          <Link className="text-lg font-semibold text-[var(--primary)]" href="/expenses">
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
                className="w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:bg-white"
                onClick={() => {
                  actions.setCategoryFilter(item.categoryId);
                  router.push("/expenses");
                }}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[34px] leading-none tracking-[-0.02em] text-[var(--ink)]">{item.name}</p>
                    <p className="mt-1 text-sm uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      {item.count} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[34px] leading-none tracking-[-0.02em] text-[var(--ink)]">{item.formattedTotal}</p>
                    <p className="mt-1 text-sm uppercase tracking-[0.14em] text-[var(--ink-muted)]">{item.percentage}% of total</p>
                  </div>
                </div>
                <div className="mt-4 h-3 rounded-full bg-[var(--surface-low)]">
                  <div
                    className="h-3 rounded-full"
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
