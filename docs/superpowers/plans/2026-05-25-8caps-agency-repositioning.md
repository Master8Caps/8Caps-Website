# 8Caps Agency Repositioning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the existing 8Caps site from a portfolio directory into an agency website — six pages (Home, Services, Work, Products, About, Contact) — in time for a finance-company referral meeting.

**Architecture:** Builds on the existing Next.js 16 App Router + Supabase + Tailwind v4 stack. Adds a `case_studies` table (with structural ASA-approval gate via RLS), three new public routes (`/services`, `/work`, `/products` — last replaces `/sites`), reworks `/`, `/about`, and `/contact`. Contact upgrades from a static page to a working enquiry form using a Server Action + Zod + Resend.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + RLS), Resend (transactional email), Zod (validation), Vitest + React Testing Library, deployed on Vercel.

**Reference spec:** `docs/superpowers/specs/2026-05-25-8caps-agency-repositioning-design.md`

**External dependencies (tracked separately):** `docs/pre-meeting-notes.md`

---

## Notes for executors

- **Sandbox**: when running `npm install` or `npm run build`, the user's environment requires `dangerouslyDisableSandbox: true` on the Bash tool — otherwise the install fails with ECONNRESET.
- **Tests pattern**: pure functions and components are tested with Vitest + RTL. Data-access wrappers and pages are verified by `npm run typecheck` + `npm run build` + manual browser check. Don't unit-test thin Supabase wrappers.
- **Existing seed conventions**: tests use UUIDs of the form `33333333-3333-…` for sites etc. Continue the pattern — case studies use the `44…` prefix.
- **Supabase migrations**: created via `npx supabase migration new <name>`, applied via `npx supabase db push`. Seed data does NOT auto-apply with `db push` — it must be pasted into the Supabase SQL editor for the hosted DB.
- **All tasks end with a commit.** Frequent commits = easy rollback.

---

## Scope

**In scope (this plan):**

- New `case_studies` + `case_study_services` tables with RLS + seed data
- Extension of `enquiries` table with three new fields (`company`, `project_type`, `heard_about`)
- Three new public pages: `/services`, `/work`, `/products` (last is the renamed `/sites`)
- Rework of `/`, `/about`, `/contact`
- Permanent redirects from `/sites` and `/sites/[slug]`
- Header nav update, Footer trust info, new `/privacy` stub
- Working contact form (Server Action + Zod + Resend) with honeypot anti-spam

**Out of scope (deferred):**

- Calendly integration on `/contact`
- Lender-specific co-branded landing pages
- Multi-step "Get a quote" wizard
- Cookie consent / analytics
- Admin CRUD for case studies (seeded directly)
- Individual `/work/[slug]` detail pages — case studies live inline on `/work`
- `ui-ux-pro-max` visual polish pass (handled as a separate phase once structure is in)

---

## File Structure

**New files:**

```
supabase/migrations/<ts>_case_studies.sql           # schema + indexes
supabase/migrations/<ts>_case_studies_rls.sql       # RLS policies
supabase/migrations/<ts>_enquiries_extra_fields.sql # add 3 columns
supabase/seed-case-studies.sql                      # seed for 7 case studies

src/types/case-study.ts                             # CaseStudy domain types
src/lib/data/case-studies.ts                        # data-access layer
src/lib/case-studies-filter.ts                      # param parsing (pure)
src/lib/case-studies-filter.test.ts
src/lib/contact-form.ts                             # Zod schema
src/lib/contact-form.test.ts
src/lib/resend.ts                                   # Resend client

src/app/(public)/services/page.tsx
src/app/(public)/work/page.tsx
src/app/(public)/products/page.tsx                  # moved from /sites
src/app/(public)/products/[slug]/page.tsx           # moved from /sites/[slug]
src/app/(public)/privacy/page.tsx                   # stub
src/app/(public)/contact/actions.ts                 # server action

src/components/work/CaseStudyCard.tsx
src/components/work/CaseStudyCard.test.tsx
src/components/work/CaseStudyFilter.tsx
src/components/work/CaseStudyFilter.test.tsx
src/components/services/ServicePillarSection.tsx
src/components/services/ServicePillarSection.test.tsx
src/components/marketing/StatStrip.tsx
src/components/marketing/StatStrip.test.tsx
src/components/about/DisciplineCard.tsx
src/components/about/DisciplineCard.test.tsx
src/components/contact/ContactForm.tsx
src/components/contact/ContactForm.test.tsx
src/components/contact/ContactWhatToExpect.tsx
```

**Files modified:**

```
src/app/(public)/page.tsx                # homepage rework
src/app/(public)/about/page.tsx          # rework
src/app/(public)/contact/page.tsx        # full upgrade
src/components/layout/Header.tsx         # nav update
src/components/layout/Footer.tsx         # compliance info
src/app/sitemap.ts                       # add new routes
next.config.ts                           # /sites → /products redirects
.env.example                             # add RESEND_API_KEY
.env.local                               # add RESEND_API_KEY (manual)
package.json                             # add resend dependency
```

**Files removed:** the old `src/app/(public)/sites/` folder after its routes are moved to `/products/`. Redirects in `next.config.ts` keep old URLs working.

---

## Task 1: case_studies + case_study_services schema migration

**Files:**
- Create: `supabase/migrations/<timestamp>_case_studies.sql`

- [ ] **Step 1: Generate the migration file**

Run: `npx supabase migration new case_studies`

Expected: creates `supabase/migrations/<timestamp>_case_studies.sql` (empty).

- [ ] **Step 2: Write the schema into the migration**

Paste into the new migration file:

```sql
-- Enum: which service pillar a case study slots into.
create type case_study_service as enum (
  'custom_software',
  'ai',
  'automation',
  'lead_gen',
  'ecommerce'
);

-- case_studies: one row per published client project.
create table case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  client_name text not null,
  client_sector text,
  year int,
  logo_url text,
  brand_colour text,                          -- optional hex, used to tint the card
  outcome_headline text not null,
  story_problem text not null,
  story_solution text not null,
  testimonial_quote text not null,
  testimonial_author text not null,
  testimonial_role text,
  testimonial_approved_at timestamptz,        -- NULL = unapproved, must not be public
  tech_stack text[] not null default '{}',
  publish_status publish_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_studies_publish_status_idx on case_studies (publish_status);
create index case_studies_is_featured_idx on case_studies (is_featured);

-- Reuse the existing updated-at trigger function from the sites table.
create trigger case_studies_set_updated_at
  before update on case_studies
  for each row execute function set_updated_at();

-- case_study_services: which service pillars a case study belongs to.
create table case_study_services (
  case_study_id uuid not null references case_studies (id) on delete cascade,
  service case_study_service not null,
  primary key (case_study_id, service)
);
create index case_study_services_service_idx on case_study_services (service);
```

- [ ] **Step 3: Apply the migration**

Run: `npx supabase db push`
Expected: "Applying migration `<timestamp>_case_studies.sql`..." then success.

- [ ] **Step 4: Verify the tables exist**

Run: `npx supabase db diff`
Expected: "No schema changes found".

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat: add case_studies and case_study_services schema"
```

---

## Task 2: case_studies RLS policies migration

**Files:**
- Create: `supabase/migrations/<timestamp>_case_studies_rls.sql`

The key constraint: a case study is only publicly visible when its testimonial has been **approved in writing** (`testimonial_approved_at IS NOT NULL`). This structurally enforces the ASA rule from the design spec.

- [ ] **Step 1: Generate the migration file**

Run: `npx supabase migration new case_studies_rls`

- [ ] **Step 2: Write the RLS policies**

Paste into the new migration file:

```sql
-- Enable RLS on the new tables.
alter table case_studies         enable row level security;
alter table case_study_services  enable row level security;

-- A case study is publicly visible only when it is published AND its
-- testimonial has been approved in writing. The approval gate enforces the
-- ASA rule structurally — an unapproved testimonial cannot accidentally leak.
create policy "public reads approved published case studies" on case_studies
  for select using (
    publish_status = 'published'
    and testimonial_approved_at is not null
  );

-- Services rows are visible whenever their parent case study is visible.
create policy "public reads services of visible case studies" on case_study_services
  for select using (
    exists (
      select 1 from case_studies cs
      where cs.id = case_study_services.case_study_id
        and cs.publish_status = 'published'
        and cs.testimonial_approved_at is not null
    )
  );
```

- [ ] **Step 3: Apply the migration**

Run: `npx supabase db push`
Expected: applies the RLS migration successfully.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations
git commit -m "feat: add RLS policies gating case studies on testimonial approval"
```

---

## Task 3: Extend enquiries table with new contact form fields

The current `enquiries` table has `name`, `email`, `message`, `site_id`, `status`, `created_at`. The new contact form captures three additional fields: company, project type, and a "how did you hear about us" string.

**Files:**
- Create: `supabase/migrations/<timestamp>_enquiries_extra_fields.sql`

- [ ] **Step 1: Generate the migration file**

Run: `npx supabase migration new enquiries_extra_fields`

