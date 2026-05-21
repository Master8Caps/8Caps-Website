# 8Caps Foundation + Public Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 8Caps marketing directory website — a Supabase-backed, publicly browsable catalogue of 8Caps-owned sites (homepage, directory, profile pages, about, contact).

**Architecture:** Next.js App Router with TypeScript and Tailwind CSS. Public pages are statically rendered with ISR and read from Supabase Postgres through a single typed data-access layer (`lib/data/*`). No admin in this plan — content is seeded directly into the database. Admin CRUD and the enquiry pipeline are Plan 2.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + Storage), Supabase CLI for migrations, Vitest + React Testing Library for tests, deployed on Vercel.

---

## Scope

**In scope:** project scaffold, Supabase schema + RLS + seed data, typed data layer, design system, public pages (`/`, `/sites`, `/sites/[slug]`, `/about`, `/contact`), SEO (metadata, sitemap, robots).

**Out of scope (Plan 2):** Supabase Auth, all `/admin/*` routes, site CRUD, image uploads from the UI, the enquiry form submission pipeline (DB write + Resend email). In this plan `/contact` is a static page showing the 8Caps email address; Plan 2 upgrades it to a working form.

**Testing approach:** Pure functions (search-param parsing, pagination math, data shaping) are built test-first with Vitest. Components get React Testing Library tests for prop rendering and interaction. The data-access layer is composed of thin typed wrappers over Supabase queries — these are verified by `npm run build` + `npm run typecheck` + a one-off seed/smoke check rather than unit tests, because unit-testing an I/O wrapper just tests Supabase. Pages are verified by a successful production build and manual checks listed in each task.

---

## File Structure

```
8Caps/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # root layout, fonts, <Header>/<Footer>
│   │   ├── globals.css                # Tailwind v4 import + @theme tokens
│   │   ├── page.tsx                   # homepage
│   │   ├── sites/
│   │   │   ├── page.tsx               # directory (search + filter + pagination)
│   │   │   └── [slug]/page.tsx        # site profile
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── layout/Header.tsx
│   │   ├── layout/Footer.tsx
│   │   ├── layout/Container.tsx
│   │   ├── ui/Button.tsx
│   │   ├── ui/StatusBadge.tsx
│   │   ├── site/SiteCard.tsx
│   │   ├── site/SiteHero.tsx
│   │   ├── site/DirectoryGrid.tsx
│   │   ├── site/CategoryFilter.tsx
│   │   ├── site/ScreenshotGallery.tsx
│   │   ├── site/Pagination.tsx
│   │   └── marketing/CTASection.tsx
│   ├── lib/
│   │   ├── supabase/public.ts         # read-only Supabase client (anon key)
│   │   ├── data/sites.ts              # site queries
│   │   ├── data/categories.ts         # category queries
│   │   └── directory.ts               # pure: param parsing + pagination math
│   └── types/domain.ts                # Site, Service, Category, Screenshot, Tag, Enquiry
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── <ts>_schema.sql            # enums + tables
│   │   └── <ts>_rls.sql               # row level security policies
│   └── seed.sql                       # seed sites/categories/etc.
├── src/test/setup.ts                  # Vitest + RTL setup
├── vitest.config.ts
├── .env.local                         # Supabase keys (gitignored)
├── .env.example                       # committed template
└── (Next.js scaffold files)
```

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: project scaffold via `create-next-app` into the existing directory
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Scaffold into the current directory**

The repo already contains `docs/`, `.gitignore`, and `.git/`. Scaffold without overwriting them.

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
Accept the defaults for any remaining prompts (Turbopack: yes is fine). When prompted that the directory is not empty, choose to continue. If `create-next-app` refuses, scaffold into a temp dir and copy: `npx create-next-app@latest _scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` then move its contents into the project root and delete `_scaffold`.

Expected: `src/app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind`-enabled `globals.css`.

- [ ] **Step 2: Verify the dev server runs**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`, default Next.js page renders. Stop the server with Ctrl+C.

- [ ] **Step 3: Verify the production build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Confirm `.gitignore` covers Next.js**

Open `.gitignore`. The Plan-0 commit already added `node_modules/`, `.next/`, `.env*.local`, `.vercel`. If `create-next-app` appended duplicates, leave them — duplicates are harmless. Confirm `.next/` and `node_modules/` are listed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app (TypeScript, Tailwind, App Router)"
```

---

## Task 2: Add testing tooling (Vitest + React Testing Library)

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install test dependencies**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `"scripts"` block add:
```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Add a smoke test to prove the setup works**

Create `src/test/setup.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the test**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 7: Run the typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add Vitest + React Testing Library"
```

---

## Task 3: Create the Supabase project and wire env vars

**Files:**
- Create: `.env.local` (gitignored), `.env.example` (committed)
- Create: `supabase/` (via CLI)

- [ ] **Step 1: Create a Supabase project**

In the Supabase dashboard (https://supabase.com/dashboard) create a new project named `8caps-website`. Record the **Project URL**, **anon public key**, and **service_role key** from Project Settings → API. Record the **database password**.

> This step is manual and must be done by James or whoever owns the Supabase account. The plan cannot create the hosted project.

- [ ] **Step 2: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

- [ ] **Step 3: Create `.env.example` (committed, no secrets)**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 4: Confirm `.env.local` is gitignored**

Run: `git check-ignore .env.local`
Expected: prints `.env.local` (meaning it is ignored). If it prints nothing, add `.env.local` to `.gitignore`.

- [ ] **Step 5: Install the Supabase CLI as a dev dependency and initialise**

Run:
```bash
npm install -D supabase
npx supabase init
```
When asked about generating VS Code settings / Deno, choose No.
Expected: `supabase/config.toml` created.

- [ ] **Step 6: Link the CLI to the hosted project**

Run: `npx supabase link --project-ref <project-ref>`
Enter the database password when prompted.
Expected: "Finished supabase link."

- [ ] **Step 7: Commit**

```bash
git add .env.example supabase/config.toml .gitignore
git commit -m "chore: add Supabase project config and env template"
```

---

## Task 4: Database schema migration (enums + tables)

**Files:**
- Create: `supabase/migrations/<timestamp>_schema.sql`

- [ ] **Step 1: Generate a migration file**

Run: `npx supabase migration new schema`
Expected: creates `supabase/migrations/<timestamp>_schema.sql` (empty).

- [ ] **Step 2: Write the schema into that file**

Paste the following into the new migration file:
```sql
-- Enums
create type publish_status as enum ('draft', 'published', 'archived');
create type site_lifecycle as enum ('live', 'coming_soon');
create type site_visibility as enum ('public', 'private');
create type enquiry_status as enum ('new', 'read', 'archived');

