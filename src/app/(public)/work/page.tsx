import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { CaseStudyCard } from "@/components/work/CaseStudyCard";
import { CaseStudyFilter } from "@/components/work/CaseStudyFilter";
import { getPublishedCaseStudies } from "@/lib/data/case-studies";
import { parseServiceFilter } from "@/lib/case-studies-filter";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected client projects from 8Caps — software, AI, and automation built for UK businesses.",
};

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const params = await searchParams;
  const service = parseServiceFilter(params);
  const caseStudies = await getPublishedCaseStudies(service ?? undefined);

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
            Selected work
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
            Projects we&rsquo;ve shipped for UK businesses.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70">
            A few of the companies we&rsquo;ve built software, AI, and
            automation for. Different sectors, same outcome — work that runs.
          </p>
        </Container>
      </section>

      {/* Filter strip */}
      <section className="bg-surface-muted py-8">
        <Container>
          <CaseStudyFilter active={service} />
        </Container>
      </section>

      {/* Case study sections */}
      <section className="bg-surface-muted pb-16">
        <Container>
          {caseStudies.length === 0 ? (
            <p
              className="rounded-card border bg-surface p-8 text-center text-ink-muted"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              No case studies to show yet.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {caseStudies.map((cs) => (
                <CaseStudyCard key={cs.id} caseStudy={cs} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <CTASection />
    </>
  );
}
