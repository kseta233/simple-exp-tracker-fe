"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDisplayDate } from "@/lib/utils/date";
import {
  getCurrentMonthTotal,
  resolveCategoryLabel,
  sortTransactions
} from "@/lib/utils/selectors";
import { useAppStore } from "@/providers/app-store";

export default function ExpensesPage() {
  const { state, actions } = useAppStore();
  const [search, setSearch] = useState("");

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortTransactions(
      state.transactions.filter((transaction) => {
        const matchesCategory =
          !state.filters.categoryId || transaction.categoryId === state.filters.categoryId;
        const matchesQuery =
          !query ||
          transaction.title.toLowerCase().includes(query) ||
          transaction.merchant.toLowerCase().includes(query);

        return matchesCategory && matchesQuery;
      })
    );
  }, [search, state.filters.categoryId, state.transactions]);

  const monthTotal = useMemo(
    () => getCurrentMonthTotal(state.transactions, state.filters.month),
    [state.filters.month, state.transactions]
  );

  return (
    <AppShell
      title="Expense Tracker"
      eyebrow="Main Screen"
      actions={
        <>
          <Link className="cta-secondary" href="/dashboard">
            Dashboard
          </Link>
          <Link className="cta-primary" href="/chat-add">
            Add Expense
          </Link>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard className="animate-rise">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">This month</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--ink-strong)]">{formatCurrency(monthTotal)}</p>
        </SectionCard>
        <SectionCard className="animate-rise [animation-delay:80ms]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Transactions</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--ink-strong)]">{state.transactions.length}</p>
        </SectionCard>
        <SectionCard className="animate-rise [animation-delay:160ms]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Active filter</p>
          <p className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">
            {state.categories.find((category) => category.id === state.filters.categoryId)?.name ?? "All categories"}
          </p>
        </SectionCard>
      </section>

      <SectionCard className="space-y-4 animate-rise [animation-delay:220ms]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="field"
            type="search"
            placeholder="Search title or merchant"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="select md:max-w-56"
            value={state.filters.categoryId ?? "all"}
            onChange={(event) =>
              actions.setCategoryFilter(event.target.value === "all" ? null : event.target.value)
            }
          >
            <option value="all">All categories</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {state.loading ? (
          <div className="rounded-[24px] bg-white/60 px-4 py-10 text-center text-sm text-[var(--ink-soft)]">
            Loading your timeline...
          </div>
        ) : visibleTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Add your first expense to build the timeline and dashboard."
            action={
              <Link className="cta-primary" href="/chat-add">
                Add your first expense
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleTransactions.map((transaction, index) => {
              const categoryLabel = resolveCategoryLabel(transaction, state.categories);

              return (
                <article
                  key={transaction.id}
                  className="grid gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-[0_12px_32px_rgba(56,39,25,0.07)] animate-rise md:grid-cols-[1fr_auto] md:items-center"
                  style={{ animationDelay: `${Math.min(index * 60, 240)}ms` }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                      <span className="tag-chip">{categoryLabel}</span>
                      {transaction.attachmentUri ? <span>Attachment</span> : null}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{transaction.title}</h2>
                      <p className="text-sm text-[var(--ink-soft)]">
                        {transaction.merchant || "No merchant"} · {formatDisplayDate(transaction.dateTrx)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl font-semibold text-[var(--ink-strong)]">{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">{transaction.source}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}

