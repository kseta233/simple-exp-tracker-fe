"use client";

import { useState } from "react";
import { NavShell } from "@/components/nav-shell";
import { submitForOCR, type OCRResponse } from "@/lib/api/ocr";
import { supabase } from "@/lib/supabase/client";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("No file selected");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResponse | null>(null);

  async function handleSubmit() {
    if (!selectedFile) {
      setErrorMessage("Choose a file before sending it to OCR.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token ?? "test-token";
      const result = await submitForOCR(selectedFile, token);
      setOcrResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR request failed";
      setErrorMessage(message);
      setOcrResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NavShell title="Upload Expense Document">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">1. Choose a receipt</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Accept images or PDFs, validate them client-side, then send them to the OCR backend.
          </p>
          <label className="mt-6 flex cursor-pointer flex-col rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-6 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Select file</span>
            <span className="mt-2">{fileName}</span>
            <input
              className="hidden"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setSelectedFile(file ?? null);
                setFileName(file?.name ?? "No file selected");
                setErrorMessage(null);
              }}
            />
          </label>
          <button
            className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Send To OCR"}
          </button>
          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">2. Review normalized OCR output</h2>

          {ocrResult?.sourceType ? (
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                ocrResult.sourceType === "bank-notification"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {ocrResult.sourceType === "bank-notification" ? "Bank Notification" : "Receipt"}
              {ocrResult.transactions.length > 1
                ? ` · ${ocrResult.transactions.length} transactions`
                : ""}
            </span>
          ) : null}

          {ocrResult && ocrResult.transactions.length > 1 ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {ocrResult.transactions.map((trx, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 p-4 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      #{index + 1} {trx.merchant}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {trx.currency} {trx.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <p>{trx.transactionDate}</p>
                    <p>{trx.paymentMethod ?? "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Merchant</p>
                <p>{ocrResult?.parsed.merchant ?? "Waiting for OCR result"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Transaction date</p>
                <p>{ocrResult?.parsed.transactionDate ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Total amount</p>
                <p>
                  {ocrResult
                    ? `${ocrResult.parsed.currency} ${ocrResult.parsed.totalAmount.toLocaleString()}`
                    : "-"}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Provider</p>
              <p>{ocrResult?.provider ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Raw text preview</p>
              <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
                {ocrResult?.rawText ? ocrResult.rawText.slice(0, 800) : "-"}
              </p>
            </div>
          </div>
        </article>
      </section>
    </NavShell>
  );
}