-- profiles: admin users (1 row per admin). Used by Plan 2; created here so RLS can reference it.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- sites
create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  url text not null,
  logo_url text,
  short_summary text not null,
  full_overview text,
  target_audience text,
  category_id uuid references categories (id) on delete set null,
  publish_status publish_status not null default 'draft',
  lifecycle site_lifecycle not null default 'live',
  visibility site_visibility not null default 'public',
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sites_category_id_idx on sites (category_id);
create index sites_publish_status_idx on sites (publish_status);

-- services (offered by a site)
create table services (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0
);
create index services_site_id_idx on services (site_id);

-- screenshots
create table screenshots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0
);
create index screenshots_site_id_idx on screenshots (site_id);

-- site_tags join table
create table site_tags (
  site_id uuid not null references sites (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (site_id, tag_id)
);

-- enquiries (contact form submissions; write path built in Plan 2)
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

-- keep sites.updated_at fresh
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sites_set_updated_at
  before update on sites
  for each row execute function set_updated_at();
```

- [ ] **Step 3: Push the migration to the hosted database**

Run: `npx supabase db push`
Expected: "Applying migration <timestamp>_schema.sql..." then success.

- [ ] **Step 4: Verify the tables exist**

Run: `npx supabase db diff`
Expected: "No schema changes found" (the local migration matches the remote DB).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat: add database schema (sites, categories, services, tags, enquiries)"
```

---

## Task 5: Row Level Security policies

**Files:**
- Create: `supabase/migrations/<timestamp>_rls.sql`

- [ ] **Step 1: Generate a migration file**

Run: `npx supabase migration new rls`

- [ ] **Step 2: Write the RLS policies into that file**

```sql
-- Enable RLS on every table
alter table profiles    enable row level security;
alter table categories  enable row level security;
alter table tags        enable row level security;
alter table sites       enable row level security;
alter table services    enable row level security;
alter table screenshots enable row level security;
alter table site_tags   enable row level security;
alter table enquiries   enable row level security;

-- A site is publicly visible when published AND public.
-- Public (anon) read access:
create policy "public reads published public sites" on sites
  for select using (publish_status = 'published' and visibility = 'public');

create policy "public reads categories" on categories
  for select using (true);

create policy "public reads tags" on tags
  for select using (true);

create policy "public reads services of visible sites" on services
  for select using (
    exists (
      select 1 from sites s
      where s.id = services.site_id
        and s.publish_status = 'published'
        and s.visibility = 'public'
    )
  );

create policy "public reads screenshots of visible sites" on screenshots
  for select using (
    exists (
      select 1 from sites s
      where s.id = screenshots.site_id
        and s.publish_status = 'published'
        and s.visibility = 'public'
    )
  );

create policy "public reads site_tags of visible sites" on site_tags
  for select using (
    exists (
      select 1 from sites s
      where s.id = site_tags.site_id
        and s.publish_status = 'published'
        and s.visibility = 'public'
    )
  );

-- enquiries: anyone may submit; nobody may read via the anon key.
create policy "public inserts enquiries" on enquiries
  for insert with check (true);

-- profiles, and all write access for admins, are added in Plan 2.
-- Until then, writes happen via the service_role key (used only by seed.sql / server-side scripts),
-- which bypasses RLS entirely.
```

- [ ] **Step 3: Push the migration**

Run: `npx supabase db push`
Expected: applies `<timestamp>_rls.sql` successfully.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations
git commit -m "feat: add row level security policies for public read access"
```

---

## Task 6: Seed data

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Write `supabase/seed.sql`**

This seeds 6 categories and 4 sites (one `draft` and one `private` so RLS can be verified). Logos/screenshots use placeholder URLs.

```sql
-- Categories
insert into categories (id, name, slug, description) values
  ('11111111-1111-1111-1111-111111111101', 'Automation',      'automation',      'Tools that automate repetitive business work.'),
  ('11111111-1111-1111-1111-111111111102', 'Lead Generation', 'lead-generation', 'Platforms that find and qualify leads.'),
  ('11111111-1111-1111-1111-111111111103', 'Property',        'property',        'Property and real-estate services.'),
  ('11111111-1111-1111-1111-111111111104', 'Marketing',       'marketing',       'Marketing tools and services.'),
  ('11111111-1111-1111-1111-111111111105', 'AI Tools',        'ai-tools',        'AI-powered products.'),
  ('11111111-1111-1111-1111-111111111106', 'Data Services',   'data-services',   'Data sourcing and enrichment.');

-- Tags
insert into tags (id, name, slug) values
  ('22222222-2222-2222-2222-222222222201', 'SaaS',        'saas'),
  ('22222222-2222-2222-2222-222222222202', 'B2B',         'b2b'),
  ('22222222-2222-2222-2222-222222222203', 'No-code',     'no-code'),
  ('22222222-2222-2222-2222-222222222204', 'UK',          'uk');

-- Sites
insert into sites (id, name, slug, url, logo_url, short_summary, full_overview, target_audience,
                   category_id, publish_status, lifecycle, visibility, is_featured,
                   seo_title, seo_description) values
  ('33333333-3333-3333-3333-333333333301', 'Automated Panda', 'automated-panda',
   'https://automatedpanda.com', 'https://placehold.co/200x200?text=Panda',
   'Workflow automation for small businesses.',
   'Automated Panda builds no-code automations that connect the tools small businesses already use, removing hours of manual data entry every week.',
   'Small business owners and operations managers.',
   '11111111-1111-1111-1111-111111111101', 'published', 'live', 'public', true,
   'Automated Panda — Workflow Automation', 'No-code workflow automation for small businesses.'),

  ('33333333-3333-3333-3333-333333333302', 'LeadHarbour', 'leadharbour',
   'https://leadharbour.example.com', 'https://placehold.co/200x200?text=Lead',
   'Find and qualify B2B leads on autopilot.',
   'LeadHarbour continuously sources B2B leads, enriches them with verified contact data, and scores them so sales teams only talk to people worth talking to.',
   'B2B sales teams and founders doing outbound.',
   '11111111-1111-1111-1111-111111111102', 'published', 'live', 'public', true,
   'LeadHarbour — B2B Lead Generation', 'Automated B2B lead sourcing and qualification.'),

  ('33333333-3333-3333-3333-333333333303', 'PropToolkit', 'proptoolkit',
   'https://proptoolkit.example.com', 'https://placehold.co/200x200?text=Prop',
   'Property analysis tools for UK investors.',
   'PropToolkit gives UK property investors instant area analysis, yield calculations, and deal comparisons in one dashboard.',
   'UK buy-to-let and property investors.',
   '11111111-1111-1111-1111-111111111103', 'published', 'coming_soon', 'public', false,
   'PropToolkit — UK Property Analysis', 'Property analysis tools for UK investors.'),

  -- Draft site: must NOT appear on the public site.
  ('33333333-3333-3333-3333-333333333304', 'Stealth Project', 'stealth-project',
   'https://stealth.example.com', null,
   'An unreleased internal project.',
   'Internal only.', 'Internal.',
   '11111111-1111-1111-1111-111111111105', 'draft', 'live', 'public', false,
   null, null);

-- Services for Automated Panda
insert into services (site_id, name, description, sort_order) values
  ('33333333-3333-3333-3333-333333333301', 'Workflow Builder', 'Visually connect apps and automate steps.', 0),
  ('33333333-3333-3333-3333-333333333301', 'Data Sync',        'Keep records consistent across tools.',      1),
  ('33333333-3333-3333-3333-333333333302', 'Lead Sourcing',    'Continuously discover new B2B leads.',        0),
  ('33333333-3333-3333-3333-333333333302', 'Contact Enrichment','Add verified emails and phone numbers.',     1);

-- Screenshots for Automated Panda
insert into screenshots (site_id, image_url, alt_text, sort_order) values
  ('33333333-3333-3333-3333-333333333301', 'https://placehold.co/1200x750?text=Dashboard', 'Automated Panda dashboard', 0),
  ('33333333-3333-3333-3333-333333333301', 'https://placehold.co/1200x750?text=Builder',   'Workflow builder screen',  1);

-- Tag links
insert into site_tags (site_id, tag_id) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222204');
```

- [ ] **Step 2: Apply the seed to the hosted database**

`supabase db push` only applies migrations, not `seed.sql`. To seed the hosted database, open the Supabase dashboard → **SQL Editor**, paste the full contents of `supabase/seed.sql`, and run it.

Expected: "Success. No rows returned." The `seed.sql` is still committed to the repo so it documents the seed and can re-seed a local `supabase db reset`.

- [ ] **Step 3: Verify the seed via the Supabase dashboard**

In the dashboard Table Editor, confirm `sites` has 4 rows, `categories` has 6, `services` has 4. Confirm `Stealth Project` has `publish_status = 'draft'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: add seed data (categories, tags, sites, services, screenshots)"
```

---

## Task 7: Domain TypeScript types

**Files:**
- Create: `src/types/domain.ts`

- [ ] **Step 1: Write `src/types/domain.ts`**

These types describe the *application-facing* shape (what the data layer returns and components consume). They deliberately use camelCase and nest related data, unlike the snake_case database rows.

```ts
export type PublishStatus = "draft" | "published" | "archived";
export type SiteLifecycle = "live" | "coming_soon";
export type SiteVisibility = "public" | "private";
export type EnquiryStatus = "new" | "read" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface Screenshot {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

/** A site as shown in lists (directory cards, homepage). */
export interface SiteSummary {
  id: string;
  name: string;
  slug: string;
  url: string;
  logoUrl: string | null;
  shortSummary: string;
  lifecycle: SiteLifecycle;
  isFeatured: boolean;
  category: Category | null;
}

/** A site with all related data, for the profile page. */
export interface SiteDetail extends SiteSummary {
  fullOverview: string | null;
  targetAudience: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  services: Service[];
  screenshots: Screenshot[];
  tags: Tag[];
}

export interface Enquiry {
  id: string;
  siteId: string | null;
  name: string;
  email: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/domain.ts
git commit -m "feat: add domain TypeScript types"
```

---

## Task 8: Supabase read-only client

**Files:**
- Create: `src/lib/supabase/public.ts`
- Install: `@supabase/supabase-js`

- [ ] **Step 1: Install the Supabase client library**

Run: `npm install @supabase/supabase-js`

- [ ] **Step 2: Write `src/lib/supabase/public.ts`**

```ts
import { createClient } from "@supabase/supabase-js";

/**
 * Read-only Supabase client for public pages. Uses the anon key, so RLS
 * restricts it to published + public data. Safe to use in Server Components.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/public.ts package.json package-lock.json
git commit -m "feat: add read-only Supabase client"
```

---

## Task 9: Directory logic — param parsing + pagination (test-first)

**Files:**
- Create: `src/lib/directory.ts`
- Test: `src/lib/directory.test.ts`

These are pure functions, so they are built test-first.

- [ ] **Step 1: Write the failing test**

Create `src/lib/directory.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseDirectoryParams, getPagination, PAGE_SIZE } from "./directory";

describe("parseDirectoryParams", () => {
  it("returns defaults for empty params", () => {
    expect(parseDirectoryParams({})).toEqual({
      query: "",
      category: null,
      lifecycle: null,
      page: 1,
    });
  });

  it("reads query, category and lifecycle", () => {
    expect(
      parseDirectoryParams({ q: "panda", category: "automation", lifecycle: "live" }),
    ).toEqual({ query: "panda", category: "automation", lifecycle: "live", page: 1 });
  });

  it("ignores an invalid lifecycle value", () => {
    expect(parseDirectoryParams({ lifecycle: "banana" }).lifecycle).toBeNull();
  });

  it("clamps page to a minimum of 1", () => {
    expect(parseDirectoryParams({ page: "0" }).page).toBe(1);
    expect(parseDirectoryParams({ page: "-3" }).page).toBe(1);
    expect(parseDirectoryParams({ page: "notanumber" }).page).toBe(1);
  });

  it("reads a valid page number", () => {
    expect(parseDirectoryParams({ page: "4" }).page).toBe(4);
  });

  it("takes the first value when a param is an array", () => {
    expect(parseDirectoryParams({ q: ["a", "b"] }).query).toBe("a");
  });
});

describe("getPagination", () => {
  it("computes range and totals for page 1", () => {
    const p = getPagination(1, 50);
    expect(p.from).toBe(0);
    expect(p.to).toBe(PAGE_SIZE - 1);
    expect(p.totalPages).toBe(Math.ceil(50 / PAGE_SIZE));
    expect(p.hasPrev).toBe(false);
    expect(p.hasNext).toBe(true);
  });

  it("computes range for a middle page", () => {
    const p = getPagination(2, 50);
    expect(p.from).toBe(PAGE_SIZE);
    expect(p.to).toBe(PAGE_SIZE * 2 - 1);
    expect(p.hasPrev).toBe(true);
  });

  it("reports no next page on the last page", () => {
    const total = PAGE_SIZE + 1;
    const p = getPagination(2, total);
    expect(p.hasNext).toBe(false);
  });

  it("handles zero results", () => {
    const p = getPagination(1, 0);
    expect(p.totalPages).toBe(0);
    expect(p.hasNext).toBe(false);
    expect(p.hasPrev).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- directory`
Expected: FAIL — `./directory` cannot be resolved.

- [ ] **Step 3: Write `src/lib/directory.ts`**

```ts
import type { SiteLifecycle } from "@/types/domain";

export const PAGE_SIZE = 12;

type RawParam = string | string[] | undefined;
type RawParams = Record<string, RawParam>;

export interface DirectoryParams {
  query: string;
  category: string | null;
  lifecycle: SiteLifecycle | null;
  page: number;
}

function first(value: RawParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDirectoryParams(params: RawParams): DirectoryParams {
  const query = first(params.q)?.trim() ?? "";
  const category = first(params.category)?.trim() || null;

  const rawLifecycle = first(params.lifecycle);
  const lifecycle: SiteLifecycle | null =
    rawLifecycle === "live" || rawLifecycle === "coming_soon"
      ? rawLifecycle
      : null;

  const parsedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return { query, category, lifecycle, page };
}

export interface Pagination {
  from: number;
  to: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function getPagination(page: number, total: number): Pagination {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return {
    from,
    to,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- directory`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/directory.ts src/lib/directory.test.ts
git commit -m "feat: add directory param parsing and pagination logic"
```

---

## Task 10: Data-access layer — categories

**Files:**
- Create: `src/lib/data/categories.ts`

- [ ] **Step 1: Write `src/lib/data/categories.ts`**

```ts
import { createPublicClient } from "@/lib/supabase/public";
import type { Category } from "@/types/domain";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

/** All categories, alphabetical. */
export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data ?? []).map(toCategory);
}

/** A single category by slug, or null if not found. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load category "${slug}": ${error.message}`);
  return data ? toCategory(data as CategoryRow) : null;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/categories.ts
git commit -m "feat: add categories data-access layer"
```

---

## Task 11: Data-access layer — sites

**Files:**
- Create: `src/lib/data/sites.ts`

- [ ] **Step 1: Write `src/lib/data/sites.ts`**

```ts
import { createPublicClient } from "@/lib/supabase/public";
import { getPagination } from "@/lib/directory";
import type { DirectoryParams } from "@/lib/directory";
import { getCategoryBySlug } from "@/lib/data/categories";
import type {
  Category,
  Service,
  Screenshot,
  SiteDetail,
  SiteSummary,
  Tag,
} from "@/types/domain";

// Column lists kept as constants so the row types below stay in sync.
const SUMMARY_COLUMNS =
  "id, name, slug, url, logo_url, short_summary, lifecycle, is_featured, " +
  "category:categories (id, name, slug, description)";

const DETAIL_COLUMNS =
  SUMMARY_COLUMNS +
  ", full_overview, target_audience, seo_title, seo_description, " +
  "services (id, name, description, sort_order), " +
  "screenshots (id, image_url, alt_text, sort_order), " +
  "site_tags (tags (id, name, slug))";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SummaryRow {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  short_summary: string;
  lifecycle: "live" | "coming_soon";
  is_featured: boolean;
  category: CategoryRow | null;
}

interface DetailRow extends SummaryRow {
  full_overview: string | null;
  target_audience: string | null;
  seo_title: string | null;
  seo_description: string | null;
  services: {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
  }[];
  screenshots: {
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
  }[];
  site_tags: { tags: { id: string; name: string; slug: string } | null }[];
}

function toCategory(row: CategoryRow | null): Category | null {
  return row
    ? { id: row.id, name: row.name, slug: row.slug, description: row.description }
    : null;
}

function toSummary(row: SummaryRow): SiteSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    url: row.url,
    logoUrl: row.logo_url,
    shortSummary: row.short_summary,
    lifecycle: row.lifecycle,
    isFeatured: row.is_featured,
    category: toCategory(row.category),
  };
}

function toDetail(row: DetailRow): SiteDetail {
  const services: Service[] = [...row.services]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      sortOrder: s.sort_order,
    }));

  const screenshots: Screenshot[] = [...row.screenshots]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      imageUrl: s.image_url,
      altText: s.alt_text,
      sortOrder: s.sort_order,
    }));

  const tags: Tag[] = row.site_tags
    .map((st) => st.tags)
    .filter((t): t is Tag => t !== null);

  return {
    ...toSummary(row),
    fullOverview: row.full_overview,
    targetAudience: row.target_audience,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    services,
    screenshots,
    tags,
  };
}

export interface DirectoryResult {
  sites: SiteSummary[];
  total: number;
  totalPages: number;
  page: number;
}

/** Paginated, filtered directory listing. RLS restricts rows to published + public. */
export async function getDirectorySites(
  params: DirectoryParams,
): Promise<DirectoryResult> {
  const supabase = createPublicClient();
  const counting = getPagination(params.page, Number.MAX_SAFE_INTEGER);

  // Resolve a category slug to its id. Filtering on an embedded resource is
  // fiddly in PostgREST, so we filter on the direct `category_id` column.
  let categoryId: string | null = null;
  if (params.category) {
    const category = await getCategoryBySlug(params.category);
    if (!category) {
      return { sites: [], total: 0, totalPages: 0, page: params.page };
    }
    categoryId = category.id;
  }

  let q = supabase
    .from("sites")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .order("is_featured", { ascending: false })
    .order("name");

  if (params.query) {
    q = q.or(
      `name.ilike.%${params.query}%,short_summary.ilike.%${params.query}%`,
    );
  }
  if (params.lifecycle) {
    q = q.eq("lifecycle", params.lifecycle);
  }
  if (categoryId) {
    q = q.eq("category_id", categoryId);
  }

  q = q.range(counting.from, counting.to);

  const { data, error, count } = await q;
  if (error) throw new Error(`Failed to load directory: ${error.message}`);

  const total = count ?? 0;
  const { totalPages } = getPagination(params.page, total);

  return {
    sites: ((data ?? []) as SummaryRow[]).map(toSummary),
    total,
    totalPages,
    page: params.page,
  };
}

/** Featured sites for the homepage. */
export async function getFeaturedSites(limit = 3): Promise<SiteSummary[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select(SUMMARY_COLUMNS)
    .eq("is_featured", true)
    .order("name")
    .limit(limit);

  if (error) throw new Error(`Failed to load featured sites: ${error.message}`);
  return ((data ?? []) as SummaryRow[]).map(toSummary);
}

/** A single site with all related data, or null if not found / not public. */
export async function getSiteBySlug(slug: string): Promise<SiteDetail | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load site "${slug}": ${error.message}`);
  return data ? toDetail(data as DetailRow) : null;
}

/** Up to `limit` other public sites in the same category. */
export async function getRelatedSites(
  siteId: string,
  categoryId: string | null,
  limit = 3,
): Promise<SiteSummary[]> {
  if (!categoryId) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select(SUMMARY_COLUMNS)
    .eq("category_id", categoryId)
    .neq("id", siteId)
    .order("name")
    .limit(limit);

  if (error) throw new Error(`Failed to load related sites: ${error.message}`);
  return ((data ?? []) as SummaryRow[]).map(toSummary);
}

/** All published slugs — used by sitemap and static params. */
export async function getAllSiteSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("sites").select("slug");
  if (error) throw new Error(`Failed to load slugs: ${error.message}`);
  return (data ?? []).map((r) => r.slug as string);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Note on verification**

The data layer is a set of thin typed wrappers over Supabase. Typecheck (Step 2) confirms the types line up. Real behavioural verification — that queries return the right rows and RLS hides drafts — happens when the directory page is built and checked in the browser (Task 19, Step 2) and the profile page (Task 20, Step 2). No separate smoke test is needed here.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/sites.ts
git commit -m "feat: add sites data-access layer"
```

---

## Task 12: Design tokens, fonts, and root layout

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/layout/Container.tsx`

- [ ] **Step 1: Replace `src/app/globals.css` with the design tokens**

Per the spec: dark/navy base, white content sections, rounded cards, strong typography.
```css
@import "tailwindcss";

@theme {
  --color-navy-950: #0a0e1a;
  --color-navy-900: #0f1629;
  --color-navy-800: #1a2440;
  --color-accent-500: #4f7cff;
  --color-accent-600: #3b63e0;
  --color-ink-900: #11151c;
  --color-ink-600: #4b5563;
  --color-ink-400: #9aa3b2;

  --radius-card: 0.875rem;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-navy-950);
  color: white;
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Create `src/components/layout/Container.tsx`**

```tsx
import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "8Caps — A Portfolio of Digital Services",
    template: "%s — 8Caps",
  },
  description:
    "8Caps is a portfolio of digital services, platforms, tools, and specialist websites built to solve practical business problems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

> Note: `Header` and `Footer` are created in Task 13. The build will fail until then — that is expected; these two tasks ship together.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/layout/Container.tsx
git commit -m "feat: add design tokens and root layout"
```

---

## Task 13: Header and Footer

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

- [ ] **Step 1: Create `src/components/layout/Header.tsx`**

```tsx
import Link from "next/link";
import { Container } from "./Container";

const NAV = [
  { href: "/sites", label: "Directory" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          8Caps
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-400">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Create `src/components/layout/Footer.tsx`**

```tsx
import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 text-sm text-ink-400">
      <Container className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} 8Caps. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/sites" className="hover:text-white">Directory</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 3: Verify the build now compiles**

