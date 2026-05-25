import { createPublicClient } from "@/lib/supabase/public";
import type { CaseStudy, CaseStudyService } from "@/types/case-study";

const COLUMNS =
  "id, slug, client_name, client_sector, year, logo_url, brand_colour, " +
  "outcome_headline, story_problem, story_solution, testimonial_quote, " +
  "testimonial_author, testimonial_role, tech_stack, is_featured, sort_order, " +
  "case_study_services (service)";

interface CaseStudyRow {
  id: string;
  slug: string;
  client_name: string;
  client_sector: string | null;
  year: number | null;
  logo_url: string | null;
  brand_colour: string | null;
  outcome_headline: string;
  story_problem: string;
  story_solution: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_role: string | null;
  tech_stack: string[] | null;
  is_featured: boolean;
  sort_order: number;
  case_study_services: { service: CaseStudyService }[];
}

function toCaseStudy(row: CaseStudyRow): CaseStudy {
  return {
    id: row.id,
    slug: row.slug,
    clientName: row.client_name,
    clientSector: row.client_sector,
    year: row.year,
    logoUrl: row.logo_url,
    brandColour: row.brand_colour,
    outcomeHeadline: row.outcome_headline,
    storyProblem: row.story_problem,
    storySolution: row.story_solution,
    testimonialQuote: row.testimonial_quote,
    testimonialAuthor: row.testimonial_author,
    testimonialRole: row.testimonial_role,
    techStack: row.tech_stack ?? [],
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    services: row.case_study_services.map((s) => s.service),
  };
}

/** All published, approved case studies in display order. RLS does the
 *  approval-gate filtering for us. */
export async function getPublishedCaseStudies(
  service?: CaseStudyService,
): Promise<CaseStudy[]> {
  const supabase = createPublicClient();

  // Service-filter approach: filter on the server in TypeScript after the
  // query rather than via a join filter. The directory size is small (10s of
  // rows), so this is simple and correct. Switch to a server-side filter if
  // the table grows.
  const { data, error } = await supabase
    .from("case_studies")
    .select(COLUMNS)
    .order("is_featured", { ascending: false })
    .order("sort_order");

  if (error) throw new Error(`Failed to load case studies: ${error.message}`);

  const all = ((data ?? []) as unknown as CaseStudyRow[]).map(toCaseStudy);
  if (!service) return all;
  return all.filter((cs) => cs.services.includes(service));
}

/** Featured case studies for the homepage. */
export async function getFeaturedCaseStudies(limit = 3): Promise<CaseStudy[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(COLUMNS)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(limit);

  if (error) throw new Error(`Failed to load featured case studies: ${error.message}`);
  return ((data ?? []) as unknown as CaseStudyRow[]).map(toCaseStudy);
}
