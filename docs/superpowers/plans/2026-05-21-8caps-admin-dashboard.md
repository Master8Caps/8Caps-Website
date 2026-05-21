# 8Caps Admin Dashboard Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the private 8Caps admin dashboard — authentication, route protection, and full content management (create/edit/publish/archive websites, manage categories, upload logos and screenshots).

**Architecture:** Supabase Auth via `@supabase/ssr` with cookie-based sessions and Next.js middleware guarding `/admin/*`. All mutations are Server Actions, validated with Zod, writing through the logged-in admin's session (RLS enforces `is_admin()`). Logos/screenshots upload directly from the browser to a Supabase Storage bucket. After any content change the action revalidates the affected public ISR routes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Auth + Postgres + Storage), `@supabase/ssr`, Zod, Vitest + React Testing Library.

---

## Scope

**In scope (Plan 2):** auth + login/logout, middleware, the `is_admin()` / `profiles` trigger / admin RLS / storage migrations, the admin shell, dashboard, site list, the site create/edit form with image uploads, category CRUD.

**Out of scope (Plan 3):** the public contact form, Resend email, the `/admin/enquiries` inbox. The Enquiries sidebar link is rendered now but points to a page built in Plan 3 — this plan adds a minimal placeholder so the link does not 404.

**Reference:** spec `docs/superpowers/specs/2026-05-21-admin-enquiries-design.md`. Plan 1 (the public site) is live; its files, the data layer in `src/lib/data/`, and the Oxford Blue design tokens in `src/app/globals.css` are the patterns to follow.

**Testing approach:** Pure logic (`slugify`, the Zod schemas) is built test-first with Vitest. The site-form sub-components get React Testing Library tests. Auth plumbing, Server Actions, RLS, middleware, and Storage are verified by `npm run typecheck` + `npm run lint` + `npm run build` plus the manual checks each task lists — unit-testing thin I/O wrappers and framework plumbing has low value.

**Database note:** the three migration tasks (3, 4, 5) are applied to the hosted Supabase project (`vokrxnqitfotucpnvfwe`) using the Supabase MCP `apply_migration` tool, run by the controller — not a sandboxed shell. Each migration's SQL is also saved into `supabase/migrations/` for the record. The `profiles` and `enquiries` tables and all enums already exist from Plan 1.

**Sandbox note:** the Bash sandbox blocks network. Run `npm install` and `npm run build` with `dangerouslyDisableSandbox: true`. `npm test` / `typecheck` / `lint` / `git` normally do not need network — retry with the flag if one hits `ECONNRESET`.

---

## File Structure

```
src/
├── middleware.ts                         # NEW — session refresh + /admin guard
├── lib/
│   ├── supabase/
│   │   ├── public.ts                     # EXISTS — anon read-only client
│   │   ├── server.ts                     # NEW — authed server client (RSC/actions)
│   │   ├── browser.ts                    # NEW — browser client (login, uploads)
│   │   └── middleware.ts                 # NEW — updateSession() helper
│   ├── data/
│   │   ├── sites.ts                      # EXISTS
│   │   ├── categories.ts                 # EXISTS
│   │   └── admin.ts                      # NEW — admin reads (drafts, stats, edit shape)
│   ├── slugify.ts                        # NEW — pure slug helper
│   └── schemas.ts                        # NEW — Zod schemas for form input
├── types/domain.ts                       # MODIFY — add SiteFormValues, input + ActionResult types
├── app/
│   ├── layout.tsx                        # MODIFY — slim to html/body/fonts only
│   ├── (public)/                         # NEW route group — public-site chrome
│   │   ├── layout.tsx                    # NEW — Header + Footer wrapper
│   │   ├── page.tsx                      # MOVED from app/page.tsx
│   │   ├── sites/...                     # MOVED from app/sites/
│   │   ├── about/page.tsx                # MOVED from app/about/
│   │   └── contact/page.tsx              # MOVED from app/contact/
│   ├── sitemap.ts / robots.ts            # UNCHANGED — stay at app root
│   ├── admin/
│   │   ├── login/page.tsx                # NEW — login (root layout only, no shell)
│   │   ├── actions.ts                    # NEW — logout action
│   │   └── (dashboard)/                  # NEW route group — the authed admin shell
│   │       ├── layout.tsx                # NEW — sidebar shell + auth guard
│   │       ├── page.tsx                  # NEW — dashboard (URL: /admin)
│   │       ├── sites/
│   │       │   ├── page.tsx              # NEW — site list
│   │       │   ├── actions.ts            # NEW — site Server Actions
│   │       │   ├── new/page.tsx          # NEW — create site
│   │       │   └── [id]/edit/page.tsx    # NEW — edit site
│   │       ├── categories/
│   │       │   ├── page.tsx              # NEW — category management
│   │       │   └── actions.ts            # NEW — category Server Actions
│   │       └── enquiries/page.tsx        # NEW — placeholder (real page = Plan 3)
├── components/admin/
│   ├── Sidebar.tsx                       # NEW — admin nav
│   ├── StatCard.tsx                      # NEW — dashboard stat card
│   ├── SiteForm.tsx                      # NEW — the create/edit form (client)
│   ├── ServicesEditor.tsx                # NEW — repeatable service rows
│   ├── ScreenshotsEditor.tsx             # NEW — screenshot upload + list
│   ├── TagSelector.tsx                   # NEW — multi-select tags
│   └── CategoryManager.tsx               # NEW — category list/add/edit/delete (client)
supabase/migrations/                      # NEW migration .sql files (also applied via MCP)
next.config.ts                            # MODIFY — add Supabase storage image host
```

---

## Task 1: Install dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install `@supabase/ssr` and `zod`**

Run (with `dangerouslyDisableSandbox: true`):
```bash
npm install @supabase/ssr zod
```
Expected: both added to `dependencies`.

- [ ] **Step 2: Verify the build still passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds, unchanged route table.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/ssr and zod"
```

---

## Task 2: Supabase server and browser clients

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`

