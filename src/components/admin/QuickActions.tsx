"use client";

import Link from "next/link";
import { useAdminPath } from "./AdminPathContext";

const ACTIONS = [
  { path: "/products/new", label: "Add product", primary: true },
  { path: "/products", label: "Manage products", primary: false },
  { path: "/categories", label: "Tidy categories", primary: false },
  { path: "/enquiries", label: "View enquiries", primary: false },
];

export function QuickActions() {
  const adminHref = useAdminPath();
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
      <div className="mt-3 flex flex-col gap-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.path}
            href={adminHref(a.path)}
            className={
              a.primary
                ? "rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white"
                : "rounded-lg border px-4 py-2 text-center text-sm font-medium text-ink"
            }
            style={a.primary ? undefined : { borderColor: "var(--color-hairline)" }}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
