"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useAdminPath } from "./AdminPathContext";

export function NewEnquiriesCallout({ count }: { count: number }) {
  const adminHref = useAdminPath();
  if (count === 0) return null;

  const noun = count === 1 ? "enquiry" : "enquiries";

  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-sky-300 bg-sky-50 p-4 text-sm text-sky-900">
      <span className="flex items-center gap-2.5">
        <Mail className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
        <span>
          <strong>{count} new {noun}</strong> from the contact form
        </span>
      </span>
      <Link
        href={`${adminHref("/enquiries")}?status=new`}
        className="rounded-lg bg-sky-900 px-3 py-1 text-xs font-semibold text-white"
      >
        View inbox →
      </Link>
    </div>
  );
}