- [ ] **Step 1: Create `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components and Server Actions. Carries the
 * logged-in admin's session via cookies, so RLS sees an authenticated user.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookies are read-only here.
          // The middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
```

- [ ] **Step 2: Create `src/lib/supabase/browser.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for client components (login form, file uploads). */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY");
  }
  return createBrowserClient(url, key);
}
```

- [ ] **Step 3: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/browser.ts
git commit -m "feat: add Supabase server and browser clients"
```

---

## Task 3: Migration — `is_admin()` and the `profiles` trigger

**Files:** Create `supabase/migrations/20260521150000_admin_auth.sql`

- [ ] **Step 1: Write the migration SQL into that file**

```sql
-- Auto-create a profiles row whenever an auth user is created.
create function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- True when the current request is from an admin (has a profiles row).
create function is_admin() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;
```

- [ ] **Step 2: Apply the migration**

Controller: apply via the Supabase MCP `apply_migration` tool, project `vokrxnqitfotucpnvfwe`, name `admin_auth`, with the SQL above.
Expected: `{"success":true}`.

- [ ] **Step 3: Verify the function exists**

Controller: run via the MCP `execute_sql` — `select is_admin();`
Expected: returns `false` (no auth context in the SQL editor) — the function exists and runs.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260521150000_admin_auth.sql
git commit -m "feat: add is_admin() and profiles auto-creation trigger"
```

---

## Task 4: Migration — admin RLS policies

**Files:** Create `supabase/migrations/20260521150100_admin_rls.sql`

- [ ] **Step 1: Write the migration SQL into that file**

```sql
-- Admin full access. Plan 1's public-read policies are left untouched;
-- these are additive (Postgres ORs multiple permissive policies).

-- sites
create policy "admins read all sites" on sites
  for select using (is_admin());
create policy "admins insert sites" on sites
  for insert with check (is_admin());
create policy "admins update sites" on sites
  for update using (is_admin());
create policy "admins delete sites" on sites
  for delete using (is_admin());

-- services
create policy "admins read all services" on services
  for select using (is_admin());
create policy "admins write services" on services
  for all using (is_admin()) with check (is_admin());

-- screenshots
create policy "admins read all screenshots" on screenshots
  for select using (is_admin());
create policy "admins write screenshots" on screenshots
  for all using (is_admin()) with check (is_admin());

-- site_tags
create policy "admins read all site_tags" on site_tags
  for select using (is_admin());
create policy "admins write site_tags" on site_tags
  for all using (is_admin()) with check (is_admin());

-- categories
create policy "admins write categories" on categories
  for all using (is_admin()) with check (is_admin());

-- tags
create policy "admins write tags" on tags
  for all using (is_admin()) with check (is_admin());

-- enquiries (the inbox is Plan 3, but admins need read/update/delete)
create policy "admins read enquiries" on enquiries
  for select using (is_admin());
create policy "admins update enquiries" on enquiries
  for update using (is_admin());
create policy "admins delete enquiries" on enquiries
  for delete using (is_admin());

-- profiles
create policy "admins read profiles" on profiles
  for select using (is_admin());
```

- [ ] **Step 2: Apply the migration**

Controller: apply via the Supabase MCP `apply_migration`, name `admin_rls`.
Expected: `{"success":true}`.

- [ ] **Step 3: Verify the public site is unaffected**

Controller: run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds; `/sites/[slug]` still statically generates exactly the 3 published slugs (`automated-panda`, `leadharbour`, `proptoolkit`) — the public anon read still works, drafts still hidden.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260521150100_admin_rls.sql
git commit -m "feat: add admin RLS policies"
```

---

## Task 5: Migration — Storage bucket and policies

**Files:** Create `supabase/migrations/20260521150200_storage.sql`

- [ ] **Step 1: Write the migration SQL into that file**

```sql
-- Public bucket for site logos and screenshots.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Anyone may read; only admins may write.
create policy "public read site-media" on storage.objects
  for select using (bucket_id = 'site-media');

create policy "admins insert site-media" on storage.objects
  for insert with check (bucket_id = 'site-media' and is_admin());

create policy "admins update site-media" on storage.objects
  for update using (bucket_id = 'site-media' and is_admin());

create policy "admins delete site-media" on storage.objects
  for delete using (bucket_id = 'site-media' and is_admin());
```

- [ ] **Step 2: Apply the migration**

Controller: apply via the Supabase MCP `apply_migration`, name `storage`.
Expected: `{"success":true}`.

- [ ] **Step 3: Verify the bucket exists**

Controller: run via the MCP `execute_sql` — `select id, public from storage.buckets where id = 'site-media';`
Expected: one row, `public = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260521150200_storage.sql
git commit -m "feat: add site-media storage bucket and policies"
```

---

## Task 6: Auth middleware

**Files:**
- Create: `src/lib/supabase/middleware.ts`, `src/middleware.ts`

- [ ] **Step 1: Create `src/lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and guards /admin/*.
 * Unauthenticated requests to an /admin route (other than the login page)
 * are redirected to /admin/login.
 */
