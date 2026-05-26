"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { categoryRenameSchema } from "@/lib/schemas";
import type { ActionResult } from "@/types/domain";

function revalidateCategoryPages() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/categories");
}

/** Rename a category. The slug is frozen on creation and never changes. */
export async function updateCategory(
  id: string,
  name: string,
): Promise<ActionResult> {
  const parsed = categoryRenameSchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

/** Delete a category. Its sites become uncategorised (FK is ON DELETE SET NULL). */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

/** Move every site from `sourceId` to `targetId`, then delete the source. */
export async function mergeCategory(
  sourceId: string,
  targetId: string,
): Promise<ActionResult> {
  if (sourceId === targetId) {
    return { ok: false, error: "Cannot merge a category into itself." };
  }
  const supabase = await createServerSupabase();

  const reassign = await supabase
    .from("sites")
    .update({ category_id: targetId })
    .eq("category_id", sourceId);
  if (reassign.error) return { ok: false, error: reassign.error.message };

  const del = await supabase.from("categories").delete().eq("id", sourceId);
  if (del.error) return { ok: false, error: del.error.message };

  revalidateCategoryPages();
  return { ok: true };
}