Run: `npm run build`
Expected: build succeeds (Task 12's layout now has its imports). The default homepage still renders.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx
git commit -m "feat: add site header and footer"
```

---

## Task 14: UI primitives — Button and StatusBadge

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/StatusBadge.tsx`
- Test: `src/components/ui/StatusBadge.test.tsx`

- [ ] **Step 1: Create `src/components/ui/Button.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary";

const STYLES: Record<Variant, string> = {
  primary: "bg-accent-500 text-white hover:bg-accent-600",
  secondary: "border border-white/20 text-white hover:bg-white/10",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  external?: boolean;
}) {
  const className = `inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${STYLES[variant]}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Write the failing test for StatusBadge**

Create `src/components/ui/StatusBadge.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders 'Live' for the live lifecycle", () => {
    render(<StatusBadge lifecycle="live" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders 'Coming soon' for the coming_soon lifecycle", () => {
    render(<StatusBadge lifecycle="coming_soon" />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- StatusBadge`
Expected: FAIL — `./StatusBadge` cannot be resolved.

- [ ] **Step 4: Create `src/components/ui/StatusBadge.tsx`**

```tsx
import type { SiteLifecycle } from "@/types/domain";

const LABELS: Record<SiteLifecycle, string> = {
  live: "Live",
  coming_soon: "Coming soon",
};

const STYLES: Record<SiteLifecycle, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  coming_soon: "bg-amber-500/15 text-amber-300",
};

export function StatusBadge({ lifecycle }: { lifecycle: SiteLifecycle }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[lifecycle]}`}
    >
      {LABELS[lifecycle]}
    </span>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- StatusBadge`
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui
git commit -m "feat: add Button and StatusBadge UI primitives"
```