export async function updateSession(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginRoute = path === "/admin/login";

  if (isAdminRoute && !isLoginRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Already logged in and visiting the login page — send to the dashboard.
  if (isLoginRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
```

- [ ] **Step 2: Create `src/middleware.ts`**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

- [ ] **Step 3: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds; build output now shows `ƒ Middleware`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/middleware.ts src/middleware.ts
git commit -m "feat: add auth middleware guarding /admin routes"
```

---

## Task 7: `slugify` utility (test-first)

**Files:**
- Create: `src/lib/slugify.ts`, `src/lib/slugify.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/slugify.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Automated Panda")).toBe("automated-panda");
  });

  it("strips punctuation and symbols", () => {
    expect(slugify("Lead & Harbour!")).toBe("lead-harbour");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   --  b")).toBe("a-b");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("returns an empty string for input with no usable characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm test -- slugify`.
Expected: FAIL — `./slugify` cannot be resolved.

- [ ] **Step 3: Create `src/lib/slugify.ts`**

```ts
/** Converts arbitrary text into a URL-safe slug (lowercase, hyphen-separated). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm test -- slugify`.
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slugify.ts src/lib/slugify.test.ts
git commit -m "feat: add slugify utility"
```

---

## Task 8: Domain types for the admin form

**Files:** Modify `src/types/domain.ts`

- [ ] **Step 1: Append the admin input types to `src/types/domain.ts`**

Add at the end of the file (the existing types stay unchanged):
```ts
/** One service row in the site form. */
export interface ServiceInput {
  name: string;
  description: string;
}

/** One screenshot row in the site form. */
export interface ScreenshotInput {
  imageUrl: string;
  altText: string;
}

/** The full editable shape of a site, as used by the admin site form. */
export interface SiteFormValues {
  name: string;
  slug: string;
  url: string;
  logoUrl: string | null;
  shortSummary: string;
  fullOverview: string;
  targetAudience: string;
  categoryId: string | null;
  publishStatus: PublishStatus;
  lifecycle: SiteLifecycle;
  visibility: SiteVisibility;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  services: ServiceInput[];
  screenshots: ScreenshotInput[];
  tagIds: string[];
}

/** A site row in the admin list view. */
export interface AdminSiteRow {
  id: string;
  name: string;
  slug: string;
  publishStatus: PublishStatus;
  lifecycle: SiteLifecycle;
  visibility: SiteVisibility;
  isFeatured: boolean;
  categoryName: string | null;
  updatedAt: string;
}

/** Dashboard counts. */
export interface DashboardStats {
  totalSites: number;
  publishedSites: number;
  draftSites: number;
  categories: number;
}

/** Result returned by a Server Action on the validation / DB-error path. */
export interface ActionResult {
  ok: boolean;
  error?: string;
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/domain.ts
git commit -m "feat: add admin domain types"
```

---

## Task 9: Zod schemas (test-first)

**Files:**
- Create: `src/lib/schemas.ts`, `src/lib/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/schemas.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { siteFormSchema, categorySchema } from "./schemas";

const validSite = {
  name: "Test Site",
  slug: "test-site",
  url: "https://example.com",
  logoUrl: null,
  shortSummary: "A short summary.",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  publishStatus: "draft",
  lifecycle: "live",
  visibility: "public",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  services: [],
  screenshots: [],
  tagIds: [],
};

describe("siteFormSchema", () => {
  it("accepts a valid site", () => {
    expect(siteFormSchema.safeParse(validSite).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, name: "" }).success,
    ).toBe(false);
  });

  it("rejects a non-URL url", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, url: "not-a-url" }).success,
    ).toBe(false);
  });

  it("rejects an invalid publishStatus", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, publishStatus: "wrong" })
        .success,
    ).toBe(false);
  });

  it("rejects an empty slug", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, slug: "" }).success,
    ).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts a valid category", () => {
    expect(
      categorySchema.safeParse({
        name: "Automation",
        slug: "automation",
        description: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      categorySchema.safeParse({ name: "", slug: "x", description: "" })
        .success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm test -- schemas`.
Expected: FAIL — `./schemas` cannot be resolved.

- [ ] **Step 3: Create `src/lib/schemas.ts`**

```ts
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string(),
});

const screenshotSchema = z.object({
  imageUrl: z.string().url("Screenshot must have a valid URL"),
  altText: z.string(),
});

export const siteFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  url: z.string().url("Must be a valid URL"),
  logoUrl: z.string().url().nullable(),
  shortSummary: z.string().min(1, "Short summary is required"),
  fullOverview: z.string(),
  targetAudience: z.string(),
  categoryId: z.string().uuid().nullable(),
  publishStatus: z.enum(["draft", "published", "archived"]),
  lifecycle: z.enum(["live", "coming_soon"]),
  visibility: z.enum(["public", "private"]),
  isFeatured: z.boolean(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  services: z.array(serviceSchema),
  screenshots: z.array(screenshotSchema),
  tagIds: z.array(z.string().uuid()),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  description: z.string(),
});

export type SiteFormInput = z.infer<typeof siteFormSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm test -- schemas`.
Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat: add Zod validation schemas"
```

---

## Task 10: Admin data layer

**Files:** Create `src/lib/data/admin.ts`

- [ ] **Step 1: Create `src/lib/data/admin.ts`**

```ts
import { createServerSupabase } from "@/lib/supabase/server";
import type {
  AdminSiteRow,
  Category,
  DashboardStats,
  SiteFormValues,
  Tag,
} from "@/types/domain";

interface AdminSiteRowRaw {
  id: string;
  name: string;
  slug: string;
  publish_status: AdminSiteRow["publishStatus"];
  lifecycle: AdminSiteRow["lifecycle"];
  visibility: AdminSiteRow["visibility"];
  is_featured: boolean;
  updated_at: string;
  category: { name: string } | null;
}

/** All sites (incl. drafts), newest-edited first, optionally name-filtered. */
export async function getAdminSites(search?: string): Promise<AdminSiteRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("sites")
    .select(
      "id, name, slug, publish_status, lifecycle, visibility, is_featured, updated_at, category:categories (name)",
    )
    .order("updated_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load sites: ${error.message}`);

  return ((data ?? []) as unknown as AdminSiteRowRaw[]).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    publishStatus: r.publish_status,
    lifecycle: r.lifecycle,
    visibility: r.visibility,
    isFeatured: r.is_featured,
    categoryName: r.category?.name ?? null,
    updatedAt: r.updated_at,
  }));
}

