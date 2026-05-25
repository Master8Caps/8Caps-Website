import type { CaseStudyService } from "@/types/case-study";

type RawParam = string | string[] | undefined;
type RawParams = Record<string, RawParam>;

const VALID: readonly CaseStudyService[] = [
  "custom_software",
  "ai",
  "automation",
  "lead_gen",
  "ecommerce",
];

function first(value: RawParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseServiceFilter(params: RawParams): CaseStudyService | null {
  const raw = first(params.service);
  if (!raw) return null;
  return (VALID as readonly string[]).includes(raw) ? (raw as CaseStudyService) : null;
}
