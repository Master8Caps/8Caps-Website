"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/types/domain";
import { slugify } from "@/lib/slugify";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/admin/(dashboard)/categories/actions";

const field = "rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

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

  function add() {
    if (!newName.trim()) return;
    run(async () => {
      const result = await createCategory({
        name: newName.trim(),
        slug: slugify(newName),
        description: newDesc.trim(),
      });
      if (result.ok) {
        setNewName("");
        setNewDesc("");
      }
      return result;
    });
  }

  return (
    <div className="space-y-6">
      {/* Add */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-card border bg-surface p-4"
        style={fieldStyle}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className={field}
          style={fieldStyle}
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description (optional)"
          className={field}
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* List */}
      <div className="space-y-2">
        {categories.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            disabled={pending}
            onSave={(name, description) =>
              run(() =>
                updateCategory(c.id, {
                  name,
                  slug: slugify(name),
                  description,
                }),
              )
            }
            onDelete={() => run(() => deleteCategory(c.id))}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  disabled,
  onSave,
  onDelete,
}: {
  category: Category;
  disabled: boolean;
  onSave: (name: string, description: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");

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
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className={field}
        style={fieldStyle}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSave(name, description)}
        className="rounded-lg border px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
        style={fieldStyle}
      >
        Save
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (confirm(`Delete "${category.name}"? Sites in it become uncategorised.`)) {
            onDelete();
          }
        }}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
