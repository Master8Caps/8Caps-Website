import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { getNewEnquiryCount } from "@/lib/data/enquiries";
import { AdminPathProvider } from "@/components/admin/AdminPathContext";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const basePath = await getAdminBasePath();

  // The login page renders without the shell; middleware already guards
  // routes, but if a non-logged-in request reaches the layout, bail out.
  if (!user) redirect(adminPath(basePath, "/login"));

  const newEnquiries = await getNewEnquiryCount();

  return (
    <AdminPathProvider basePath={basePath}>
      <div className="flex min-h-dvh bg-surface-muted text-ink">
        <Sidebar email={user.email ?? ""} newEnquiries={newEnquiries} />
        <div className="flex-1 overflow-x-auto pt-16 lg:pt-0">{children}</div>
      </div>
    </AdminPathProvider>
  );
}
