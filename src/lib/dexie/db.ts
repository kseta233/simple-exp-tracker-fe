import Dexie, { type Table } from "dexie";
import type { FinanceEntry, OCRResult, RawDocument } from "@/features/expenses/types";

export class ExpenseTrackerDB extends Dexie {
  rawDocuments!: Table<RawDocument, string>;
  ocrResults!: Table<OCRResult, string>;
  financeEntries!: Table<FinanceEntry, string>;

  constructor() {
    super("expense-tracker-db");

    this.version(1).stores({
      rawDocuments: "id, userId, createdAt, fileName",
      ocrResults: "id, rawDocumentId, processedAt",
      financeEntries: "id, transactionDate, merchant, status, category"
    });
  }
}

export const db = new ExpenseTrackerDB();

