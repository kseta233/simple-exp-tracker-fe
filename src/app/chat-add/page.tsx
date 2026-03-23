"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, EmptyState, SectionCard } from "@/components/app-shell";
import { useAppStore } from "@/providers/app-store";

export default function ChatAddPage() {
  const { state, actions } = useAppStore();
  const router = useRouter();
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

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
      setLocalMessage("Add text, an image, or both before parsing.");
      return;
    }

    setLocalMessage(null);
    await actions.parseDrafts({
      text,
      file: selectedFile,
      attachmentUri
    });
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
    <AppShell title="Add Expense" eyebrow="Chat Add Transaction">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard className="space-y-5 animate-rise">
          <div>
            <h2 className="font-heading text-3xl text-[var(--ink-strong)]">Composer</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Drop a quick note, attach one image, and generate confirmation cards before anything is saved.
            </p>
          </div>

          <label className="block text-sm font-semibold text-[var(--ink-strong)]">
            What happened?
            <textarea
              className="textarea mt-2"
              placeholder="Lunch 45k KFC&#10;Coffee 32rb"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>

          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col rounded-[24px] border border-dashed border-[rgba(194,91,52,0.35)] bg-[rgba(255,255,255,0.66)] px-4 py-5 text-sm text-[var(--ink-soft)]">
              <span className="font-semibold text-[var(--ink-strong)]">Upload one receipt or photo</span>
              <span className="mt-1">PNG, JPG, WEBP, or PDF. One image for MVP.</span>
              <input
                className="hidden"
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  replaceAttachment(file);
                  setLocalMessage(null);
                }}
              />
            </label>

            {attachmentUri ? (
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-strong)]">{selectedFile?.name ?? "Attachment ready"}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Preview before parse</p>
                  </div>
                  <button type="button" className="cta-secondary" onClick={() => replaceAttachment(null)}>
                    Remove
                  </button>
                </div>
                {selectedFile?.type.startsWith("image/") ? (
                  <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[20px]">
                    <Image src={attachmentUri} alt="Receipt preview" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {(localMessage || state.errorMessage) ? (
            <div className="rounded-[22px] border border-[rgba(180,75,55,0.15)] bg-[rgba(180,75,55,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
              {localMessage ?? state.errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" className="cta-primary" onClick={handleParse} disabled={state.parsing}>
              {state.parsing ? "Parsing..." : "Parse draft"}
            </button>
            <button type="button" className="cta-secondary" onClick={discardAll}>
              Discard
            </button>
          </div>
        </SectionCard>

        <SectionCard className="space-y-5 animate-rise [animation-delay:120ms]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl text-[var(--ink-strong)]">Confirmation cards</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Fix every draft here. Submit stays disabled until all cards validate.
              </p>
            </div>
            <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
              {state.draftTransactions.length} draft{state.draftTransactions.length === 1 ? "" : "s"}
            </div>
          </div>

          {state.draftTransactions.length === 0 ? (
            <EmptyState
              title="No drafts yet"
              description="Use text, an image, or both. When parsing finishes, each extracted transaction appears as its own editable card."
            />
          ) : (
            <div className="space-y-4">
              {state.draftTransactions.map((draft, index) => (
                <article
                  key={draft.id}
                  className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-[0_12px_32px_rgba(56,39,25,0.07)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">Transaction {index + 1}</p>
                      <h3 className="mt-1 text-xl font-semibold text-[var(--ink-strong)]">
                        {draft.title || draft.merchant || "Untitled draft"}
                      </h3>
                    </div>
                    <div className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${draft.isValid ? "bg-[rgba(44,110,73,0.12)] text-[var(--success)]" : "bg-[rgba(180,75,55,0.1)] text-[var(--danger)]"}`}>
                      {draft.isValid ? "Ready" : "Needs review"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium text-[var(--ink-strong)]">
                      Title
                      <input
                        className="field mt-2"
                        value={draft.title}
                        onChange={(event) => actions.updateDraft(draft.id, { title: event.target.value })}
                      />
                      {draft.errors.title ? <span className="mt-2 block text-xs text-[var(--danger)]">{draft.errors.title}</span> : null}
                    </label>
                    <label className="text-sm font-medium text-[var(--ink-strong)]">
                      Merchant
                      <input
                        className="field mt-2"
                        value={draft.merchant}
                        onChange={(event) => actions.updateDraft(draft.id, { merchant: event.target.value })}
                      />
                    </label>
                    <label className="text-sm font-medium text-[var(--ink-strong)]">
                      Amount
                      <input
                        className="field mt-2"
                        inputMode="numeric"
                        value={draft.amount ?? ""}
                        onChange={(event) => {
                          const value = event.target.value.trim();
                          actions.updateDraft(draft.id, {
                            amount: value ? Number(value.replace(/[^\d]/g, "")) : null
                          });
                        }}
                      />
                      {draft.errors.amount ? <span className="mt-2 block text-xs text-[var(--danger)]">{draft.errors.amount}</span> : null}
                    </label>
                    <label className="text-sm font-medium text-[var(--ink-strong)]">
                      Date
                      <input
                        className="field mt-2"
                        type="date"
                        value={draft.dateTrx}
                        onChange={(event) => actions.updateDraft(draft.id, { dateTrx: event.target.value })}
                      />
                      {draft.errors.dateTrx ? <span className="mt-2 block text-xs text-[var(--danger)]">{draft.errors.dateTrx}</span> : null}
                    </label>
                    <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2">
                      Category
                      <select
                        className="select mt-2"
                        value={draft.categoryId ?? ""}
                        onChange={(event) => actions.updateDraft(draft.id, { categoryId: event.target.value })}
                      >
                        {state.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {draft.errors.category ? <span className="mt-2 block text-xs text-[var(--danger)]">{draft.errors.category}</span> : null}
                    </label>
                  </div>

                  {draft.attachmentUri ? (
                    <div className="relative mt-4 aspect-[5/2] overflow-hidden rounded-[20px] bg-[rgba(125,95,74,0.08)]">
                      <Image src={draft.attachmentUri} alt="Draft attachment" fill className="object-cover" unoptimized />
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                      Confidence {draft.parseConfidence ? `${Math.round(draft.parseConfidence * 100)}%` : "manual review"}
                    </p>
                    <button type="button" className="cta-danger" onClick={() => actions.removeDraft(draft.id)}>
                      Delete draft
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              className="cta-primary"
              onClick={handleSubmit}
              disabled={state.parsing || state.submitting || state.draftTransactions.length === 0 || hasInvalidDrafts}
            >
              {state.submitting ? "Saving..." : "Submit All"}
            </button>
            <button type="button" className="cta-secondary" onClick={discardAll}>
              Discard drafts
            </button>
            {hasInvalidDrafts ? (
              <p className="self-center text-sm text-[var(--danger)]">Invalid cards need fixing before submit.</p>
            ) : null}
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
