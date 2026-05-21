import Link from "next/link";
import type { Category } from "@/types/domain";

export function CategoryFilter({
  categories,
  activeCategory,
  query,
  lifecycle,
}: {
  categories: Category[];
  activeCategory: string | null;
  query: string;
  lifecycle: string | null;
}) {
  function hrefFor(categorySlug: string | null): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (lifecycle) params.set("lifecycle", lifecycle);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return qs ? `/sites?${qs}` : "/sites";
  }

  const base =
    "rounded-full px-3 py-1.5 text-sm transition-colors";
  const active = "bg-accent-500 text-white";
  const inactive = "border border-white/15 text-ink-400 hover:text-white";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(null)}
        className={`${base} ${activeCategory === null ? active : inactive}`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={hrefFor(c.slug)}
          className={`${base} ${activeCategory === c.slug ? active : inactive}`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
