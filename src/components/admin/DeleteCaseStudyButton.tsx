"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/types/domain";

export function DeleteCaseStudyButton({
  onDelete,
}: {
  onDelete: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Delete this case study permanently? Its services links go with it. This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result && !result.ok) {
        setError(result.error ?? "Could not delete this case study.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
