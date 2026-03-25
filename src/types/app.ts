export const UNCATEGORIZED_CATEGORY_ID = "uncategorized";

export type TransactionSource = "manual_text" | "photo" | "text+photo";

export type Transaction = {
  id: string;
  merchant: string;
  title: string;
  amount: number;
  dateTrx: string;
  categoryId: string | null;
  categoryLabel: string;
  attachmentUri?: string | null;
  source: TransactionSource;
  createdAt: string;
};

export type DraftTransaction = {
  id: string;
  merchant: string;
  title: string;
  amount: number | null;
  dateTrx: string;
  categoryId: string | null;
  categoryLabel: string | null;
  attachmentUri?: string | null;
  parseConfidence?: number | null;
  errors: {
    amount?: string;
    category?: string;
    merchant?: string;
    title?: string;
    dateTrx?: string;
  };
  isValid: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
};

export type AppState = {
  transactions: Transaction[];
  categories: Category[];
  draftTransactions: DraftTransaction[];
  filters: {
    categoryId?: string | null;
    month?: string;
  };
};

export type ParseRequest = {
  text?: string;
  attachmentUri?: string | null;
  file?: File | null;
  sourceType?: "receipt" | "bank-notification";
};

export type ParseResponse = {
  drafts: DraftTransaction[];
};

export const DEFAULT_CATEGORY_SEEDS: Array<Pick<Category, "id" | "name" | "color" | "isDefault">> = [
  {
    id: UNCATEGORIZED_CATEGORY_ID,
    name: "Uncategorized",
    color: "#7c6f64",
    isDefault: true
  },
  {
    id: "food",
    name: "Food",
    color: "#d1603d",
    isDefault: true
  },
  {
    id: "transport",
    name: "Transport",
    color: "#3d7ea6",
    isDefault: true
  },
  {
    id: "shopping",
    name: "Shopping",
    color: "#6b8f71",
    isDefault: true
  },
  {
    id: "bills",
    name: "Bills",
    color: "#8a5a44",
    isDefault: true
  },
  {
    id: "entertainment",
    name: "Entertainment",
    color: "#9b6b9e",
    isDefault: true
  }
];
