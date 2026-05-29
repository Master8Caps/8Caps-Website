"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAdminPath } from "./AdminPathContext";

export function PendingApprovalCallout({ count }: { count: number }) {
  const adminHref = useAdminPath();
  if (count === 0) return null;

  const noun = count === 1 ? "case study" : "case studies";

  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <span className="flex items-center gap-2.5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <span>
          <strong>{count} {noun}</strong> pending approval
        </span>
      </span>
      <Link
        href={`${adminHref("/case-studies")}?status=pending`}
        className="rounded-lg bg-amber-900 px-3 py-1 text-xs font-semibold text-white"
      >
        Review →
      </Link>
    </div>
  );
}
