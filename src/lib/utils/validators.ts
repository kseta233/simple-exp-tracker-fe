import { getTodayDate } from "@/lib/utils/date";
import type { Category, DraftTransaction } from "@/types/app";
import { UNCATEGORIZED_CATEGORY_ID } from "@/types/app";

export function validateDraft(draft: DraftTransaction, categories: Category[]): DraftTransaction {
  const errors: DraftTransaction["errors"] = {};
  const fallbackCategory = categories.find((category) => category.id === UNCATEGORIZED_CATEGORY_ID);
  const title = draft.title.trim();
  const merchant = draft.merchant.trim();

  if (draft.amount === null || Number.isNaN(draft.amount) || draft.amount <= 0) {
    errors.amount = "Amount must be greater than 0.";
  }

  if (!draft.dateTrx || Number.isNaN(Date.parse(`${draft.dateTrx}T00:00:00`))) {
    errors.dateTrx = "Choose a valid date.";
  }

  if (!title && !merchant) {
    errors.title = "Add a title or merchant.";
  }

  const categoryId = draft.categoryId ?? fallbackCategory?.id ?? null;
  const category = categories.find((item) => item.id === categoryId) ?? fallbackCategory ?? null;

  if (!category) {
    errors.category = "Choose a category.";
  }

  return {
    ...draft,
    title: title || merchant,
    merchant,
    dateTrx: draft.dateTrx || getTodayDate(),
    categoryId: category?.id ?? null,
    categoryLabel: category?.name ?? draft.categoryLabel ?? null,
    errors,
    isValid: Object.keys(errors).length === 0
  };
}

export function validateCategoryName(name: string): string | null {
  const normalized = name.trim();

  if (!normalized) {
    return "Category name is required.";
  }

  if (normalized.length > 30) {
    return "Category name must be 30 characters or less.";
  }

  return null;
}
