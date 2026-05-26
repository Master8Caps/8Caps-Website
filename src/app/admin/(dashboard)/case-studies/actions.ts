"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { caseStudyFormSchema } from "@/lib/schemas";
import type { ActionResult } from "@/types/domain";
import type { CaseStudyFormValues } from "@/types/case-study";

async function caseStudiesListHref(): Promise<string> {
  const basePath = await getAdminBasePath();
  return adminPath(basePath, "/case-studies");
}

/**
 * Revalidate every public route affected by case study changes.
 */
function revalidatePublic() {
  revalidatePath("/");                            // featured case studies on home
  revalidatePath("/work");                        // /work list
  revalidatePath("/work/[slug]", "page");         // every detail page
}

/** Map form values to a `case_studies` table row (snake_case). */
function toCaseStudyRow(values: CaseStudyFormValues) {
  return {
    slug: values.slug,
    client_name: values.clientName,
    client_sector: values.clientSector || null,
    year: values.year,
    logo_url: values.logoUrl,
    brand_colour: values.brandColour || null,
    outcome_headline: values.outcomeHeadline,
    story_problem: values.storyProblem,
    story_solution: values.storySolution,
    testimonial_quote: values.testimonialQuote,
    testimonial_author: values.testimonialAuthor,
    testimonial_role: values.testimonialRole || null,
    testimonial_approved_at: values.testimonialApproved ? new Date().toISOString() : null,
    tech_stack: values.techStack,
    publish_status: values.publishStatus,
    is_featured: values.isFeatured,
    sort_order: values.sortOrder,
  };
}

/** Delete-and-reinsert the M2M services rows for a case study. */
async function writeServices(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  caseStudyId: string,
  services: CaseStudyFormValues["services"],
): Promise<string | null> {
  const deleted = await supabase
    .from("case_study_services")
    .delete()
    .eq("case_study_id", caseStudyId);
  if (deleted.error) return deleted.error.message;

  if (services.length === 0) return null;

  const { error } = await supabase
    .from("case_study_services")
    .insert(services.map((service) => ({ case_study_id: caseStudyId, service })));
  if (error) return error.message;

  return null;
}

export async function createCaseStudy(
  values: CaseStudyFormValues,
): Promise<ActionResult> {
  const parsed = caseStudyFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const row = toCaseStudyRow(parsed.data);

  const { data, error } = await supabase
    .from("case_studies")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    return { ok: false, error: `Could not create case study: ${error.message}` };
  }

  const servicesError = await writeServices(supabase, data.id, parsed.data.services);
  if (servicesError) {
    return { ok: false, error: `Case study saved, but services failed: ${servicesError}` };
  }

  revalidatePublic();
  redirect(await caseStudiesListHref());
}

export async function updateCaseStudy(
  id: string,
  values: CaseStudyFormValues,
): Promise<ActionResult> {
  const parsed = caseStudyFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("case_studies")
    .update(toCaseStudyRow(parsed.data))
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not update case study: ${error.message}` };
  }

  const servicesError = await writeServices(supabase, id, parsed.data.services);
  if (servicesError) {
    return { ok: false, error: `Case study saved, but services failed: ${servicesError}` };
  }

  revalidatePublic();
  redirect(await caseStudiesListHref());
}

export async function deleteCaseStudy(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("case_studies").delete().eq("id", id);
  if (error) {
    return { ok: false, error: `Could not delete case study: ${error.message}` };
  }
  revalidatePublic();
  redirect(await caseStudiesListHref());
}

export async function approveCaseStudy(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("case_studies")
    .update({ testimonial_approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not approve testimonial: ${error.message}` };
  }
  revalidatePublic();
  revalidatePath(adminPath(await getAdminBasePath(), "/case-studies"));
  return { ok: true };
}

export async function revokeApproval(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("case_studies")
    .update({ testimonial_approved_at: null })
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not revoke approval: ${error.message}` };
  }
  revalidatePublic();
  revalidatePath(adminPath(await getAdminBasePath(), "/case-studies"));
  return { ok: true };
}
