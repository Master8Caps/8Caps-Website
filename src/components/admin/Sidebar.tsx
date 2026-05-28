"use client";

import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/brand/Logo";
import { useAdminPath } from "./AdminPathContext";

const NAV = [
  { path: "/", label: "Dashboard" },
  { path: "/products", label: "Products" },
  { path: "/case-studies", label: "Case studies" },
  { path: "/categories", label: "Categories" },
  { path: "/enquiries", label: "Enquiries" },
];

export function Sidebar({
  email,
  newEnquiries = 0,
}: {
  email: string;
  newEnquiries?: number;
}) {
  const adminHref = useAdminPath();
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-oxford text-white">
      <div className="border-b border-white/10 p-5">
        <Link href={adminHref("/")} className="flex items-center gap-2">
          <Logo variant="lockup" className="h-6 w-auto" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
            Admin
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const badge =
            item.path === "/enquiries" && newEnquiries > 0 ? newEnquiries : null;
          return (
            <Link
              key={item.path}
              href={adminHref(item.path)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              <span>{item.label}</span>
              {badge !== null && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-3 pb-2 text-xs text-white/45">{email}</p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
