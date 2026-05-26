import type { Metadata } from "next";
import { Code, Sparkles, Workflow } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { ServicePillarSection } from "@/components/services/ServicePillarSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Custom software, AI solutions, and automation built for UK SMBs by 8Caps.",
};

export default function ServicesPage() {
  return (
    <>
      {/* Hero band */}
      <section className="hero-surface py-16 text-white">
        <Container>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            What we do
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
            Three ways we help UK businesses grow.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70">
            Whether you need a custom app, an AI that does the thinking, or
            workflows that run themselves — we design, build, and ship it.
          </p>
        </Container>
      </section>

      <ServicePillarSection
        anchorId="custom-software"
        icon={Code}
        title="Custom Software"
        description="We build the apps your business has outgrown spreadsheets for — internal tools, customer portals, dashboards, and operational software that fits how you actually work."
        solves={[
          "Spreadsheets that have outgrown themselves",
          "Tools that don't talk to each other",
          "A process that only one person knows how to run",
          "Off-the-shelf software that almost fits but never quite",
        ]}
        audience="UK SMBs — typically £500k–£10m turnover, 5–50 people."
        ctaHref="/contact"
        ctaLabel="Tell us about your project"
      />

      <ServicePillarSection
        anchorId="ai-solutions"
        icon={Sparkles}
        title="AI Solutions"
        description="We build AI that actually earns its keep — reading documents, drafting replies, qualifying leads, talking to customers. Built on the Claude API for reliability."
        solves={[
          "Manual research at scale",
          "Reading and summarising long documents",
          "Qualifying leads before a human touches them",
          "Customer support that doesn't sleep",
        ]}
        audience="UK SMBs with a repetitive thinking task they'd love to hand off."
        ctaHref="/contact"
        ctaLabel="See if AI fits your workflow"
      />

      <ServicePillarSection
        anchorId="automation"
        icon={Workflow}
        title="Automation"
        description="We connect the tools you already use so they pass data, fire notifications, and run sequences without anyone touching them. Built on Make.com, n8n, Zapier, or custom orchestration where it matters."
        solves={[
          "Repetitive admin that eats your week",
          "Data flowing between tools",
          "Manual notifications, reports, follow-ups",
          "Onboarding and offboarding sequences",
        ]}
        audience="Any UK business with a job that goes 'and then someone copies it into…'."
        ctaHref="/contact"
        ctaLabel="Tell us what's eating your time"
      />

      <CTASection />
    </>
  );
}
