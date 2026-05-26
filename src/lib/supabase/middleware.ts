import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function makeSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return { supabase, getResponse: () => response };
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
  return to;
}

/**
 * Refreshes the Supabase auth session on every request and guards /admin/*.
 * Used on the apex/dev/preview hosts where /admin/* still resolves directly.
 * On the admin subdomain, see {@link updateAdminSubdomainSession}.
 */
export async function updateSession(request: NextRequest) {
  const { supabase, getResponse } = makeSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginRoute = path === "/admin/login";

  if (isAdminRoute && !isLoginRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    return copyCookies(getResponse(), NextResponse.redirect(redirectUrl));
  }

  if (isLoginRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return copyCookies(getResponse(), NextResponse.redirect(redirectUrl));
  }

  return getResponse();
}

/**
 * Handles requests on the admin subdomain (admin.8caps.co.uk):
 *   - Rewrites the URL onto /admin/* internally (browser keeps the clean path)
 *   - Enforces auth using subdomain-local paths (`/login`, not `/admin/login`)
 *   - Preserves any Supabase session cookies on the final response
 */
export async function updateAdminSubdomainSession(
  request: NextRequest,
  internalPath: string,
) {
  const { supabase, getResponse } = makeSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = internalPath === "/admin/login";

  if (!isLoginRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return copyCookies(getResponse(), NextResponse.redirect(redirectUrl));
  }

  if (isLoginRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return copyCookies(getResponse(), NextResponse.redirect(redirectUrl));
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = internalPath;
  return copyCookies(
    getResponse(),
    NextResponse.rewrite(rewriteUrl, { request }),
  );
}
