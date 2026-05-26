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
