import { createPublicClient } from "@/lib/supabase/public";
import { getPagination } from "@/lib/directory";
import type { DirectoryParams } from "@/lib/directory";
import { getCategoryBySlug } from "@/lib/data/categories";
import type {
  Category,
  Service,
  Screenshot,
  SiteDetail,
  SiteSummary,
  Tag,
} from "@/types/domain";

// Column lists kept as constants so the row types below stay in sync.
const SUMMARY_COLUMNS =
  "id, name, slug, url, logo_url, short_summary, lifecycle, is_featured, " +
  "category:categories (id, name, slug, description)";

const DETAIL_COLUMNS =
  SUMMARY_COLUMNS +
  ", full_overview, target_audience, seo_title, seo_description, " +
  "services (id, name, description, sort_order), " +
  "screenshots (id, image_url, alt_text, sort_order), " +
  "site_tags (tags (id, name, slug))";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SummaryRow {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  short_summary: string;
  lifecycle: "live" | "coming_soon";
  is_featured: boolean;
  category: CategoryRow | null;
}

interface DetailRow extends SummaryRow {
  full_overview: string | null;
  target_audience: string | null;
  seo_title: string | null;
  seo_description: string | null;
  services: {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
  }[];
  screenshots: {
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
  }[];
  site_tags: { tags: { id: string; name: string; slug: string } | null }[];
}

function toCategory(row: CategoryRow | null): Category | null {
  return row
    ? { id: row.id, name: row.name, slug: row.slug, description: row.description }
    : null;
}

function toSummary(row: SummaryRow): SiteSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    url: row.url,
    logoUrl: row.logo_url,
    shortSummary: row.short_summary,
    lifecycle: row.lifecycle,
    isFeatured: row.is_featured,
    category: toCategory(row.category),
  };
}

function toDetail(row: DetailRow): SiteDetail {
  const services: Service[] = [...row.services]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      sortOrder: s.sort_order,
    }));

  const screenshots: Screenshot[] = [...row.screenshots]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      imageUrl: s.image_url,
      altText: s.alt_text,
      sortOrder: s.sort_order,
    }));

  const tags: Tag[] = row.site_tags
    .map((st) => st.tags)
    .filter((t): t is Tag => t !== null);

  return {
    ...toSummary(row),
    fullOverview: row.full_overview,
    targetAudience: row.target_audience,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    services,
    screenshots,
    tags,
  };
}

export interface DirectoryResult {
  sites: SiteSummary[];
  total: number;
  totalPages: number;
  page: number;
}

/** Paginated, filtered directory listing. RLS restricts rows to published + public. */
export async function getDirectorySites(
  params: DirectoryParams,
): Promise<DirectoryResult> {
  const supabase = createPublicClient();
  const counting = getPagination(params.page, Number.MAX_SAFE_INTEGER);

  // Resolve a category slug to its id. Filtering on an embedded resource is
  // fiddly in PostgREST, so we filter on the direct `category_id` column.
  let categoryId: string | null = null;
  if (params.category) {
    const category = await getCategoryBySlug(params.category);
    if (!category) {
      return { sites: [], total: 0, totalPages: 0, page: params.page };
    }
    categoryId = category.id;
  }

  let q = supabase
    .from("sites")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .order("is_featured", { ascending: false })
    .order("name");

  if (params.query) {
    q = q.or(
      `name.ilike.%${params.query}%,short_summary.ilike.%${params.query}%`,
    );
  }
  if (params.lifecycle) {
    q = q.eq("lifecycle", params.lifecycle);
  }
  if (categoryId) {
    q = q.eq("category_id", categoryId);
  }

  q = q.range(counting.from, counting.to);

  const { data, error, count } = await q;
  if (error) throw new Error(`Failed to load directory: ${error.message}`);

  const total = count ?? 0;
  const { totalPages } = getPagination(params.page, total);

  return {
    sites: ((data ?? []) as unknown as SummaryRow[]).map(toSummary),
    total,
    totalPages,
    page: params.page,
  };
}

/** Featured sites for the homepage. */
export async function getFeaturedSites(limit = 3): Promise<SiteSummary[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select(SUMMARY_COLUMNS)
    .eq("is_featured", true)
    .order("name")
    .limit(limit);

  if (error) throw new Error(`Failed to load featured sites: ${error.message}`);
  return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
}

/** A single site with all related data, or null if not found / not public. */
export async function getSiteBySlug(slug: string): Promise<SiteDetail | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load site "${slug}": ${error.message}`);
  return data ? toDetail(data as unknown as DetailRow) : null;
}

/** Up to `limit` other public sites in the same category. */
export async function getRelatedSites(
  siteId: string,
  categoryId: string | null,
  limit = 3,
): Promise<SiteSummary[]> {
  if (!categoryId) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select(SUMMARY_COLUMNS)
    .eq("category_id", categoryId)
    .neq("id", siteId)
    .order("name")
    .limit(limit);

  if (error) throw new Error(`Failed to load related sites: ${error.message}`);
  return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
}

/** All published slugs — used by sitemap and static params. */
export async function getAllSiteSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("sites").select("slug");
  if (error) throw new Error(`Failed to load slugs: ${error.message}`);
  return (data ?? []).map((r) => r.slug as string);
}
