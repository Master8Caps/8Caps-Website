export type CaseStudyService =
  | "custom_software"
  | "ai"
  | "automation"
  | "lead_gen"
  | "ecommerce";

export const CASE_STUDY_SERVICE_LABELS: Record<CaseStudyService, string> = {
  custom_software: "Custom Software",
  ai: "AI",
  automation: "Automation",
  lead_gen: "Lead Gen",
  ecommerce: "E-commerce",
};

/** A case study as shown on /work and homepage Featured Work. */
export interface CaseStudy {
  id: string;
  slug: string;
  clientName: string;
  clientSector: string | null;
  year: number | null;
  logoUrl: string | null;
  brandColour: string | null;
  outcomeHeadline: string;
  storyProblem: string;
  storySolution: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string | null;
  techStack: string[];
  isFeatured: boolean;
  sortOrder: number;
  services: CaseStudyService[];
}