/** Dashboard counts. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabase();

  const [total, published, draft, categories] = await Promise.all([
    supabase.from("sites").select("id", { count: "exact", head: true }),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("publish_status", "published"),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("publish_status", "draft"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalSites: total.count ?? 0,
    publishedSites: published.count ?? 0,
    draftSites: draft.count ?? 0,
    categories: categories.count ?? 0,
  };
}

interface SiteEditRaw {
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  short_summary: string;
  full_overview: string | null;
  target_audience: string | null;
  category_id: string | null;
  publish_status: SiteFormValues["publishStatus"];
  lifecycle: SiteFormValues["lifecycle"];
  visibility: SiteFormValues["visibility"];
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  services: { name: string; description: string | null; sort_order: number }[];
  screenshots: { image_url: string; alt_text: string | null; sort_order: number }[];
  site_tags: { tag_id: string }[];
}

/** A site in the editable form shape, or null if not found. */
export async function getSiteForEdit(
  id: string,
): Promise<SiteFormValues | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .select(
      "name, slug, url, logo_url, short_summary, full_overview, target_audience, " +
        "category_id, publish_status, lifecycle, visibility, is_featured, " +
        "seo_title, seo_description, " +
        "services (name, description, sort_order), " +
        "screenshots (image_url, alt_text, sort_order), " +
        "site_tags (tag_id)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load site: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as SiteEditRaw;
  return {
    name: row.name,
    slug: row.slug,
    url: row.url,
    logoUrl: row.logo_url,
    shortSummary: row.short_summary,
    fullOverview: row.full_overview ?? "",
    targetAudience: row.target_audience ?? "",
    categoryId: row.category_id,
    publishStatus: row.publish_status,
    lifecycle: row.lifecycle,
    visibility: row.visibility,
    isFeatured: row.is_featured,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    services: [...row.services]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ name: s.name, description: s.description ?? "" })),
    screenshots: [...row.screenshots]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ imageUrl: s.image_url, altText: s.alt_text ?? "" })),
    tagIds: row.site_tags.map((t) => t.tag_id),
  };
}

/** All tags, alphabetical — for the tag selector. */
export async function getAllTags(): Promise<Tag[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name");
  if (error) throw new Error(`Failed to load tags: ${error.message}`);
  return (data ?? []) as Tag[];
}

/** All categories, alphabetical. */
export async function getAdminCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data ?? []) as Category[];
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/admin.ts
git commit -m "feat: add admin data-access layer"
```

---

## Task 11: Login page and logout action

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/actions.ts`

- [ ] **Step 1: Create `src/app/admin/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 2: Create `src/app/admin/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Container } from "@/components/layout/Container";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Incorrect email or password.");
      setPending(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="band-surface flex min-h-screen items-center py-16 text-white">
      <Container className="max-w-sm">
        <h1 className="text-2xl font-bold">8Caps Admin</h1>
        <p className="mt-1 text-sm text-white/60">Sign in to manage the directory.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds; `/admin/login` appears in the route table.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/login/page.tsx src/app/admin/actions.ts
git commit -m "feat: add admin login page and logout action"
```

---

## Task 12: Layout restructure (route groups) + admin shell

The root layout currently renders the public site's `<Header>` / `<Footer>`, and every route nests inside it. Admin pages must not inherit that public chrome, and `/admin/login` must not inherit the admin sidebar. The fix is Next.js **route groups**: public pages move into a `(public)` group that owns the Header/Footer; the authenticated admin pages live in an `admin/(dashboard)` group that owns the sidebar shell; `/admin/login` sits outside both groups and gets only the slim root layout. Route groups do not change URLs.

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/(public)/layout.tsx`, `src/components/admin/Sidebar.tsx`, `src/app/admin/(dashboard)/layout.tsx`
- Move: `src/app/page.tsx`, `src/app/sites/`, `src/app/about/`, `src/app/contact/` into `src/app/(public)/`

- [ ] **Step 1: Move the public pages into a `(public)` route group**

Run:
```bash
mkdir -p "src/app/(public)"
git mv src/app/page.tsx "src/app/(public)/page.tsx"
git mv src/app/sites "src/app/(public)/sites"
git mv src/app/about "src/app/(public)/about"
git mv src/app/contact "src/app/(public)/contact"
```
`globals.css`, `layout.tsx`, `sitemap.ts`, `robots.ts`, and `favicon.ico` stay at `src/app/`. The public pages use `@/`-aliased imports, so moving the files does not break anything.

- [ ] **Step 2: Slim the root layout — `src/app/layout.tsx`**

Open the current `src/app/layout.tsx`. Keep its font setup (Inter + Space Grotesk) and the `metadata` object exactly as they are. Change ONLY the returned JSX: remove `<Header />`, the `<main>` wrapper, `<Footer />`, and the two layout-component imports. The body renders `{children}` directly. Target shape:

```tsx
// keep: next/font imports, "./globals.css", Metadata import + metadata object.
// remove: the Header and Footer imports.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={/* keep the existing font-variable className */}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create `src/app/(public)/layout.tsx`**

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/admin/Sidebar.tsx`**

```tsx
import Link from "next/link";
import { logout } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sites", label: "Websites" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export function Sidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-oxford text-white">
      <div className="border-b border-white/10 p-5">
        <Link
          href="/admin"
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          8Caps Admin
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-3 pb-2 text-xs text-white/45">{email}</p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/(dashboard)/layout.tsx`**

```tsx
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
```

> This `layout.tsx` lives in the `(dashboard)` route group, so it wraps every authenticated admin page (`/admin`, `/admin/sites`, …) but NOT `/admin/login` — which sits outside the group and therefore renders with only the slim root layout. No redirect loop, and the public Header/Footer never reach admin pages.

- [ ] **Step 6: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds. URLs are unchanged: `/`, `/sites`, `/about`, `/contact` still resolve (now via the `(public)` group), `/admin/login` resolves, and the admin routes compile.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: split public and admin chrome via route groups, add admin shell"
```

---

## Task 13: Dashboard and StatCard

**Files:**
- Create: `src/components/admin/StatCard.tsx`, `src/app/admin/(dashboard)/page.tsx`

- [ ] **Step 1: Create `src/components/admin/StatCard.tsx`**

```tsx
export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div
        className="text-3xl font-bold text-oxford"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </div>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/(dashboard)/page.tsx`**

```tsx
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { getDashboardStats } from "@/lib/data/admin";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">
        An overview of the 8Caps directory.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total websites" value={stats.totalSites} />
        <StatCard label="Published" value={stats.publishedSites} />
        <StatCard label="Drafts" value={stats.draftSites} />
        <StatCard label="Categories" value={stats.categories} />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/sites/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Add a website
        </Link>
        <Link
          href="/admin/sites"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-ink"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          Manage websites
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`). Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/StatCard.tsx src/app/admin/(dashboard)/page.tsx
git commit -m "feat: add admin dashboard"
```

---

## Task 14: Site list page

**Files:** Create `src/app/admin/(dashboard)/sites/page.tsx`

- [ ] **Step 1: Create `src/app/admin/(dashboard)/sites/page.tsx`**

```tsx
import Link from "next/link";
import { getAdminSites } from "@/lib/data/admin";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-live-bg text-live",
  draft: "bg-soon-bg text-soon",
  archived: "bg-black/5 text-ink-muted",
};

export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sites = await getAdminSites(q?.trim() || undefined);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Websites</h1>
        <Link
          href="/admin/sites/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Add a website
        </Link>
      </div>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name…"
          className="w-full max-w-sm rounded-lg border bg-surface px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
      </form>

      <div
        className="mt-6 overflow-hidden rounded-card border bg-surface"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-ink-muted" style={{ borderColor: "var(--color-hairline)" }}>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No websites yet.
                </td>
              </tr>
            )}
            {sites.map((s) => (
              <tr
                key={s.id}
                className="border-b last:border-0"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {s.categoryName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLE[s.publishStatus]
                    }`}
                  >
                    {s.publishStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {s.isFeatured ? "Yes" : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/sites/${s.id}/edit`}
                    className="font-semibold text-accent"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`). Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(dashboard)/sites/page.tsx
git commit -m "feat: add admin site list page"
```

---

## Task 15: Site Server Actions

**Files:** Create `src/app/admin/(dashboard)/sites/actions.ts`

- [ ] **Step 1: Create `src/app/admin/(dashboard)/sites/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { siteFormSchema } from "@/lib/schemas";
import type { ActionResult, SiteFormValues } from "@/types/domain";

/** Revalidate every public route that could show site data. */
function revalidatePublic(slug: string) {
  revalidatePath("/");
  revalidatePath("/sites");
  revalidatePath(`/sites/${slug}`);
}

/** Replace a site's child rows (services, screenshots, tags). */
async function writeChildren(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  siteId: string,
  values: SiteFormValues,
): Promise<string | null> {
  await supabase.from("services").delete().eq("site_id", siteId);
  await supabase.from("screenshots").delete().eq("site_id", siteId);
  await supabase.from("site_tags").delete().eq("site_id", siteId);

  if (values.services.length > 0) {
    const { error } = await supabase.from("services").insert(
      values.services.map((s, i) => ({
        site_id: siteId,
        name: s.name,
        description: s.description || null,
        sort_order: i,
      })),
    );
    if (error) return error.message;
  }
  if (values.screenshots.length > 0) {
    const { error } = await supabase.from("screenshots").insert(
      values.screenshots.map((s, i) => ({
        site_id: siteId,
        image_url: s.imageUrl,
        alt_text: s.altText || null,
        sort_order: i,
      })),
    );
    if (error) return error.message;
  }
  if (values.tagIds.length > 0) {
    const { error } = await supabase
      .from("site_tags")
      .insert(values.tagIds.map((tagId) => ({ site_id: siteId, tag_id: tagId })));
    if (error) return error.message;
  }
  return null;
}

/** Map validated form values to a `sites` table row. */
function toSiteRow(values: SiteFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    url: values.url,
    logo_url: values.logoUrl,
    short_summary: values.shortSummary,
    full_overview: values.fullOverview || null,
    target_audience: values.targetAudience || null,
    category_id: values.categoryId,
    publish_status: values.publishStatus,
    lifecycle: values.lifecycle,
    visibility: values.visibility,
    is_featured: values.isFeatured,
    seo_title: values.seoTitle || null,
    seo_description: values.seoDescription || null,
  };
}

