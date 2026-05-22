import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: ReactNode;
}) {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-3xl font-bold text-oxford"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </div>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  );
}