- [ ] **Step 2: Write the migration**

```sql
-- Project-type enum used by the contact form.
create type enquiry_project_type as enum (
  'custom_software',
  'ai',
  'automation',
  'not_sure'
);

alter table enquiries
  add column company text,
  add column project_type enquiry_project_type,
  add column heard_about text;
```

- [ ] **Step 3: Apply the migration**

Run: `npx supabase db push`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations
git commit -m "feat: extend enquiries with company, project_type, heard_about"
```

---

## Task 4: Seed data for case studies

Seeds the seven real case studies — but all start with `testimonial_approved_at = null`, so RLS hides them until each client signs off. Once a sign-off lands, an admin (or a quick SQL update) sets `testimonial_approved_at = now()` for that row and it goes live.

**Files:**
- Create: `supabase/seed-case-studies.sql`

- [ ] **Step 1: Create the seed file**

Create `supabase/seed-case-studies.sql`:

```sql
-- Seed: seven real client case studies. All start with
-- testimonial_approved_at = NULL so RLS hides them until each client has
-- signed off on the wording in writing.
--
-- Story / outcome / testimonial text is placeholder until James fills in real
-- copy. Logos are placeholders.

-- North Bar — Custom Software · Automation · Lead Gen — Obi
insert into case_studies (id, slug, client_name, client_sector, year, logo_url,
                          outcome_headline, story_problem, story_solution,
                          testimonial_quote, testimonial_author, testimonial_role,
                          tech_stack, publish_status, is_featured, sort_order)
values
  ('44444444-4444-4444-4444-444444444401', 'north-bar', 'North Bar', 'Hospitality', 2024,
   'https://placehold.co/200x80?text=North+Bar',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Obi', 'Owner',
   array['Next.js', 'Supabase', 'Make.com'], 'published', true, 0),

  ('44444444-4444-4444-4444-444444444402', 'hull-mag', 'Hull Mag / Bestey', 'Publishing', 2024,
   'https://placehold.co/200x80?text=Hull+Mag',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Jane Gough', 'Editor',
   array['Make.com', 'Claude API', 'Mailchimp'], 'published', true, 1),

  ('44444444-4444-4444-4444-444444444403', 'store-more', 'Store More', 'Self-storage', 2024,
   'https://placehold.co/200x80?text=Store+More',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Dean Booty', 'Director',
   array['Claude API', 'Voice agent', 'Make.com'], 'published', false, 2),

  ('44444444-4444-4444-4444-444444444404', 'frame-sfs', 'Frame SFS', 'Picture framing', 2024,
   'https://placehold.co/200x80?text=Frame+SFS',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Alex Stark', 'Owner',
   array['Next.js', 'Supabase', 'Make.com'], 'published', false, 3),

  ('44444444-4444-4444-4444-444444444405', 'de-lacy-salons', 'De Lacy Salons', 'Beauty', 2024,
   'https://placehold.co/200x80?text=De+Lacy+Salons',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Kirsty Reader', 'Owner',
   array['Next.js', 'Claude API', 'Supabase'], 'published', true, 4),

  ('44444444-4444-4444-4444-444444444406', 'de-lacy-at-home', 'De Lacy at Home', 'E-commerce', 2024,
   'https://placehold.co/200x80?text=De+Lacy+at+Home',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Kerris Lacy', 'Owner',
   array['Shopify', 'Make.com', 'Etsy API'], 'published', false, 5),

  ('44444444-4444-4444-4444-444444444407', 'castle-sunset', 'Castle Sunset', 'Holiday lets', 2024,
   'https://placehold.co/200x80?text=Castle+Sunset',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Rebecca Curley', 'Owner',
   array['Claude API', 'Voice agent', 'Make.com'], 'published', true, 6);

-- Service pillar tags per case study.
insert into case_study_services (case_study_id, service) values
  ('44444444-4444-4444-4444-444444444401', 'custom_software'),
  ('44444444-4444-4444-4444-444444444401', 'automation'),
  ('44444444-4444-4444-4444-444444444401', 'lead_gen'),
  ('44444444-4444-4444-4444-444444444402', 'automation'),
  ('44444444-4444-4444-4444-444444444402', 'ai'),
  ('44444444-4444-4444-4444-444444444403', 'ai'),
  ('44444444-4444-4444-4444-444444444403', 'automation'),
  ('44444444-4444-4444-4444-444444444404', 'custom_software'),
  ('44444444-4444-4444-4444-444444444404', 'automation'),
  ('44444444-4444-4444-4444-444444444404', 'lead_gen'),
  ('44444444-4444-4444-4444-444444444405', 'custom_software'),
  ('44444444-4444-4444-4444-444444444405', 'ai'),
  ('44444444-4444-4444-4444-444444444405', 'automation'),
  ('44444444-4444-4444-4444-444444444406', 'automation'),
  ('44444444-4444-4444-4444-444444444406', 'ecommerce'),
  ('44444444-4444-4444-4444-444444444407', 'ai'),
  ('44444444-4444-4444-4444-444444444407', 'automation'),
  ('44444444-4444-4444-4444-444444444407', 'lead_gen');
```

- [ ] **Step 2: Apply the seed to the hosted database**

`supabase db push` does not run seed files. Open the Supabase dashboard → **SQL Editor** → paste the full contents of `supabase/seed-case-studies.sql` → Run.

Expected: 7 rows in `case_studies`, 18 rows in `case_study_services`. RLS will hide them from the anon key until `testimonial_approved_at` is set, so this is the correct state for now.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed-case-studies.sql
git commit -m "feat: seed seven case studies (testimonials pending approval)"
```

---

## Task 5: CaseStudy domain types

**Files:**
- Create: `src/types/case-study.ts`

- [ ] **Step 1: Create the types file**

```ts
export type CaseStudyService =
  | "custom_software"
  | "ai"
  | "automation"
  | "lead_gen"
  | "ecommerce";

export const CASE_STUDY_SERVICE_LABELS: Record<CaseStudyService, string> = {
  custom_software: "Custom Software",
  ai: "AI",
  automation: "Automation",
  lead_gen: "Lead Gen",
  ecommerce: "E-commerce",
};

/** A case study as shown on /work and homepage Featured Work. */
export interface CaseStudy {
  id: string;
  slug: string;
  clientName: string;
  clientSector: string | null;
  year: number | null;
  logoUrl: string | null;
  brandColour: string | null;
  outcomeHeadline: string;
  storyProblem: string;
  storySolution: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string | null;
  techStack: string[];
  isFeatured: boolean;
  sortOrder: number;
  services: CaseStudyService[];
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/case-study.ts
git commit -m "feat: add CaseStudy domain types"
```

---

## Task 6: Case studies data-access layer

Pattern mirrors `src/lib/data/sites.ts`: thin typed wrappers over Supabase queries. Not unit-tested — verified by typecheck + pages rendering.

**Files:**
- Create: `src/lib/data/case-studies.ts`

- [ ] **Step 1: Create the data layer**

```ts
import { createPublicClient } from "@/lib/supabase/public";
import type { CaseStudy, CaseStudyService } from "@/types/case-study";

const COLUMNS =
  "id, slug, client_name, client_sector, year, logo_url, brand_colour, " +
  "outcome_headline, story_problem, story_solution, testimonial_quote, " +
  "testimonial_author, testimonial_role, tech_stack, is_featured, sort_order, " +
  "case_study_services (service)";

interface CaseStudyRow {
  id: string;
  slug: string;
  client_name: string;
  client_sector: string | null;
  year: number | null;
  logo_url: string | null;
  brand_colour: string | null;
  outcome_headline: string;
  story_problem: string;
  story_solution: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_role: string | null;
  tech_stack: string[] | null;
  is_featured: boolean;
  sort_order: number;
  case_study_services: { service: CaseStudyService }[];
}

function toCaseStudy(row: CaseStudyRow): CaseStudy {
  return {
    id: row.id,
    slug: row.slug,
    clientName: row.client_name,
    clientSector: row.client_sector,
    year: row.year,
    logoUrl: row.logo_url,
    brandColour: row.brand_colour,
    outcomeHeadline: row.outcome_headline,
    storyProblem: row.story_problem,
    storySolution: row.story_solution,
    testimonialQuote: row.testimonial_quote,
    testimonialAuthor: row.testimonial_author,
    testimonialRole: row.testimonial_role,
    techStack: row.tech_stack ?? [],
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    services: row.case_study_services.map((s) => s.service),
  };
}

/** All published, approved case studies in display order. RLS does the
 *  approval-gate filtering for us. */
export async function getPublishedCaseStudies(
  service?: CaseStudyService,
): Promise<CaseStudy[]> {
  const supabase = createPublicClient();

  // Service-filter approach: filter on the server in TypeScript after the
  // query rather than via a join filter. The directory size is small (10s of
  // rows), so this is simple and correct. Switch to a server-side filter if
  // the table grows.
  const { data, error } = await supabase
    .from("case_studies")
    .select(COLUMNS)
    .order("is_featured", { ascending: false })
    .order("sort_order");

  if (error) throw new Error(`Failed to load case studies: ${error.message}`);

  const all = ((data ?? []) as CaseStudyRow[]).map(toCaseStudy);
  if (!service) return all;
  return all.filter((cs) => cs.services.includes(service));
}

/** Featured case studies for the homepage. */
export async function getFeaturedCaseStudies(limit = 3): Promise<CaseStudy[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(COLUMNS)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(limit);

  if (error) throw new Error(`Failed to load featured case studies: ${error.message}`);
  return ((data ?? []) as CaseStudyRow[]).map(toCaseStudy);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/case-studies.ts
git commit -m "feat: add case-studies data-access layer"
```

