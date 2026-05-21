"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/types/domain";

/**
 * Delete button for the site edit page. Confirms before running the
 * (destructive, cascading) delete and surfaces any error — the bound
 * server action redirects on success, so only failures return here.
 */
export function DeleteSiteButton({
  onDelete,
}: {
  onDelete: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Delete this website permanently? Its services, screenshots and tags go with it. This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      // A successful delete redirects and never returns; only errors arrive here.
      if (result && !result.ok) {
        setError(result.error ?? "Could not delete this website.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
