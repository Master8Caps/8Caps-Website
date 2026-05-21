import { createPublicClient } from "@/lib/supabase/public";
import type { Category } from "@/types/domain";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

/** All categories, alphabetical. */
export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data ?? []).map(toCategory);
}

/** A single category by slug, or null if not found. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load category "${slug}": ${error.message}`);
  return data ? toCategory(data as CategoryRow) : null;
}