---

## Task 15: SiteCard component

**Files:**
- Create: `src/components/site/SiteCard.tsx`
- Test: `src/components/site/SiteCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/site/SiteCard.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteCard } from "./SiteCard";
import type { SiteSummary } from "@/types/domain";

const site: SiteSummary = {
  id: "1",
  name: "Automated Panda",
  slug: "automated-panda",
  url: "https://automatedpanda.com",
  logoUrl: null,
  shortSummary: "Workflow automation for small businesses.",
  lifecycle: "live",
  isFeatured: true,
  category: { id: "c1", name: "Automation", slug: "automation", description: null },
};

describe("SiteCard", () => {
  it("shows the site name, summary and category", () => {
    render(<SiteCard site={site} />);
    expect(screen.getByText("Automated Panda")).toBeInTheDocument();
    expect(
      screen.getByText("Workflow automation for small businesses."),
    ).toBeInTheDocument();
    expect(screen.getByText("Automation")).toBeInTheDocument();
  });

  it("links 'View details' to the site profile", () => {
    render(<SiteCard site={site} />);
    const link = screen.getByRole("link", { name: /view details/i });
    expect(link).toHaveAttribute("href", "/sites/automated-panda");
  });

  it("links 'Visit website' to the external URL", () => {
    render(<SiteCard site={site} />);
    const link = screen.getByRole("link", { name: /visit website/i });
    expect(link).toHaveAttribute("href", "https://automatedpanda.com");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- SiteCard`
