import Link from "next/link";
import { logout } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sites", label: "Websites" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export function Sidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-oxford text-white">
      <div className="border-b border-white/10 p-5">
        <Link
          href="/admin"
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          8Caps Admin
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
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