export async function createSite(values: SiteFormValues): Promise<ActionResult> {
  const parsed = siteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .insert(toSiteRow(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: `Could not create site: ${error.message}` };
  }

  const childError = await writeChildren(supabase, data.id, parsed.data);
  if (childError) {
    return { ok: false, error: `Site saved, but related data failed: ${childError}` };
  }

  revalidatePublic(parsed.data.slug);
  redirect("/admin/sites");
}

export async function updateSite(
  id: string,
  values: SiteFormValues,
): Promise<ActionResult> {
  const parsed = siteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("sites")
    .update(toSiteRow(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, error: `Could not update site: ${error.message}` };
  }

  const childError = await writeChildren(supabase, id, parsed.data);
  if (childError) {
    return { ok: false, error: `Site saved, but related data failed: ${childError}` };
  }

  revalidatePublic(parsed.data.slug);
  redirect("/admin/sites");
}

export async function deleteSite(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) {
    return { ok: false, error: `Could not delete site: ${error.message}` };
  }
  revalidatePath("/");
  revalidatePath("/sites");
  redirect("/admin/sites");
}
```

> Note: `redirect()` throws internally, so the `createSite`/`updateSite`/`deleteSite` functions never return on the success path — the `Promise<ActionResult>` return type covers only the validation/DB-error paths. This is the standard Next.js Server Action pattern.

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(dashboard)/sites/actions.ts
git commit -m "feat: add site create/update/delete server actions"
```

---

## Task 16: Image upload hook

**Files:** Create `src/lib/use-upload.ts`

- [ ] **Step 1: Create `src/lib/use-upload.ts`**

```ts
"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Uploads a file to the `site-media` Storage bucket and returns its public URL.
 * `folder` groups uploads (e.g. "logos", "screenshots").
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File, folder: string): Promise<string> {
    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("site-media")
        .upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/use-upload.ts
git commit -m "feat: add image upload hook for Supabase Storage"
```

---

## Task 17: ServicesEditor and TagSelector components

**Files:**
- Create: `src/components/admin/ServicesEditor.tsx`, `src/components/admin/TagSelector.tsx`
- Test: `src/components/admin/ServicesEditor.test.tsx`

- [ ] **Step 1: Write the failing test for ServicesEditor**

