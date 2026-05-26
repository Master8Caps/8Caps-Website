import "server-only";
import { headers } from "next/headers";
import { ADMIN_HOST } from "@/lib/host-routing";
import type { AdminBasePath } from "@/lib/admin-paths";

/**
 * Decide the admin basePath for the current request by inspecting the host
 * header. Returns `""` on the admin subdomain (URLs are prefix-free) and
 * `"/admin"` everywhere else (apex, localhost, Vercel previews).
 */
export async function getAdminBasePath(): Promise<AdminBasePath> {
  const host = (await headers()).get("host") ?? "";
  const normalised = host.toLowerCase().split(":")[0];
  return normalised === ADMIN_HOST ? "" : "/admin";
}
