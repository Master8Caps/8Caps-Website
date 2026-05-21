import type { SiteLifecycle } from "@/types/domain";

const LABELS: Record<SiteLifecycle, string> = {
  live: "Live",
  coming_soon: "Coming soon",
};

const STYLES: Record<SiteLifecycle, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  coming_soon: "bg-amber-500/15 text-amber-300",
};

export function StatusBadge({ lifecycle }: { lifecycle: SiteLifecycle }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[lifecycle]}`}
    >
      {LABELS[lifecycle]}
    </span>
  );
}
