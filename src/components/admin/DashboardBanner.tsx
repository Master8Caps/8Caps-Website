"use client";

import Link from "next/link";
import { londonHour } from "@/lib/greeting";
import { Greeting } from "./Greeting";
import { useAdminPath } from "./AdminPathContext";

export function DashboardBanner({
  name,
  totalSites,
  addedThisWeek,
}: {
  name: string | null;
  totalSites: number;
  addedThisWeek: number;
}) {
  const productsWord = totalSites === 1 ? "product" : "products";
  const adminHref = useAdminPath();

  return (
    <div className="band-surface flex flex-wrap items-center justify-between gap-4 rounded-card p-6">
      <div>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Greeting name={name} fallbackHour={londonHour()} />
        </h1>
        <p className="mt-1 text-sm text-accent-soft">
          {totalSites} {productsWord} in the directory · {addedThisWeek} added
          this week
        </p>
      </div>
      <Link
        href={adminHref("/products/new")}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:brightness-110 hover:shadow-lift active:scale-[0.98]"
      >
        + Add a product
      </Link>
    </div>
  );
}
