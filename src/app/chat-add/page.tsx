"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseChatInput } from "@/lib/utils/chat-parser";
import { TransactionFormFields } from "@/components/transaction-form-fields";
import { createId } from "@/lib/utils/id";
import { getTodayDate } from "@/lib/utils/date";
import { useAppStore } from "@/providers/app-store";
import { UNCATEGORIZED_CATEGORY_ID, type DraftTransaction } from "@/types/app";

type TrackingMode = "manual" | "photo-ocr" | "chat-parsing" | null;

function ChatTopBar({
  title,
  onBack
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <button
          type="button"
          className="flex h-9 min-w-16 items-center justify-start rounded-md px-2 text-sm font-medium text-[var(--primary)]"
          onClick={onBack}
          aria-label="Back"
        >
          ← Back
        </button>
        <h1 className="font-heading text-lg font-semibold text-[var(--ink)]">{title}</h1>
        <div className="h-9 min-w-16" aria-hidden />
      </div>
    </header>
  );
}

export default function ChatAddPage() {
  const { state, actions } = useAppStore();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"receipt" | "bank-notification">("receipt");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(getTodayDate());
  const [manualCategoryId, setManualCategoryId] = useState(UNCATEGORIZED_CATEGORY_ID);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    title: string;
    merchant: string;
    amount: string;
    dateTrx: string;
    categoryId: string;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [trackingMode, state.draftTransactions]);

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

  function resetMode() {
    setTrackingMode(null);
    setChatInput("");
    replaceAttachment(null);
    setLocalMessage(null);
    setManualTitle("");
    setManualMerchant("");
    setManualAmount("");
    setManualDate(getTodayDate());
    setManualCategoryId(UNCATEGORIZED_CATEGORY_ID);
    setEditingDraftId(null);
    setEditValues(null);
  }

  function openDraftEdit(draft: DraftTransaction) {
    setEditingDraftId(draft.id);
    setEditValues({
      title: draft.title,
      merchant: draft.merchant,
      amount: draft.amount?.toString() || "",
      dateTrx: draft.dateTrx,
      categoryId: draft.categoryId || UNCATEGORIZED_CATEGORY_ID
    });
  }

  function closeDraftEdit() {
    setEditingDraftId(null);
    setEditValues(null);
  }

  function saveDraftEdit() {
    if (!editValues || !editingDraftId) return;

    const category = state.categories.find((item) => item.id === editValues.categoryId);
    const parsedAmount = editValues.amount ? Number(editValues.amount.replace(/[^\d]/g, "")) : null;

    actions.updateDraft(editingDraftId, {
      title: editValues.title,
      merchant: editValues.merchant,
      amount: parsedAmount && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
      dateTrx: editValues.dateTrx,
      categoryId: editValues.categoryId,
      categoryLabel: category?.name ?? "Uncategorized"
    });

    closeDraftEdit();
  }

  function DraftCard({ draft }: { draft: DraftTransaction }) {
    const isEditing = editingDraftId === draft.id;

    if (isEditing && editValues) {
      return (
        <article className="rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="space-y-4">
            <TransactionFormFields
              values={editValues}
              categories={state.categories}
              errors={draft.errors}
              onChange={(field, value) => {
                setEditValues({
                  ...editValues,
                  [field]: value
                });
              }}
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 cta-secondary"
                onClick={closeDraftEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 cta-primary"
                onClick={saveDraftEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </article>
      );
    }

    return (
      <article
        onClick={() => openDraftEdit(draft)}
        className="rounded-xl border border-[var(--line)] bg-white p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-[var(--ink)]">
              {draft.title || draft.merchant || "Untitled"}
            </h4>
            <p className="text-sm text-[var(--ink-muted)]">Rp {draft.amount?.toLocaleString() || "0"}</p>
            <div className="flex gap-2 mt-2 flex-wrap text-xs">
              <span className="text-[var(--ink-muted)]">{draft.categoryLabel}</span>
              <span className="text-[var(--ink-muted)]">{draft.dateTrx}</span>
              {draft.parseConfidence && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {draft.parseConfidence}% confidence
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="text-[var(--danger)] text-lg flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              actions.removeDraft(draft.id);
            }}
          >
            ×
          </button>
        </div>
      </article>
    );
  }

  // Manual form submission
  function addManualDraft() {
    if (!manualMerchant.trim() && !manualTitle.trim()) {
      setLocalMessage("Please enter a title or merchant.");
      return;
    }

    const category = state.categories.find((item) => item.id === manualCategoryId);
    const parsedAmount = manualAmount ? Number(manualAmount.replace(/[^\d]/g, "")) : null;

    const draft: DraftTransaction = {
      id: createId("draft"),
      merchant: manualMerchant.trim(),
      title: manualTitle.trim(),
      amount: parsedAmount && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
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
    setLocalMessage(null);
  }

  // Photo OCR submission
  async function handleUploadPhoto() {
    if (!selectedFile) {
      setLocalMessage("Please select a photo first.");
      return;
    }

    setLocalMessage(null);
    await actions.parseDrafts({
      file: selectedFile,
      attachmentUri,
      sourceType
    });
  }

  // Chat parsing submission
  function handleChatParsing() {
    if (!chatInput.trim()) {
      setLocalMessage("Type a message first.");
      return;
    }

    const messages = parseChatInput(chatInput);
    
    if (messages.length === 0) {
      setLocalMessage("Unable to parse. Try: 'Coffee 50k' or 'Lunch 75000 at Warung'");
      return;
    }

    const newDrafts: DraftTransaction[] = messages.map((msg) => {
      const category = state.categories.find(
        (c) => c.name.toLowerCase() === (msg.category?.toLowerCase() ?? "")
      ) || state.categories.find((c) => c.id === UNCATEGORIZED_CATEGORY_ID);

      return {
        id: createId("draft"),
        merchant: msg.merchant ?? "Unknown",
        title: msg.title ?? msg.merchant ?? "Expense",
        amount: msg.amount ?? null,
        dateTrx: getTodayDate(),
        categoryId: category?.id ?? UNCATEGORIZED_CATEGORY_ID,
        categoryLabel: category?.name ?? "Uncategorized",
        attachmentUri: null,
        parseConfidence: Math.round(msg.confidence * 100),
        errors: {},
        isValid: false
      };
    });

    actions.setDraftTransactions([...state.draftTransactions, ...newDrafts]);
    setChatInput("");
    setLocalMessage(null);
  }

  async function handleSubmit() {
    const isValid = actions.validateDrafts();
    if (!isValid) {
      return;
    }

    const conflicts = actions.getSimilarityConflicts();
    if (conflicts.length > 0) {
      router.push("/chat-add/similarity");
      return;
    }

    const ok = await actions.submitDrafts();
    if (!ok) return;
    router.push("/expenses");
  }

  function discardAll() {
    actions.discardDrafts();
    resetMode();
  }

  // If no mode selected, show selector
  if (trackingMode === null) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[var(--background)] to-[var(--surface-high)] overflow-hidden">
        <ChatTopBar title="Add Expense" onBack={() => router.push("/expenses")} />

        {/* Chat-style message area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-5 space-y-6">
          <div className="mx-auto max-w-lg">
            {/* Assistant message */}
            <div className="mb-6">
              <div className="inline-flex rounded-2xl rounded-tl-none bg-[var(--surface)] px-4 py-3 shadow-sm">
                <p className="text-center text-[var(--ink)]">
                  How would you like to <br /> <strong>track your expense?</strong>
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setTrackingMode("manual")}
                className="w-full rounded-2xl bg-[#E7F5FF] border-2 border-[#B3E5FC] px-4 py-4 text-left hover:bg-[#B3E5FC] transition-colors"
              >
                <div className="text-sm font-semibold text-[#0277BD]">📝 Manual Form</div>
                <div className="mt-1 text-xs text-[#0277BD] opacity-80">Fill in details by hand</div>
              </button>

              <button
                type="button"
                onClick={() => setTrackingMode("photo-ocr")}
                className="w-full rounded-2xl bg-[#F3E5F5] border-2 border-[#CE93D8] px-4 py-4 text-left hover:bg-[#CE93D8] transition-colors"
              >
                <div className="text-sm font-semibold text-[#7B1FA2]">📸 Photo OCR</div>
                <div className="mt-1 text-xs text-[#7B1FA2] opacity-80">Scan receipt or bank notification</div>
              </button>

              <button
                type="button"
                onClick={() => setTrackingMode("chat-parsing")}
                className="w-full rounded-2xl bg-[#E8F5E9] border-2 border-[#81C784] px-4 py-4 text-left hover:bg-[#81C784] transition-colors"
              >
                <div className="text-sm font-semibold text-[#2E7D32]">💬 Chat Parsing</div>
                <div className="mt-1 text-xs text-[#2E7D32] opacity-80">Type like you're chatting</div>
              </button>
            </div>
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>
    );
  }

  // Manual form mode
  if (trackingMode === "manual") {
    return (
      <div className="flex-1 flex flex-col bg-[var(--background)]">
        <ChatTopBar title="Manual Entry" onBack={resetMode} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="mx-auto max-w-lg space-y-4">
            {/* Form */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5 space-y-4">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              {localMessage && (
                <div className="rounded-xl border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                  {localMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <button type="button" className="cta-secondary w-full" onClick={() => setManualTitle("")}>
                  Add Another
                </button>
                <button type="button" className="cta-primary w-full" onClick={addManualDraft}>
                  Save Entry
                </button>
              </div>
            </div>

            {/* Drafts list */}
            {state.draftTransactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                  Drafts ({state.draftTransactions.length})
                </h3>
                {state.draftTransactions.map((draft, index) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="sticky bottom-0 left-0 right-0 border-t border-[var(--line)] bg-white px-4 py-3 sm:px-5">
          <div className="mx-auto max-w-2xl grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className="cta-secondary"
              onClick={discardAll}
              disabled={state.draftTransactions.length === 0}
            >
              Discard All
            </button>
            <button
              type="button"
              className="cta-primary"
              onClick={handleSubmit}
              disabled={state.submitting || state.draftTransactions.length === 0}
            >
              {state.submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Photo OCR mode
  if (trackingMode === "photo-ocr") {
    return (
      <div className="flex-1 flex flex-col bg-[var(--background)]">
        <ChatTopBar title="Photo OCR" onBack={resetMode} />

        {state.parsing ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="rounded-2xl border border-[var(--line)] bg-white px-6 py-5 text-center shadow-lg">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--surface-high)] border-t-[var(--primary)]" />
              <p className="mt-4 text-sm font-medium text-[var(--ink)]">Processing OCR...</p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">Please wait while we read your document.</p>
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 pb-32">
          <div className="mx-auto max-w-lg space-y-4">
            {/* Form */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5 space-y-4">
              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--ink-muted)]">
                    Source Type
                  </span>
                  <select
                    className="select w-full"
                    value={sourceType}
                    onChange={(event) => setSourceType(event.target.value as "receipt" | "bank-notification")}
                  >
                    <option value="receipt">Receipt (Expense Parser)</option>
                    <option value="bank-notification">Bank Notification (Document Reader)</option>
                  </select>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    {sourceType === "receipt"
                      ? "Use for receipts and invoices"
                      : "Use for bank transaction notifications"}
                  </p>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--ink-muted)]">
                  Upload Photo
                </span>
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

              {attachmentUri && selectedFile?.type.startsWith("image/") && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--line)]">
                  <Image
                    src={attachmentUri}
                    alt="Receipt preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {localMessage && (
                <div className="rounded-xl border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                  {localMessage}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  className="cta-primary w-full"
                  onClick={handleUploadPhoto}
                  disabled={!selectedFile || state.parsing}
                >
                  {state.parsing ? "Processing..." : "Process Photo"}
                </button>
              </div>
            </div>

            {/* Drafts list */}
            {state.draftTransactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                  Drafts ({state.draftTransactions.length})
                </h3>
                {state.draftTransactions.map((draft, index) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="sticky bottom-0 left-0 right-0 border-t border-[var(--line)] bg-white px-4 py-3 sm:px-5">
          <div className="mx-auto max-w-2xl grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className="cta-secondary"
              onClick={discardAll}
              disabled={state.draftTransactions.length === 0}
            >
              Discard All
            </button>
            <button
              type="button"
              className="cta-primary"
              onClick={handleSubmit}
              disabled={state.submitting || state.draftTransactions.length === 0}
            >
              {state.submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat parsing mode
  if (trackingMode === "chat-parsing") {
    return (
      <div className="flex-1 flex flex-col bg-[var(--background)]">
        <ChatTopBar title="Chat Parsing" onBack={resetMode} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 pb-32">
          <div className="mx-auto max-w-lg space-y-4">
            {/* Input area */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5 space-y-4">
              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--ink-muted)]">
                    Describe your expenses
                  </span>
                  <textarea
                    className="textarea min-h-24"
                    placeholder="Coffee 50k&#10;Lunch 75000 at Warung&#10;Grab 34.5k"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                  />
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    Type each expense on a new line. Format: "amount merchant category" or "merchant amount"
                  </p>
                </label>
              </div>

              {localMessage && (
                <div className="rounded-xl border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                  {localMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="cta-secondary w-full"
                  onClick={resetMode}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="cta-primary w-full"
                  onClick={handleChatParsing}
                  disabled={!chatInput.trim()}
                >
                  Parse
                </button>
              </div>
            </div>

            {/* Drafts list */}
            {state.draftTransactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                  Parsed Expenses ({state.draftTransactions.length})
                </h3>
                {state.draftTransactions.map((draft, index) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="sticky bottom-0 left-0 right-0 border-t border-[var(--line)] bg-white px-4 py-3 sm:px-5">
          <div className="mx-auto max-w-2xl grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className="cta-secondary"
              onClick={discardAll}
              disabled={state.draftTransactions.length === 0}
            >
              Discard All
            </button>
            <button
              type="button"
              className="cta-primary"
              onClick={handleSubmit}
              disabled={state.submitting || state.draftTransactions.length === 0}
            >
              {state.submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
