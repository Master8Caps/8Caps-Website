import { createServerSupabase } from "@/lib/supabase/server";
import type {
  AdminCategory,
  AdminSiteRow,
  Category,
  DashboardStats,
  RecentSite,
  SiteFormValues,
  Tag,
} from "@/types/domain";
import type {
  AdminCaseStudy,
  AdminCaseStudyRow,
  CaseStudyService,
} from "@/types/case-study";

interface AdminSiteRowRaw {
  id: string;
  name: string;
  slug: string;
  publish_status: AdminSiteRow["publishStatus"];
  lifecycle: AdminSiteRow["lifecycle"];
  visibility: AdminSiteRow["visibility"];
  is_featured: boolean;
  updated_at: string;
  category: { name: string } | null;
}

/** All sites (incl. drafts), newest-edited first, optionally name-filtered. */
export async function getAdminSites(search?: string): Promise<AdminSiteRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("sites")
    .select(
      "id, name, slug, publish_status, lifecycle, visibility, is_featured, updated_at, category:categories (name)",
    )
    .order("updated_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load sites: ${error.message}`);

  return ((data ?? []) as unknown as AdminSiteRowRaw[]).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    publishStatus: r.publish_status,
    lifecycle: r.lifecycle,
    visibility: r.visibility,
    isFeatured: r.is_featured,
    categoryName: r.category?.name ?? null,
    updatedAt: r.updated_at,
  }));
}

/** Dashboard counts. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabase();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total, published, draft, categories, thisWeek, caseStudies, pendingApprovals] =
    await Promise.all([
      supabase.from("sites").select("id", { count: "exact", head: true }),
      supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .eq("publish_status", "published"),
      supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .eq("publish_status", "draft"),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase.from("case_studies").select("id", { count: "exact", head: true }),
      supabase
        .from("case_studies")
        .select("id", { count: "exact", head: true })
        .eq("publish_status", "published")
        .is("testimonial_approved_at", null),
    ]);

  return {
    totalSites: total.count ?? 0,
    publishedSites: published.count ?? 0,
    draftSites: draft.count ?? 0,
    categories: categories.count ?? 0,
    sitesAddedThisWeek: thisWeek.count ?? 0,
    caseStudyCount: caseStudies.count ?? 0,
    pendingCaseStudyApprovals: pendingApprovals.count ?? 0,
  };
}

interface SiteEditRaw {
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  short_summary: string;
  full_overview: string | null;
  target_audience: string | null;
  category_id: string | null;
  publish_status: SiteFormValues["publishStatus"];
  lifecycle: SiteFormValues["lifecycle"];
  visibility: SiteFormValues["visibility"];
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  services: { name: string; description: string | null; sort_order: number }[];
  screenshots: { image_url: string; alt_text: string | null; sort_order: number }[];
  site_tags: { tag_id: string }[];
}

/** A site in the editable form shape, or null if not found. */
export async function getSiteForEdit(
  id: string,
): Promise<SiteFormValues | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .select(
      "name, slug, url, logo_url, short_summary, full_overview, target_audience, " +
        "category_id, publish_status, lifecycle, visibility, is_featured, " +
        "seo_title, seo_description, " +
        "services (name, description, sort_order), " +
        "screenshots (image_url, alt_text, sort_order), " +
        "site_tags (tag_id)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load site: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as SiteEditRaw;
  return {
    name: row.name,
    slug: row.slug,
    url: row.url,
    logoUrl: row.logo_url,
    shortSummary: row.short_summary,
    fullOverview: row.full_overview ?? "",
    targetAudience: row.target_audience ?? "",
    categoryId: row.category_id,
    newCategoryName: null,
    publishStatus: row.publish_status,
    lifecycle: row.lifecycle,
    visibility: row.visibility,
    isFeatured: row.is_featured,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    services: [...row.services]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ name: s.name, description: s.description ?? "" })),
    screenshots: [...row.screenshots]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ imageUrl: s.image_url, altText: s.alt_text ?? "" })),
    tagIds: row.site_tags.map((t) => t.tag_id),
  };
}