Expected: FAIL — `./SiteCard` cannot be resolved.

- [ ] **Step 3: Create `src/components/site/SiteCard.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { SiteSummary } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SiteCard({ site }: { site: SiteSummary }) {
  return (
    <article className="flex flex-col rounded-card border border-white/10 bg-navy-900 p-5 transition-colors hover:border-white/25">
      <div className="flex items-center gap-3">
        {site.logoUrl ? (
          <Image
            src={site.logoUrl}
            alt={`${site.name} logo`}
            width={44}
            height={44}
            className="rounded-lg"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-800 text-sm font-bold text-ink-400">
            {site.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-semibold leading-tight">{site.name}</h3>
          {site.category && (
            <p className="text-xs text-ink-400">{site.category.name}</p>
          )}
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm text-ink-400">{site.shortSummary}</p>

      <div className="mt-4 flex items-center justify-between">
        <StatusBadge lifecycle={site.lifecycle} />
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/sites/${site.slug}`}
          className="flex-1 rounded-lg bg-accent-500 px-3 py-2 text-center text-sm font-semibold hover:bg-accent-600"
        >
          View details
        </Link>
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-center text-sm font-semibold hover:bg-white/10"
        >
          Visit website
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Configure `next/image` to allow the placeholder host**

In `next.config.ts`, add `images.remotePatterns` so the seed's `placehold.co` logos load:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- SiteCard`
Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/site/SiteCard.tsx src/components/site/SiteCard.test.tsx next.config.ts
git commit -m "feat: add SiteCard component"
```

---

## Task 16: DirectoryGrid, CategoryFilter, Pagination components

**Files:**
- Create: `src/components/site/DirectoryGrid.tsx`, `src/components/site/CategoryFilter.tsx`, `src/components/site/Pagination.tsx`

- [ ] **Step 1: Create `src/components/site/DirectoryGrid.tsx`**

```tsx
import type { SiteSummary } from "@/types/domain";
import { SiteCard } from "./SiteCard";

