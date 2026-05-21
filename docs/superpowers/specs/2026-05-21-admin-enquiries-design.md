# 8Caps — Admin Dashboard & Enquiries Design Spec

**Date:** 2026-05-21
**Status:** Approved for planning
**Scope:** The private side of the 8Caps site — admin authentication, the admin dashboard with full content management, and the enquiry pipeline. This is "Phase 2" of the original project context, building on the live Plan 1 public site.

---

## 1. Goal

Give 8Caps admins a private dashboard to manage every website listed in the directory — add, edit, publish, archive, upload logos and screenshots, manage categories — and capture enquiries from the public site (save them, email a notification, and let admins triage them).

---

## 2. Scope

**In scope:** Supabase Auth, route protection, admin RLS, Supabase Storage, the admin dashboard (shell, dashboard, site CRUD, category CRUD, image uploads), the public contact form, enquiry-notification email, and the admin enquiry inbox.

**Out of scope:**
- The admin **Settings page** for editing homepage copy — dropped (YAGNI; homepage copy stays in code).
- An in-app **user-management** UI — the 5 admin accounts are created directly in the Supabase dashboard.
- The AI URL-onboarding / crawler — still a future, separate project.

**Two-plan split.** This single spec is implemented as two sequential plans:

- **Plan 2 — Admin:** auth, middleware, admin RLS + storage, the admin shell, dashboard, site CRUD, category CRUD, image uploads.
- **Plan 3 — Enquiries:** the public contact form, Resend notification email, and the admin enquiry inbox.

Plan 3 depends on Plan 2 (its inbox page lives inside the Plan 2 admin shell).

---

## 3. Architecture

**Stack additions** to the existing Next.js 16 / Supabase / Tailwind app: `@supabase/ssr` (cookie-based auth), `zod` (input validation), `resend` (Plan 3 — transactional email).

### Authentication

- **`@supabase/ssr`** provides cookie-based sessions. Three client helpers:
  - `src/lib/supabase/server.ts` — `createServerClient` bound to Next's `cookies()`, for Server Components and Server Actions.
  - `src/lib/supabase/browser.ts` — `createBrowserClient`, for client components (the login form).
  - The existing `src/lib/supabase/public.ts` (anon, read-only) stays for the public pages.
- **`src/middleware.ts`** — refreshes the auth session on every request and guards `/admin/*`: an unauthenticated request to any `/admin` route (except `/admin/login`) is redirected to `/admin/login`.
- **Login** — `/admin/login`, a client component calling `signInWithPassword`. **Logout** — a Server Action calling `signOut`.
- The 5 admin accounts are created manually in the Supabase dashboard (email + password). A **Postgres trigger** on `auth.users` insert auto-creates the matching `profiles` row, so the app never writes to `profiles`.

### Authorization (RLS)

- A `SECURITY DEFINER` SQL function **`is_admin()`** → `true` when the caller has a `profiles` row (`exists(select 1 from profiles where id = auth.uid())`).
- New admin policies (a new migration), added alongside Plan 1's public-read policies:
  - `sites`, `services`, `screenshots`, `site_tags`, `categories`, `tags` — admins (`is_admin()`) get full `select` / `insert` / `update` / `delete`.
  - `enquiries` — admins get `select` / `update` / `delete`; the public `insert` policy from Plan 1 stays.
  - `profiles` — admins can `select`.
- Plan 1's public-read policies are unchanged. Admin writes happen through the **logged-in user's session** — no `service_role` key in the app.

### Storage

- A Supabase Storage bucket **`site-media`** — public read, writes restricted to `is_admin()`. Holds logos and screenshots.
- Uploads go **browser → Storage** directly via `supabase-js`; the returned public URL is saved on the `sites.logo_url` / `screenshots.image_url` column by the Server Action.
- The Supabase Storage hostname is added to `next.config.ts` `images.remotePatterns`.

### Mutations & revalidation

- All writes are **Server Actions** (`createSite`, `updateSite`, `archiveSite`, category CRUD, `updateEnquiryStatus`, `submitEnquiry`, login/logout).
- Action inputs are validated with **Zod** schemas before touching the database.
- After any change that affects public content, the action calls `revalidatePath` on the affected public routes (`/`, `/sites`, `/sites/[slug]`) so the ISR'd public site updates immediately.

### Admin data access

- Admin pages read through the **authenticated server client** (RLS grants admins drafts + private sites). New module `src/lib/data/admin.ts`: `getAdminSites` (all, incl. drafts, searchable), `getSiteForEdit` (raw editable shape), `getDashboardStats`, `getEnquiries`, etc.
- New type `SiteFormValues` for the editable (write-shaped) site, distinct from the read-shaped `SiteSummary` / `SiteDetail`.

---

## 4. Database Changes

No new tables — `profiles` and `enquiries` and all enums already exist from Plan 1. New migrations only add:

1. **`profiles` auto-creation** — `handle_new_user()` trigger function + trigger on `auth.users`.
2. **`is_admin()`** helper function.
3. **Admin RLS policies** for all content tables and `enquiries` / `profiles` (per §3).
4. **Storage** — create the `site-media` bucket and its access policies.

A `slugify` requirement: the site form auto-generates `slug` from `name`; a small pure `slugify` util is added (`src/lib/slugify.ts`).

---

## 5. Admin Dashboard (Plan 2)

### Shell

`/admin/*` routes use a shared layout: a **dark Oxford Blue left sidebar** (links: Dashboard, Websites, Categories, Enquiries; plus Logout) and a light content area. Same Oxford Blue design tokens and Space Grotesk / Inter typography as the public site. The `/admin/login` page is outside this shell. The layout server-checks the session and redirects to login if absent.

### Pages

