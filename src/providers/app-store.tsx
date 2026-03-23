"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";
import { db } from "@/lib/dexie/db";
import { parseExpenseInput } from "@/lib/api/parse";
import { createId } from "@/lib/utils/id";
import { getCurrentMonthKey } from "@/lib/utils/date";
import { validateCategoryName, validateDraft } from "@/lib/utils/validators";
import type { AppState, Category, DraftTransaction, ParseRequest, Transaction } from "@/types/app";
import {
  DEFAULT_CATEGORY_SEEDS,
  UNCATEGORIZED_CATEGORY_ID
} from "@/types/app";

type StoreState = AppState & {
  hydrated: boolean;
  loading: boolean;
  parsing: boolean;
  submitting: boolean;
  errorMessage: string | null;
};

type StoreContextValue = {
  state: StoreState;
  actions: {
    refreshData: () => Promise<void>;
    setCategoryFilter: (categoryId: string | null) => void;
    setDraftTransactions: (drafts: DraftTransaction[]) => void;
    updateDraft: (draftId: string, patch: Partial<DraftTransaction>) => void;
    removeDraft: (draftId: string) => void;
    discardDrafts: () => void;
    parseDrafts: (request: ParseRequest) => Promise<void>;
    submitDrafts: () => Promise<boolean>;
    createCategory: (name: string) => Promise<{ ok: boolean; message?: string }>;
    renameCategory: (categoryId: string, name: string) => Promise<{ ok: boolean; message?: string }>;
    deleteCategory: (categoryId: string) => Promise<{ ok: boolean; message?: string }>;
  };
};

const initialState: StoreState = {
  transactions: [],
  categories: [],
  draftTransactions: [],
  filters: {
    categoryId: null,
    month: getCurrentMonthKey()
  },
  hydrated: false,
  loading: true,
  parsing: false,
  submitting: false,
  errorMessage: null
};

type Action =
  | { type: "hydrate"; payload: Pick<StoreState, "transactions" | "categories"> }
  | { type: "set-loading"; payload: boolean }
  | { type: "set-parsing"; payload: boolean }
  | { type: "set-submitting"; payload: boolean }
  | { type: "set-error"; payload: string | null }
  | { type: "set-filter"; payload: string | null }
  | { type: "set-drafts"; payload: DraftTransaction[] }
  | { type: "update-draft"; payload: DraftTransaction }
  | { type: "remove-draft"; payload: string };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        ...action.payload,
        hydrated: true,
        loading: false
      };
    case "set-loading":
      return {
        ...state,
        loading: action.payload
      };
    case "set-parsing":
      return {
        ...state,
        parsing: action.payload
      };
    case "set-submitting":
      return {
        ...state,
        submitting: action.payload
      };
    case "set-error":
      return {
        ...state,
        errorMessage: action.payload
      };
    case "set-filter":
      return {
        ...state,
        filters: {
          ...state.filters,
          categoryId: action.payload
        }
      };
    case "set-drafts":
      return {
        ...state,
        draftTransactions: action.payload
      };
    case "update-draft":
      return {
        ...state,
        draftTransactions: state.draftTransactions.map((draft) =>
          draft.id === action.payload.id ? action.payload : draft
        )
      };
    case "remove-draft":
      return {
        ...state,
        draftTransactions: state.draftTransactions.filter((draft) => draft.id !== action.payload)
      };
    default:
      return state;
  }
}

const AppStoreContext = createContext<StoreContextValue | null>(null);

async function ensureSeededCategories(): Promise<void> {
  const existingCount = await db.categories.count();

  if (existingCount > 0) {
    return;
  }

  const timestamp = new Date().toISOString();
  await db.categories.bulkPut(
    DEFAULT_CATEGORY_SEEDS.map((category) => ({
      ...category,
      icon: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }))
  );
}

async function readSnapshot() {
  await ensureSeededCategories();

  const [transactions, categories] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray()
  ]);

  return { transactions, categories };
}

function normalizeDrafts(drafts: DraftTransaction[], categories: Category[]) {
  return drafts.map((draft) => validateDraft(draft, categories));
}