/** All tags, alphabetical — for the tag selector. */
export async function getAllTags(): Promise<Tag[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name");
  if (error) throw new Error(`Failed to load tags: ${error.message}`);
  return (data ?? []) as Tag[];
}

interface AdminCategoryRaw {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sites: { count: number }[];
}

/** All categories with their site counts, alphabetical. */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, sites (count)")
    .order("name");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);

  return ((data ?? []) as unknown as AdminCategoryRaw[]).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    siteCount: c.sites[0]?.count ?? 0,
  }));
}

interface RecentSiteRaw {
  id: string;
  name: string;
  publish_status: RecentSite["publishStatus"];
  category: { name: string } | null;
}

/** The most recently created sites, newest first — for the dashboard feed. */
export async function getRecentSites(limit = 5): Promise<RecentSite[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, publish_status, category:categories (name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load recent sites: ${error.message}`);

  return ((data ?? []) as unknown as RecentSiteRaw[]).map((r) => ({
    id: r.id,
    name: r.name,
    publishStatus: r.publish_status,
    categoryName: r.category?.name ?? null,
  }));
}

interface AdminCaseStudyRowRaw {
  id: string;
  slug: string;
  client_name: string;
  client_sector: string | null;
  year: number | null;
  is_featured: boolean;
  publish_status: AdminCaseStudyRow["publishStatus"];
  testimonial_approved_at: string | null;
}

/**
 * Admin case studies list. Optional filter:
 *   - search: case-insensitive on client_name
 *   - status: 'pending' (published + unapproved), 'live' (published + approved),
 *     'featured' (is_featured = true, any state), or undefined (all)
 */
export async function getAdminCaseStudies(filter?: {
  search?: string;
  status?: "pending" | "live" | "featured";
}): Promise<AdminCaseStudyRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("case_studies")
    .select(
      "id, slug, client_name, client_sector, year, is_featured, publish_status, testimonial_approved_at",
    )
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (filter?.search) query = query.ilike("client_name", `%${filter.search}%`);
  if (filter?.status === "pending") {
    query = query.eq("publish_status", "published").is("testimonial_approved_at", null);
  } else if (filter?.status === "live") {
    query = query.eq("publish_status", "published").not("testimonial_approved_at", "is", null);
  } else if (filter?.status === "featured") {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load case studies: ${error.message}`);

  return ((data ?? []) as unknown as AdminCaseStudyRowRaw[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    clientName: r.client_name,
    clientSector: r.client_sector,
    year: r.year,
    isFeatured: r.is_featured,
    publishStatus: r.publish_status,
    testimonialApprovedAt: r.testimonial_approved_at,
  }));
}

interface CaseStudyEditRaw {
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
  testimonial_approved_at: string | null;
  tech_stack: string[] | null;
  publish_status: AdminCaseStudy["publishStatus"];
  is_featured: boolean;
  sort_order: number;
  case_study_services: { service: CaseStudyService }[];
}

/** A case study in the editable form shape, or null if not found. */
export async function getCaseStudyForEdit(
  id: string,
): Promise<AdminCaseStudy | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, slug, client_name, client_sector, year, logo_url, brand_colour, " +
        "outcome_headline, story_problem, story_solution, " +
        "testimonial_quote, testimonial_author, testimonial_role, testimonial_approved_at, " +
        "tech_stack, publish_status, is_featured, sort_order, " +
        "case_study_services (service)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load case study: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as CaseStudyEditRaw;
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
    testimonialApprovedAt: row.testimonial_approved_at,
    techStack: row.tech_stack ?? [],
    publishStatus: row.publish_status,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    services: row.case_study_services.map((s) => s.service),
  };
}

/** Count of case studies that are published but awaiting testimonial approval. */
export async function getPendingApprovalCount(): Promise<number> {
  const supabase = await createServerSupabase();
  const { count, error } = await supabase
    .from("case_studies")
    .select("id", { count: "exact", head: true })
    .eq("publish_status", "published")
    .is("testimonial_approved_at", null);
  if (error) throw new Error(`Failed to count pending case studies: ${error.message}`);
  return count ?? 0;
}
