"use client";

import type { Tag } from "@/types/domain";

export function TagSelector({
  allTags,
  selected,
  onChange,
}: {
  allTags: Tag[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((t) => t !== id)
        : [...selected, id],
    );
  }

  if (allTags.length === 0) {
    return <p className="text-sm text-ink-muted">No tags exist yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              active
                ? "bg-accent text-white"
                : "border text-ink-muted"
            }`}
            style={active ? undefined : { borderColor: "var(--color-hairline)" }}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
