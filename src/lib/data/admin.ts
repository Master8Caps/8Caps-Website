import { createServerSupabase } from "@/lib/supabase/server";
import type {
  AdminSiteRow,
  Category,
  DashboardStats,
  SiteFormValues,
  Tag,
} from "@/types/domain";

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

  const [total, published, draft, categories] = await Promise.all([
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
  ]);

  return {
    totalSites: total.count ?? 0,
    publishedSites: published.count ?? 0,
    draftSites: draft.count ?? 0,
    categories: categories.count ?? 0,
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

/** All categories, alphabetical. */
export async function getAdminCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data ?? []) as Category[];
}
