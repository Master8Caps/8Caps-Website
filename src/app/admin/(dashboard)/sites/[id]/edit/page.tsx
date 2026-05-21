import { notFound } from "next/navigation";
import { SiteForm } from "@/components/admin/SiteForm";
import {
  getAdminCategories,
  getAllTags,
  getSiteForEdit,
} from "@/lib/data/admin";
import { updateSite, deleteSite } from "../../actions";

export default async function EditSitePage({
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

  async function handleDelete() {
    "use server";
    // deleteSite redirects to /admin/sites on success; a returned error
    // (rare) is not surfaced here — the form-action signature is void.
    await deleteSite(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-2xl font-bold text-ink">Edit website</h1>
        <form action={handleDelete}>
          <button
            type="submit"
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600"
          >
            Delete
          </button>
        </form>
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
