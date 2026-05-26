import { SiteForm } from "@/components/admin/SiteForm";
import { getAdminCategories, getAllTags } from "@/lib/data/admin";
import { createSite } from "../actions";

export default async function NewProductPage() {
  const [categories, tags] = await Promise.all([
    getAdminCategories(),
    getAllTags(),
  ]);

  return (
    <div>
      <h1 className="px-8 pt-8 text-2xl font-bold text-ink">Add a product</h1>
      <SiteForm
        categories={categories}
        allTags={tags}
        onSubmit={createSite}
        enableUrlAnalysis
      />
    </div>
  );
}
