import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HOST, decideRoute } from "@/lib/host-routing";
import {
  updateAdminSubdomainSession,
  updateSession,
} from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
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