---

## Task 7: Case studies filter parsing (test-first)

Pure function — built test-first.

**Files:**
- Create: `src/lib/case-studies-filter.ts`
- Test: `src/lib/case-studies-filter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/case-studies-filter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseServiceFilter } from "./case-studies-filter";

describe("parseServiceFilter", () => {
  it("returns null for empty params", () => {
    expect(parseServiceFilter({})).toBeNull();
  });

  it("reads a valid service value", () => {
    expect(parseServiceFilter({ service: "custom_software" })).toBe("custom_software");
    expect(parseServiceFilter({ service: "ai" })).toBe("ai");
    expect(parseServiceFilter({ service: "automation" })).toBe("automation");
    expect(parseServiceFilter({ service: "lead_gen" })).toBe("lead_gen");
    expect(parseServiceFilter({ service: "ecommerce" })).toBe("ecommerce");
  });

  it("returns null for an invalid value", () => {
    expect(parseServiceFilter({ service: "banana" })).toBeNull();
  });

  it("takes the first value when given an array", () => {
    expect(parseServiceFilter({ service: ["ai", "custom_software"] })).toBe("ai");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- case-studies-filter`
Expected: FAIL — `./case-studies-filter` cannot be resolved.

- [ ] **Step 3: Write the implementation**

Create `src/lib/case-studies-filter.ts`:

```ts
import type { CaseStudyService } from "@/types/case-study";

type RawParam = string | string[] | undefined;
type RawParams = Record<string, RawParam>;

const VALID: readonly CaseStudyService[] = [
  "custom_software",
  "ai",
  "automation",
  "lead_gen",
  "ecommerce",
];

function first(value: RawParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseServiceFilter(params: RawParams): CaseStudyService | null {
  const raw = first(params.service);
  if (!raw) return null;
  return (VALID as readonly string[]).includes(raw) ? (raw as CaseStudyService) : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- case-studies-filter`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/case-studies-filter.ts src/lib/case-studies-filter.test.ts
git commit -m "feat: add /work service filter param parsing"
```

---

## Task 8: StatStrip component (test-first)

Reusable 3- or 4-number band used on `/` and `/about`.

**Files:**
- Create: `src/components/marketing/StatStrip.tsx`
- Test: `src/components/marketing/StatStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/marketing/StatStrip.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatStrip } from "./StatStrip";

