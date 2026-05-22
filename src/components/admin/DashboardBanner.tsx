import Link from "next/link";
import { greetingFor } from "@/lib/greeting";

export function DashboardBanner({
  name,
  totalSites,
  addedThisWeek,
}: {
  name: string;
  totalSites: number;
  addedThisWeek: number;
}) {
  const greeting = greetingFor(new Date().getHours());
  const sitesWord = totalSites === 1 ? "website" : "websites";

  return (
    <div className="band-surface flex flex-wrap items-center justify-between gap-4 rounded-card p-6">
      <div>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {greeting}, {name}!
        </h1>
        <p className="mt-1 text-sm text-accent-soft">
          {totalSites} {sitesWord} in the directory · {addedThisWeek} added this
          week
        </p>
      </div>
      <Link
        href="/admin/sites/new"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        + Add a website
      </Link>
    </div>
  );
}
