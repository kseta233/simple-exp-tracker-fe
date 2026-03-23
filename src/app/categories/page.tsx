"use client";

import { useMemo, useState } from "react";
import { AppShell, SectionCard } from "@/components/app-shell";
import { getCategoryUsageCount } from "@/lib/utils/selectors";
import { useAppStore } from "@/providers/app-store";
import { UNCATEGORIZED_CATEGORY_ID } from "@/types/app";

const ROW_ICON_BG = ["#f2dfc3", "#d7e6fb", "#e4d8f6", "#d8f2e6", "#f8dbe1", "#e8ebf0"];

export default function CategoriesPage() {
  const { state, actions } = useAppStore();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const categoryUsage = useMemo(
    () =>
      Object.fromEntries(
        state.categories.map((category) => [category.id, getCategoryUsageCount(state.transactions, category.id)])
      ),
    [state.categories, state.transactions]
  );

  async function handleCreateCategory() {
    const result = await actions.createCategory(newCategoryName);

    if (!result.ok) {
      setMessage(result.message ?? "Failed to create category.");
      return;
    }

    setNewCategoryName("");
    setMessage(null);
  }

  async function handleRenameCategory() {
    if (!editingId) {
      return;
    }

    const result = await actions.renameCategory(editingId, editingValue);

    if (!result.ok) {
      setMessage(result.message ?? "Failed to rename category.");
      return;
    }

    setEditingId(null);
    setEditingValue("");
    setMessage(null);
  }

  async function handleDeleteCategory(categoryId: string, categoryName: string) {
    const confirmed = window.confirm(
      `${categoryName} will be deleted. Any linked transactions will move to Uncategorized.`
    );

    if (!confirmed) {
      return;
    }

    const result = await actions.deleteCategory(categoryId);

    if (!result.ok) {
      setMessage(result.message ?? "Failed to delete category.");
      return;
    }

    setMessage(null);
  }

  return (
    <AppShell title="Categories" eyebrow="Manage Buckets">
      <SectionCard className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-muted)]">Create New</p>
        <div className="flex gap-3">
          <input
            className="field"
            value={newCategoryName}
            maxLength={30}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Category Name"
          />
          <button type="button" className="cta-primary min-w-28" onClick={handleCreateCategory}>
            Add
          </button>
        </div>
        {message ? (
          <p className="rounded-xl border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {message}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-3xl leading-none tracking-[-0.02em] text-[var(--ink)]">Active Categories</h3>
          <span className="rounded-full bg-[var(--surface-high)] px-3 py-1 text-sm text-[var(--ink-muted)]">
            {state.categories.length} Total
          </span>
        </div>

        <div className="space-y-3">
          {state.categories.map((category, index) => {
            const usageCount = categoryUsage[category.id] ?? 0;
            const isEditing = editingId === category.id;
            const isProtected = category.id === UNCATEGORIZED_CATEGORY_ID;

            return (
              <article
                key={category.id}
                className={`rounded-3xl border p-4 ${
                  isProtected
                    ? "border-dashed border-[var(--line)] bg-[var(--surface-low)] opacity-80"
                    : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-[var(--primary)]"
                      style={{ backgroundColor: ROW_ICON_BG[index % ROW_ICON_BG.length] }}
                    >
                      {category.name.slice(0, 1).toUpperCase()}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="field min-w-44"
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          maxLength={30}
                        />
                        <button type="button" className="cta-primary" onClick={handleRenameCategory}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="cta-secondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditingValue("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-2xl leading-none tracking-[-0.01em] text-[var(--ink)]">{category.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                          {isProtected ? "Locked" : `${usageCount} linked transactions`}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="cta-secondary"
                        disabled={isProtected}
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingValue(category.name);
                          setMessage(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="cta-danger"
                        disabled={isProtected}
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="rounded-3xl bg-[rgba(223,228,255,0.56)] px-4 py-4 text-sm leading-7 text-[var(--primary)]">
          Deleting a category remaps linked transactions into Uncategorized to keep records consistent.
        </div>
      </SectionCard>
    </AppShell>
  );
}
