import Link from "next/link";
import { ArrowRight, Code, Sparkles, Workflow } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { StatStrip } from "@/components/marketing/StatStrip";
import { CaseStudyCard } from "@/components/work/CaseStudyCard";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { getFeaturedSites } from "@/lib/data/sites";
import { getFeaturedCaseStudies } from "@/lib/data/case-studies";

export const revalidate = 3600;

const SERVICES = [
  {
    icon: Code,
    title: "Custom Software",
    description: "Apps, dashboards, and internal tools your business has outgrown spreadsheets for.",
    href: "/services#custom-software",
  },
  {
    icon: Sparkles,
    title: "AI Solutions",
    description: "Document AI, voice agents, and assistants that handle the repetitive thinking.",
    href: "/services#ai-solutions",
  },
  {
    icon: Workflow,
    title: "Automation",
    description: "Workflows that connect your tools, fire your notifications, and don't break.",
    href: "/services#automation",
  },
];

export default async function HomePage() {
  const [featuredCaseStudies, featuredProducts] = await Promise.all([
    getFeaturedCaseStudies(3),
    getFeaturedSites(3),
  ]);

  // NOTE: stat values are placeholders — replace once real numbers land
  // (see docs/pre-meeting-notes.md).
  const stats = [
    { value: "Since 2022", label: "Building software & AI" },
    { value: "20+", label: "Projects shipped" },
    { value: "6+", label: "Products in portfolio" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero-surface py-20 text-white">
        <Container>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            UK Software &amp; AI Studio
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            We build the software, AI, and automations UK businesses need to
            grow.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70 text-base">
            Established 2022. Trusted by SMBs across the UK. We design, build,
            and ship the tools that make small businesses run faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/work">See our work</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Start a project
            </ButtonLink>
          </div>
        </Container>
      </section>

      <StatStrip stats={stats} />

      {/* Services preview */}
      <section className="bg-surface-muted py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink">What we do</h2>
          <p className="mt-1 text-ink-muted">
            Three pillars — pick the one that fits the problem.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.title}
                  href={s.href}
                  className="rounded-card border bg-surface p-5 hover:shadow-md transition-shadow"
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
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{s.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    Learn more <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Featured work */}
      <section className="bg-surface py-16">
        <Container>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">Featured work</h2>
              <p className="mt-1 text-ink-muted">
                A few of the companies we&rsquo;ve shipped for.
              </p>
            </div>
            <Link
              href="/work"
              className="hidden text-sm font-semibold text-accent hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              See all work <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-6">
            {featuredCaseStudies.length === 0 ? (
              <p
                className="rounded-card border bg-surface p-6 text-center text-ink-muted"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                Case studies coming soon — testimonials currently being approved by clients.
              </p>
            ) : (
              featuredCaseStudies.map((cs) => (
                <CaseStudyCard key={cs.id} caseStudy={cs} />
              ))
            )}
          </div>
        </Container>
      </section>

      {/* Featured products */}
      <section className="bg-surface-muted py-16">
        <Container>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">Our own products</h2>
              <p className="mt-1 text-ink-muted">
                We don&rsquo;t just build software — we run it.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-semibold text-accent hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              See all products <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-8">
            <DirectoryGrid sites={featuredProducts} />
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
