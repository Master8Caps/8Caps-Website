/**
 * Pure host/path → routing decision logic for the Next.js proxy.
 *
 * The admin dashboard is served as a route-group under `/admin/*` in the same
 * Next.js app, but in production we expose it on the `admin.8caps.co.uk`
 * subdomain with the `/admin` prefix stripped from the public URL. Localhost
 * and Vercel preview deploys keep `/admin/*` working directly so the dev loop
 * isn't broken.
 */

export const ADMIN_HOST = "admin.8caps.co.uk";
export const PROD_APEX_HOSTS = ["8caps.co.uk", "www.8caps.co.uk"] as const;

export type RouteDecision =
  | { kind: "apex-admin-redirect"; targetPath: string }
  | { kind: "admin-subdomain"; internalPath: string }
  | { kind: "passthrough" };

function normaliseHost(raw: string): string {
  return raw.toLowerCase().split(":")[0];
}

/**
 * Legacy URL rename: admin `/sites/*` → `/products/*`, mirroring the
 * public-side redirect in `next.config.ts`. Returns the renamed path when
 * the input is a legacy admin URL, or `null` otherwise.
 *
 * Subdomain bookmarks like `admin.8caps.co.uk/sites/abc/edit` and apex
 * bookmarks like `8caps.co.uk/admin/sites/abc/edit` both 308 to the
 * `/products` equivalent.
 */
export function legacySitesRedirect(host: string, pathname: string): string | null {
  const h = normaliseHost(host);

  if (h === ADMIN_HOST) {
    if (pathname === "/sites") return "/products";
    if (pathname.startsWith("/sites/")) {
      return "/products" + pathname.slice("/sites".length);
    }
  }

  if (pathname === "/admin/sites") return "/admin/products";
  if (pathname.startsWith("/admin/sites/")) {
    return "/admin/products" + pathname.slice("/admin/sites".length);
  }

  return null;
}

export function decideRoute(host: string, pathname: string): RouteDecision {
  const h = normaliseHost(host);

  if (
    (PROD_APEX_HOSTS as readonly string[]).includes(h) &&
    pathname.startsWith("/admin")
  ) {
    const stripped = pathname.replace(/^\/admin\/?/, "/");
    return {
      kind: "apex-admin-redirect",
      targetPath: stripped === "" ? "/" : stripped,
    };
  }

  if (h === ADMIN_HOST) {
    let internalPath: string;
    if (pathname === "/") {
      internalPath = "/admin";
    } else if (pathname.startsWith("/admin")) {
      internalPath = pathname;
    } else {
      internalPath = "/admin" + pathname;
    }
    return { kind: "admin-subdomain", internalPath };
  }

  return { kind: "passthrough" };
}
