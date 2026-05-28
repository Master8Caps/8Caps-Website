import Link from "next/link";
import type { CaseStudyService } from "@/types/case-study";
import { CASE_STUDY_SERVICE_LABELS } from "@/types/case-study";

const SERVICES: CaseStudyService[] = [
  "custom_software",
  "ai",
  "automation",
  "lead_gen",
  "ecommerce",
];

export function CaseStudyFilter({ active }: { active: CaseStudyService | null }) {
  const base = "rounded-full px-3 py-1.5 text-sm transition-colors active:scale-[0.98]";
  const activeStyle = "bg-accent text-white";
  const inactiveStyle = "border border-hairline text-ink-muted hover:text-ink";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/work"
        className={`${base} ${active === null ? activeStyle : inactiveStyle}`}
      >
        All
      </Link>
      {SERVICES.map((service) => (
        <Link
          key={service}
          href={`/work?service=${service}`}
          className={`${base} ${active === service ? activeStyle : inactiveStyle}`}
        >
          {CASE_STUDY_SERVICE_LABELS[service]}
        </Link>
      ))}
    </div>
  );
}
