import { z } from "zod";

const sourceTypeSchema = z.enum(["receipt", "bank-notification"]);

export const parsedExpenseSchema = z.object({
  merchant: z.string().default("Unknown merchant"),
  transactionDate: z.string(),
  totalAmount: z.number(),
  currency: z.string().default("IDR"),
  category: z.string().default("Uncategorized"),
  paymentMethod: z.string().nullable(),
  notes: z.string().nullable(),
  lineItems: z.array(z.unknown()).default([])
});

export const ocrResponseSchema = z.object({
  requestId: z.string(),
  provider: z.string(),
  sourceType: sourceTypeSchema,
  rawText: z.string(),
  parsed: parsedExpenseSchema,
  transactions: z.array(parsedExpenseSchema),
  confidence: z.object({
    overall: z.number(),
    fields: z.record(z.number())
  }),
  raw: z.record(z.unknown())
});

export type OCRResponse = z.infer<typeof ocrResponseSchema>;

export async function submitForOCR(
  file: File,
  sourceType?: "receipt" | "bank-notification",
  token?: string
): Promise<OCRResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const resolvedToken =
    token ??
    process.env.NEXT_PUBLIC_OCR_BEARER_TOKEN ??
    process.env.NEXT_PUBLIC_OCR_DEV_BEARER_TOKEN ??
    "temporary-token";

  const url = new URL(`${process.env.NEXT_PUBLIC_OCR_API_URL}/api/v1/ocr/process`);
  if (sourceType) {
    url.searchParams.set("sourceType", sourceType);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolvedToken}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`OCR request failed with status ${response.status}`);
  }

  return ocrResponseSchema.parse(await response.json());
}

