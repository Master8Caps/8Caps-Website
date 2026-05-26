"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { siteFormSchema } from "@/lib/schemas";
import { slugify } from "@/lib/slugify";
import type { ActionResult, SiteFormValues } from "@/types/domain";

async function sitesListHref(): Promise<string> {
  const basePath = await getAdminBasePath();
  return adminPath(basePath, "/sites");
}

/**
 * Revalidate every public route that could show site data. Uses the
 * `/sites/[slug]` route pattern so every detail page is refreshed — this
 * covers creation, deletion, and slug changes without needing the slug.
 */
function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[slug]", "page");
}

/** Replace a site's child rows (services, screenshots, tags). */
async function writeChildren(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  siteId: string,
  values: SiteFormValues,
): Promise<string | null> {
  const deletedServices = await supabase
    .from("services")
    .delete()
    .eq("site_id", siteId);
  if (deletedServices.error) return deletedServices.error.message;

  const deletedScreenshots = await supabase
    .from("screenshots")
    .delete()
    .eq("site_id", siteId);
  if (deletedScreenshots.error) return deletedScreenshots.error.message;

  const deletedTags = await supabase
    .from("site_tags")
    .delete()
    .eq("site_id", siteId);
  if (deletedTags.error) return deletedTags.error.message;

  if (values.services.length > 0) {
    const { error } = await supabase.from("services").insert(
      values.services.map((s, i) => ({
        site_id: siteId,
        name: s.name,
        description: s.description || null,
        sort_order: i,
      })),
    );
    if (error) return error.message;
  }
  if (values.screenshots.length > 0) {
    const { error } = await supabase.from("screenshots").insert(
      values.screenshots.map((s, i) => ({
        site_id: siteId,
        image_url: s.imageUrl,
        alt_text: s.altText || null,
        sort_order: i,
      })),
    );
    if (error) return error.message;
  }
  if (values.tagIds.length > 0) {
    const { error } = await supabase
      .from("site_tags")
      .insert(values.tagIds.map((tagId) => ({ site_id: siteId, tag_id: tagId })));
    if (error) return error.message;
  }
  return null;
}

/** Map validated form values to a `sites` table row. */
function toSiteRow(values: SiteFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    url: values.url,
    logo_url: values.logoUrl,
    short_summary: values.shortSummary,
    full_overview: values.fullOverview || null,
    target_audience: values.targetAudience || null,
    category_id: values.categoryId,
    publish_status: values.publishStatus,
    lifecycle: values.lifecycle,
    visibility: values.visibility,
    is_featured: values.isFeatured,
    seo_title: values.seoTitle || null,
    seo_description: values.seoDescription || null,
  };
}

type CategoryResolution =
  | { ok: true; categoryId: string | null }
  | { ok: false; error: string };

/**
 * Decide a site's `category_id`. An explicit `categoryId` wins. Otherwise a
 * `newCategoryName` is matched case-insensitively to an existing category, or
 * a fresh category is created with a slug frozen at creation time.
 */
async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  values: SiteFormValues,
): Promise<CategoryResolution> {
  if (values.categoryId) {
    return { ok: true, categoryId: values.categoryId };
  }
  const name = values.newCategoryName?.trim();
  if (!name) return { ok: true, categoryId: null };

  const existing = await supabase
    .from("categories")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (existing.error) return { ok: false, error: existing.error.message };
  if (existing.data) return { ok: true, categoryId: existing.data.id };

  const created = await supabase
    .from("categories")
    .insert({ name, slug: slugify(name) })
    .select("id")
    .single();
  if (created.error) {
    return { ok: false, error: `Could not create category: ${created.error.message}` };
  }
  return { ok: true, categoryId: created.data.id };
}

export async function createSite(values: SiteFormValues): Promise<ActionResult> {
  const parsed = siteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const category = await resolveCategoryId(supabase, parsed.data);
  if (!category.ok) return { ok: false, error: category.error };

  const { data, error } = await supabase
    .from("sites")
    .insert({ ...toSiteRow(parsed.data), category_id: category.categoryId })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: `Could not create site: ${error.message}` };
  }

  const childError = await writeChildren(supabase, data.id, parsed.data);
  if (childError) {
    return { ok: false, error: `Site saved, but related data failed: ${childError}` };
  }

  revalidatePublic();
  redirect(await sitesListHref());
}

export async function updateSite(
  id: string,
  values: SiteFormValues,
): Promise<ActionResult> {
  const parsed = siteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const category = await resolveCategoryId(supabase, parsed.data);
  if (!category.ok) return { ok: false, error: category.error };

  const { error } = await supabase
    .from("sites")
    .update({ ...toSiteRow(parsed.data), category_id: category.categoryId })
    .eq("id", id);

  if (error) {
    return { ok: false, error: `Could not update site: ${error.message}` };
  }

  const childError = await writeChildren(supabase, id, parsed.data);
  if (childError) {
    return { ok: false, error: `Site saved, but related data failed: ${childError}` };
  }

  revalidatePublic();
  redirect(await sitesListHref());
}

export async function deleteSite(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) {
    return { ok: false, error: `Could not delete site: ${error.message}` };
  }
  revalidatePublic();
  redirect(await sitesListHref());
}
