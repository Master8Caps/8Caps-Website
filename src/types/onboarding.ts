/** The structured listing the Claude analysis produces. */
export interface AnalysisResult {
  name: string;
  shortSummary: string;
  fullOverview: string;
  targetAudience: string;
  /**
   * The category for this site. At most one of these is non-null: an existing
   * category slug, or a proposed new category name when none of the existing
   * categories fit. Both null means no category applies.
   */
  suggestedCategorySlug: string | null;
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
