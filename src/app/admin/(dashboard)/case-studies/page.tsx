import Link from "next/link";
import { getAdminCaseStudies } from "@/lib/data/admin";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { CaseStudyList } from "@/components/admin/CaseStudyList";

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending approval" },
  { value: "live", label: "Live" },
  { value: "featured", label: "Featured" },
] as const;

type Status = "pending" | "live" | "featured";

function asStatus(v: string | undefined): Status | undefined {
  if (v === "pending" || v === "live" || v === "featured") return v;
  return undefined;
}

export default async function AdminCaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const filter = {
    search: q?.trim() || undefined,
    status: asStatus(status),
  };
  const [rows, basePath] = await Promise.all([
    getAdminCaseStudies(filter),
    getAdminBasePath(),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Case studies</h1>
        <Link
          href={adminPath(basePath, "/case-studies/new")}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:brightness-110 hover:shadow-lift active:scale-[0.98]"
        >
          + Add case study
        </Link>
      </div>

      <form method="get" className="mt-6 max-w-sm">
        <label htmlFor="case-study-search" className="block text-sm font-medium text-ink">
          Search
        </label>
        <input
          id="case-study-search"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by client name…"
          className="mt-1 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
        {/* Preserve the active filter when searching */}
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const active = (status ?? "") === option.value;
          const href =
            option.value === ""
              ? adminPath(basePath, "/case-studies")
              : `${adminPath(basePath, "/case-studies")}?status=${option.value}`;
          return (
            <Link
              key={option.value || "all"}
              href={href}
              className={
                active
                  ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white transition-colors"
                  : "rounded-full border px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-surface-muted"
              }
              style={active ? undefined : { borderColor: "var(--color-hairline)" }}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <CaseStudyList rows={rows} />
      </div>
    </div>
  );
}
