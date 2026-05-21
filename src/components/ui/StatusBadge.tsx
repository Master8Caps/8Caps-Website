import type { SiteLifecycle } from "@/types/domain";

const LABELS: Record<SiteLifecycle, string> = {
  live: "Live",
  coming_soon: "Coming soon",
};

// Soft pill using status tokens: green for Live, amber for Coming soon, with a leading dot.
const STYLES: Record<SiteLifecycle, string> = {
  live: "bg-live-bg text-live",
  coming_soon: "bg-soon-bg text-soon",
};

export function StatusBadge({ lifecycle }: { lifecycle: SiteLifecycle }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[lifecycle]}`}
    >
      <span aria-hidden="true">●</span>
      {LABELS[lifecycle]}
    </span>
  );
}
