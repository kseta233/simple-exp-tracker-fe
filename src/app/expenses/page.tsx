"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDisplayDate, getCurrentMonthKey } from "@/lib/utils/date";
import {
  getCurrentMonthTotal,
  resolveCategoryLabel,
  sortTransactions
} from "@/lib/utils/selectors";
import { useAppStore } from "@/providers/app-store";

const ICON_BY_CATEGORY: Record<string, string> = {
  food: "F",
  transport: "T",
  shopping: "S",
  bills: "B",
  entertainment: "E",
  uncategorized: "?"
};

const COLOR_BY_CATEGORY: Record<string, string> = {
  food: "#f2dfc3",
  transport: "#d7e6fb",
  shopping: "#e4d8f6",
  bills: "#d8f2e6",
  entertainment: "#f8dbe1",
  uncategorized: "#e8ebf0"
};

function getDayLabel(dateTrx: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(`${dateTrx}T00:00:00`).getTime();
  const dayDiff = Math.round((today - target) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return "Today";
  }

  if (dayDiff === 1) {
    return "Yesterday";
  }

  return formatDisplayDate(dateTrx);
}

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

  const monthLabel = useMemo(() => {
    const month = state.filters.month ?? getCurrentMonthKey();
    const [year, monthNumber] = month.split("-");
    const d = new Date(Number(year), Number(monthNumber) - 1, 1);

    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  }, [state.filters.month]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof visibleTransactions>();

    for (const transaction of visibleTransactions) {
      const key = getDayLabel(transaction.dateTrx);
      const existing = map.get(key) ?? [];
      existing.push(transaction);
      map.set(key, existing);
    }

    return [...map.entries()];
  }, [visibleTransactions]);

  return (
    <AppShell title="Expenses" eyebrow="Main Tracker">
      <section className="grid grid-cols-2 gap-4">
        <SectionCard className="animate-rise">
          <p className="text-sm text-[var(--ink-muted)]">This Month</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[var(--primary)]">
            {formatCurrency(monthTotal)}
          </p>
        </SectionCard>
        <SectionCard className="animate-rise [animation-delay:90ms]">
          <p className="text-sm text-[var(--ink-muted)]">Total Transactions</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {state.transactions.length}
          </p>
        </SectionCard>
      </section>

      <SectionCard className="space-y-4 animate-rise [animation-delay:140ms]">
        <div className="relative">
          <input
            className="field pl-12"
            type="search"
            placeholder="Search by title..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">o</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            className={`shrink-0 rounded-full px-6 py-2 text-base font-semibold ${
              !state.filters.categoryId
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface-high)] text-[var(--ink-muted)]"
            }`}
            onClick={() => actions.setCategoryFilter(null)}
          >
            All
          </button>
          {state.categories
            .filter((category) => category.id !== "uncategorized")
            .map((category) => (
              <button
                type="button"
                key={category.id}
                className={`shrink-0 rounded-full px-6 py-2 text-base font-semibold ${
                  state.filters.categoryId === category.id
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-high)] text-[var(--ink-muted)]"
                }`}
                onClick={() => actions.setCategoryFilter(category.id)}
              >
                {category.name}
              </button>
            ))}
        </div>
      </SectionCard>

      <section className="space-y-5 animate-rise [animation-delay:210ms]">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Recent Activity
          </p>
          <p className="text-xl leading-none text-[var(--ink-muted)]">{monthLabel}</p>
        </div>

        {state.loading ? (
          <SectionCard>
            <p className="text-sm text-[var(--ink-muted)]">Loading timeline...</p>
          </SectionCard>
        ) : visibleTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Use Add Expense to parse receipts and confirm entries before saving."
            action={
              <Link className="cta-primary" href="/chat-add">
                Add your first expense
              </Link>
            }
          />
        ) : (
          grouped.map(([dayLabel, items]) => (
            <div key={dayLabel} className="space-y-3">
              <div className="inline-flex rounded-xl bg-[var(--surface-low)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {dayLabel}
              </div>
              {items.map((transaction) => {
                const categoryLabel = resolveCategoryLabel(transaction, state.categories);
                const categoryId = transaction.categoryId ?? "uncategorized";

                return (
                  <article
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-[var(--primary)]"
                        style={{ backgroundColor: COLOR_BY_CATEGORY[categoryId] ?? "#e8ebf0" }}
                      >
                        {ICON_BY_CATEGORY[categoryId] ?? "?"}
                      </div>
                      <div>
                        <h3 className="text-2xl leading-none tracking-[-0.01em] text-[var(--ink)]">
                          {transaction.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="tag-chip">{categoryLabel}</span>
                          {transaction.attachmentUri ? (
                            <span className="text-xs uppercase tracking-[0.15em] text-[var(--ink-muted)]">File</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl leading-none tracking-[-0.02em] text-[var(--ink)]">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-muted)]">{formatDisplayDate(transaction.dateTrx)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ))
        )}
      </section>

      <Link
        href="/chat-add"
        className="fixed bottom-28 right-6 z-20 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--primary)] text-4xl text-white shadow-[var(--shadow-float)]"
        aria-label="Add expense"
      >
        +
      </Link>
    </AppShell>
  );
}