export function DirectoryGrid({ sites }: { sites: SiteSummary[] }) {
  if (sites.length === 0) {
    return (
      <p className="rounded-card border border-white/10 bg-navy-900 p-8 text-center text-ink-400">
        No websites match your search.
      </p>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/site/CategoryFilter.tsx`**

A server component rendering links that set the `category` search param. Selecting a category resets `page`.
```tsx
import Link from "next/link";
import type { Category } from "@/types/domain";

export function CategoryFilter({
  categories,
  activeCategory,
  query,
  lifecycle,
}: {
  categories: Category[];
  activeCategory: string | null;
  query: string;
  lifecycle: string | null;
}) {
  function hrefFor(categorySlug: string | null): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (lifecycle) params.set("lifecycle", lifecycle);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return qs ? `/sites?${qs}` : "/sites";
  }

  const base =
    "rounded-full px-3 py-1.5 text-sm transition-colors";
  const active = "bg-accent-500 text-white";
  const inactive = "border border-white/15 text-ink-400 hover:text-white";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(null)}
        className={`${base} ${activeCategory === null ? active : inactive}`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={hrefFor(c.slug)}
          className={`${base} ${activeCategory === c.slug ? active : inactive}`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/site/Pagination.tsx`**

```tsx
import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(targetPage));
    return `/sites?${params.toString()}`;
  }

  const linkClass =
    "rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10";
  const disabledClass =
    "rounded-lg border border-white/5 px-4 py-2 text-sm text-ink-600";

  return (
    <nav className="mt-8 flex items-center justify-between">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-sm text-ink-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </nav>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/DirectoryGrid.tsx src/components/site/CategoryFilter.tsx src/components/site/Pagination.tsx
git commit -m "feat: add directory grid, category filter and pagination components"
```

---

## Task 17: CTASection and SiteHero components

**Files:**
- Create: `src/components/marketing/CTASection.tsx`, `src/components/site/SiteHero.tsx`, `src/components/site/ScreenshotGallery.tsx`

- [ ] **Step 1: Create `src/components/marketing/CTASection.tsx`**

```tsx
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="py-16">
      <Container>
        <div className="rounded-card bg-gradient-to-br from-accent-600 to-navy-800 p-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Looking for a service, or have a question?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Get in touch with the 8Caps team and we will point you to the right
            tool or service.
          </p>
          <div className="mt-6">
            <ButtonLink href="/contact" variant="secondary">
              Contact 8Caps
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/site/ScreenshotGallery.tsx`**

```tsx
import Image from "next/image";
import type { Screenshot } from "@/types/domain";

export function ScreenshotGallery({
  screenshots,
}: {
  screenshots: Screenshot[];
}) {
  if (screenshots.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {screenshots.map((shot) => (
        <Image
          key={shot.id}
          src={shot.imageUrl}
          alt={shot.altText ?? ""}
          width={1200}
          height={750}
          className="rounded-card border border-white/10"
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/site/SiteHero.tsx`**

```tsx
import Image from "next/image";
import type { SiteDetail } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";

export function SiteHero({ site }: { site: SiteDetail }) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      {site.logoUrl ? (
        <Image
          src={site.logoUrl}
          alt={`${site.name} logo`}
          width={80}
          height={80}
          className="rounded-xl"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-navy-800 text-2xl font-bold text-ink-400">
          {site.name.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <StatusBadge lifecycle={site.lifecycle} />
        </div>
        {site.category && (
          <p className="mt-1 text-sm text-ink-400">{site.category.name}</p>
        )}
        <p className="mt-3 max-w-2xl text-ink-400">{site.shortSummary}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={site.url} external>
            Visit website
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Enquire through 8Caps
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/CTASection.tsx src/components/site/SiteHero.tsx src/components/site/ScreenshotGallery.tsx
git commit -m "feat: add CTASection, SiteHero and ScreenshotGallery components"
```

---

## Task 18: Homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { getFeaturedSites } from "@/lib/data/sites";
import { getCategories } from "@/lib/data/categories";

// Revalidate the static page hourly; admin publish actions in Plan 2 will
// trigger on-demand revalidation.
export const revalidate = 3600;

const WHY = [
  { title: "Credibility", body: "A single, verifiable home for every 8Caps brand." },
  { title: "Range of services", body: "Tools across automation, marketing, property and more." },
  { title: "Specialist websites", body: "Each product is purpose-built for its audience." },
  { title: "Practical solutions", body: "Everything here solves a real business problem." },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedSites(3),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="py-20">
        <Container>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            A portfolio of digital services built to solve practical business
            problems.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-400">
            8Caps builds and operates specialist websites, platforms and tools.
            Explore everything we offer in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/sites">Explore our services</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Contact 8Caps
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Featured */}
      <section className="bg-navy-900 py-16">
        <Container>
          <h2 className="text-2xl font-bold">Featured websites</h2>
          <p className="mt-1 text-ink-400">A selection of our flagship products.</p>
          <div className="mt-8">
            <DirectoryGrid sites={featured} />
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-bold">Browse by category</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/sites?category=${c.slug}`}
                className="rounded-card border border-white/10 bg-navy-900 p-5 hover:border-white/25"
              >
                <h3 className="font-semibold">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 text-sm text-ink-400">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Why 8Caps */}
      <section className="bg-navy-900 py-16">
        <Container>
          <h2 className="text-2xl font-bold">Why 8Caps</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold text-accent-500">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-400">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
```

- [ ] **Step 2: Run the dev server and verify the homepage**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: hero, **2 featured sites** (Automated Panda + LeadHarbour — PropToolkit is not featured), 6 category cards, Why section, CTA. `Stealth Project` does not appear.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build homepage"
```

---

## Task 19: Directory page

**Files:**
- Create: `src/app/sites/page.tsx`

- [ ] **Step 1: Create `src/app/sites/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CategoryFilter } from "@/components/site/CategoryFilter";
import { Pagination } from "@/components/site/Pagination";
import { getDirectorySites } from "@/lib/data/sites";
import { getCategories } from "@/lib/data/categories";
import { parseDirectoryParams } from "@/lib/directory";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse every website, tool and service operated by 8Caps.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseDirectoryParams(await searchParams);
  const [result, categories] = await Promise.all([
    getDirectorySites(params),
    getCategories(),
  ]);

  const baseParams = new URLSearchParams();
  if (params.query) baseParams.set("q", params.query);
  if (params.category) baseParams.set("category", params.category);
  if (params.lifecycle) baseParams.set("lifecycle", params.lifecycle);

  return (
    <section className="py-14">
      <Container>
        <h1 className="text-3xl font-bold">Website directory</h1>
        <p className="mt-2 text-ink-400">
          {result.total} {result.total === 1 ? "website" : "websites"} operated
          by 8Caps.
        </p>

        {/* Search */}
        <form action="/sites" method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={params.query}
            placeholder="Search by name or keyword…"
            className="w-full max-w-md rounded-lg border border-white/15 bg-navy-900 px-4 py-2.5 text-sm placeholder:text-ink-600"
          />
          {params.category && (
            <input type="hidden" name="category" value={params.category} />
          )}
          {params.lifecycle && (
            <input type="hidden" name="lifecycle" value={params.lifecycle} />
          )}
          <button
            type="submit"
            className="rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold hover:bg-accent-600"
          >
            Search
          </button>
        </form>

        {/* Category filter */}
        <div className="mt-5">
          <CategoryFilter
            categories={categories}
            activeCategory={params.category}
            query={params.query}
            lifecycle={params.lifecycle}
          />
        </div>

        {/* Results */}
        <div className="mt-8">
          <DirectoryGrid sites={result.sites} />
        </div>

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          baseParams={baseParams}
        />
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Verify the directory in the browser**

With `npm run dev` running, open `http://localhost:3000/sites`.
Expected checks:
- 3 sites shown (Automated Panda, LeadHarbour, PropToolkit). `Stealth Project` (draft) is absent — this confirms RLS.
- Searching `panda` shows only Automated Panda.
- Clicking the `Property` category filter shows only PropToolkit.
- The count text matches the number of cards.

- [ ] **Step 3: Commit**

```bash
git add src/app/sites/page.tsx
git commit -m "feat: build directory page with search, filter and pagination"
```

---

## Task 20: Site profile page

**Files:**
- Create: `src/app/sites/[slug]/page.tsx`

- [ ] **Step 1: Create `src/app/sites/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { SiteHero } from "@/components/site/SiteHero";
import { ScreenshotGallery } from "@/components/site/ScreenshotGallery";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { getSiteBySlug, getRelatedSites, getAllSiteSlugs } from "@/lib/data/sites";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllSiteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return { title: "Website not found" };
  return {
    title: site.seoTitle ?? site.name,
    description: site.seoDescription ?? site.shortSummary,
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const related = await getRelatedSites(
    site.id,
    site.category?.id ?? null,
    3,
  );

  return (
    <>
      <section className="py-14">
        <Container>
          <SiteHero site={site} />

          {site.fullOverview && (
            <div className="mt-12 max-w-3xl">
              <h2 className="text-xl font-bold">Overview</h2>
              <p className="mt-3 text-ink-400">{site.fullOverview}</p>
            </div>
          )}

          {site.services.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold">Services offered</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {site.services.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-card border border-white/10 bg-navy-900 p-4"
                  >
                    <h3 className="font-semibold">{s.name}</h3>
                    {s.description && (
                      <p className="mt-1 text-sm text-ink-400">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {site.targetAudience && (
            <div className="mt-12 max-w-3xl">
              <h2 className="text-xl font-bold">Who it helps</h2>
              <p className="mt-3 text-ink-400">{site.targetAudience}</p>
            </div>
          )}

          {site.screenshots.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold">Screenshots</h2>
              <div className="mt-4">
                <ScreenshotGallery screenshots={site.screenshots} />
              </div>
            </div>
          )}

          {site.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {site.tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-ink-400"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold">Related websites</h2>
              <div className="mt-4">
                <DirectoryGrid sites={related} />
              </div>
            </div>
          )}
        </Container>
      </section>

      <CTASection />
    </>
  );
}
```

- [ ] **Step 2: Verify the profile page in the browser**

With `npm run dev` running:
- Open `http://localhost:3000/sites/automated-panda` → hero, overview, 2 services, who-it-helps, 2 screenshots, tags.
- Open `http://localhost:3000/sites/stealth-project` → **404 page** (draft site, blocked by RLS).
- Open `http://localhost:3000/sites/does-not-exist` → **404 page**.

- [ ] **Step 3: Commit**

```bash
git add "src/app/sites/[slug]/page.tsx"
git commit -m "feat: build site profile page"
```

---

## Task 21: About and Contact pages

**Files:**
- Create: `src/app/about/page.tsx`, `src/app/contact/page.tsx`

- [ ] **Step 1: Create `src/app/about/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";

export const metadata: Metadata = {
  title: "About",
  description:
    "8Caps is a portfolio of digital services, platforms and specialist websites.",
};

export default function AboutPage() {
  return (
    <>
      <section className="py-14">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-bold">About 8Caps</h1>
          <p className="mt-5 text-ink-400">
            8Caps is a portfolio of digital services, platforms, tools and
            specialist websites built to solve practical business problems.
            Every brand we operate is purpose-built for a specific audience and
            a specific job.
          </p>
          <p className="mt-4 text-ink-400">
            This directory exists to give each of those products a credible,
            verifiable home — and to make it easy to find the right tool for
            your needs.
          </p>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
```

- [ ] **Step 2: Create `src/app/contact/page.tsx`**

This is the static interim version. Plan 2 replaces it with a working enquiry form.
```tsx
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the 8Caps team.",
};

export default function ContactPage() {
  return (
    <section className="py-14">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-bold">Contact 8Caps</h1>
        <p className="mt-4 text-ink-400">
          Have a question about one of our services, or want to be pointed to
          the right tool? Email us and we will get back to you.
        </p>
        <div className="mt-6">
          <ButtonLink href="mailto:master@8caps.co.uk" external>
            master@8caps.co.uk
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-ink-600">
          An online enquiry form is coming soon.
        </p>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Verify both pages**

With `npm run dev` running, open `/about` and `/contact`. Both render; the `mailto:` link opens an email draft.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx src/app/contact/page.tsx
git commit -m "feat: add about and contact pages"
```

---

## Task 22: SEO — sitemap and robots

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Create: `.env.local` addition for the site URL

- [ ] **Step 1: Add the public site URL to `.env.local` and `.env.example`**

Add to both (value blank in `.env.example`):
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
In production on Vercel this will be set to the real domain.

- [ ] **Step 2: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { getAllSiteSlugs } from "@/lib/data/sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const slugs = await getAllSiteSlugs();

  const staticRoutes = ["", "/sites", "/about", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const siteRoutes = slugs.map((slug) => ({
    url: `${base}/sites/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...siteRoutes];
}
```

- [ ] **Step 3: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Verify**

With `npm run dev` running, open `http://localhost:3000/sitemap.xml` (lists static + 3 published site URLs) and `http://localhost:3000/robots.txt`.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts .env.example
git commit -m "feat: add sitemap and robots"
```

---

## Task 23: Full verification and deploy

**Files:** none (verification + deployment)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (directory logic, StatusBadge, SiteCard).

- [ ] **Step 2: Run the typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Run the linter**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: build succeeds. The directory and site pages are listed as static/ISR.

- [ ] **Step 5: Manual smoke check against the production build**

Run: `npm run build && npm start`, then verify:
- `/` shows hero, 2 featured sites, 6 categories.
- `/sites` shows 3 sites; search and category filter work.
- `/sites/automated-panda` shows the full profile.
- `/sites/stealth-project` returns 404.
- `/about`, `/contact` render.

- [ ] **Step 6: Deploy to Vercel**

Import the GitHub repo into Vercel. Set the environment variables in the Vercel project settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL` (the production domain). Trigger a deploy.

> This step is manual (James creates/links the Vercel project).

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: Plan 1 complete — foundation and public site"
git push
```

---

## Self-Review Notes

- **Spec coverage:** Homepage, directory (search/filter/pagination), profile pages, about, contact — all covered (Tasks 18–21). Schema with the three-way `publish_status` / `lifecycle` / `visibility` split — Task 4. RLS for public read — Task 5. Typed data layer — Tasks 10–11. Design tokens matching the spec's dark/navy direction — Task 12. SEO — Task 22. Admin, auth, and the enquiry write path are deliberately Plan 2.
- **Out of scope confirmed:** `/contact` ships static here; the working form, `enquiries` write path, Resend email, and all `/admin/*` routes are Plan 2.
- **Type consistency:** `SiteSummary` / `SiteDetail` defined in Task 7 are used unchanged by the data layer (Tasks 10–11) and every component. `parseDirectoryParams` / `getPagination` (Task 9) feed `getDirectorySites` (Task 11) and the directory page (Task 19).
