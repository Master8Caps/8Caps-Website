"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Briefcase,
  Tag,
  Inbox,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/brand/Logo";
import { useAdminPath } from "./AdminPathContext";

const NAV: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/products", label: "Products", icon: Package },
  { path: "/case-studies", label: "Case studies", icon: Briefcase },
  { path: "/categories", label: "Categories", icon: Tag },
  { path: "/enquiries", label: "Enquiries", icon: Inbox },
];

export function Sidebar({
  email,
  newEnquiries = 0,
}: {
  email: string;
  newEnquiries?: number;
}) {
  const adminHref = useAdminPath();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    const href = adminHref(path);
    if (path === "/") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile top bar — visible below lg, where the sidebar is a drawer */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-oxford px-4 text-white lg:hidden">
        <Link
          href={adminHref("/")}
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <Logo variant="lockup" className="h-8 w-auto" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Scrim behind the open drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-oxford-deep/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col bg-oxford text-white transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <Link
            href={adminHref("/")}
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Logo variant="lockup" className="h-8 w-auto" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const badge =
              item.path === "/enquiries" && newEnquiries > 0
                ? newEnquiries
                : null;
            return (
              <Link
                key={item.path}
                href={adminHref(item.path)}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 font-semibold text-white"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-accent"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.label}</span>
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
          <p className="truncate px-3 pb-2 text-xs text-white/45">{email}</p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
