"use client";

import Link from "next/link";
import { Clock, CheckCircle2, Star, type LucideIcon } from "lucide-react";
import { statusFor } from "@/lib/case-study-status";
import type { AdminCaseStudyRow, CaseStudyStatus } from "@/types/case-study";
import { useAdminPath } from "./AdminPathContext";
import { CaseStudyApproveButton } from "./CaseStudyApproveButton";

const STATUS_STYLE: Record<CaseStudyStatus, string> = {
  pending: "bg-soon-bg text-soon",
  live: "bg-live-bg text-live",
  draft: "bg-black/5 text-ink-muted",
  archived: "bg-black/5 text-ink-muted",
};

const STATUS_LABEL: Record<CaseStudyStatus, string> = {
  pending: "Pending",
  live: "Live",
  draft: "Draft",
  archived: "Archived",
};

const STATUS_ICON: Partial<Record<CaseStudyStatus, LucideIcon>> = {
  pending: Clock,
  live: CheckCircle2,
};

export function CaseStudyList({ rows }: { rows: AdminCaseStudyRow[] }) {
  const adminHref = useAdminPath();

  if (rows.length === 0) {
    return (
      <div
        className="rounded-card border bg-surface p-8 text-center text-ink-muted"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        No case studies yet.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-card border bg-surface shadow-soft"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left text-ink-muted"
            style={{ borderColor: "var(--color-hairline)" }}
          >
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Sector</th>
            <th className="px-4 py-3 font-medium">Year</th>
            <th className="px-4 py-3 font-medium">Featured</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = statusFor(row);
            const StatusIcon = STATUS_ICON[status];
            return (
              <tr
                key={row.id}
                className="border-b transition-colors last:border-0 hover:bg-surface-muted"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                <td className="px-4 py-3 font-medium text-ink">
                  <Link
                    href={adminHref(`/case-studies/${row.id}/edit`)}
                    className="hover:text-accent"
                  >
                    {row.clientName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{row.clientSector ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{row.year ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {row.isFeatured ? (
                    <Star
                      className="h-4 w-4 fill-soon text-soon"
                      aria-label="Featured"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                  >
                    {StatusIcon && (
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {STATUS_LABEL[status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {status === "pending" && (
                    <CaseStudyApproveButton id={row.id} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
