"use client";

import Link from "next/link";
import { PROJECT_TYPE_LABELS } from "@/lib/contact-form";
import {
  ENQUIRY_STATUS_LABEL,
  ENQUIRY_STATUS_STYLE,
  formatEnquiryDate,
} from "@/lib/enquiries";
import type { AdminEnquiry } from "@/types/domain";
import { useAdminPath } from "./AdminPathContext";

export function EnquiryList({ rows }: { rows: AdminEnquiry[] }) {
  const adminHref = useAdminPath();

  if (rows.length === 0) {
    return (
      <div
        className="rounded-card border bg-surface p-8 text-center text-ink-muted"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        No enquiries here yet.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-card border bg-surface"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left text-ink-muted"
            style={{ borderColor: "var(--color-hairline)" }}
          >
            <th className="px-4 py-3 font-medium">From</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Received</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const unread = row.status === "new";
            return (
              <tr
                key={row.id}
                className="border-b last:border-0"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={adminHref(`/enquiries/${row.id}`)}
                    className={`flex items-center gap-2 hover:text-accent ${
                      unread ? "font-semibold text-ink" : "text-ink-muted"
                    }`}
                  >
                    {unread && (
                      <span
                        aria-label="Unread"
                        className="h-2 w-2 shrink-0 rounded-full bg-accent"
                      />
                    )}
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{row.company ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {row.projectType ? PROJECT_TYPE_LABELS[row.projectType] : "—"}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {formatEnquiryDate(row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ENQUIRY_STATUS_STYLE[row.status]}`}
                  >
                    {ENQUIRY_STATUS_LABEL[row.status]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
