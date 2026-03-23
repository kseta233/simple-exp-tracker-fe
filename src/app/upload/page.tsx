"use client";

import { useState } from "react";
import { NavShell } from "@/components/nav-shell";

export default function UploadPage() {
  const [fileName, setFileName] = useState("No file selected");

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
                setFileName(file?.name ?? "No file selected");
              }}
            />
          </label>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">2. Review normalized OCR output</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Merchant</p>
              <p>Example Coffee Roasters</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Transaction date</p>
              <p>2026-03-23</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Total amount</p>
              <p>IDR 78,000</p>
            </div>
          </div>
        </article>
      </section>
    </NavShell>
  );
}

