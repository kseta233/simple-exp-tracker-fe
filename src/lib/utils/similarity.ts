import type { DraftTransaction, Transaction } from "@/types/app";

export type SimilarityConflict = {
  draft: DraftTransaction;
  existing: Transaction;
};

function normalizeValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildDraftSimilarityKey(draft: DraftTransaction) {
  return [
    normalizeValue(draft.merchant),
    draft.amount ?? "",
    normalizeValue(draft.dateTrx),
    normalizeValue(draft.title)
  ].join("::");
}

function buildTransactionSimilarityKey(transaction: Transaction) {
  return [
    normalizeValue(transaction.merchant),
    transaction.amount,
    normalizeValue(transaction.dateTrx),
    normalizeValue(transaction.title)
  ].join("::");
}

export function findSimilarityConflicts(
  drafts: DraftTransaction[],
  transactions: Transaction[]
): SimilarityConflict[] {
  const transactionMap = new Map<string, Transaction>();

  for (const transaction of transactions) {
    transactionMap.set(buildTransactionSimilarityKey(transaction), transaction);
  }

  return drafts.flatMap((draft) => {
    const existing = transactionMap.get(buildDraftSimilarityKey(draft));

    if (!existing) {
      return [];
    }

    return [{ draft, existing }];
  });
}