"use client";

import { useState, type KeyboardEvent } from "react";

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface px-3 py-2"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
        >
          {tag}
          <button
            type="button"
            aria-label={`remove ${tag}`}
            onClick={() => remove(tag)}
            className="text-accent/70 hover:text-accent"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 min-w-[8rem] border-none bg-transparent text-sm outline-none"
      />
    </div>
  );
}
