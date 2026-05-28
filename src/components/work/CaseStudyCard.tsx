import Image from "next/image";
import Link from "next/link";
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
    <Link
      href={`/work/${cs.slug}`}
      className="group block rounded-card border p-8 transition-shadow hover:shadow-md sm:p-10"
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
      <h3 className="mt-6 text-2xl font-bold text-ink group-hover:text-accent sm:text-3xl">
        {cs.outcomeHeadline}
      </h3>

      {/* Meta line */}
      <p className="mt-2 text-sm text-ink-muted">{meta}</p>

      {/* Teaser — first lines of the problem */}
      <p className="mt-4 line-clamp-2 text-ink-muted leading-relaxed">
        {cs.storyProblem}
      </p>

      <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        Read case study
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
