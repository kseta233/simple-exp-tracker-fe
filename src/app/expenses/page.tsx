"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import {
  TransactionFormFields,
  type TransactionFormErrors,
  type TransactionFormValues
} from "@/components/transaction-form-fields";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDisplayDate, getCurrentMonthKey } from "@/lib/utils/date";
import {
  getCurrentMonthTotal,
  resolveCategoryLabel,
  sortTransactions
} from "@/lib/utils/selectors";
import { validateDraft } from "@/lib/utils/validators";
import { useAppStore } from "@/providers/app-store";
import type { Transaction } from "@/types/app";
import { UNCATEGORIZED_CATEGORY_ID } from "@/types/app";

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
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editValues, setEditValues] = useState<TransactionFormValues | null>(null);
  const [editErrors, setEditErrors] = useState<TransactionFormErrors | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingEdit, setIsDeletingEdit] = useState(false);

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

  function openEditModal(transaction: Transaction) {
    setInlineMessage(null);
    setEditErrors(null);
    setEditingTransaction(transaction);
    setEditValues({
      title: transaction.title,
      merchant: transaction.merchant,
      amount: String(transaction.amount),
      dateTrx: transaction.dateTrx,
      categoryId: transaction.categoryId ?? UNCATEGORIZED_CATEGORY_ID
    });
  }

  function closeEditModal() {
    if (isSavingEdit || isDeletingEdit) {
      return;
    }

    setEditingTransaction(null);
    setEditValues(null);
    setEditErrors(null);
  }

  async function saveEdit() {
    if (!editingTransaction || !editValues) {
      return;
    }

    const parsedAmount = Number(editValues.amount.replace(/[^\d]/g, ""));
    const category = state.categories.find((item) => item.id === editValues.categoryId);
    const validated = validateDraft(
      {
        id: editingTransaction.id,
        merchant: editValues.merchant,
        title: editValues.title,
        amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
        dateTrx: editValues.dateTrx,
        categoryId: editValues.categoryId,
        categoryLabel: category?.name ?? null,
        attachmentUri: editingTransaction.attachmentUri ?? null,
        parseConfidence: null,
        errors: {},
        isValid: false
      },
      state.categories
    );

    if (!validated.isValid) {
      setEditErrors(validated.errors);
      return;
    }

    setIsSavingEdit(true);
    setInlineMessage(null);

    const result = await actions.updateTransaction(editingTransaction.id, {
      title: validated.title,
      merchant: validated.merchant,
      amount: validated.amount,
      dateTrx: validated.dateTrx,
      categoryId: validated.categoryId ?? UNCATEGORIZED_CATEGORY_ID
    });

    setIsSavingEdit(false);

    if (!result.ok) {
      setInlineMessage(result.message ?? "Failed to update transaction.");
      return;
    }

    setInlineMessage(`Updated ${validated.title || validated.merchant}.`);
    closeEditModal();
  }

  async function deleteEdit() {
    if (!editingTransaction) {
      return;
    }

    const confirmed = window.confirm("Delete this transaction?");

    if (!confirmed) {
      return;
    }

    setIsDeletingEdit(true);
    setInlineMessage(null);

    const result = await actions.deleteTransaction(editingTransaction.id);

    setIsDeletingEdit(false);

    if (!result.ok) {
      setInlineMessage(result.message ?? "Failed to delete transaction.");
      return;
    }

    setInlineMessage("Transaction deleted.");
    closeEditModal();
  }

  return (
    <AppShell title="Expenses" eyebrow="Main Tracker">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <SectionCard className="animate-rise">
          <p className="text-sm text-[var(--ink-muted)]">This Month</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
            {formatCurrency(monthTotal)}
          </p>
        </SectionCard>
        <SectionCard className="animate-rise [animation-delay:90ms]">
          <p className="type-body text-[var(--ink-muted)]">Total Transactions</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
            {state.transactions.length}
          </p>
        </SectionCard>
      </section>

      <SectionCard className="space-y-4 animate-rise [animation-delay:140ms]">
        <div>
          <input
            className="field"
            type="search"
            placeholder="Search by title..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setInlineMessage(null);
            }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold sm:px-5 sm:text-sm ${
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
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold sm:px-5 sm:text-sm ${
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
        <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-label font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Recent Activity
          </p>
          <p className="type-body text-[var(--ink-muted)]">{monthLabel}</p>
        </div>

        {inlineMessage ? (
          <SectionCard>
            <p className="type-body text-[var(--primary)]">{inlineMessage}</p>
          </SectionCard>
        ) : null}

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
                    className="flex cursor-pointer flex-col gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
                    onClick={() => openEditModal(transaction)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEditModal(transaction);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-[var(--primary)]"
                        style={{ backgroundColor: COLOR_BY_CATEGORY[categoryId] ?? "#e8ebf0" }}
                      >
                        {ICON_BY_CATEGORY[categoryId] ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-all text-xl font-semibold leading-tight text-[var(--ink)] sm:text-2xl">
                          {transaction.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="tag-chip">{categoryLabel}</span>
                          {transaction.attachmentUri ? (
                            <span className="type-label uppercase tracking-[0.15em] text-[var(--ink-muted)]">File</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[var(--line)] pt-3 sm:border-none sm:pt-0">
                      <div className="flex flex-col gap-2 sm:items-end">
                        <p className="text-3xl font-semibold text-[var(--ink)] sm:text-2xl">
                        {formatCurrency(transaction.amount)}
                      </p>
                        <p className="text-sm text-[var(--ink-muted)]">{formatDisplayDate(transaction.dateTrx)}</p>
                        <p className="rounded-md bg-[var(--surface-low)] px-3 py-2 text-sm text-[var(--ink-muted)]">
                          {categoryLabel}
                        </p>
                        <p className="text-xs text-[var(--ink-muted)]">Tap to edit</p>
                      </div>
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
        className="fixed bottom-24 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-2xl text-white sm:bottom-24 sm:right-6"
        aria-label="Add expense"
      >
        +
      </Link>

      {editingTransaction && editValues ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-xl bg-white p-4 sm:max-w-lg sm:rounded-xl sm:border sm:border-[var(--line)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--ink-muted)]">Edit Transaction</p>
                <h3 className="text-lg font-semibold text-[var(--ink)]">{editingTransaction.title}</h3>
              </div>
              <button type="button" className="cta-secondary" onClick={closeEditModal} disabled={isSavingEdit}>
                Close
              </button>
            </div>

            <TransactionFormFields
              values={editValues}
              errors={editErrors ?? undefined}
              disabled={isSavingEdit}
              categories={state.categories.map((category) => ({ id: category.id, name: category.name }))}
              onChange={(field, value) => {
                setEditErrors(null);
                setEditValues((prev) => {
                  if (!prev) {
                    return prev;
                  }

                  return {
                    ...prev,
                    [field]: value
                  };
                });
              }}
            />

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="cta-secondary w-full"
                onClick={closeEditModal}
                disabled={isSavingEdit || isDeletingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cta-primary w-full"
                onClick={saveEdit}
                disabled={isSavingEdit || isDeletingEdit}
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
              onClick={deleteEdit}
              disabled={isSavingEdit || isDeletingEdit}
            >
              {isDeletingEdit ? "Deleting..." : "Delete Entry"}
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
