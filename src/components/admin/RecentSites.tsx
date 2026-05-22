import Link from "next/link";
import type { RecentSite } from "@/types/domain";

export function RecentSites({ sites }: { sites: RecentSite[] }) {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Recently added</h2>
        <Link
          href="/admin/sites"
          className="text-sm font-semibold text-accent"
        >
          View all →
        </Link>
      </div>

      {sites.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No websites yet.</p>
      ) : (
        <ul className="mt-2">
          {sites.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              <Link
                href={`/admin/sites/${s.id}/edit`}
                className="text-sm font-medium text-ink hover:text-accent"
              >
                {s.name}
                {s.categoryName && (
                  <span className="text-ink-muted"> · {s.categoryName}</span>
                )}
              </Link>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={
                  s.publishStatus === "published"
                    ? { background: "var(--color-live-bg)", color: "var(--color-live)" }
                    : { background: "var(--color-soon-bg)", color: "var(--color-soon)" }
                }
              >
                {s.publishStatus === "published" ? "Published" : "Draft"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
