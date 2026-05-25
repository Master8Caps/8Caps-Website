import Image from "next/image";
import type { CaseStudy } from "@/types/case-study";
import { CASE_STUDY_SERVICE_LABELS } from "@/types/case-study";

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const cs = caseStudy;
  const meta = [cs.clientName, cs.clientSector, cs.year]
    .filter(Boolean)
    .join(" · ");

  const cardStyle = cs.brandColour
    ? { backgroundColor: `color-mix(in srgb, ${cs.brandColour} 6%, white)` }
    : undefined;

  return (
    <article
      className="rounded-card border p-8 sm:p-10"
      style={{
        ...cardStyle,
        borderColor: "var(--color-hairline)",
      }}
    >
      {/* Header: logo + service pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {cs.logoUrl ? (
          <Image
            src={cs.logoUrl}
            alt={`${cs.clientName} logo`}
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
          />
        ) : (
          <div className="text-2xl font-bold text-ink">{cs.clientName}</div>
        )}
        <div className="flex flex-wrap gap-2">
          {cs.services.map((s) => (
            <span
              key={s}
              className="rounded-full bg-oxford/10 px-2.5 py-0.5 text-xs font-semibold text-oxford"
            >
              {CASE_STUDY_SERVICE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Outcome headline */}
      <h3 className="mt-6 text-2xl font-bold text-ink sm:text-3xl">
        {cs.outcomeHeadline}
      </h3>

      {/* Meta line */}
      <p className="mt-2 text-sm text-ink-muted">{meta}</p>

      {/* Story */}
      <div className="mt-6 space-y-3 text-ink-muted leading-relaxed">
        <p>{cs.storyProblem}</p>
        <p>{cs.storySolution}</p>
      </div>

      {/* Testimonial */}
      <blockquote
        className="mt-6 rounded-card border-l-4 bg-white p-5"
        style={{ borderLeftColor: "var(--color-accent)" }}
      >
        <p className="text-ink italic">&ldquo;{cs.testimonialQuote}&rdquo;</p>
        <footer className="mt-2 text-sm font-semibold text-ink">
          — {cs.testimonialAuthor}
          {cs.testimonialRole ? `, ${cs.testimonialRole}` : ""}, {cs.clientName}
        </footer>
      </blockquote>

      {/* Tech stack */}
      {cs.techStack.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
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
    </article>
  );
}
