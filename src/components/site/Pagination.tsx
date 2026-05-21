import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(targetPage));
    return `/sites?${params.toString()}`;
  }

  const linkClass =
    "rounded-lg border border-hairline px-4 py-2 text-sm text-oxford hover:bg-surface-muted transition-colors";
  const disabledClass =
    "rounded-lg border border-hairline px-4 py-2 text-sm text-ink-muted opacity-50";

  return (
    <nav className="mt-8 flex items-center justify-between">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-sm text-ink-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </nav>
  );
}
