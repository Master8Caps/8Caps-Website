import type { LucideIcon } from "lucide-react";

export function DisciplineCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-card border bg-surface p-6 shadow-soft"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: "var(--color-oxford)" }}
      >
        <Icon size={18} strokeWidth={1.75} className="text-white" />
      </div>
      <h3
        className="font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink-muted leading-relaxed">{description}</p>
    </div>
  );
}
