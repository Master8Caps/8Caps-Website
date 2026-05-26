import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_HOST,
  decideRoute,
  legacySitesRedirect,
} from "@/lib/host-routing";
import {
  updateAdminSubdomainSession,
  updateSession,
} from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Legacy admin URL rename: /sites/* → /products/* (mirrors the public
  // /sites → /products redirect in next.config.ts). Emit a 308 before the
  // host-routing logic so old bookmarks land on the canonical URL.
  const renamed = legacySitesRedirect(host, request.nextUrl.pathname);
  if (renamed) {
    const target = request.nextUrl.clone();
    target.pathname = renamed;
    return NextResponse.redirect(target, 308);
  }

  const decision = decideRoute(host, request.nextUrl.pathname);

  if (decision.kind === "apex-admin-redirect") {
    const target = request.nextUrl.clone();
    target.host = ADMIN_HOST;
    target.pathname = decision.targetPath;
    return NextResponse.redirect(target, 308);
  }

  if (decision.kind === "admin-subdomain") {
    return updateAdminSubdomainSession(request, decision.internalPath);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
