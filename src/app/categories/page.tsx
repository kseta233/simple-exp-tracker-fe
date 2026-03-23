"use client";

import { useMemo, useState } from "react";
import { AppShell, SectionCard } from "@/components/app-shell";
import { getCategoryUsageCount } from "@/lib/utils/selectors";
import { useAppStore } from "@/providers/app-store";
import { UNCATEGORIZED_CATEGORY_ID } from "@/types/app";

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
    <AppShell title="Categories" eyebrow="Category CRUD">
      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionCard className="space-y-4 animate-rise">
          <div>
            <h2 className="font-heading text-3xl text-[var(--ink-strong)]">Add category</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Categories are local-only in this MVP and immediately available in the draft flow.
            </p>
          </div>

          <label className="block text-sm font-semibold text-[var(--ink-strong)]">
            Category name
            <input
              className="field mt-2"
              value={newCategoryName}
              maxLength={30}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Example: Health"
            />
          </label>

          <button type="button" className="cta-primary" onClick={handleCreateCategory}>
            Add category
          </button>

          {message ? (
            <p className="rounded-[22px] border border-[rgba(180,75,55,0.15)] bg-[rgba(180,75,55,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
              {message}
            </p>
          ) : null}
        </SectionCard>

        <SectionCard className="animate-rise [animation-delay:120ms]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl text-[var(--ink-strong)]">Manage local categories</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Deleting a used category automatically remaps old transactions to Uncategorized.
              </p>
            </div>
            <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
              {state.categories.length} categories
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {state.categories.map((category) => {
              const usageCount = categoryUsage[category.id] ?? 0;
              const isEditing = editingId === category.id;
              const isProtected = category.id === UNCATEGORIZED_CATEGORY_ID;

              return (
                <article
                  key={category.id}
                  className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-[0_12px_32px_rgba(56,39,25,0.07)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <input
                            className="field"
                            value={editingValue}
                            onChange={(event) => setEditingValue(event.target.value)}
                            maxLength={30}
                          />
                          <div className="flex gap-2">
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
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold text-[var(--ink-strong)]">{category.name}</h3>
                            {isProtected ? <span className="tag-chip">Protected</span> : null}
                          </div>
                          <p className="mt-2 text-sm text-[var(--ink-soft)]">
                            Used by {usageCount} transaction{usageCount === 1 ? "" : "s"}
                          </p>
                        </>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="cta-secondary"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingValue(category.name);
                            setMessage(null);
                          }}
                          disabled={isProtected}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="cta-danger"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          disabled={isProtected}
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
        </SectionCard>
      </section>
    </AppShell>
  );
}
