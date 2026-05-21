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
    "rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10";
  const disabledClass =
    "rounded-lg border border-white/5 px-4 py-2 text-sm text-ink-600";

  return (
    <nav className="mt-8 flex items-center justify-between">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-sm text-ink-400">
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
