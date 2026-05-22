"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategory } from "@/types/domain";
import {
  updateCategory,
  deleteCategory,
  mergeCategory,
} from "@/app/admin/(dashboard)/categories/actions";

const field = "rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };

export function CategoryManager({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    });
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No categories yet — they appear here automatically as you add websites.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {categories.map((c) => (
        <CategoryRow
          key={c.id}
          category={c}
          others={categories.filter((o) => o.id !== c.id)}
          disabled={pending}
          onRename={(name) => run(() => updateCategory(c.id, name))}
          onMerge={(targetId) => run(() => mergeCategory(c.id, targetId))}
          onDelete={() => run(() => deleteCategory(c.id))}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  others,
  disabled,
  onRename,
  onMerge,
  onDelete,
}: {
  category: AdminCategory;
  others: AdminCategory[];
  disabled: boolean;
  onRename: (name: string) => void;
  onMerge: (targetId: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [mergeTarget, setMergeTarget] = useState("");

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface p-3"
      style={fieldStyle}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={field}
        style={fieldStyle}
      />
      <span className="text-sm text-ink-muted">
        {category.siteCount} {category.siteCount === 1 ? "site" : "sites"}
      </span>
      <button
        type="button"
        disabled={disabled || !name.trim() || name.trim() === category.name}
        onClick={() => onRename(name.trim())}
        className="rounded-lg border px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
        style={fieldStyle}
      >
        Rename
      </button>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={mergeTarget}
          onChange={(e) => setMergeTarget(e.target.value)}
          className={field}
          style={fieldStyle}
          disabled={disabled || others.length === 0}
        >
          <option value="">Merge into…</option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || !mergeTarget}
          onClick={() => {
            const target = others.find((o) => o.id === mergeTarget);
            if (
              target &&
              confirm(
                `Move all sites from "${category.name}" into "${target.name}" and delete "${category.name}"?`,
              )
            ) {
              onMerge(mergeTarget);
            }
          }}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
          style={fieldStyle}
        >
          Merge
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (
              confirm(
                `Delete "${category.name}"? Sites in it become uncategorised.`,
              )
            ) {
              onDelete();
            }
          }}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
