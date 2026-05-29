import { CategoryManager } from "@/components/admin/CategoryManager";
import { getAdminCategories } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="p-8">
      <PageHeader
        title="Categories"
        description="Categories are assigned automatically as you add products. Use this page to rename, merge duplicates, or remove ones you don't need."
      />
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
