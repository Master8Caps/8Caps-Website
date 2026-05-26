import { notFound } from "next/navigation";
import { SiteForm } from "@/components/admin/SiteForm";
import { DeleteSiteButton } from "@/components/admin/DeleteSiteButton";
import {
  getAdminCategories,
  getAllTags,
  getSiteForEdit,
} from "@/lib/data/admin";
import { updateSite, deleteSite } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [site, categories, tags] = await Promise.all([
    getSiteForEdit(id),
    getAdminCategories(),
    getAllTags(),
  ]);

  if (!site) notFound();

  // Bind the site id into the update action.
  async function handleUpdate(values: Parameters<typeof updateSite>[1]) {
    "use server";
    return updateSite(id, values);
  }

  // Bind the site id into the delete action; returns the result so the
  // client button can confirm first and surface any failure.
  async function handleDelete() {
    "use server";
    return deleteSite(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-2xl font-bold text-ink">Edit product</h1>
        <DeleteSiteButton onDelete={handleDelete} />
      </div>
      <SiteForm
        initial={site}
        categories={categories}
        allTags={tags}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
