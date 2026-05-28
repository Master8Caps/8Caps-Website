import Link from "next/link";
import { getAdminSites } from "@/lib/data/admin";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-live-bg text-live",
  draft: "bg-soon-bg text-soon",
  archived: "bg-black/5 text-ink-muted",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [sites, basePath] = await Promise.all([
    getAdminSites(q?.trim() || undefined),
    getAdminBasePath(),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Products</h1>
        <Link
          href={adminPath(basePath, "/products/new")}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:brightness-110 hover:shadow-lift active:scale-[0.98]"
        >
          Add a product
        </Link>
      </div>

      <form method="get" className="mt-6 max-w-sm">
        <label htmlFor="product-search" className="block text-sm font-medium text-ink">
          Search
        </label>
        <input
          id="product-search"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name…"
          className="mt-1 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
      </form>

      <div
        className="mt-6 overflow-hidden rounded-card border bg-surface shadow-soft"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-ink-muted" style={{ borderColor: "var(--color-hairline)" }}>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No products yet.
                </td>
              </tr>
            )}
            {sites.map((s) => (
              <tr
                key={s.id}
                className="border-b transition-colors last:border-0 hover:bg-surface-muted"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {s.categoryName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLE[s.publishStatus]
                    }`}
                  >
                    {s.publishStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {s.isFeatured ? "Yes" : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={adminPath(basePath, `/products/${s.id}/edit`)}
                    className="font-semibold text-accent transition-colors hover:text-oxford"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
