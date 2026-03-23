import Dexie, { type Table } from "dexie";
import type { Category, Transaction } from "@/types/app";

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;

  constructor() {
    super("expense-tracker-mvp-db");

    this.version(1).stores({
      transactions: "id, dateTrx, createdAt, categoryId, title, merchant",
      categories: "id, name, updatedAt, isDefault"
    });
  }
}

export const db = new ExpenseTrackerDB();

