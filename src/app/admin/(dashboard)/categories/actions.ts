"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/schemas";
import type { ActionResult } from "@/types/domain";

function revalidateCategoryPages() {
  revalidatePath("/");
  revalidatePath("/sites");
  revalidatePath("/admin/categories");
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description: string;
}): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: { name: string; slug: string; description: string },
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}
