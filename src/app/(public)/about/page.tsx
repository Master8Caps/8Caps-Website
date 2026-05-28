import type { Metadata } from "next";
import Link from "next/link";
import { Code, Sparkles, Workflow, Paintbrush } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { StatStrip } from "@/components/marketing/StatStrip";
import { DisciplineCard } from "@/components/about/DisciplineCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "8Caps is a UK studio building software, AI, and automation for SMBs. Established 2022.",
};

const DISCIPLINES = [
  {
    icon: Code,
    title: "Software engineering",
    description:
      "TypeScript, Next.js, React, Supabase, Postgres — modern, fast, maintainable.",
  },
  {
    icon: Sparkles,
    title: "AI engineering",
    description:
      "Claude API, prompt engineering, retrieval, AI voice agents, document AI.",
  },
  {
    icon: Workflow,
    title: "Automation engineering",
    description:
      "Make.com, n8n, Zapier, custom orchestration — workflows that don't break.",
  },
  {
    icon: Paintbrush,
    title: "Design & product",
    description:
      "Interface design, UX, brand — we don't ship ugly.",
  },
];

const HOW_WE_WORK = [
  {
    title: "Talk",
    body: "We listen first, write a one-page brief, agree the shape and the price.",
  },
  {
    title: "Build",
    body: "Short iterations, you see progress every week, you steer along the way.",
  },
  {
    title: "Operate",
    body: "When it ships, we don't disappear. We run it, monitor it, keep it healthy.",
  },
];

export default function AboutPage() {
  // NOTE: these are placeholder numbers — replace with real counts once James
  // confirms (see docs/pre-meeting-notes.md).
  const stats = [
    { value: "Since 2022", label: "Building software & AI" },
    { value: "20+", label: "Projects shipped" },
    { value: "12+", label: "UK sectors served" },
    { value: "6+", label: "Products operating" },
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
            A UK studio building software, AI, and automation for SMBs.
          </h1>
          <p className="mt-5 text-white/70 leading-relaxed">
            Founded in 2022, 8Caps is a small, focused team that designs,
            ships, and operates the kind of practical tools UK businesses
            actually use every day.
          </p>
        </Container>
      </section>

      <StatStrip stats={stats} />

      {/* What we do */}
      <section className="bg-surface-muted py-20">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">What we do</h2>
          <div className="mt-6 space-y-5 text-ink-muted leading-relaxed">
            <p>
              <strong className="text-ink">What we build.</strong> The
              unglamorous stuff that runs your business: the internal app, the
              AI that drafts your emails, the automation that means no one has
              to re-key a customer detail again.
            </p>
            <p>
              <strong className="text-ink">Who we build it for.</strong> UK
              SMBs, typically £500k–£10m turnover, 5–50 people, in sectors from
              hospitality to publishing to e-commerce.
            </p>
            <p>
              <strong className="text-ink">Why this approach works.</strong> We
              don&rsquo;t just build software — we operate it. Every product on
              our <Link href="/products" className="underline">products page</Link>{" "}
              is a real, running, paying business. We know what &ldquo;shipped&rdquo;
              means because we live it.
            </p>
          </div>
        </Container>
      </section>

      {/* Disciplines */}
      <section className="bg-surface py-20">
        <Container>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Our disciplines</h2>
          <p className="mt-2 text-ink-muted">
            Four capabilities, end-to-end — under one roof.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DISCIPLINES.map((d) => (
              <DisciplineCard key={d.title} {...d} />
            ))}
          </div>
        </Container>
      </section>

      {/* How we work */}
      <section className="bg-surface-muted py-20">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">How we work</h2>
          <div className="mt-8 space-y-7">
            {HOW_WE_WORK.map((step) => (
              <div key={step.title} className="flex gap-4">
                <div
                  className="mt-1.5 h-0.5 w-7 shrink-0 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
                <div>
                  <h3 className="font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                    {step.body}
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