function buildTransactionFromDraft(draft: DraftTransaction, categories: Category[]): Transaction {
  const fallbackCategory = categories.find((category) => category.id === UNCATEGORIZED_CATEGORY_ID);
  const category = categories.find((item) => item.id === draft.categoryId) ?? fallbackCategory;
  const hasAttachment = Boolean(draft.attachmentUri);
  const source = hasAttachment && draft.title ? "text+photo" : hasAttachment ? "photo" : "manual_text";

  return {
    id: createId("txn"),
    merchant: draft.merchant.trim(),
    title: draft.title.trim() || draft.merchant.trim(),
    amount: draft.amount ?? 0,
    dateTrx: draft.dateTrx,
    categoryId: category?.id ?? null,
    categoryLabel: category?.name ?? "Uncategorized",
    attachmentUri: draft.attachmentUri ?? null,
    source,
    createdAt: new Date().toISOString()
  };
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refreshData = useCallback(async () => {
    dispatch({ type: "set-loading", payload: true });

    try {
      const snapshot = await readSnapshot();
      dispatch({ type: "hydrate", payload: snapshot });
    } catch (error) {
      dispatch({ type: "set-loading", payload: false });
      dispatch({ type: "set-error", payload: error instanceof Error ? error.message : "Failed to load data." });
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const actions = useMemo<StoreContextValue["actions"]>(() => ({
    refreshData,
    setCategoryFilter(categoryId) {
      dispatch({ type: "set-filter", payload: categoryId });
    },
    setDraftTransactions(drafts) {
      const validated = normalizeDrafts(drafts, stateRef.current.categories);
      dispatch({ type: "set-drafts", payload: validated });
      dispatch({ type: "set-error", payload: null });
    },
    updateDraft(draftId, patch) {
      const currentDraft = stateRef.current.draftTransactions.find((draft) => draft.id === draftId);

      if (!currentDraft) {
        return;
      }

      const nextDraft = validateDraft(
        {
          ...currentDraft,
          ...patch
        },
        stateRef.current.categories
      );

      dispatch({ type: "update-draft", payload: nextDraft });
    },
    removeDraft(draftId) {
      dispatch({ type: "remove-draft", payload: draftId });
    },
    discardDrafts() {
      dispatch({ type: "set-drafts", payload: [] });
      dispatch({ type: "set-error", payload: null });
    },
    async parseDrafts(request) {
      dispatch({ type: "set-parsing", payload: true });
      dispatch({ type: "set-error", payload: null });

      try {
        const response = await parseExpenseInput(request, stateRef.current.categories);
        const validated = normalizeDrafts(response.drafts, stateRef.current.categories);
        dispatch({ type: "set-drafts", payload: validated });
      } catch (error) {
        dispatch({ type: "set-drafts", payload: [] });
        dispatch({
          type: "set-error",
          payload: error instanceof Error ? error.message : "OCR parse failed. Please try another image."
        });
      } finally {
        dispatch({ type: "set-parsing", payload: false });
      }
    },
    async submitDrafts() {
      const validated = normalizeDrafts(stateRef.current.draftTransactions, stateRef.current.categories);
      dispatch({ type: "set-drafts", payload: validated });

      if (validated.some((draft) => !draft.isValid)) {
        dispatch({ type: "set-error", payload: `${validated.filter((draft) => !draft.isValid).length} invalid cards need fixing.` });
        return false;
      }

      dispatch({ type: "set-submitting", payload: true });
      dispatch({ type: "set-error", payload: null });

      try {
        const transactions = validated.map((draft) => buildTransactionFromDraft(draft, stateRef.current.categories));
        await db.transactions.bulkPut(transactions);
        startTransition(() => {
          dispatch({ type: "set-drafts", payload: [] });
        });
        await refreshData();
        return true;
      } catch (error) {
        dispatch({ type: "set-error", payload: error instanceof Error ? error.message : "Failed to save transactions." });
        return false;
      } finally {
        dispatch({ type: "set-submitting", payload: false });
      }
    },
    async createCategory(name) {
      const normalized = name.trim();
      const validationError = validateCategoryName(normalized);

      if (validationError) {
        return { ok: false, message: validationError };
      }

      const duplicate = stateRef.current.categories.some(
        (category) => category.name.toLowerCase() === normalized.toLowerCase()
      );

      if (duplicate) {
        return { ok: false, message: "Category already exists." };
      }

      const timestamp = new Date().toISOString();
      await db.categories.put({
        id: createId("category"),
        name: normalized,
        icon: null,
        color: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isDefault: false
      });
      await refreshData();
      return { ok: true };
    },
    async renameCategory(categoryId, name) {
      const normalized = name.trim();
      const validationError = validateCategoryName(normalized);

      if (validationError) {
        return { ok: false, message: validationError };
      }

      if (categoryId === UNCATEGORIZED_CATEGORY_ID) {
        return { ok: false, message: "Uncategorized cannot be renamed." };
      }

      const duplicate = stateRef.current.categories.some(
        (category) =>
          category.id !== categoryId && category.name.toLowerCase() === normalized.toLowerCase()
      );

      if (duplicate) {
        return { ok: false, message: "Category already exists." };
      }

      const category = stateRef.current.categories.find((item) => item.id === categoryId);

      if (!category) {
        return { ok: false, message: "Category not found." };
      }

      await db.categories.put({
        ...category,
        name: normalized,
        updatedAt: new Date().toISOString()
      });
      await refreshData();
      return { ok: true };
    },
    async deleteCategory(categoryId) {
      if (categoryId === UNCATEGORIZED_CATEGORY_ID) {
        return { ok: false, message: "Uncategorized cannot be deleted." };
      }

      const fallbackCategory = stateRef.current.categories.find(
        (category) => category.id === UNCATEGORIZED_CATEGORY_ID
      );

      if (!fallbackCategory) {
        return { ok: false, message: "Fallback category missing." };
      }

      await db.transaction("rw", db.categories, db.transactions, async () => {
        const impactedTransactions = await db.transactions.where("categoryId").equals(categoryId).toArray();
        await Promise.all(
          impactedTransactions.map((transaction) =>
            db.transactions.put({
              ...transaction,
              categoryId: fallbackCategory.id,
              categoryLabel: fallbackCategory.name
            })
          )
        );
        await db.categories.delete(categoryId);
      });
      await refreshData();
      return { ok: true };
    }
  }), [refreshData]);

  return <AppStoreContext.Provider value={{ state, actions }}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }

  return context;
}
