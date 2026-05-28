import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import {
  getCaseStudyBySlug,
  getCaseStudySlugs,
} from "@/lib/data/case-studies";
import { CASE_STUDY_SERVICE_LABELS } from "@/types/case-study";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudyBySlug(slug);
  if (!cs) return { title: "Case study not found" };
  return {
    title: `${cs.clientName} — case study`,
    description: cs.outcomeHeadline,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cs = await getCaseStudyBySlug(slug);
  if (!cs) notFound();

  const meta = [cs.clientSector, cs.year].filter(Boolean).join(" · ");

  return (
    <>
      {/* Hero band */}
      <section className="hero-surface py-16 text-white">
        <Container>
          <Link
            href="/work"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Back to work
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {cs.logoUrl ? (
              <Image
                src={cs.logoUrl}
                alt={`${cs.clientName} logo`}
                width={180}
                height={56}
                className="h-14 w-auto object-contain"
              />
            ) : (
              <span className="text-2xl font-bold">{cs.clientName}</span>
            )}
            <div className="flex flex-wrap gap-2">
              {cs.services.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white"
                >
                  {CASE_STUDY_SERVICE_LABELS[s]}
                </span>
              ))}
            </div>
          </div>

          <h1 className="mt-6 max-w-3xl text-3xl font-bold sm:text-4xl">
            {cs.outcomeHeadline}
          </h1>
          {meta && <p className="mt-3 text-white/70">{meta}</p>}
        </Container>
      </section>

      {/* Body */}
      <section className="bg-surface py-14">
        <Container className="max-w-3xl">
          <div className="space-y-4 text-ink-muted leading-relaxed">
            <h2 className="text-xl font-bold text-ink">The challenge</h2>
            <p>{cs.storyProblem}</p>
            <h2 className="pt-4 text-xl font-bold text-ink">What we did</h2>
            <p>{cs.storySolution}</p>
          </div>

          <blockquote
            className="mt-10 rounded-card border-l-4 bg-surface-muted p-6"
            style={{ borderLeftColor: "var(--color-accent)" }}
          >
            <p className="text-lg text-ink italic">
              &ldquo;{cs.testimonialQuote}&rdquo;
            </p>
            <footer className="mt-3 text-sm font-semibold text-ink">
              — {cs.testimonialAuthor}
              {cs.testimonialRole ? `, ${cs.testimonialRole}` : ""},{" "}
              {cs.clientName}
            </footer>
          </blockquote>

          {cs.techStack.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Built with:
              </span>
              {cs.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border px-2.5 py-0.5 text-xs text-ink-muted"
                  style={{ borderColor: "var(--color-hairline)" }}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </Container>
      </section>

      <CTASection />
    </>
  );
}