Create `src/components/admin/ServicesEditor.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesEditor } from "./ServicesEditor";
import type { ServiceInput } from "@/types/domain";

describe("ServicesEditor", () => {
  it("renders existing service rows", () => {
    const services: ServiceInput[] = [
      { name: "Service A", description: "desc" },
    ];
    render(<ServicesEditor services={services} onChange={() => {}} />);
    expect(screen.getByDisplayValue("Service A")).toBeInTheDocument();
  });

  it("calls onChange with a new empty row when Add is clicked", async () => {
    const onChange = vi.fn();
    render(<ServicesEditor services={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /add service/i }));
    expect(onChange).toHaveBeenCalledWith([{ name: "", description: "" }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm test -- ServicesEditor`.
Expected: FAIL — `./ServicesEditor` cannot be resolved.

- [ ] **Step 3: Create `src/components/admin/ServicesEditor.tsx`**

```tsx
"use client";

import type { ServiceInput } from "@/types/domain";

export function ServicesEditor({
  services,
  onChange,
}: {
  services: ServiceInput[];
  onChange: (next: ServiceInput[]) => void;
}) {
  function update(index: number, patch: Partial<ServiceInput>) {
    onChange(
      services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }
  function remove(index: number) {
    onChange(services.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...services, { name: "", description: "" }]);
  }

  return (
    <div className="space-y-3">
      {services.map((service, i) => (
        <div
          key={i}
          className="rounded-lg border p-3"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <input
            value={service.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Service name"
            className="w-full rounded border px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--color-hairline)" }}
          />
          <input
            value={service.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Description"
            className="mt-2 w-full rounded border px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--color-hairline)" }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-2 text-xs font-medium text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-ink"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        Add service
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm test -- ServicesEditor`.
Expected: 2 tests PASS.

- [ ] **Step 5: Create `src/components/admin/TagSelector.tsx`**

```tsx
"use client";

import type { Tag } from "@/types/domain";

export function TagSelector({
  allTags,
  selected,
  onChange,
}: {
  allTags: Tag[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((t) => t !== id)
        : [...selected, id],
    );
  }

  if (allTags.length === 0) {
    return <p className="text-sm text-ink-muted">No tags exist yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              active
                ? "bg-accent text-white"
                : "border text-ink-muted"
            }`}
            style={active ? undefined : { borderColor: "var(--color-hairline)" }}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/ServicesEditor.tsx src/components/admin/ServicesEditor.test.tsx src/components/admin/TagSelector.tsx
git commit -m "feat: add ServicesEditor and TagSelector components"
```

---

## Task 18: ScreenshotsEditor component

**Files:** Create `src/components/admin/ScreenshotsEditor.tsx`

- [ ] **Step 1: Create `src/components/admin/ScreenshotsEditor.tsx`**

```tsx
"use client";

import Image from "next/image";
import type { ScreenshotInput } from "@/types/domain";
import { useUpload } from "@/lib/use-upload";

