import { Container } from "@/components/layout/Container";

export interface Stat {
  value: string;
  label: string;
}

export function StatStrip({ stats }: { stats: Stat[] }) {
  const cols =
    stats.length === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-3";

  return (
    <section className="bg-surface py-12">
      <Container>
        <div className={`grid gap-4 ${cols}`}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-card border bg-surface p-6 text-center"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              <div
                className="text-4xl font-bold text-oxford"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
