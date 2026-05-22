/** The structured listing the Claude analysis produces. */
export interface AnalysisResult {
  name: string;
  shortSummary: string;
  fullOverview: string;
  targetAudience: string;
  /** A slug from the existing category list, or null if none fits. */
  suggestedCategorySlug: string | null;
  /** A proposed new category name when no existing category fits, else null. */
  suggestedNewCategory: string | null;
  /** Slugs from the existing tag list. */
  suggestedTagSlugs: string[];
  services: { name: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
  suggestedSlug: string;
  confidence: "low" | "medium" | "high";
  notes: string;
}

/** One event in the analyse endpoint's newline-delimited JSON stream. */
export type AnalyzeEvent =
  | { type: "progress"; message: string }
  | { type: "error"; message: string }
  | { type: "done"; result: AnalysisResult; logoUrl: string | null };
