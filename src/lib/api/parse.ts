import { createId } from "@/lib/utils/id";
import { getTodayDate } from "@/lib/utils/date";
import { supabase } from "@/lib/supabase/client";
import type { Category, DraftTransaction, ParseRequest, ParseResponse, TransactionSource } from "@/types/app";
import { UNCATEGORIZED_CATEGORY_ID } from "@/types/app";

type BackendTransaction = {
  merchant?: string;
  transactionDate?: string;
  totalAmount?: number;
  currency?: string;
  category?: string;
  paymentMethod?: string | null;
  notes?: string | null;
};

type BackendResponse = {
  requestId?: string;
  provider?: string;
  sourceType?: "receipt" | "bank-notification";
  rawText?: string;
  transactions?: BackendTransaction[];
  parsed?: BackendTransaction;
  confidence?: {
    overall?: number;
  };
};

type BackendErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["food", "lunch", "dinner", "breakfast", "coffee", "cafe", "restaurant", "kfc"],
  transport: ["transport", "grab", "gocar", "taxi", "train", "bus", "fuel", "tol"],
  shopping: ["shop", "shopping", "mart", "store", "market", "tokopedia", "shopee"],
  bills: ["bill", "internet", "electric", "pln", "water", "postpaid"],
  entertainment: ["movie", "netflix", "spotify", "game", "concert"]
};

function inferSource(text: string, hasFile: boolean): TransactionSource {
  if (text && hasFile) {
    return "text+photo";
  }

  if (hasFile) {
    return "photo";
  }

  return "manual_text";
}

function parseAmount(fragment: string): number | null {
  const lowered = fragment.toLowerCase();
  const compact = lowered.replace(/\s+/g, "");
  const multiplierMatch = compact.match(/(?:rp)?(\d+(?:[.,]\d+)?)(k|rb|jt)/i);

  if (multiplierMatch) {
    const value = Number(multiplierMatch[1].replace(/,/g, "."));
    const multiplier = multiplierMatch[2].toLowerCase();

    if (multiplier === "k" || multiplier === "rb") {
      return Math.round(value * 1000);
    }

    if (multiplier === "jt") {
      return Math.round(value * 1000000);
    }
  }

  const currencyMatch = fragment.match(/(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,})/i);

  if (currencyMatch) {
    return Number(currencyMatch[1].replace(/[.,]/g, ""));
  }

  return null;
}

function inferCategory(text: string, categories: Category[]): Category | undefined {
  const lowered = text.toLowerCase();
  const directMatch = categories.find((category) => lowered.includes(category.name.toLowerCase()));

  if (directMatch) {
    return directMatch;
  }

  const keywordEntry = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => lowered.includes(keyword))
  );

  if (!keywordEntry) {
    return categories.find((category) => category.id === UNCATEGORIZED_CATEGORY_ID);
  }

  return categories.find((category) => category.id === keywordEntry[0]);
}

function normalizeTitle(sourceText: string): { title: string; merchant: string } {
  const text = sourceText.replace(/(?:rp\s*)?\d[\d.,kKrbjt\s]*/g, " ").trim();
  const cleaned = text.replace(/\s+/g, " ");

  if (!cleaned) {
    return { title: "", merchant: "" };
  }

  return {
    title: cleaned,
    merchant: cleaned
  };
}

function createDraft(params: {
  text: string;
  attachmentUri?: string | null;
  categories: Category[];
  amount?: number | null;
  merchant?: string;
  title?: string;
  dateTrx?: string;
  parseConfidence?: number | null;
  source: TransactionSource;
}): DraftTransaction {
  const fallbackCategory = inferCategory(params.text, params.categories) ?? null;
  const title = params.title ?? normalizeTitle(params.text).title;
  const merchant = params.merchant ?? normalizeTitle(params.text).merchant;

  return {
    id: createId("draft"),
    merchant,
    title: title || merchant,
    amount: params.amount ?? parseAmount(params.text),
    dateTrx: params.dateTrx ?? getTodayDate(),
    categoryId: fallbackCategory?.id ?? null,
    categoryLabel: fallbackCategory?.name ?? null,
    attachmentUri: params.attachmentUri ?? null,
    parseConfidence: params.parseConfidence ?? null,
    errors: {},
    isValid: false
  };
}

async function parseWithBackend(
  file: File,
  text: string,
  sourceType?: "receipt" | "bank-notification"
): Promise<BackendResponse | null> {
  const endpoint = process.env.NEXT_PUBLIC_OCR_API_URL;

  if (!endpoint) {
    return null;
  }

  const session = supabase ? await supabase.auth.getSession() : null;
  const accessToken = session?.data.session?.access_token;
  const configuredToken = process.env.NEXT_PUBLIC_OCR_BEARER_TOKEN;
  const devToken = process.env.NEXT_PUBLIC_OCR_DEV_BEARER_TOKEN;
  const fallbackToken = "temporary-token";
  const bearerToken = accessToken ?? configuredToken ?? devToken ?? fallbackToken;

  const formData = new FormData();
  formData.append("file", file);
  if (text) {
    formData.append("text", text);
  }

  const normalizedEndpoint = endpoint.replace(/\/$/, "");
  const url = new URL(`${normalizedEndpoint}/api/v1/ocr/process`);
  if (sourceType) {
    url.searchParams.set("sourceType", sourceType);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`
    },
    body: formData
  });

  if (!response.ok) {
    let message = `OCR request failed with status ${response.status}`;

    try {
      const errorPayload = (await response.json()) as BackendErrorResponse;
      if (errorPayload.error?.message) {
        message = errorPayload.error.message;
      }
    } catch {
      // Keep default status message when non-JSON body is returned.
    }

    throw new Error(message);
  }

  return (await response.json()) as BackendResponse;
}

export async function parseExpenseInput(
  request: ParseRequest,
  categories: Category[]
): Promise<ParseResponse> {
  const text = request.text?.trim() ?? "";
  const attachmentUri = request.attachmentUri ?? null;
  const source = inferSource(text, Boolean(request.file));

  if (request.file) {
    const backendResult = await parseWithBackend(request.file, text, request.sourceType);
    const responseTransactions = backendResult?.transactions?.length
      ? backendResult.transactions
      : backendResult?.parsed
        ? [backendResult.parsed]
        : [];

    if (responseTransactions.length === 0) {
      throw new Error("OCR returned no transactions from the uploaded file.");
    }

    return {
      drafts: responseTransactions.map((item, index) => {
        const composedText = [item.merchant, item.category, text].filter(Boolean).join(" ").trim();
        const titleFromBackend = item.merchant?.trim() || item.category?.trim() || text.trim();

        return createDraft({
          text: composedText || "OCR transaction",
          attachmentUri,
          categories,
          amount: typeof item.totalAmount === "number" ? item.totalAmount : null,
          merchant: item.merchant ?? "",
          title:
            titleFromBackend ||
            `Transaction ${index + 1}`,
          dateTrx: item.transactionDate ?? getTodayDate(),
          parseConfidence: backendResult?.confidence?.overall ?? null,
          source
        });
      })
    };
  }

  const fragments = text
    ? text
        .split(/\n+/)
        .map((fragment) => fragment.trim())
        .filter(Boolean)
    : [];

  const draftInputs = fragments.length > 0 ? fragments : [text || "Manual expense"];

  return {
    drafts: draftInputs.map((fragment) =>
      createDraft({
        text: fragment,
        attachmentUri,
        categories,
        source
      })
    )
  };
}
