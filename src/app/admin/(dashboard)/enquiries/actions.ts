"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import type { ActionResult, EnquiryStatus } from "@/types/domain";

const VALID_STATUSES: readonly EnquiryStatus[] = ["new", "read", "archived"];

/** Revalidate every admin view whose enquiry counts/rows go stale on a status
 *  change: the inbox list, the dashboard callout + sidebar badge, and the
 *  detail page itself. */
async function revalidateEnquiries(id: string) {
  const basePath = await getAdminBasePath();
  revalidatePath(adminPath(basePath, "/enquiries"));
  revalidatePath(adminPath(basePath, `/enquiries/${id}`));
  revalidatePath(adminPath(basePath, "/"));
}

export async function setEnquiryStatus(
  id: string,
  status: EnquiryStatus,
): Promise<ActionResult> {
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not update enquiry: ${error.message}` };
  }

  await revalidateEnquiries(id);
  return { ok: true };
}
