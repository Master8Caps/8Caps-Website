/**
 * Pure helpers for building admin-area hrefs that adapt to the current host.
 *
 * On the admin subdomain the public URLs are prefix-free (`/sites`,
 * `/categories`, etc.) and Next.js serves them from the `/admin/*` tree via an
 * internal rewrite (see {@link "@/lib/host-routing"}). On the apex, on
 * localhost, and on Vercel previews the same pages live under `/admin/*`
 * directly.
 *
 * `basePath` is either `""` (admin subdomain) or `"/admin"` (everywhere else).
 */

export type AdminBasePath = "" | "/admin";

/**
 * Build the public href for an admin route given the current basePath.
 * The `path` argument is always the "admin-relative" path with a leading
 * slash (`/`, `/sites`, `/sites/new`, `/sites/${id}/edit`, ...).
 */
export function adminPath(basePath: AdminBasePath, path: string): string {
  if (basePath === "") {
    return path;
  }
  return path === "/" ? "/admin" : `/admin${path}`;
}
