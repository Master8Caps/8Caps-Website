import Link from "next/link";
import { getAdminSites } from "@/lib/data/admin";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-live-bg text-live",
  draft: "bg-soon-bg text-soon",
  archived: "bg-black/5 text-ink-muted",
};

export default async function AdminSitesPage({
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
        <h1 className="text-2xl font-bold text-ink">Websites</h1>
        <Link
          href={adminPath(basePath, "/sites/new")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Add a website
        </Link>
      </div>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name…"
          className="w-full max-w-sm rounded-lg border bg-surface px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
      </form>

      <div
        className="mt-6 overflow-hidden rounded-card border bg-surface"
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
                  No websites yet.
                </td>
              </tr>
            )}
            {sites.map((s) => (
              <tr
                key={s.id}
                className="border-b last:border-0"
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
                    href={adminPath(basePath, `/sites/${s.id}/edit`)}
                    className="font-semibold text-accent"
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
