"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  const basePath = await getAdminBasePath();
  redirect(adminPath(basePath, "/login"));
}
