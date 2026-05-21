import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { getDashboardStats } from "@/lib/data/admin";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">
        An overview of the 8Caps directory.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total websites" value={stats.totalSites} />
        <StatCard label="Published" value={stats.publishedSites} />
        <StatCard label="Drafts" value={stats.draftSites} />
        <StatCard label="Categories" value={stats.categories} />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/sites/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Add a website
        </Link>
        <Link
          href="/admin/sites"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-ink"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          Manage websites
        </Link>
      </div>
    </div>
  );
}
