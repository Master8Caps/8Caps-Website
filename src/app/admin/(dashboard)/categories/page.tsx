import { CategoryManager } from "@/components/admin/CategoryManager";
import { getAdminCategories } from "@/lib/data/admin";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink">Categories</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Manage the categories websites can be filed under.
      </p>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
