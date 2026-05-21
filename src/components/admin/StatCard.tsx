export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div
        className="text-3xl font-bold text-oxford"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </div>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  );
}
