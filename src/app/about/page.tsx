import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { getCategories } from "@/lib/data/categories";
import { getAllSiteSlugs } from "@/lib/data/sites";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "8Caps is a portfolio of digital services, platforms and specialist websites built to solve practical business problems.",
};

const APPROACH = [
  {
    title: "Built for a job",
    body: "Every site in the portfolio is built around one clear problem and one clear audience — not a catch-all platform trying to do everything.",
  },
  {
    title: "Operated, not just launched",
    body: "8Caps runs and maintains what it builds. These are working products with real users, not abandoned side projects.",
  },
  {
    title: "Transparent by design",
    body: "This directory exists so every product has a credible, verifiable home — easy to find, easy to check, easy to get in touch about.",
  },
];

export default async function AboutPage() {
  const [categories, slugs] = await Promise.all([
    getCategories(),
    getAllSiteSlugs(),
  ]);

  const stats = [
    { value: String(slugs.length), label: "Websites in the portfolio" },
    { value: String(categories.length), label: "Service categories" },
    { value: "100%", label: "Hand-reviewed before listing" },
  ];

  return (
    <>
      {/* Dark intro band */}
      <section className="band-surface py-16 text-white">
        <Container className="max-w-3xl">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            About 8Caps
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            A portfolio of digital services, under one roof.
          </h1>
          <p className="mt-5 text-white/70 leading-relaxed">
            8Caps builds and operates specialist websites, platforms and tools.
            Each one is purpose-built to solve a practical business problem —
            and this directory brings them all together in one credible place.
          </p>
        </Container>
      </section>

      {/* Stats strip */}
      <section className="bg-surface py-12">
        <Container>
          <div className="grid gap-4 sm:grid-cols-3">
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

      {/* What we do */}
      <section className="bg-surface-muted py-16">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink">What we do</h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            8Caps is a portfolio business. Rather than one large product, we
            build and run a range of focused digital services — automation
            tools, lead-generation platforms, property and marketing tools, and
            more — each aimed at a specific audience and a specific job.
          </p>
          <p className="mt-4 text-ink-muted leading-relaxed">
            Some are flagship products in active use; others are newer or still
            in development. What they share is a practical purpose: every site
            exists to make a real task faster, easier or cheaper for the people
            who use it.
          </p>
          <p className="mt-4 text-ink-muted leading-relaxed">
            This site is the directory for all of it — a single, trustworthy
            place to explore what 8Caps offers, see what each product does, and
            get in touch about any of them.
          </p>
        </Container>
      </section>

      {/* Our approach */}
      <section className="bg-surface py-16">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink">Our approach</h2>
          <div className="mt-8 space-y-7">
            {APPROACH.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div
                  className="mt-1.5 h-0.5 w-7 shrink-0 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
                <div>
                  <h3 className="font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
