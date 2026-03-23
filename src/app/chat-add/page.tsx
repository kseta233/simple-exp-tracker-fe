"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import { createId } from "@/lib/utils/id";
import { getTodayDate } from "@/lib/utils/date";
import { useAppStore } from "@/providers/app-store";
import { UNCATEGORIZED_CATEGORY_ID, type DraftTransaction } from "@/types/app";

type InputTab = "quick" | "manual";

export default function ChatAddPage() {
  const { state, actions } = useAppStore();
  const router = useRouter();
  const [tab, setTab] = useState<InputTab>("quick");
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(getTodayDate());
  const [manualCategoryId, setManualCategoryId] = useState(UNCATEGORIZED_CATEGORY_ID);

  useEffect(() => {
    return () => {
      if (attachmentUri) {
        URL.revokeObjectURL(attachmentUri);
      }
    };
  }, [attachmentUri]);

  function replaceAttachment(nextFile: File | null) {
    if (attachmentUri) {
      URL.revokeObjectURL(attachmentUri);
    }

    setSelectedFile(nextFile);
    setAttachmentUri(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleParse() {
    if (!text.trim() && !selectedFile) {
      setLocalMessage("Type an expense or upload a receipt first.");
      return;
    }

    setLocalMessage(null);
    await actions.parseDrafts({
      text,
      file: selectedFile,
      attachmentUri
    });
  }

  function addManualDraft() {
    const category = state.categories.find((item) => item.id === manualCategoryId);
    const parsedAmount = Number(manualAmount.replace(/[^\d]/g, ""));

    const draft: DraftTransaction = {
      id: createId("draft"),
      merchant: manualMerchant.trim(),
      title: manualTitle.trim(),
      amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
      dateTrx: manualDate,
      categoryId: category?.id ?? UNCATEGORIZED_CATEGORY_ID,
      categoryLabel: category?.name ?? "Uncategorized",
      attachmentUri: null,
      parseConfidence: null,
      errors: {},
      isValid: false
    };

    actions.setDraftTransactions([...state.draftTransactions, draft]);
    setManualTitle("");
    setManualMerchant("");
    setManualAmount("");
    setManualDate(getTodayDate());
    setManualCategoryId(UNCATEGORIZED_CATEGORY_ID);
  }

  async function handleSubmit() {
    const ok = await actions.submitDrafts();

    if (!ok) {
      return;
    }

    setText("");
    replaceAttachment(null);
    router.push("/expenses");
  }

  function discardAll() {
    actions.discardDrafts();
    setText("");
    replaceAttachment(null);
    setLocalMessage(null);
  }

  const hasInvalidDrafts = state.draftTransactions.some((draft) => !draft.isValid);

  return (
    <AppShell title="Add Expense" eyebrow="Drafting">
      <SectionCard className="space-y-4">
        <div className="flex border-b border-[var(--line)]">
          <button
            type="button"
            className={`flex-1 pb-3 text-center text-base font-semibold ${tab === "quick" ? "tab-active" : "text-[var(--ink-muted)]"}`}
            onClick={() => setTab("quick")}
          >
            Quick Add (AI)
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-center text-base font-semibold ${tab === "manual" ? "tab-active" : "text-[var(--ink-muted)]"}`}
            onClick={() => setTab("manual")}
          >
            Manual Entry
          </button>
        </div>

        {tab === "quick" ? (
          <div className="space-y-4">
            <div className="rounded-3xl border-l-4 border-[var(--primary)] bg-[rgba(223,228,255,0.6)] p-5 text-sm leading-7 text-[var(--ink)]">
              Type details like "Coffee 32k at Starbucks" and upload receipt photos when needed. FE calls OCR process endpoint, receives transactions, and renders confirmation cards below.
            </div>

            <div className="space-y-3 rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] p-5">
              <label className="block">
                <span className="mb-2 block text-sm uppercase tracking-[0.16em] text-[var(--ink-muted)]">Quick text input</span>
                <textarea
                  className="textarea"
                  placeholder="Lunch 45k at Pret\nGrab 34.500"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm uppercase tracking-[0.16em] text-[var(--ink-muted)]">Upload receipt photo</span>
                <input
                  className="field"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    replaceAttachment(file);
                    setLocalMessage(null);
                  }}
                />
              </label>

              {attachmentUri && selectedFile?.type.startsWith("image/") ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--line)]">
                  <Image src={attachmentUri} alt="Receipt preview" fill className="object-cover" unoptimized />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button type="button" className="cta-primary" onClick={handleParse} disabled={state.parsing}>
                  {state.parsing ? "AI is parsing..." : "Parse to Draft Cards"}
                </button>
                <button type="button" className="cta-secondary" onClick={discardAll}>
                  Discard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="font-heading text-2xl leading-none tracking-[-0.01em] text-[var(--ink)]">Expense Details</h3>
              <div className="mt-4 grid gap-3">
                <input
                  className="field"
                  placeholder="Title / Description"
                  value={manualTitle}
                  onChange={(event) => setManualTitle(event.target.value)}
                />
                <input
                  className="field"
                  placeholder="Merchant"
                  value={manualMerchant}
                  onChange={(event) => setManualMerchant(event.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="field"
                    placeholder="Amount"
                    inputMode="numeric"
                    value={manualAmount}
                    onChange={(event) => setManualAmount(event.target.value)}
                  />
                  <input
                    className="field"
                    type="date"
                    value={manualDate}
                    onChange={(event) => setManualDate(event.target.value)}
                  />
                </div>
                <select
                  className="select"
                  value={manualCategoryId}
                  onChange={(event) => setManualCategoryId(event.target.value)}
                >
                  {state.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-3 pt-2">
                  <button type="button" className="cta-secondary flex-1" onClick={discardAll}>
                    Add Another
                  </button>
                  <button type="button" className="cta-primary flex-1" onClick={addManualDraft}>
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(localMessage || state.errorMessage) ? (
          <div className="rounded-xl border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {localMessage ?? state.errorMessage}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="font-heading text-3xl leading-none tracking-[-0.02em] text-[var(--ink)]">Confirmation Cards</h3>
          <span className="rounded-full bg-[var(--surface-high)] px-3 py-1 text-sm text-[var(--ink-muted)]">
            {state.draftTransactions.length} drafts
          </span>
        </div>

        {state.draftTransactions.length === 0 ? (
          <EmptyState
            title="No drafts yet"
            description="Parse from OCR or add manual entries. Every draft must be confirmed before submit."
          />
        ) : (
          <div className="space-y-4">
            {state.draftTransactions.map((draft, index) => (
              <article key={draft.id} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">Draft {index + 1}</p>
                    <h4 className="mt-1 text-2xl leading-none tracking-[-0.01em] text-[var(--ink)]">
                      {draft.title || draft.merchant || "Untitled"}
                    </h4>
                  </div>
                  <button type="button" className="cta-danger" onClick={() => actions.removeDraft(draft.id)}>
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="field"
                    value={draft.title}
                    placeholder="Title"
                    onChange={(event) => actions.updateDraft(draft.id, { title: event.target.value })}
                  />
                  <input
                    className="field"
                    value={draft.merchant}
                    placeholder="Merchant"
                    onChange={(event) => actions.updateDraft(draft.id, { merchant: event.target.value })}
                  />
                  <input
                    className="field"
                    inputMode="numeric"
                    value={draft.amount ?? ""}
                    placeholder="Amount"
                    onChange={(event) => {
                      const value = event.target.value.trim();
                      actions.updateDraft(draft.id, {
                        amount: value ? Number(value.replace(/[^\d]/g, "")) : null
                      });
                    }}
                  />
                  <input
                    className="field"
                    type="date"
                    value={draft.dateTrx}
                    onChange={(event) => actions.updateDraft(draft.id, { dateTrx: event.target.value })}
                  />
                  <select
                    className="select md:col-span-2"
                    value={draft.categoryId ?? ""}
                    onChange={(event) => actions.updateDraft(draft.id, { categoryId: event.target.value })}
                  >
                    {state.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  <span className={`tag-chip ${draft.isValid ? "!bg-[rgba(0,113,78,0.18)] !text-[var(--success)]" : ""}`}>
                    {draft.isValid ? "Ready" : "Needs review"}
                  </span>
                  <span>Confidence {draft.parseConfidence ? `${Math.round(draft.parseConfidence * 100)}%` : "manual"}</span>
                </div>

                {draft.errors.amount ? <p className="mt-2 text-sm text-[var(--danger)]">{draft.errors.amount}</p> : null}
                {draft.errors.dateTrx ? <p className="mt-2 text-sm text-[var(--danger)]">{draft.errors.dateTrx}</p> : null}
                {draft.errors.title ? <p className="mt-2 text-sm text-[var(--danger)]">{draft.errors.title}</p> : null}
                {draft.errors.category ? <p className="mt-2 text-sm text-[var(--danger)]">{draft.errors.category}</p> : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <section className="floating-bar safe-bottom fixed bottom-20 left-0 right-0 z-20 border-y border-[var(--line)] px-5 py-3">
        <div className="mx-auto flex w-full max-w-xl gap-3">
          <button
            type="button"
            className="cta-primary flex-1"
            onClick={handleSubmit}
            disabled={state.parsing || state.submitting || state.draftTransactions.length === 0 || hasInvalidDrafts}
          >
            {state.submitting ? "Saving..." : "Submit All Transactions"}
          </button>
          <button type="button" className="cta-secondary px-5" onClick={discardAll}>
            Discard
          </button>
        </div>
      </section>
    </AppShell>
  );
}
