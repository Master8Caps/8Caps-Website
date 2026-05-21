"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { siteFormSchema } from "@/lib/schemas";
import type { ActionResult, SiteFormValues } from "@/types/domain";

/**
 * Revalidate every public route that could show site data. Uses the
 * `/sites/[slug]` route pattern so every detail page is refreshed — this
 * covers creation, deletion, and slug changes without needing the slug.
 */
function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/sites");
  revalidatePath("/sites/[slug]", "page");
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

export async function createSite(values: SiteFormValues): Promise<ActionResult> {
  const parsed = siteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .insert(toSiteRow(parsed.data))
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
  redirect("/admin/sites");
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
  const { error } = await supabase
    .from("sites")
    .update(toSiteRow(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, error: `Could not update site: ${error.message}` };
  }

  const childError = await writeChildren(supabase, id, parsed.data);
  if (childError) {
    return { ok: false, error: `Site saved, but related data failed: ${childError}` };
  }

  revalidatePublic();
  redirect("/admin/sites");
}

export async function deleteSite(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) {
    return { ok: false, error: `Could not delete site: ${error.message}` };
  }
  revalidatePublic();
  redirect("/admin/sites");
}