describe("StatStrip", () => {
  it("renders every stat label and value", () => {
    render(
      <StatStrip
        stats={[
          { value: "3+", label: "Years operating" },
          { value: "20", label: "Projects shipped" },
          { value: "12", label: "UK sectors" },
        ]}
      />,
    );

    expect(screen.getByText("3+")).toBeInTheDocument();
    expect(screen.getByText("Years operating")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("Projects shipped")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("UK sectors")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- StatStrip`
Expected: FAIL.

- [ ] **Step 3: Create the component**

Create `src/components/marketing/StatStrip.tsx`:

```tsx
import { Container } from "@/components/layout/Container";

export interface Stat {
  value: string;
  label: string;
}

export function StatStrip({ stats }: { stats: Stat[] }) {
  const cols =
    stats.length === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-3";

  return (
    <section className="bg-surface py-12">
      <Container>
        <div className={`grid gap-4 ${cols}`}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-card border bg-surface p-6 text-center"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              <div
                className="text-4xl font-bold text-oxford"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- StatStrip`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/StatStrip.tsx src/components/marketing/StatStrip.test.tsx
git commit -m "feat: add StatStrip component"
```

---

## Task 9: CaseStudyCard component (test-first)

The big case study section shown on `/work`. Logo + outcome headline + story + baked-in testimonial.

**Files:**
- Create: `src/components/work/CaseStudyCard.tsx`
- Test: `src/components/work/CaseStudyCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/work/CaseStudyCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyCard } from "./CaseStudyCard";
import type { CaseStudy } from "@/types/case-study";

const cs: CaseStudy = {
  id: "1",
  slug: "north-bar",
  clientName: "North Bar",
  clientSector: "Hospitality",
  year: 2024,
  logoUrl: null,
  brandColour: null,
  outcomeHeadline: "Replaced two hours of weekly admin with a Sunday-night email.",
  storyProblem: "They needed a way to track bookings without a spreadsheet.",
  storySolution: "We built a custom booking dashboard with automated email drafts.",
  testimonialQuote: "It just works. No more chasing paperwork on a Monday morning.",
  testimonialAuthor: "Obi",
  testimonialRole: "Owner",
  techStack: ["Next.js", "Supabase", "Make.com"],
  isFeatured: true,
  sortOrder: 0,
  services: ["custom_software", "automation"],
};

describe("CaseStudyCard", () => {
  it("renders the client name, sector and year", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText("North Bar")).toBeInTheDocument();
    expect(screen.getByText(/Hospitality/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("renders the outcome headline", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(
      screen.getByText(/Replaced two hours of weekly admin/),
    ).toBeInTheDocument();
  });

  it("renders the testimonial quote and signed author", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText(/It just works/)).toBeInTheDocument();
    expect(screen.getByText(/Obi, Owner, North Bar/)).toBeInTheDocument();
  });

  it("renders both story paragraphs", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(
      screen.getByText(/track bookings without a spreadsheet/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/custom booking dashboard/),
    ).toBeInTheDocument();
  });

  it("renders tech stack tags", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Supabase")).toBeInTheDocument();
    expect(screen.getByText("Make.com")).toBeInTheDocument();
  });

  it("renders the service pillar tags", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText("Custom Software")).toBeInTheDocument();
    expect(screen.getByText("Automation")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- CaseStudyCard`
Expected: FAIL.

- [ ] **Step 3: Create the component**

Create `src/components/work/CaseStudyCard.tsx`:

```tsx
import Image from "next/image";
import type { CaseStudy } from "@/types/case-study";
import { CASE_STUDY_SERVICE_LABELS } from "@/types/case-study";

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const cs = caseStudy;
  const meta = [cs.clientName, cs.clientSector, cs.year]
    .filter(Boolean)
    .join(" · ");

  const cardStyle = cs.brandColour
    ? { backgroundColor: `color-mix(in srgb, ${cs.brandColour} 6%, white)` }
    : undefined;

  return (
    <article
      className="rounded-card border p-8 sm:p-10"
      style={{
        ...cardStyle,
        borderColor: "var(--color-hairline)",
      }}
    >
      {/* Header: logo + service pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {cs.logoUrl ? (
          <Image
            src={cs.logoUrl}
            alt={`${cs.clientName} logo`}
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
          />
        ) : (
          <div className="text-2xl font-bold text-ink">{cs.clientName}</div>
        )}
        <div className="flex flex-wrap gap-2">
          {cs.services.map((s) => (
            <span
              key={s}
              className="rounded-full bg-oxford/10 px-2.5 py-0.5 text-xs font-semibold text-oxford"
            >
              {CASE_STUDY_SERVICE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Outcome headline */}
      <h3 className="mt-6 text-2xl font-bold text-ink sm:text-3xl">
        {cs.outcomeHeadline}
      </h3>

      {/* Meta line */}
      <p className="mt-2 text-sm text-ink-muted">{meta}</p>

      {/* Story */}
      <div className="mt-6 space-y-3 text-ink-muted leading-relaxed">
        <p>{cs.storyProblem}</p>
        <p>{cs.storySolution}</p>
      </div>

      {/* Testimonial */}
      <blockquote
        className="mt-6 rounded-card border-l-4 bg-white p-5"
        style={{ borderLeftColor: "var(--color-accent)" }}
      >
        <p className="text-ink italic">&ldquo;{cs.testimonialQuote}&rdquo;</p>
        <footer className="mt-2 text-sm font-semibold text-ink">
          — {cs.testimonialAuthor}
          {cs.testimonialRole ? `, ${cs.testimonialRole}` : ""}, {cs.clientName}
        </footer>
      </blockquote>

      {/* Tech stack */}
      {cs.techStack.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Built with:
          </span>
          {cs.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border px-2.5 py-0.5 text-xs text-ink-muted"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- CaseStudyCard`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/work/CaseStudyCard.tsx src/components/work/CaseStudyCard.test.tsx
git commit -m "feat: add CaseStudyCard component"
```

---

## Task 10: CaseStudyFilter component (test-first)

Pill-row filter for `/work` — sets the `service` URL param.

**Files:**
- Create: `src/components/work/CaseStudyFilter.tsx`
- Test: `src/components/work/CaseStudyFilter.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/work/CaseStudyFilter.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyFilter } from "./CaseStudyFilter";

describe("CaseStudyFilter", () => {
  it("renders an 'All' pill and one pill per service", () => {
    render(<CaseStudyFilter active={null} />);
    expect(screen.getByRole("link", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Custom Software" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AI" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Automation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lead Gen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "E-commerce" })).toBeInTheDocument();
  });

  it("links 'All' to /work with no service param", () => {
    render(<CaseStudyFilter active={null} />);
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/work");
  });

  it("links each service pill to /work?service=<value>", () => {
    render(<CaseStudyFilter active={null} />);
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute(
      "href",
      "/work?service=ai",
    );
    expect(screen.getByRole("link", { name: "Custom Software" })).toHaveAttribute(
      "href",
      "/work?service=custom_software",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- CaseStudyFilter`
Expected: FAIL.

- [ ] **Step 3: Create the component**

Create `src/components/work/CaseStudyFilter.tsx`:

```tsx
import Link from "next/link";
import type { CaseStudyService } from "@/types/case-study";
import { CASE_STUDY_SERVICE_LABELS } from "@/types/case-study";

const SERVICES: CaseStudyService[] = [
  "custom_software",
  "ai",
  "automation",
  "lead_gen",
  "ecommerce",
];

export function CaseStudyFilter({ active }: { active: CaseStudyService | null }) {
  const base = "rounded-full px-3 py-1.5 text-sm transition-colors";
  const activeStyle = "bg-accent text-white";
  const inactiveStyle = "border border-hairline text-ink-muted hover:text-ink";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/work"
        className={`${base} ${active === null ? activeStyle : inactiveStyle}`}
      >
        All
      </Link>
      {SERVICES.map((service) => (
        <Link
          key={service}
          href={`/work?service=${service}`}
          className={`${base} ${active === service ? activeStyle : inactiveStyle}`}
        >
          {CASE_STUDY_SERVICE_LABELS[service]}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- CaseStudyFilter`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/work/CaseStudyFilter.tsx src/components/work/CaseStudyFilter.test.tsx
git commit -m "feat: add CaseStudyFilter component"
```

---

## Task 11: Build /work page

**Files:**
- Create: `src/app/(public)/work/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { CaseStudyCard } from "@/components/work/CaseStudyCard";
import { CaseStudyFilter } from "@/components/work/CaseStudyFilter";
import { getPublishedCaseStudies } from "@/lib/data/case-studies";
import { parseServiceFilter } from "@/lib/case-studies-filter";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected client projects from 8Caps — software, AI, and automation built for UK businesses.",
};

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const params = await searchParams;
  const service = parseServiceFilter(params);
  const caseStudies = await getPublishedCaseStudies(service ?? undefined);

  return (
    <>
      {/* Hero band */}
      <section className="hero-surface py-16 text-white">
        <Container>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Selected work
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
            Projects we&rsquo;ve shipped for UK businesses.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70">
            A few of the companies we&rsquo;ve built software, AI, and
            automation for. Different sectors, same outcome — work that runs.
          </p>
        </Container>
      </section>

      {/* Filter strip */}
      <section className="bg-surface-muted py-8">
        <Container>
          <CaseStudyFilter active={service} />
        </Container>
      </section>

      {/* Case study sections */}
      <section className="bg-surface-muted pb-16">
        <Container>
          {caseStudies.length === 0 ? (
            <p
              className="rounded-card border bg-surface p-8 text-center text-ink-muted"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              No case studies to show yet.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {caseStudies.map((cs) => (
                <CaseStudyCard key={cs.id} caseStudy={cs} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <CTASection />
    </>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: build succeeds. The `/work` page builds.

- [ ] **Step 3: Manual check**

Run: `npm run dev` (use `dangerouslyDisableSandbox: true` if needed)
Visit `http://localhost:3000/work`.

Expected: the page renders with the hero and empty state ("No case studies to show yet") — because RLS hides the seeded case studies whose `testimonial_approved_at` is null. This is the **correct** behaviour until each testimonial is approved. To temporarily verify the cards render, run in the Supabase SQL editor:

```sql
update case_studies set testimonial_approved_at = now()
  where slug = 'north-bar';
```

Refresh `/work` — North Bar should now appear. Then revert:

```sql
update case_studies set testimonial_approved_at = null
  where slug = 'north-bar';
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/work/page.tsx
git commit -m "feat: add /work page driven by case_studies"
```

---

## Task 12: ServicePillarSection component (test-first)

**Files:**
- Create: `src/components/services/ServicePillarSection.tsx`
- Test: `src/components/services/ServicePillarSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/services/ServicePillarSection.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Code } from "lucide-react";
import { ServicePillarSection } from "./ServicePillarSection";

describe("ServicePillarSection", () => {
  it("renders the pillar title, description, solves list, audience and CTA", () => {
    render(
      <ServicePillarSection
        anchorId="custom-software"
        icon={Code}
        title="Custom Software"
        description="We build the apps your business has outgrown spreadsheets for."
        solves={[
          "Spreadsheets that have outgrown themselves",
          "Tools that don't talk to each other",
        ]}
        audience="UK SMBs — typically £500k–£10m turnover."
        ctaHref="/contact"
        ctaLabel="Tell us about your project"
      />,
    );

    expect(screen.getByText("Custom Software")).toBeInTheDocument();
    expect(
      screen.getByText(/We build the apps your business has outgrown/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Spreadsheets that have outgrown themselves"),
    ).toBeInTheDocument();
    expect(screen.getByText(/UK SMBs/)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Tell us about your project" });
    expect(cta).toHaveAttribute("href", "/contact");
  });

  it("sets the anchor id so #links work", () => {
    const { container } = render(
      <ServicePillarSection
        anchorId="ai-solutions"
        icon={Code}
        title="AI"
        description="x"
        solves={[]}
        audience="x"
        ctaHref="/contact"
        ctaLabel="x"
      />,
    );
    expect(container.querySelector("#ai-solutions")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ServicePillarSection`
Expected: FAIL.

- [ ] **Step 3: Create the component**

Create `src/components/services/ServicePillarSection.tsx`:

```tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";

export interface ServicePillarSectionProps {
  anchorId: string;
  icon: LucideIcon;
  title: string;
  description: string;
  solves: string[];
  audience: string;
  ctaHref: string;
  ctaLabel: string;
}

export function ServicePillarSection({
  anchorId,
  icon: Icon,
  title,
  description,
  solves,
  audience,
  ctaHref,
  ctaLabel,
}: ServicePillarSectionProps) {
  return (
    <section id={anchorId} className="bg-surface py-16">
      <Container className="max-w-3xl">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--color-oxford)" }}
          >
            <Icon size={20} strokeWidth={1.75} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-ink">{title}</h2>
        </div>

        <p className="mt-4 text-ink-muted leading-relaxed">{description}</p>

        {solves.length > 0 && (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-ink-muted">
              What it solves
            </h3>
            <ul className="mt-3 space-y-2">
              {solves.map((item) => (
                <li key={item} className="flex gap-3 text-ink-muted">
                  <span
                    className="mt-2 h-1 w-3 shrink-0 rounded-full"
                    style={{ background: "var(--color-accent)" }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Who it&rsquo;s for
        </h3>
        <p className="mt-2 text-ink-muted">{audience}</p>

        <div className="mt-8">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ServicePillarSection`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/services/ServicePillarSection.tsx src/components/services/ServicePillarSection.test.tsx
git commit -m "feat: add ServicePillarSection component"
```

---

## Task 13: Build /services page

**Files:**
- Create: `src/app/(public)/services/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { Code, Sparkles, Workflow } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { ServicePillarSection } from "@/components/services/ServicePillarSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Custom software, AI solutions, and automation built for UK SMBs by 8Caps.",
};

export default function ServicesPage() {
  return (
    <>
      {/* Hero band */}
      <section className="hero-surface py-16 text-white">
        <Container>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            What we do
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
            Three ways we help UK businesses grow.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70">
            Whether you need a custom app, an AI that does the thinking, or
            workflows that run themselves — we design, build, and ship it.
          </p>
        </Container>
      </section>

      <ServicePillarSection
        anchorId="custom-software"
        icon={Code}
        title="Custom Software"
        description="We build the apps your business has outgrown spreadsheets for — internal tools, customer portals, dashboards, and operational software that fits how you actually work."
        solves={[
          "Spreadsheets that have outgrown themselves",
          "Tools that don't talk to each other",
          "A process that only one person knows how to run",
          "Off-the-shelf software that almost fits but never quite",
        ]}
        audience="UK SMBs — typically £500k–£10m turnover, 5–50 people."
        ctaHref="/contact"
        ctaLabel="Tell us about your project"
      />

      <ServicePillarSection
        anchorId="ai-solutions"
        icon={Sparkles}
        title="AI Solutions"
        description="We build AI that actually earns its keep — reading documents, drafting replies, qualifying leads, talking to customers. Built on the Claude API for reliability."
        solves={[
          "Manual research at scale",
          "Reading and summarising long documents",
          "Qualifying leads before a human touches them",
          "Customer support that doesn't sleep",
        ]}
        audience="UK SMBs with a repetitive thinking task they'd love to hand off."
        ctaHref="/contact"
        ctaLabel="See if AI fits your workflow"
      />

      <ServicePillarSection
        anchorId="automation"
        icon={Workflow}
        title="Automation"
        description="We connect the tools you already use so they pass data, fire notifications, and run sequences without anyone touching them. Built on Make.com, n8n, Zapier, or custom orchestration where it matters."
        solves={[
          "Repetitive admin that eats your week",
          "Data flowing between tools",
          "Manual notifications, reports, follow-ups",
          "Onboarding and offboarding sequences",
        ]}
        audience="Any UK business with a job that goes 'and then someone copies it into…'."
        ctaHref="/contact"
        ctaLabel="Tell us what's eating your time"
      />

      <CTASection />
    </>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 3: Manual check**

Run dev server, visit `/services`. Confirm the hero, three pillar sections, and `#custom-software`, `#ai-solutions`, `#automation` anchor links all work.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/services/page.tsx
git commit -m "feat: add /services page with three pillars"
```

---

## Task 14: DisciplineCard component (test-first)

**Files:**
- Create: `src/components/about/DisciplineCard.tsx`
- Test: `src/components/about/DisciplineCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/about/DisciplineCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Code } from "lucide-react";
import { DisciplineCard } from "./DisciplineCard";

describe("DisciplineCard", () => {
  it("renders the title and description", () => {
    render(
      <DisciplineCard
        icon={Code}
        title="Software engineering"
        description="TypeScript, Next.js, React, Supabase, Postgres."
      />,
    );
    expect(screen.getByText("Software engineering")).toBeInTheDocument();
    expect(
      screen.getByText(/TypeScript, Next.js, React, Supabase, Postgres./),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- DisciplineCard`
Expected: FAIL.

- [ ] **Step 3: Create the component**

Create `src/components/about/DisciplineCard.tsx`:

```tsx
import type { LucideIcon } from "lucide-react";

export function DisciplineCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-card border bg-surface p-6"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: "var(--color-oxford)" }}
      >
        <Icon size={18} strokeWidth={1.75} className="text-white" />
      </div>
      <h3
        className="font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink-muted leading-relaxed">{description}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- DisciplineCard`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/about/DisciplineCard.tsx src/components/about/DisciplineCard.test.tsx
git commit -m "feat: add DisciplineCard component"
```

---

## Task 15: Rework /about page

Replace the contents of `src/app/(public)/about/page.tsx`. Drops the directory-flavoured stats and "approach" copy; replaces with disciplines + new stats + how-we-work.

**Files:**
- Modify: `src/app/(public)/about/page.tsx`

- [ ] **Step 1: Replace the page contents**

Replace `src/app/(public)/about/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { Code, Sparkles, Workflow, Paintbrush } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";
import { StatStrip } from "@/components/marketing/StatStrip";
import { DisciplineCard } from "@/components/about/DisciplineCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "8Caps is a UK studio building software, AI, and automation for SMBs. Established 2022.",
};

const DISCIPLINES = [
  {
    icon: Code,
    title: "Software engineering",
    description:
      "TypeScript, Next.js, React, Supabase, Postgres — modern, fast, maintainable.",
  },
  {
    icon: Sparkles,
    title: "AI engineering",
    description:
      "Claude API, prompt engineering, retrieval, AI voice agents, document AI.",
  },
  {
    icon: Workflow,
    title: "Automation engineering",
    description:
      "Make.com, n8n, Zapier, custom orchestration — workflows that don't break.",
  },
  {
    icon: Paintbrush,
    title: "Design & product",
    description:
      "Interface design, UX, brand — we don't ship ugly.",
  },
];

const HOW_WE_WORK = [
  {
    title: "Talk",
    body: "We listen first, write a one-page brief, agree the shape and the price.",
  },
  {
    title: "Build",
    body: "Short iterations, you see progress every week, you steer along the way.",
  },
  {
    title: "Operate",
    body: "When it ships, we don't disappear. We run it, monitor it, keep it healthy.",
  },
];

export default function AboutPage() {
  // NOTE: these are placeholder numbers — replace with real counts once James
  // confirms (see docs/pre-meeting-notes.md).
  const stats = [
    { value: "Since 2022", label: "Building software & AI" },
    { value: "20+", label: "Projects shipped" },
    { value: "12+", label: "UK sectors served" },
    { value: "6+", label: "Products operating" },
  ];

  return (
    <>
      {/* Dark intro band */}
      <section className="band-surface py-16 text-white">
        <Container className="max-w-3xl">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            About 8Caps
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            A UK studio building software, AI, and automation for SMBs.
          </h1>
          <p className="mt-5 text-white/70 leading-relaxed">
            Founded in 2022, 8Caps is a small, focused team that designs,
            ships, and operates the kind of practical tools UK businesses
            actually use every day.
          </p>
        </Container>
      </section>

      <StatStrip stats={stats} />

      {/* What we do */}
      <section className="bg-surface-muted py-16">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink">What we do</h2>
          <div className="mt-6 space-y-5 text-ink-muted leading-relaxed">
            <p>
              <strong className="text-ink">What we build.</strong> The
              unglamorous stuff that runs your business: the internal app, the
              AI that drafts your emails, the automation that means no one has
              to re-key a customer detail again.
            </p>
            <p>
              <strong className="text-ink">Who we build it for.</strong> UK
              SMBs, typically £500k–£10m turnover, 5–50 people, in sectors from
              hospitality to publishing to e-commerce.
            </p>
            <p>
              <strong className="text-ink">Why this approach works.</strong> We
              don&rsquo;t just build software — we operate it. Every product on
              our <a href="/products" className="underline">products page</a>{" "}
              is a real, running, paying business. We know what &ldquo;shipped&rdquo;
              means because we live it.
            </p>
          </div>
        </Container>
      </section>

      {/* Disciplines */}
      <section className="bg-surface py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink">Our disciplines</h2>
          <p className="mt-2 text-ink-muted">
            Four capabilities, end-to-end — under one roof.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DISCIPLINES.map((d) => (
              <DisciplineCard key={d.title} {...d} />
            ))}
          </div>
        </Container>
      </section>

      {/* How we work */}
      <section className="bg-surface-muted py-16">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink">How we work</h2>
          <div className="mt-8 space-y-7">
            {HOW_WE_WORK.map((step) => (
              <div key={step.title} className="flex gap-4">
                <div
                  className="mt-1.5 h-0.5 w-7 shrink-0 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
                <div>
                  <h3 className="font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                    {step.body}
                  </p>
                </div>
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

- [ ] **Step 2: Build to verify imports**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 3: Manual check**

Visit `/about`. Confirm new content renders with stats, disciplines (4 cards), how-we-work, and CTA.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/about/page.tsx
git commit -m "feat: rework /about with disciplines and updated stats"
```

---

## Task 16: /sites → /products route move + redirects

**Files:**
- Move: `src/app/(public)/sites/` → `src/app/(public)/products/`
- Modify: `next.config.ts`
- Modify: `src/app/(public)/products/page.tsx` (renamed hero copy comes in Task 17)
- Modify: any internal links in code that point at `/sites` or `/sites/[slug]`

- [ ] **Step 1: Move the route folder**

Move `src/app/(public)/sites/` to `src/app/(public)/products/`. The route folder contains `page.tsx` (directory listing) and `[slug]/page.tsx` (profile). All file contents stay the same in this task — copy changes are Task 17. Bash:

```bash
git mv "src/app/(public)/sites" "src/app/(public)/products"
```

- [ ] **Step 2: Update internal Next.js links inside the moved pages**

In `src/app/(public)/products/page.tsx` and `src/app/(public)/products/[slug]/page.tsx`, find every `/sites/` reference (e.g. `/sites?category=...`, `/sites/${site.slug}`) and rewrite it to `/products/`. Use Grep:

```bash
# Quick way to find references inside the moved folder
```

Run `grep -rn "/sites" "src/app/(public)/products/"` and fix each match.

- [ ] **Step 3: Find every other reference to `/sites` in the codebase**

Run a project-wide grep for `"/sites"` and `'/sites'` (literal strings in TSX/TS).

Update the matches:
- `src/components/layout/Footer.tsx`: change `href="/sites"` to `href="/products"`
- `src/components/layout/Header.tsx`: change the `Directory` nav entry to `Products` with `/products` (Header rework is fully done in Task 19, this step just protects against build errors right now)
- `src/components/site/CategoryFilter.tsx`: every URL it builds with `/sites?...` becomes `/products?...`
- `src/app/sitemap.ts`: change `/sites/${slug}` to `/products/${slug}` and the directory URL similarly
- Any other files using `/sites` literally — update them all

Also rename the directory at `src/components/site/` if you want consistency with `/products` — **but don't rename in this task**. Renaming components touches many files; we'd rather have the routes working first. The folder name `site/` (lowercase) is independent of the URL `/products` and can stay.

- [ ] **Step 4: Add redirects in `next.config.ts`**

Replace `next.config.ts` with:

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
  async redirects() {
    return [
      { source: "/sites", destination: "/products", permanent: true },
      { source: "/sites/:slug", destination: "/products/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 5: Build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success. Build output shows both `/products` and `/products/[slug]` routes; no `/sites` routes.

- [ ] **Step 6: Manual check**

Run dev server. Visit:
- `http://localhost:3000/products` — should render the existing directory page (with old copy, that's fine for this task)
- `http://localhost:3000/products/automated-panda` — should render the existing site profile page
- `http://localhost:3000/sites` → should redirect to `/products`
- `http://localhost:3000/sites/automated-panda` → should redirect to `/products/automated-panda`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: move /sites routes to /products with permanent redirects"
```

---

## Task 17: Rework /products page copy

Just the hero copy changes — the existing directory machinery (filter, search, pagination, `SiteCard`) stays.

**Files:**
- Modify: `src/app/(public)/products/page.tsx`

- [ ] **Step 1: Read the current page**

Read `src/app/(public)/products/page.tsx` so you know exactly what it renders today. Locate the hero band and any "About this directory" copy.

- [ ] **Step 2: Replace the hero band copy**

Locate the hero `<section>` near the top of the page (eyebrow, H1, subhead). Replace its contents:

```tsx
<p
  className="text-xs font-semibold uppercase tracking-widest"
  style={{
    color: "var(--color-accent-soft)",
    fontFamily: "var(--font-heading)",
  }}
>
  Our own products
</p>
<h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
  We don&rsquo;t just build software — we operate it.
</h1>
<p className="mt-5 max-w-2xl text-white/70">
  Every project we ship for a client, we&rsquo;ve already lived ourselves.
  These are the products 8Caps owns and runs in production — practical tools
  solving real business problems.
</p>
```

If the existing page uses a different copy structure (e.g. metadata title, intro band below the hero), update those copy strings to match — keep all other markup, styling, and component composition intact.

- [ ] **Step 3: Update the page's `metadata`**

```tsx
export const metadata: Metadata = {
  title: "Our products",
  description:
    "The products 8Caps owns and operates — proof that we don't just build software, we run it.",
};
```

- [ ] **Step 4: Add the trust lead-in band below the hero**

After the hero `<section>` and before the filter/search/grid section, insert:

```tsx
<section className="bg-surface py-6">
  <Container>
    <p className="max-w-3xl text-ink-muted">
      What this means for your project — we know exactly what &ldquo;shipped
      and running&rdquo; looks like, because we&rsquo;re doing it every day.
    </p>
  </Container>
</section>
```

- [ ] **Step 5: Build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 6: Manual check**

Visit `/products`. Confirm new hero copy, trust lead-in band, and existing filter/grid all render.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(public\)/products/page.tsx
git commit -m "feat: reframe /products copy as 'proof we ship'"
```

---

## Task 18: Update Header navigation

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Replace Header**

Replace `src/components/layout/Header.tsx` with:

```tsx
import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-white/10 bg-oxford">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo variant="lockup" className="h-7 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/75 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Contact
          </Link>
        </nav>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Update the header's test if one exists**

If `src/components/layout/Header.test.tsx` exists, it likely asserts the old nav. Read it, then update the assertions to match the new nav (Services / Work / Products / About / Contact button).

- [ ] **Step 3: Run tests**

Run: `npm test -- Header`
Expected: PASS (after updating the test if needed).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Header.test.tsx
git commit -m "feat: update header nav to Services/Work/Products/About"
```

---

## Task 19: Rework homepage

Drops the directory-grid / categories-grid bands; replaces with agency hero, stats, services preview, featured work, featured products, closing CTA.

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Replace the page**

Replace `src/app/(public)/page.tsx` with:

```tsx
import Link from "next/link";
import { ArrowRight, Code, Sparkles, Workflow } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { StatStrip } from "@/components/marketing/StatStrip";
import { CaseStudyCard } from "@/components/work/CaseStudyCard";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { getFeaturedSites } from "@/lib/data/sites";
import { getFeaturedCaseStudies } from "@/lib/data/case-studies";

export const revalidate = 3600;

const SERVICES = [
  {
    icon: Code,
    title: "Custom Software",
    description: "Apps, dashboards, and internal tools your business has outgrown spreadsheets for.",
    href: "/services#custom-software",
  },
  {
    icon: Sparkles,
    title: "AI Solutions",
    description: "Document AI, voice agents, and assistants that handle the repetitive thinking.",
    href: "/services#ai-solutions",
  },
  {
    icon: Workflow,
    title: "Automation",
    description: "Workflows that connect your tools, fire your notifications, and don't break.",
    href: "/services#automation",
  },
];

export default async function HomePage() {
  const [featuredCaseStudies, featuredProducts] = await Promise.all([
    getFeaturedCaseStudies(3),
    getFeaturedSites(3),
  ]);

  // NOTE: stat values are placeholders — replace once real numbers land
  // (see docs/pre-meeting-notes.md).
  const stats = [
    { value: "Since 2022", label: "Building software & AI" },
    { value: "20+", label: "Projects shipped" },
    { value: "6+", label: "Products in portfolio" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero-surface py-20 text-white">
        <Container>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            UK Software &amp; AI Studio
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            We build the software, AI, and automations UK businesses need to
            grow.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70 text-base">
            Established 2022. Trusted by SMBs across the UK. We design, build,
            and ship the tools that make small businesses run faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/work">See our work</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Start a project
            </ButtonLink>
          </div>
        </Container>
      </section>

      <StatStrip stats={stats} />

      {/* Services preview */}
      <section className="bg-surface-muted py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink">What we do</h2>
          <p className="mt-1 text-ink-muted">
            Three pillars — pick the one that fits the problem.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.title}
                  href={s.href}
                  className="rounded-card border bg-surface p-5 hover:shadow-md transition-shadow"
                  style={{ borderColor: "var(--color-hairline)" }}
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: "var(--color-oxford)" }}
                  >
                    <Icon size={18} strokeWidth={1.75} className="text-white" />
                  </div>
                  <h3
                    className="font-semibold text-ink"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{s.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    Learn more <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Featured work */}
      <section className="bg-surface py-16">
        <Container>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">Featured work</h2>
              <p className="mt-1 text-ink-muted">
                A few of the companies we&rsquo;ve shipped for.
              </p>
            </div>
            <Link
              href="/work"
              className="hidden text-sm font-semibold text-accent hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              See all work <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-6">
            {featuredCaseStudies.length === 0 ? (
              <p
                className="rounded-card border bg-surface p-6 text-center text-ink-muted"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                Case studies coming soon — testimonials currently being approved by clients.
              </p>
            ) : (
              featuredCaseStudies.map((cs) => (
                <CaseStudyCard key={cs.id} caseStudy={cs} />
              ))
            )}
          </div>
        </Container>
      </section>

      {/* Featured products */}
      <section className="bg-surface-muted py-16">
        <Container>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">Our own products</h2>
              <p className="mt-1 text-ink-muted">
                We don&rsquo;t just build software — we run it.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-semibold text-accent hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              See all products <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-8">
            <DirectoryGrid sites={featuredProducts} />
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
```

- [ ] **Step 2: Build to verify imports**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 3: Manual check**

Visit `/`. Confirm the new hero, stats, services preview, featured work (likely empty state, that's expected), featured products, CTA all render.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/page.tsx
git commit -m "feat: rework homepage with agency hero, services preview and featured work"
```

---

## Task 20: Install Resend and add env vars

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1: Install resend**

Run: `npm install resend` (use `dangerouslyDisableSandbox: true` — npm requires it in this env)
Expected: `resend` appears in `package.json` dependencies.

- [ ] **Step 2: Add env vars to `.env.example`**

Append to `.env.example`:

```
RESEND_API_KEY=
CONTACT_FROM_EMAIL=noreply@8caps.co.uk
CONTACT_TO_EMAIL=master@8caps.co.uk
```

- [ ] **Step 3: Add the same keys to `.env.local`**

Append to `.env.local`:

```
RESEND_API_KEY=<paste from Resend dashboard, see docs/pre-meeting-notes.md>
CONTACT_FROM_EMAIL=noreply@8caps.co.uk
CONTACT_TO_EMAIL=master@8caps.co.uk
```

`RESEND_API_KEY` will be blank until the Resend account is set up. The server action handles a missing key gracefully (Task 23).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install resend and add contact email env vars"
```

(Don't commit `.env.local` — it's gitignored.)

---

## Task 21: Contact form Zod schema (test-first)

**Files:**
- Create: `src/lib/contact-form.ts`
- Test: `src/lib/contact-form.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/contact-form.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { contactFormSchema } from "./contact-form";

describe("contactFormSchema", () => {
  const valid = {
    name: "Test User",
    email: "test@example.com",
    company: "",
    projectType: "custom_software" as const,
    heardAbout: "",
    message: "Hi I have a project I want to talk about.",
    website: "", // honeypot
  };

  it("accepts a valid submission", () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, name: "" }).success,
    ).toBe(false);
  });

  it("rejects a too-short message", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, message: "Too short" }).success,
    ).toBe(false);
  });

  it("rejects an invalid projectType", () => {
    const bad = { ...valid, projectType: "banana" as unknown as "custom_software" };
    expect(contactFormSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects when honeypot is filled (bot)", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, website: "https://spam.example" })
        .success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- contact-form`
Expected: FAIL.

- [ ] **Step 3: Create the schema**

Create `src/lib/contact-form.ts`:

```ts
import { z } from "zod";

export const PROJECT_TYPES = ["custom_software", "ai", "automation", "not_sure"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  custom_software: "Custom Software",
  ai: "AI Solutions",
  automation: "Automation",
  not_sure: "Not sure yet",
};

/**
 * Contact form schema. `website` is a honeypot — a real visitor will never
 * see it; bots fill every visible-looking field, so a non-empty value means
 * "treat this submission as spam".
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  company: z.string().trim().max(200).optional().default(""),
  projectType: z.enum(PROJECT_TYPES),
  heardAbout: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(20, "Tell us a bit more — at least 20 characters").max(5000),
  website: z.string().max(0, "Spam check failed").optional().default(""),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- contact-form`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contact-form.ts src/lib/contact-form.test.ts
git commit -m "feat: add contact form Zod schema with honeypot"
```

---

## Task 22: Resend client setup

**Files:**
- Create: `src/lib/resend.ts`

- [ ] **Step 1: Create the client wrapper**

Create `src/lib/resend.ts`:

```ts
import { Resend } from "resend";

/**
 * Returns a Resend client, or null if no API key is configured. The contact
 * form's server action handles the null path by still saving the enquiry to
 * the database and surfacing a soft warning in the server log — so the form
 * keeps working before Resend DNS is fully set up.
 */
export function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getContactFromEmail(): string {
  return process.env.CONTACT_FROM_EMAIL ?? "noreply@8caps.co.uk";
}

export function getContactToEmail(): string {
  return process.env.CONTACT_TO_EMAIL ?? "master@8caps.co.uk";
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat: add resend client wrapper"
```

---

## Task 23: Contact form server action

**Files:**
- Create: `src/app/(public)/contact/actions.ts`

- [ ] **Step 1: Create the server action**

Create `src/app/(public)/contact/actions.ts`:

```ts
"use server";

import { contactFormSchema } from "@/lib/contact-form";
import { createPublicClient } from "@/lib/supabase/public";
import {
  createResendClient,
  getContactFromEmail,
  getContactToEmail,
} from "@/lib/resend";
import type { ActionResult } from "@/types/domain";

// The `enquiries` table's RLS allows public inserts via the anon key
// (Plan 1, migration `<ts>_rls.sql`), so the existing `createPublicClient()`
// works for the contact form insert too.

export async function submitContactForm(
  raw: FormData,
): Promise<ActionResult> {
  // 1. Validate.
  const parsed = contactFormSchema.safeParse({
    name: raw.get("name"),
    email: raw.get("email"),
    company: raw.get("company"),
    projectType: raw.get("projectType"),
    heardAbout: raw.get("heardAbout"),
    message: raw.get("message"),
    website: raw.get("website"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please check the form and try again.",
    };
  }

  const { name, email, company, projectType, heardAbout, message } = parsed.data;

  // 2. Save the enquiry.
  const supabase = createPublicClient();
  const { error: dbError } = await supabase.from("enquiries").insert({
    name,
    email,
    message,
    company: company || null,
    project_type: projectType,
    heard_about: heardAbout || null,
  });

  if (dbError) {
    console.error("[contact] DB insert failed:", dbError);
    return {
      ok: false,
      error:
        "Sorry — we couldn't save your message. Please email master@8caps.co.uk directly.",
    };
  }

  // 3. Send email notification (best-effort — DB insert is the source of truth).
  const resend = createResendClient();
  if (resend) {
    try {
      await resend.emails.send({
        from: `8Caps Website <${getContactFromEmail()}>`,
        to: getContactToEmail(),
        replyTo: email,
        subject: `New enquiry from ${name}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Company: ${company || "—"}`,
          `Project type: ${projectType}`,
          `Heard about us: ${heardAbout || "—"}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      });
    } catch (e) {
      console.error("[contact] Resend send failed:", e);
      // Don't fail the action — the enquiry is already saved.
    }
  } else {
    console.warn("[contact] RESEND_API_KEY not set; skipped email notification.");
  }

  return { ok: true };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/contact/actions.ts
git commit -m "feat: add contact form server action (Supabase + Resend)"
```

---

## Task 24: ContactForm component (test-first)

**Files:**
- Create: `src/components/contact/ContactForm.tsx`
- Test: `src/components/contact/ContactForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/contact/ContactForm.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("renders every form field", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Your name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByLabelText(/What kind of project/)).toBeInTheDocument();
    expect(screen.getByLabelText(/How did you hear/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tell us about your project/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send enquiry/i })).toBeInTheDocument();
  });

  it("renders all project type options", () => {
    render(<ContactForm />);
    expect(screen.getByRole("option", { name: "Custom Software" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "AI Solutions" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Automation" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Not sure yet" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ContactForm`
Expected: FAIL.

- [ ] **Step 3: Create the component**

Create `src/components/contact/ContactForm.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { submitContactForm } from "@/app/(public)/contact/actions";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/lib/contact-form";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus({ kind: "submitting" });
    startTransition(async () => {
      const result = await submitContactForm(formData);
      if (result.ok) {
        setStatus({ kind: "success" });
      } else {
        setStatus({
          kind: "error",
          message: result.error ?? "Something went wrong. Please try again.",
        });
      }
    });
  }

  if (status.kind === "success") {
    return (
      <div
        className="rounded-card border bg-surface p-8 text-center"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <h2 className="text-2xl font-bold text-ink">Thanks — message received.</h2>
        <p className="mt-2 text-ink-muted">
          We&rsquo;ll be in touch within one working day.
        </p>
        <a href="/" className="mt-6 inline-block text-sm font-semibold text-accent">
          ← Back to the homepage
        </a>
      </div>
    );
  }

  const isBusy = status.kind === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Your name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Company" name="company" />

      <div>
        <label htmlFor="projectType" className="block text-sm font-semibold text-ink">
          What kind of project? <span className="text-accent">*</span>
        </label>
        <select
          id="projectType"
          name="projectType"
          required
          defaultValue="not_sure"
          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-ink"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          {PROJECT_TYPES.map((p) => (
            <option key={p} value={p}>
              {PROJECT_TYPE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <Field label="How did you hear about us?" name="heardAbout" />

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-ink">
          Tell us about your project <span className="text-accent">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={20}
          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-ink"
          style={{ borderColor: "var(--color-hairline)" }}
        />
      </div>

      {/* Honeypot — invisible to humans, bots will fill it. */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status.kind === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isBusy}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isBusy ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-ink"
        style={{ borderColor: "var(--color-hairline)" }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ContactForm`
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/contact/ContactForm.tsx src/components/contact/ContactForm.test.tsx
git commit -m "feat: add ContactForm with server action and honeypot"
```

---

## Task 25: ContactWhatToExpect panel

**Files:**
- Create: `src/components/contact/ContactWhatToExpect.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Clock, MessageSquare, Shield, Mail } from "lucide-react";

const ITEMS = [
  { icon: Clock, text: "We reply within one working day." },
  { icon: MessageSquare, text: "First call is a no-cost conversation." },
  { icon: Shield, text: "Everything you share is confidential." },
];

export function ContactWhatToExpect() {
  return (
    <aside
      className="rounded-card border bg-surface p-6"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <h2
        className="text-lg font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        What happens next
      </h2>
      <ul className="mt-4 space-y-3">
        {ITEMS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-ink-muted">
            <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{text}</span>
          </li>
        ))}
        <li className="flex items-start gap-3 text-sm text-ink-muted">
          <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Or email us directly:{" "}
            <a className="font-semibold text-ink underline" href="mailto:master@8caps.co.uk">
              master@8caps.co.uk
            </a>
          </span>
        </li>
      </ul>
    </aside>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/contact/ContactWhatToExpect.tsx
git commit -m "feat: add ContactWhatToExpect panel"
```

---

## Task 26: Upgrade /contact page

Replace the static page with the new layout: hero + (form / what-to-expect) two-column + compliance closing band.

**Files:**
- Modify: `src/app/(public)/contact/page.tsx`

- [ ] **Step 1: Replace the page**

Replace `src/app/(public)/contact/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactWhatToExpect } from "@/components/contact/ContactWhatToExpect";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell 8Caps about your software, AI, or automation project. We reply within one working day.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-surface py-14 text-white">
        <Container className="max-w-3xl">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Get in touch
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Tell us what you&rsquo;re trying to solve.
          </h1>
          <p className="mt-4 text-white/70">
            Drop us a line and we&rsquo;ll come back within one working day. No
            sales pressure — just a real conversation about whether we can help.
          </p>
        </Container>
      </section>

      {/* Form + reassurance */}
      <section className="bg-surface-muted py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
            <div className="lg:col-span-1">
              <ContactWhatToExpect />
            </div>
          </div>
        </Container>
      </section>

      {/* Compliance band */}
      <section className="bg-surface py-10">
        <Container>
          <p className="text-xs text-ink-muted leading-relaxed">
            {/* PLACEHOLDERS — replace once the real details land (see docs/pre-meeting-notes.md). */}
            <strong className="text-ink">8Caps</strong> &middot; Registered in
            England &amp; Wales · Company No. <em>00000000</em> · ICO
            registration <em>ZA000000</em> · Registered office: <em>Address
            placeholder</em>.
          </p>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 3: Manual check**

Visit `/contact`. Submit a test enquiry (anything that passes validation). Confirm:
- Success state appears
- A new row lands in the `enquiries` table (check via Supabase dashboard)
- If `RESEND_API_KEY` is set + domain verified, an email lands in `master@8caps.co.uk`. If not, the server log shows the "skipped email notification" warning and the DB row still saved correctly.

Also confirm the failing path: submit a message of < 20 chars → inline error appears, form keeps the values you typed.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/contact/page.tsx
git commit -m "feat: upgrade /contact to a working form with compliance band"
```

---

## Task 27: Add /privacy stub page

The contact form goes live in Task 26 — a Privacy Policy must exist as a routable page before the form can be public-facing under UK GDPR. This task adds a stub. The real policy copy lands once it's drafted (tracked in `pre-meeting-notes.md`).

**Files:**
- Create: `src/app/(public)/privacy/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Privacy",
  description: "8Caps privacy notice — how we handle the data you give us.",
};

export default function PrivacyPage() {
  return (
    <section className="bg-surface py-14">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink">Privacy notice</h1>
        <p className="mt-4 text-ink-muted">
          {/* PLACEHOLDER — replace with the real privacy policy once drafted.
              Tracked in docs/pre-meeting-notes.md. */}
          We respect your privacy. This is a placeholder notice until the full
          privacy policy is published. The contact form on this site collects
          your name, email address, company name, project information, and
          message text — we use this only to reply to your enquiry and to
          maintain a record of communications. We do not share this data with
          third parties.
        </p>
        <p className="mt-4 text-ink-muted">
          To request a copy of, correction to, or deletion of any data we hold
          about you, email{" "}
          <a className="underline" href="mailto:master@8caps.co.uk">
            master@8caps.co.uk
          </a>
          .
        </p>
        <p className="mt-4 text-xs text-ink-muted">
          Last updated: pending — full policy in progress.
        </p>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/privacy/page.tsx
git commit -m "feat: add /privacy stub page"
```

---

## Task 28: Footer compliance info

Add a small compliance/legal row under the existing footer content.

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Read the current footer**

Read `src/components/layout/Footer.tsx`. The existing layout is logo + copyright on the left, three nav links on the right.

- [ ] **Step 2: Replace the footer**

Replace `src/components/layout/Footer.tsx` with:

```tsx
import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="bg-oxford-deep py-10 text-sm text-white/60">
      <Container className="flex flex-col gap-6">
        {/* Top row: logo + copyright on the left, primary nav on the right */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo variant="mark" className="h-6 w-auto" />
            <p>© {new Date().getFullYear()} 8Caps. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <Link href="/work" className="hover:text-white transition-colors">
              Work
            </Link>
            <Link href="/products" className="hover:text-white transition-colors">
              Products
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Compliance row */}
        <div className="border-t border-white/10 pt-4 text-xs">
          {/* PLACEHOLDERS — replace once the real details land. */}
          <p>
            Registered in England &amp; Wales · Company No. <em>00000000</em> ·
            ICO registration <em>ZA000000</em> · Registered office:{" "}
            <em>Address placeholder</em>.
          </p>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: add full nav and compliance row to footer"
```

---

## Task 29: Update sitemap.ts

Old sitemap probably emits `/sites` and `/sites/[slug]`. Replace with the new routes so search engines pick up the rename.

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Read the current sitemap**

Read `src/app/sitemap.ts` to confirm the current shape (likely an async default export returning an array of `MetadataRoute.Sitemap` entries with `/sites/*` URLs).

- [ ] **Step 2: Replace the sitemap**

Replace `src/app/sitemap.ts` with:

```ts
import type { MetadataRoute } from "next";
import { getAllSiteSlugs } from "@/lib/data/sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productSlugs = await getAllSiteSlugs();

  const now = new Date();

  const staticPaths: string[] = [
    "/",
    "/services",
    "/work",
    "/products",
    "/about",
    "/contact",
    "/privacy",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }));

  const productEntries: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: now,
  }));

  return [...staticEntries, ...productEntries];
}
```

- [ ] **Step 3: Build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success.

- [ ] **Step 4: Manual check**

Visit `http://localhost:3000/sitemap.xml`. Confirm it lists `/`, `/services`, `/work`, `/products`, `/about`, `/contact`, `/privacy`, plus one entry per product slug. No `/sites` entries.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: update sitemap with new routes (services/work/products/privacy)"
```

---

## Task 30: Seed cleanup — retire placeholder products

The Plan 1 seed inserted placeholder products (`LeadHarbour`, `PropToolkit`, `Stealth Project`) that aren't real 8Caps products. They appear publicly on `/products`. Archive them so they're hidden but recoverable.

**Files:** no file changes. SQL run in the Supabase dashboard.

- [ ] **Step 1: Decide which seeded sites are real**

Check the seeded sites table for placeholders that aren't real 8Caps products. By default, `LeadHarbour`, `PropToolkit`, and `Stealth Project` are placeholders. `Automated Panda` is a real 8Caps product.

If James has added more sites since Plan 1, list them via the Supabase dashboard SQL editor:

```sql
select slug, name, publish_status, visibility
from sites
order by created_at;
```

- [ ] **Step 2: Archive the placeholders**

In the Supabase SQL editor, archive the placeholders (don't delete — preserves history):

```sql
update sites
   set publish_status = 'archived'
 where slug in ('leadharbour', 'proptoolkit', 'stealth-project');
```

Expected: 3 rows affected. RLS now hides them from `/products` (which only shows `published`).

- [ ] **Step 3: Verify `/products` is clean**

Visit `/products` in the browser. The placeholders should no longer appear. Only `Automated Panda` (and any other real products James has added) should remain.

- [ ] **Step 4: Note this in `pre-meeting-notes.md`**

Add a checkbox to `docs/pre-meeting-notes.md` (under a new "Products" section near the bottom):

```markdown
### Products on /products

- [x] Placeholder seed sites archived (LeadHarbour, PropToolkit, Stealth Project)
- [ ] Add any other real 8Caps products beyond Automated Panda via the admin dashboard
```

- [ ] **Step 5: Commit**

```bash
git add docs/pre-meeting-notes.md
git commit -m "docs: note placeholder product archival in pre-meeting checklist"
```

---

## Verification — end-to-end smoke

After Task 30 is committed:

- [ ] **Run the full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Run typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Run the production build**

Run: `npm run build` (use `dangerouslyDisableSandbox: true`)
Expected: success. Build output should list these public routes:
- `/`
- `/services`
- `/work`
- `/products`
- `/products/[slug]`
- `/about`
- `/contact`
- `/privacy`
- `/sitemap.xml`
- `/robots.txt`

And no `/sites/...` routes (redirected via `next.config.ts`).

- [ ] **Click through the site**

Run dev server, click through every nav link, confirm:
- Header nav: Services · Work · Products · About · Contact (button) — all work
- Footer nav matches and links to Privacy too
- `/sites` redirects to `/products` (URL bar changes)
- `/sites/automated-panda` redirects to `/products/automated-panda`
- `/work` shows the empty state until testimonials are approved (correct)
- `/contact` form submits successfully → success state, row in DB, email sent (if Resend configured)
- All compliance placeholders are clearly visible as `<em>placeholder</em>` in the footer / contact page / privacy page

---

## Out of plan (handled outside this build)

These items are content/external work, tracked in `docs/pre-meeting-notes.md`:

- Real testimonial wording + sign-offs from all 7 clients
- Setting `testimonial_approved_at = now()` on each case study once approved
- Real case study story text (problem, solution, outcome headline)
- Real client logos uploaded
- Real stat numbers replacing the `20+` etc. placeholders on `/` and `/about`
- Real Companies House number, ICO number, registered office address
- Real Privacy Policy text in `/privacy`
- Resend account creation + DNS verification for `8caps.co.uk`
- `ui-ux-pro-max` visual polish pass once the structure above is in
