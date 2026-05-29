import type { ReactNode } from "react";

/**
 * Shared header for admin section pages — consistent title, optional
 * description, and an optional action slot (typically a primary button).
 * The dashboard home keeps its own dark DashboardBanner instead.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
