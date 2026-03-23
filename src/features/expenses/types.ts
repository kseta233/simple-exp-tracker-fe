export type ExpenseStatus = "draft" | "confirmed";

export interface RawDocument {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  source: "upload" | "camera";
  blobRef: string;
  createdAt: string;
}

export interface OCRResult {
  id: string;
  rawDocumentId: string;
  provider: string;
  rawText: string;
  rawJson: Record<string, unknown>;
  confidence: number;
  processedAt: string;
}

export interface FinanceEntry {
  id: string;
  rawDocumentId: string;
  ocrResultId: string;
  merchant: string;
  transactionDate: string;
  totalAmount: number;
  currency: string;
  category: string;
  paymentMethod: string | null;
  notes: string | null;
  status: ExpenseStatus;
  correctedFields: string[];
  createdAt: string;
  updatedAt: string;
}

