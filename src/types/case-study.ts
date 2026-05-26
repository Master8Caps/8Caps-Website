import type { PublishStatus } from "@/types/domain";

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

export type CaseStudyStatus = "draft" | "pending" | "live" | "archived";

/** Service enum options as picker-ready data. */
export const CASE_STUDY_SERVICE_OPTIONS: { value: CaseStudyService; label: string }[] = [
  { value: "custom_software", label: "Custom Software" },
  { value: "ai", label: "AI" },
  { value: "automation", label: "Automation" },
  { value: "lead_gen", label: "Lead Gen" },
  { value: "ecommerce", label: "E-commerce" },
];

/** A case study with all admin-visible fields (incl. approval timestamp). */
export interface AdminCaseStudy extends CaseStudy {
  testimonialApprovedAt: string | null;
  publishStatus: PublishStatus;
}

/** A row in the admin list view — only what the table needs. */
export interface AdminCaseStudyRow {
  id: string;
  slug: string;
  clientName: string;
  clientSector: string | null;
  year: number | null;
  isFeatured: boolean;
  publishStatus: PublishStatus;
  testimonialApprovedAt: string | null;
}

/** The full editable shape used by the admin case study form. */
export interface CaseStudyFormValues {
  clientName: string;
  slug: string;
  clientSector: string;
  year: number | null;
  logoUrl: string | null;
  brandColour: string;
  outcomeHeadline: string;
  storyProblem: string;
  storySolution: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;
  techStack: string[];
  services: CaseStudyService[];
  publishStatus: PublishStatus;
  isFeatured: boolean;
  sortOrder: number;
  testimonialApproved: boolean;
}
