import Link from "next/link";
import { getAdminEnquiries } from "@/lib/data/enquiries";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { EnquiryList } from "@/components/admin/EnquiryList";
import { PageHeader } from "@/components/admin/PageHeader";
import type { EnquiryStatus } from "@/types/domain";

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
] as const;

function asStatus(v: string | undefined): EnquiryStatus | undefined {
  if (v === "new" || v === "read" || v === "archived") return v;
  return undefined;
}

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [rows, basePath] = await Promise.all([
    getAdminEnquiries({ status: asStatus(status) }),
    getAdminBasePath(),
  ]);

  return (
    <div className="p-8">
      <PageHeader
        title="Enquiries"
        description="Messages from the website contact form."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const active = (status ?? "") === option.value;
          const href =
            option.value === ""
              ? adminPath(basePath, "/enquiries")
              : `${adminPath(basePath, "/enquiries")}?status=${option.value}`;
          return (
            <Link
              key={option.value || "all"}
              href={href}
              className={
                active
                  ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border px-3 py-1 text-xs font-medium text-ink"
              }
              style={active ? undefined : { borderColor: "var(--color-hairline)" }}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <EnquiryList rows={rows} />
      </div>
    </div>
  );
}