| Route | Purpose |
|---|---|
| `/admin/login` | Email + password login |
| `/admin` | Dashboard — stat cards (total / published / draft sites, categories, new enquiries) and a recent-enquiries list |
| `/admin/sites` | All websites incl. drafts — searchable list with status badges, edit links, "New website" button |
| `/admin/sites/new` | Create a website (site form) |
| `/admin/sites/[id]/edit` | Edit a website (site form), with archive / delete |
| `/admin/categories` | List categories; add / edit / delete inline |
| `/admin/enquiries` | Enquiry inbox (built in Plan 3) |

### Site form

One page, grouped sections, a single Save. Implemented as a client component (`SiteForm`) for the interactive parts; Save calls a Server Action that writes the site and its related rows together and revalidates public pages.

1. **Basics** — name, slug (auto-generated from name via `slugify`, editable), URL, logo upload
2. **Content** — short summary, full overview, target audience
3. **Classification** — category, publish status (`draft`/`published`/`archived`), lifecycle (`live`/`coming_soon`), visibility (`public`/`private`), featured toggle
4. **SEO** — SEO title, SEO description
5. **Services** — repeatable name + description rows; add / remove / order
6. **Screenshots** — upload multiple images to Storage, alt text + order each
7. **Tags** — multi-select against existing tags

Deleting a site offers **archive** (sets `publish_status = archived`) or hard delete. Deleting a category is allowed — the `category_id` FK is `on delete set null`, so any sites in that category simply become uncategorised; the UI warns first and names how many sites are affected.

### Form library decision

The site form uses **plain React state + a Server Action** — no form library. The form is large but not logically complex; this avoids a dependency. (react-hook-form was the alternative, set aside.)

---

## 6. Enquiries (Plan 3)

### Public contact form

`/contact` is rebuilt from the current static page into a real form: **name, email, message**, plus an optional hidden `site_id` populated when the visitor arrives via an "Enquire through 8Caps" CTA on a site profile page. On submit, the `submitEnquiry` Server Action:

1. Validates input (Zod).
2. Inserts a row into `enquiries` (Plan 1's public-insert RLS permits this).
3. Sends a notification email via Resend.
4. Returns a success state shown in place of the form.

### Notification email

- Sent with **Resend** to the 8Caps inbox. Contains the enquirer's name, email, message, and which site (if any) the enquiry came from.
- Requires a Resend account, a **verified sending domain**, and an API key. Env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (verified from-address), `ENQUIRY_NOTIFICATION_EMAIL` (recipient; defaults to `master@8caps.co.uk`).
- If the email send fails, the enquiry is still saved and the user still sees success — the failure is logged, not surfaced to the visitor.

### Admin enquiry inbox

`/admin/enquiries` — enquiries newest-first, filterable by status (`new` / `read` / `archived`). Selecting one shows the full message and the linked site; admins can mark it `read` or `archived` via `updateEnquiryStatus`. The count of `new` enquiries appears on the dashboard.

---

## 7. Environment & External Setup

| Variable | Where | Notes |
|---|---|---|
| `RESEND_API_KEY` | `.env.local` + Vercel | Plan 3 — secret |
| `RESEND_FROM_EMAIL` | `.env.local` + Vercel | Verified Resend from-address |
| `ENQUIRY_NOTIFICATION_EMAIL` | `.env.local` + Vercel | Recipient; defaults to `master@8caps.co.uk` |

**Manual setup by James:**
- Create the 5 admin accounts (email + password) in the Supabase dashboard.
- Plan 3: create a Resend account, verify a sending domain, generate the API key.

No `service_role` key is used.

---

## 8. Testing Approach

Consistent with Plan 1:

- **Pure logic, test-first:** `slugify`, the Zod validation schemas.
- **Components:** React Testing Library for the site form's interactive pieces (dynamic service rows, tag select) and key admin components.
- **Server Actions, RLS, Storage, middleware:** verified by `npm run build` + `npm run typecheck` + manual checks against the live project — unit-testing thin I/O wrappers and auth plumbing has low value.
- All of `npm test` / `typecheck` / `lint` / `build` must pass per plan.

---

## 9. Build Order

**Plan 2 — Admin**
1. Install `@supabase/ssr`, `zod`; add server/browser Supabase clients.
2. Migrations: `profiles` trigger, `is_admin()`, admin RLS policies, `site-media` storage bucket + policies.
3. Middleware + `/admin/login` + logout.
4. Admin shell (sidebar layout, auth guard).
5. `slugify` util (test-first); admin data layer (`lib/data/admin.ts`); `SiteFormValues` type.
6. Dashboard page.
7. Sites list page.
8. Site form + create / update / archive / delete Server Actions + image upload.
9. Categories CRUD.
10. Full verification + deploy.

**Plan 3 — Enquiries**
1. `submitEnquiry` action + Resend integration.
2. Rebuild `/contact` as a real form; wire the site-profile "Enquire" CTA to prefill `site_id`.
3. `/admin/enquiries` inbox + `updateEnquiryStatus`; wire the dashboard's new-enquiry count.
4. Full verification + deploy.

---

## 10. Decisions Log

| Decision | Choice |
|---|---|
| Admin layout | Dark Oxford Blue left sidebar + light content |
| Site form | One page, grouped sections, single Save |
| Form library | None — plain React state + Server Action |
| Settings page (homepage-copy CMS) | Dropped (YAGNI) |
| Admin accounts | 5, created in Supabase dashboard; `profiles` row via trigger |
| Auth method | Email + password |
| Mutations | Server Actions, Zod-validated, with `revalidatePath` |
| Admin authorization | `is_admin()` RLS via the logged-in session; no `service_role` |
| Email | Resend, in Plan 3 |
| Plan split | Plan 2 (admin) then Plan 3 (enquiries) |