export function ScreenshotsEditor({
  screenshots,
  onChange,
}: {
  screenshots: ScreenshotInput[];
  onChange: (next: ScreenshotInput[]) => void;
}) {
  const { upload, uploading } = useUpload();

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const uploaded: ScreenshotInput[] = [];
    for (const file of Array.from(files)) {
      const imageUrl = await upload(file, "screenshots");
      uploaded.push({ imageUrl, altText: "" });
    }
    onChange([...screenshots, ...uploaded]);
  }

  function update(index: number, altText: string) {
    onChange(
      screenshots.map((s, i) => (i === index ? { ...s, altText } : s)),
    );
  }
  function remove(index: number) {
    onChange(screenshots.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {screenshots.map((shot, i) => (
        <div
          key={shot.imageUrl}
          className="flex gap-3 rounded-lg border p-3"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <Image
            src={shot.imageUrl}
            alt={shot.altText || "Screenshot"}
            width={120}
            height={75}
            className="rounded object-cover"
          />
          <div className="flex-1">
            <input
              value={shot.altText}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Alt text"
              className="w-full rounded border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--color-hairline)" }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-2 text-xs font-medium text-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <label className="inline-block cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-ink"
        style={{ borderColor: "var(--color-hairline)" }}>
        {uploading ? "Uploading…" : "Add screenshots"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ScreenshotsEditor.tsx
git commit -m "feat: add ScreenshotsEditor component"
```

---

## Task 19: SiteForm component

**Files:** Create `src/components/admin/SiteForm.tsx`

- [ ] **Step 1: Create `src/components/admin/SiteForm.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type {
  ActionResult,
  Category,
  SiteFormValues,
  Tag,
} from "@/types/domain";
import { slugify } from "@/lib/slugify";
import { useUpload } from "@/lib/use-upload";
import { ServicesEditor } from "./ServicesEditor";
import { ScreenshotsEditor } from "./ScreenshotsEditor";
import { TagSelector } from "./TagSelector";

const EMPTY: SiteFormValues = {
  name: "",
  slug: "",
  url: "",
  logoUrl: null,
  shortSummary: "",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  publishStatus: "draft",
  lifecycle: "live",
  visibility: "public",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  services: [],
  screenshots: [],
  tagIds: [],
};

const field = "w-full rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };
const sectionTitle = "text-sm font-semibold uppercase tracking-wide text-ink-muted";

export function SiteForm({
  initial,
  categories,
  allTags,
  onSubmit,
}: {
  initial?: SiteFormValues;
  categories: Category[];
  allTags: Tag[];
  onSubmit: (values: SiteFormValues) => Promise<ActionResult>;
}) {
  const [values, setValues] = useState<SiteFormValues>(initial ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { upload, uploading } = useUpload();

  function set<K extends keyof SiteFormValues>(key: K, value: SiteFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleName(name: string) {
    setValues((v) => ({
      ...v,
      name,
      slug: slugEdited ? v.slug : slugify(name),
    }));
  }

  async function handleLogo(file: File | null) {
    if (!file) return;
    const url = await upload(file, "logos");
    set("logoUrl", url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      // A successful action redirects and never returns; only errors arrive here.
      if (result && !result.ok) setError(result.error ?? "Something went wrong");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8 p-8">
      {/* Basics */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Basics</h2>
        <input
          required
          value={values.name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Website name"
          className={field}
          style={fieldStyle}
        />
        <input
          required
          value={values.slug}
          onChange={(e) => {
            setSlugEdited(true);
            set("slug", e.target.value);
          }}
          placeholder="slug"
          className={field}
          style={fieldStyle}
        />
        <input
          required
          type="url"
          value={values.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://example.com"
          className={field}
          style={fieldStyle}
        />
        <div className="flex items-center gap-3">
          {values.logoUrl && (
            <Image
              src={values.logoUrl}
              alt="Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
          )}
          <label className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-ink"
            style={fieldStyle}>
            {uploading ? "Uploading…" : values.logoUrl ? "Change logo" : "Upload logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </section>

      {/* Content */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Content</h2>
        <input
          required
          value={values.shortSummary}
          onChange={(e) => set("shortSummary", e.target.value)}
          placeholder="Short summary"
          className={field}
          style={fieldStyle}
        />
        <textarea
          value={values.fullOverview}
          onChange={(e) => set("fullOverview", e.target.value)}
          placeholder="Full overview"
          rows={4}
          className={field}
          style={fieldStyle}
        />
        <textarea
          value={values.targetAudience}
          onChange={(e) => set("targetAudience", e.target.value)}
          placeholder="Who it helps"
          rows={2}
          className={field}
          style={fieldStyle}
        />
      </section>

      {/* Classification */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Classification</h2>
        <select
          value={values.categoryId ?? ""}
          onChange={(e) => set("categoryId", e.target.value || null)}
          className={field}
          style={fieldStyle}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={values.publishStatus}
            onChange={(e) =>
              set("publishStatus", e.target.value as SiteFormValues["publishStatus"])
            }
            className={field}
            style={fieldStyle}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={values.lifecycle}
            onChange={(e) =>
              set("lifecycle", e.target.value as SiteFormValues["lifecycle"])
            }
            className={field}
            style={fieldStyle}
          >
            <option value="live">Live</option>
            <option value="coming_soon">Coming soon</option>
          </select>
          <select
            value={values.visibility}
            onChange={(e) =>
              set("visibility", e.target.value as SiteFormValues["visibility"])
            }
            className={field}
            style={fieldStyle}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured on the homepage
        </label>
      </section>

      {/* SEO */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>SEO</h2>
        <input
          value={values.seoTitle}
          onChange={(e) => set("seoTitle", e.target.value)}
          placeholder="SEO title"
          className={field}
          style={fieldStyle}
        />
        <textarea
          value={values.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          placeholder="SEO description"
          rows={2}
          className={field}
          style={fieldStyle}
        />
      </section>

      {/* Services */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Services</h2>
        <ServicesEditor
          services={values.services}
          onChange={(next) => set("services", next)}
        />
      </section>

      {/* Screenshots */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Screenshots</h2>
        <ScreenshotsEditor
          screenshots={values.screenshots}
          onChange={(next) => set("screenshots", next)}
        />
      </section>

      {/* Tags */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Tags</h2>
        <TagSelector
          allTags={allTags}
          selected={values.tagIds}
          onChange={(next) => set("tagIds", next)}
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save website"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/SiteForm.tsx
git commit -m "feat: add SiteForm component"
```

---

## Task 20: New and Edit site pages

**Files:**
- Create: `src/app/admin/(dashboard)/sites/new/page.tsx`, `src/app/admin/(dashboard)/sites/[id]/edit/page.tsx`

- [ ] **Step 1: Create `src/app/admin/(dashboard)/sites/new/page.tsx`**

```tsx
import { SiteForm } from "@/components/admin/SiteForm";
import { getAdminCategories, getAllTags } from "@/lib/data/admin";
import { createSite } from "../actions";

export default async function NewSitePage() {
  const [categories, tags] = await Promise.all([
    getAdminCategories(),
    getAllTags(),
  ]);

  return (
    <div>
      <h1 className="px-8 pt-8 text-2xl font-bold text-ink">Add a website</h1>
      <SiteForm categories={categories} allTags={tags} onSubmit={createSite} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/(dashboard)/sites/[id]/edit/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { SiteForm } from "@/components/admin/SiteForm";
import {
  getAdminCategories,
  getAllTags,
  getSiteForEdit,
} from "@/lib/data/admin";
import { updateSite, deleteSite } from "../../actions";

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [site, categories, tags] = await Promise.all([
    getSiteForEdit(id),
    getAdminCategories(),
    getAllTags(),
  ]);

  if (!site) notFound();

  // Bind the site id into the update action.
  async function handleUpdate(values: Parameters<typeof updateSite>[1]) {
    "use server";
    return updateSite(id, values);
  }

  async function handleDelete() {
    "use server";
    // deleteSite redirects to /admin/sites on success; a returned error
    // (rare) is not surfaced here — the form-action signature is void.
    await deleteSite(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-2xl font-bold text-ink">Edit website</h1>
        <form action={handleDelete}>
          <button
            type="submit"
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600"
          >
            Delete
          </button>
        </form>
      </div>
      <SiteForm
        initial={site}
        categories={categories}
        allTags={tags}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds; `/admin/sites/new` and `/admin/sites/[id]/edit` appear in the route table.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(dashboard)/sites/new/page.tsx" "src/app/admin/(dashboard)/sites/[id]/edit/page.tsx"
git commit -m "feat: add new and edit site pages"
```

---

## Task 21: Category management

**Files:**
- Create: `src/app/admin/(dashboard)/categories/actions.ts`, `src/components/admin/CategoryManager.tsx`, `src/app/admin/(dashboard)/categories/page.tsx`

- [ ] **Step 1: Create `src/app/admin/(dashboard)/categories/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/schemas";
import type { ActionResult } from "@/types/domain";

function revalidateCategoryPages() {
  revalidatePath("/");
  revalidatePath("/sites");
  revalidatePath("/admin/categories");
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description: string;
}): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: { name: string; slug: string; description: string },
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}
```

- [ ] **Step 2: Create `src/components/admin/CategoryManager.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/types/domain";
import { slugify } from "@/lib/slugify";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/admin/(dashboard)/categories/actions";

const field = "rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    });
  }

  function add() {
    if (!newName.trim()) return;
    run(async () => {
      const result = await createCategory({
        name: newName.trim(),
        slug: slugify(newName),
        description: newDesc.trim(),
      });
      if (result.ok) {
        setNewName("");
        setNewDesc("");
      }
      return result;
    });
  }

  return (
    <div className="space-y-6">
      {/* Add */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-card border bg-surface p-4"
        style={fieldStyle}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className={field}
          style={fieldStyle}
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description (optional)"
          className={field}
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* List */}
      <div className="space-y-2">
        {categories.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            disabled={pending}
            onSave={(name, description) =>
              run(() =>
                updateCategory(c.id, {
                  name,
                  slug: slugify(name),
                  description,
                }),
              )
            }
            onDelete={() => run(() => deleteCategory(c.id))}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  disabled,
  onSave,
  onDelete,
}: {
  category: Category;
  disabled: boolean;
  onSave: (name: string, description: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface p-3"
      style={fieldStyle}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={field}
        style={fieldStyle}
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className={field}
        style={fieldStyle}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSave(name, description)}
        className="rounded-lg border px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
        style={fieldStyle}
      >
        Save
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (confirm(`Delete "${category.name}"? Sites in it become uncategorised.`)) {
            onDelete();
          }
        }}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/(dashboard)/categories/page.tsx`**

```tsx
import { CategoryManager } from "@/components/admin/CategoryManager";
import { getAdminCategories } from "@/lib/data/admin";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink">Categories</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Manage the categories websites can be filed under.
      </p>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`). Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(dashboard)/categories src/components/admin/CategoryManager.tsx
git commit -m "feat: add category management"
```

---

## Task 22: Enquiries placeholder + Storage image host

**Files:**
- Create: `src/app/admin/(dashboard)/enquiries/page.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Create `src/app/admin/(dashboard)/enquiries/page.tsx`**

A minimal placeholder so the sidebar "Enquiries" link does not 404. The real inbox is Plan 3.
```tsx
export default function AdminEnquiriesPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink">Enquiries</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The enquiry inbox is coming soon.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add the Supabase Storage host to `next.config.ts`**

The current `next.config.ts` allows `placehold.co`. Add the Supabase Storage host so uploaded logos/screenshots render through `next/image`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      {
        protocol: "https",
        hostname: "vokrxnqitfotucpnvfwe.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`). Expected: succeeds; `/admin/enquiries` in the route table.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/(dashboard)/enquiries/page.tsx next.config.ts
git commit -m "feat: add enquiries placeholder and Supabase storage image host"
```

---

## Task 23: Full verification and admin smoke test

**Files:** none (verification)

- [ ] **Step 1: Run the full test suite**

Run `npm test`. Expected: all tests pass (slugify, schemas, ServicesEditor, plus the Plan 1 tests — 25+ tests total).

- [ ] **Step 2: Typecheck and lint**

Run `npm run typecheck` then `npm run lint`. Expected: both clean.

- [ ] **Step 3: Production build**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: succeeds; route table includes `/admin`, `/admin/login`, `/admin/sites`, `/admin/sites/new`, `/admin/sites/[id]/edit`, `/admin/categories`, `/admin/enquiries`, and `ƒ Middleware`.

- [ ] **Step 4: Create a test admin account**

Controller / James: in the Supabase dashboard (Authentication → Users) create one admin user with an email + password. Confirm a matching row appears in the `profiles` table (the trigger from Task 3).

- [ ] **Step 5: Manual admin smoke test**

Run `npm run build && npm start` (with `dangerouslyDisableSandbox: true`), then in a browser:
- Visit `/admin` → redirected to `/admin/login`.
- Sign in with the test account → lands on the dashboard with correct counts.
- `/admin/sites` lists all 4 seed sites (incl. the draft).
- Create a website via `/admin/sites/new` — upload a logo, add a service, save → it appears in the list and (if published) on the public `/sites`.
- Edit a site, change its status, save → public site reflects it.
- Add and delete a category.
- Sign out → redirected to login.

- [ ] **Step 6: Final commit and push**

```bash
git add -A
git commit -m "chore: Plan 2 complete — admin dashboard"
git push
```

---

## Self-Review Notes

- **Spec coverage:** Auth + login/logout (Tasks 6, 11) · `is_admin()` + profiles trigger (Task 3) · admin RLS (Task 4) · Storage bucket + policies (Task 5) · layout route-group restructure + admin shell with sidebar (Task 12) · dashboard (Task 13) · site list (Task 14) · site CRUD form + actions + image upload (Tasks 15–20) · category CRUD (Task 21) · Zod validation (Task 9) · `slugify` (Task 7) · `revalidatePath` on every public-affecting write (Tasks 15, 21). The enquiry inbox is intentionally a placeholder (Task 22) — real page is Plan 3.
- **Layout architecture:** Task 12 introduces two route groups — `(public)` (owns the Header/Footer chrome) and `admin/(dashboard)` (owns the sidebar shell + auth guard). `/admin/login` sits in neither, so it gets only the slim root layout. Route groups leave all URLs unchanged.
- **Type consistency:** `SiteFormValues`, `ServiceInput`, `ScreenshotInput`, `AdminSiteRow`, `DashboardStats`, and `ActionResult` are all defined in Task 8 (`src/types/domain.ts`) and used unchanged by the data layer (Task 10), the Server Actions (Tasks 15, 21), and the components (Tasks 17–20) — no action file exports a shared type, so there are no parenthesised route-group import paths except the one client→action import in `CategoryManager`.
- **No `service_role`:** every Server Action uses `createServerSupabase()` (the logged-in admin's session); RLS `is_admin()` authorizes the writes.
- **Out of scope confirmed:** the public contact form, Resend email, and the real enquiry inbox are Plan 3.
