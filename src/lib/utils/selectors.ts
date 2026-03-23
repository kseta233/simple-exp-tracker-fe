import { formatCurrency } from "@/lib/utils/currency";
import { getCurrentMonthKey, isWithinMonth } from "@/lib/utils/date";
import type { Category, Transaction } from "@/types/app";
import { UNCATEGORIZED_CATEGORY_ID } from "@/types/app";

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    const byDate = right.dateTrx.localeCompare(left.dateTrx);

    if (byDate !== 0) {
      return byDate;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function resolveCategoryLabel(transaction: Transaction, categories: Category[]): string {
  return (
    categories.find((category) => category.id === transaction.categoryId)?.name ??
    transaction.categoryLabel ??
    "Uncategorized"
  );
}

export function getTransactionsByMonth(transactions: Transaction[], month = getCurrentMonthKey()): Transaction[] {
  return sortTransactions(transactions.filter((transaction) => isWithinMonth(transaction.dateTrx, month)));
}

export function getTransactionsByCategory(transactions: Transaction[], categoryId: string | null): Transaction[] {
  if (!categoryId) {
    return sortTransactions(transactions);
  }

  return sortTransactions(transactions.filter((transaction) => transaction.categoryId === categoryId));
}

export function getCurrentMonthTotal(transactions: Transaction[], month = getCurrentMonthKey()): number {
  return getTransactionsByMonth(transactions, month).reduce((total, transaction) => total + transaction.amount, 0);
}

export function getRecentTransactions(transactions: Transaction[], limit: number): Transaction[] {
  return sortTransactions(transactions).slice(0, limit);
}

export function getCategoryUsageCount(transactions: Transaction[], categoryId: string): number {
  return transactions.filter((transaction) => transaction.categoryId === categoryId).length;
}

export function getCategoryBreakdown(transactions: Transaction[], categories: Category[], month = getCurrentMonthKey()) {
  const monthTransactions = getTransactionsByMonth(transactions, month);
  const total = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const map = new Map<string, { total: number; count: number; name: string; color: string | null }>();

  for (const transaction of monthTransactions) {
    const category =
      categories.find((item) => item.id === transaction.categoryId) ??
      categories.find((item) => item.id === UNCATEGORIZED_CATEGORY_ID);
    const key = category?.id ?? UNCATEGORIZED_CATEGORY_ID;
    const current = map.get(key) ?? {
      total: 0,
      count: 0,
      name: category?.name ?? transaction.categoryLabel ?? "Uncategorized",
      color: category?.color ?? null
    };

    current.total += transaction.amount;
    current.count += 1;
    map.set(key, current);
  }

  return [...map.entries()]
    .map(([categoryId, value]) => ({
      categoryId,
      ...value,
      percentage: total === 0 ? 0 : Math.round((value.total / total) * 100),
      formattedTotal: formatCurrency(value.total)
    }))
    .sort((left, right) => right.total - left.total);
}
