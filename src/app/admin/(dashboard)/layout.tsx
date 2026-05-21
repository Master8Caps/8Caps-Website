import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
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

  // The login page renders without the shell; middleware already guards
  // routes, but if a non-logged-in request reaches the layout, bail out.
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-surface-muted text-ink">
      <Sidebar email={user.email ?? ""} />
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
