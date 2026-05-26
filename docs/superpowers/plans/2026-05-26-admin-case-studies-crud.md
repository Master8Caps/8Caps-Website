# Admin Case Studies CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/case-studies` admin section (list with quick-approve, full create/edit/delete form, dashboard pending callout, 5th stat tile) so case studies can be managed through the UI instead of raw SQL.

**Architecture:** Mirrors the existing Sites admin pattern. New server-side data readers in `src/lib/data/admin.ts`. Server actions in a new `(dashboard)/case-studies/actions.ts`. A new `CaseStudyForm` modelled on `SiteForm`. List view with URL-driven filter chips and per-row approve action. Sidebar + dashboard get the new section wired in.

**Tech Stack:** Next.js 16 (App Router, server components + server actions), TypeScript, Supabase, Zod, Tailwind v4, Vitest + Testing Library.

---

## Notes for the implementer

- Run commands from the project root: `C:\Users\James\OneDrive\Documents\SaaS Products\8Caps`.
- `npm test` runs Vitest once; `npm run typecheck` runs `tsc --noEmit`; `npm run build` runs the Next.js build.
- ⚠️ `npm run build` and any `npm install` need the sandbox disabled (`dangerouslyDisableSandbox: true` on the Bash call) — they fail with `ECONNRESET` otherwise.
- The repo tests **pure functions and components** only; it has no Supabase-mocking harness. Tasks that touch the database are implemented directly and verified with `npm run typecheck` + `npm run build` + a manual check (matches existing codebase).
- **Spec correction:** the spec missed `publish_status` (the table has a `publish_status publish_status not null default 'draft'` column). The form includes a Publish-status select alongside the approval toggle. For a case study to be public on `/work`, BOTH `publish_status = 'published'` AND `testimonial_approved_at IS NOT NULL` must hold (RLS enforces this).
- **Spec deviation:** admin case-study data readers go in the existing `src/lib/data/admin.ts` alongside `getAdminSites`/`getAdminCategories` (existing convention groups admin fetchers there). The spec proposed a new `case-studies-admin.ts` — using the existing file is more consistent.
- Commit after every task.
- After the final task, push to `main` (Vercel auto-deploys).

---

## File Structure

### New files (10)

| File | Responsibility |
|---|---|
| `src/app/admin/(dashboard)/case-studies/page.tsx` | List page (server-rendered, URL-driven filters) |
| `src/app/admin/(dashboard)/case-studies/new/page.tsx` | New case study form host |
| `src/app/admin/(dashboard)/case-studies/[id]/edit/page.tsx` | Edit form host with bound update/delete actions |
| `src/app/admin/(dashboard)/case-studies/actions.ts` | Server actions: create/update/delete/approve/revoke |
| `src/components/admin/CaseStudyForm.tsx` | Multi-section form (mirrors SiteForm) |
| `src/components/admin/CaseStudyList.tsx` | Table component with per-row approve button |
| `src/components/admin/CaseStudyApproveButton.tsx` | Client wrapper around `approveCaseStudy` server action |
| `src/components/admin/PendingApprovalCallout.tsx` | Yellow dashboard banner when count > 0 |
| `src/components/admin/ServicesPicker.tsx` | Chip multi-select for `CaseStudyService` enum |
| `src/components/admin/TagInput.tsx` | Generic tag input (used for `tech_stack`) |

### Test files (5)

| File | Coverage |
|---|---|
| `src/lib/schemas.test.ts` (existing — extend) | `caseStudyFormSchema` validation |
| `src/lib/case-study-status.test.ts` | `statusFor(testimonialApprovedAt, publishStatus)` helper |
| `src/components/admin/CaseStudyForm.test.tsx` | Renders sections, approval toggle visibility |
| `src/components/admin/CaseStudyList.test.tsx` | Status pills, approve button only on pending |
| `src/components/admin/PendingApprovalCallout.test.tsx` | Renders only when count > 0 |
| `src/components/admin/TagInput.test.tsx` | Add/remove tags |

### Modified files (8)

| File | Change |
|---|---|
| `src/types/case-study.ts` | Add `AdminCaseStudy`, `AdminCaseStudyRow`, `CaseStudyFormValues`, `CaseStudyStatus`, `CASE_STUDY_SERVICE_OPTIONS` |
| `src/types/domain.ts` | Add `caseStudyCount` and `pendingCaseStudyApprovals` to `DashboardStats` |
| `src/lib/schemas.ts` | Add `caseStudyFormSchema` |
| `src/lib/case-study-status.ts` (new but co-located in lib) | `statusFor` helper |
| `src/lib/data/admin.ts` | Add `getAdminCaseStudies`, `getCaseStudyForEdit`, `getPendingApprovalCount`; extend `getDashboardStats` |
| `src/components/admin/Sidebar.tsx` | Add "Case studies" nav entry between Products and Categories |
| `src/components/admin/QuickActions.tsx` | Swap "View enquiries" for "Add case study" |
| `src/app/admin/(dashboard)/page.tsx` | Add 5th stat tile + `PendingApprovalCallout`; pass new stats props |
| `src/components/admin/DashboardBanner.tsx` | (No change — leave as-is) |

---

## Part A — Foundation (types + schema + status helper)

### Task 1: Add admin case study types

**Files:**
- Modify: `src/types/case-study.ts`

- [ ] **Step 1: Append the new types to `src/types/case-study.ts`**

```typescript
import type { PublishStatus } from "@/types/domain";

export type CaseStudyStatus = "draft" | "pending" | "live" | "archived";

/** Service enum options as picker-ready data. */
export const CASE_STUDY_SERVICE_OPTIONS: { value: CaseStudyService; label: string }[] = [
  { value: "custom_software", label: "Custom Software" },
  { value: "ai", label: "AI" },
  { value: "automation", label: "Automation" },
  { value: "lead_gen", label: "Lead Gen" },
  { value: "ecommerce", label: "E-commerce" },
];

/** A case study with all admin-visible fields (incl. approval timestamp). */
export interface AdminCaseStudy extends CaseStudy {
  testimonialApprovedAt: string | null;
  publishStatus: PublishStatus;
}

/** A row in the admin list view — only what the table needs. */
export interface AdminCaseStudyRow {
  id: string;
  slug: string;
  clientName: string;
  clientSector: string | null;
  year: number | null;
  isFeatured: boolean;
  publishStatus: PublishStatus;
  testimonialApprovedAt: string | null;
}

/** The full editable shape used by the admin case study form. */
export interface CaseStudyFormValues {
  clientName: string;
  slug: string;
  clientSector: string;
  year: number | null;
  logoUrl: string | null;
  brandColour: string;
  outcomeHeadline: string;
  storyProblem: string;
  storySolution: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;
  techStack: string[];
  services: CaseStudyService[];
  publishStatus: PublishStatus;
  isFeatured: boolean;
  sortOrder: number;
  testimonialApproved: boolean;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/types/case-study.ts
git commit -m "feat(admin): add case study admin types"
```

---

### Task 2: Add `caseStudyFormSchema` + tests

**Files:**
- Modify: `src/lib/schemas.ts`
- Modify: `src/lib/schemas.test.ts`

- [ ] **Step 1: Write the failing schema tests**

Append to `src/lib/schemas.test.ts`:

```typescript
import { caseStudyFormSchema } from "./schemas";
import type { CaseStudyFormValues } from "@/types/case-study";

const validCaseStudy: CaseStudyFormValues = {
  clientName: "North Bar",
  slug: "north-bar",
  clientSector: "Hospitality",
  year: 2024,
  logoUrl: null,
  brandColour: "",
  outcomeHeadline: "Sold out every weekend",
  storyProblem: "Couldn't manage bookings.",
  storySolution: "Built a booking widget.",
  testimonialQuote: "It changed our business.",
  testimonialAuthor: "Obi",
  testimonialRole: "Owner",
  techStack: ["Next.js", "Supabase"],
  services: ["custom_software"],
  publishStatus: "draft",
  isFeatured: false,
  sortOrder: 0,
  testimonialApproved: false,
};

describe("caseStudyFormSchema", () => {
  it("accepts a fully populated valid case study", () => {
    expect(caseStudyFormSchema.safeParse(validCaseStudy).success).toBe(true);
  });

  it("requires clientName", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, clientName: "" }).success,
    ).toBe(false);
  });

  it("rejects an invalid slug", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, slug: "North Bar" }).success,
    ).toBe(false);
  });

  it("accepts an empty brandColour", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, brandColour: "" }).success,
    ).toBe(true);
  });

  it("rejects a non-hex brandColour", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, brandColour: "blue" }).success,
    ).toBe(false);
  });

  it("accepts a valid hex brandColour", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, brandColour: "#1f2937" }).success,
    ).toBe(true);
  });

  it("rejects year < 2000", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, year: 1999 }).success,
    ).toBe(false);
  });

  it("accepts a null year", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, year: null }).success,
    ).toBe(true);
  });

  it("rejects an invalid service value", () => {
    expect(
      caseStudyFormSchema.safeParse({
        ...validCaseStudy,
        services: ["custom_software", "nonsense" as never],
      }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/schemas.test.ts`
Expected: FAIL — `caseStudyFormSchema` is not exported.

- [ ] **Step 3: Add the schema to `src/lib/schemas.ts`**

Append to `src/lib/schemas.ts`:

```typescript
const caseStudyServiceSchema = z.enum([
  "custom_software",
  "ai",
  "automation",
  "lead_gen",
  "ecommerce",
]);

const currentYear = new Date().getFullYear();

export const caseStudyFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  clientSector: z.string(),
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(currentYear + 1, "Year is in the future")
    .nullable(),
  logoUrl: z.string().url().nullable(),
  brandColour: z
    .union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex like #1f2937")]),
  outcomeHeadline: z.string().min(1, "Outcome headline is required"),
  storyProblem: z.string().min(1, "Problem paragraph is required"),
  storySolution: z.string().min(1, "Solution paragraph is required"),
  testimonialQuote: z.string().min(1, "Testimonial quote is required"),
  testimonialAuthor: z.string().min(1, "Testimonial author is required"),
  testimonialRole: z.string(),
  techStack: z.array(z.string().min(1)),
  services: z.array(caseStudyServiceSchema),
  publishStatus: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0),
  testimonialApproved: z.boolean(),
});

export type CaseStudyFormInput = z.infer<typeof caseStudyFormSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/schemas.test.ts`
Expected: PASS (all `caseStudyFormSchema` tests plus existing schema tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat(admin): add caseStudyFormSchema with tests"
```

---

### Task 3: Add `statusFor` helper + tests

**Files:**
- Create: `src/lib/case-study-status.ts`
- Create: `src/lib/case-study-status.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/case-study-status.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { statusFor } from "./case-study-status";

describe("statusFor", () => {
  it("returns 'draft' when publishStatus is draft", () => {
    expect(statusFor({ publishStatus: "draft", testimonialApprovedAt: null })).toBe("draft");
  });

  it("returns 'archived' when publishStatus is archived", () => {
    expect(statusFor({ publishStatus: "archived", testimonialApprovedAt: null })).toBe("archived");
  });

  it("returns 'pending' when published but testimonial not approved", () => {
    expect(
      statusFor({ publishStatus: "published", testimonialApprovedAt: null }),
    ).toBe("pending");
  });

  it("returns 'live' when published and testimonial approved", () => {
    expect(
      statusFor({
        publishStatus: "published",
        testimonialApprovedAt: "2026-05-25T10:00:00Z",
      }),
    ).toBe("live");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/case-study-status.test.ts`
Expected: FAIL — module `./case-study-status` does not exist.

- [ ] **Step 3: Create `src/lib/case-study-status.ts`**

```typescript
import type { PublishStatus } from "@/types/domain";
import type { CaseStudyStatus } from "@/types/case-study";

/**
 * Derive the admin-visible status of a case study from its two gating
 * columns. Pending means published-but-unapproved — that's the case the
 * admin needs to act on. Live means published-and-approved (the only state
 * that's visible to the public, per RLS).
 */
export function statusFor(row: {
  publishStatus: PublishStatus;
  testimonialApprovedAt: string | null;
}): CaseStudyStatus {
  if (row.publishStatus === "draft") return "draft";
  if (row.publishStatus === "archived") return "archived";
  return row.testimonialApprovedAt ? "live" : "pending";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/case-study-status.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/case-study-status.ts src/lib/case-study-status.test.ts
git commit -m "feat(admin): add case study status helper"
```

---

## Part B — Data Layer

### Task 4: Data readers in `src/lib/data/admin.ts`

**Files:**
- Modify: `src/lib/data/admin.ts`
- Modify: `src/types/domain.ts`

- [ ] **Step 1: Extend `DashboardStats` in `src/types/domain.ts`**

Edit the `DashboardStats` interface (around line 115) to add two fields:

```typescript
export interface DashboardStats {
  totalSites: number;
  publishedSites: number;
  draftSites: number;
  categories: number;
  sitesAddedThisWeek: number;
  caseStudyCount: number;
  pendingCaseStudyApprovals: number;
}
```

- [ ] **Step 2: Add the three reader functions to `src/lib/data/admin.ts`**

Add at the bottom of the file (after `getRecentSites`):

```typescript
import type {
  AdminCaseStudy,
  AdminCaseStudyRow,
  CaseStudyService,
} from "@/types/case-study";

interface AdminCaseStudyRowRaw {
  id: string;
  slug: string;
  client_name: string;
  client_sector: string | null;
  year: number | null;
  is_featured: boolean;
  publish_status: AdminCaseStudyRow["publishStatus"];
  testimonial_approved_at: string | null;
}

/**
 * Admin case studies list. Optional filter:
 *   - search: case-insensitive on client_name
 *   - status: 'pending' (published + unapproved), 'live' (published + approved),
 *     'featured' (is_featured = true, any state), or undefined (all)
 */
export async function getAdminCaseStudies(filter?: {
  search?: string;
  status?: "pending" | "live" | "featured";
}): Promise<AdminCaseStudyRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("case_studies")
    .select(
      "id, slug, client_name, client_sector, year, is_featured, publish_status, testimonial_approved_at",
    )
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (filter?.search) query = query.ilike("client_name", `%${filter.search}%`);
  if (filter?.status === "pending") {
    query = query.eq("publish_status", "published").is("testimonial_approved_at", null);
  } else if (filter?.status === "live") {
    query = query.eq("publish_status", "published").not("testimonial_approved_at", "is", null);
  } else if (filter?.status === "featured") {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load case studies: ${error.message}`);

  return ((data ?? []) as unknown as AdminCaseStudyRowRaw[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    clientName: r.client_name,
    clientSector: r.client_sector,
    year: r.year,
    isFeatured: r.is_featured,
    publishStatus: r.publish_status,
    testimonialApprovedAt: r.testimonial_approved_at,
  }));
}

interface CaseStudyEditRaw {
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
  testimonial_approved_at: string | null;
  tech_stack: string[] | null;
  publish_status: AdminCaseStudy["publishStatus"];
  is_featured: boolean;
  sort_order: number;
  case_study_services: { service: CaseStudyService }[];
}

/** A case study in the editable form shape, or null if not found. */
export async function getCaseStudyForEdit(
  id: string,
): Promise<AdminCaseStudy | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, slug, client_name, client_sector, year, logo_url, brand_colour, " +
        "outcome_headline, story_problem, story_solution, " +
        "testimonial_quote, testimonial_author, testimonial_role, testimonial_approved_at, " +
        "tech_stack, publish_status, is_featured, sort_order, " +
        "case_study_services (service)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load case study: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as CaseStudyEditRaw;
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
    testimonialApprovedAt: row.testimonial_approved_at,
    techStack: row.tech_stack ?? [],
    publishStatus: row.publish_status,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    services: row.case_study_services.map((s) => s.service),
  };
}

/** Count of case studies that are published but awaiting testimonial approval. */
export async function getPendingApprovalCount(): Promise<number> {
  const supabase = await createServerSupabase();
  const { count, error } = await supabase
    .from("case_studies")
    .select("id", { count: "exact", head: true })
    .eq("publish_status", "published")
    .is("testimonial_approved_at", null);
  if (error) throw new Error(`Failed to count pending case studies: ${error.message}`);
  return count ?? 0;
}
```

- [ ] **Step 3: Extend `getDashboardStats` to include case study counts**

Replace the body of `getDashboardStats` in `src/lib/data/admin.ts`:

```typescript
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabase();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total, published, draft, categories, thisWeek, caseStudies, pendingApprovals] =
    await Promise.all([
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
      supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase.from("case_studies").select("id", { count: "exact", head: true }),
      supabase
        .from("case_studies")
        .select("id", { count: "exact", head: true })
        .eq("publish_status", "published")
        .is("testimonial_approved_at", null),
    ]);

  return {
    totalSites: total.count ?? 0,
    publishedSites: published.count ?? 0,
    draftSites: draft.count ?? 0,
    categories: categories.count ?? 0,
    sitesAddedThisWeek: thisWeek.count ?? 0,
    caseStudyCount: caseStudies.count ?? 0,
    pendingCaseStudyApprovals: pendingApprovals.count ?? 0,
  };
}
```

- [ ] **Step 4: Run typecheck + build to verify**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run build` (with `dangerouslyDisableSandbox: true`)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/admin.ts src/types/domain.ts
git commit -m "feat(admin): add case study data readers + dashboard stats"
```

---

## Part C — Server Actions

### Task 5: Server actions file scaffold

**Files:**
- Create: `src/app/admin/(dashboard)/case-studies/actions.ts`

- [ ] **Step 1: Create the actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { caseStudyFormSchema } from "@/lib/schemas";
import { slugify } from "@/lib/slugify";
import type { ActionResult } from "@/types/domain";
import type { CaseStudyFormValues } from "@/types/case-study";

async function caseStudiesListHref(): Promise<string> {
  const basePath = await getAdminBasePath();
  return adminPath(basePath, "/case-studies");
}

/**
 * Revalidate every public route affected by case study changes.
 */
function revalidatePublic() {
  revalidatePath("/");                            // featured case studies on home
  revalidatePath("/work");                        // /work list
  revalidatePath("/work/[slug]", "page");         // every detail page
}

/** Map form values to a `case_studies` table row (snake_case). */
function toCaseStudyRow(values: CaseStudyFormValues) {
  return {
    slug: values.slug,
    client_name: values.clientName,
    client_sector: values.clientSector || null,
    year: values.year,
    logo_url: values.logoUrl,
    brand_colour: values.brandColour || null,
    outcome_headline: values.outcomeHeadline,
    story_problem: values.storyProblem,
    story_solution: values.storySolution,
    testimonial_quote: values.testimonialQuote,
    testimonial_author: values.testimonialAuthor,
    testimonial_role: values.testimonialRole || null,
    testimonial_approved_at: values.testimonialApproved ? new Date().toISOString() : null,
    tech_stack: values.techStack,
    publish_status: values.publishStatus,
    is_featured: values.isFeatured,
    sort_order: values.sortOrder,
  };
}

/** Delete-and-reinsert the M2M services rows for a case study. */
async function writeServices(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  caseStudyId: string,
  services: CaseStudyFormValues["services"],
): Promise<string | null> {
  const deleted = await supabase
    .from("case_study_services")
    .delete()
    .eq("case_study_id", caseStudyId);
  if (deleted.error) return deleted.error.message;

  if (services.length === 0) return null;

  const { error } = await supabase
    .from("case_study_services")
    .insert(services.map((service) => ({ case_study_id: caseStudyId, service })));
  if (error) return error.message;

  return null;
}

export async function createCaseStudy(
  values: CaseStudyFormValues,
): Promise<ActionResult> {
  const parsed = caseStudyFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const row = toCaseStudyRow(parsed.data);

  const { data, error } = await supabase
    .from("case_studies")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    return { ok: false, error: `Could not create case study: ${error.message}` };
  }

  const servicesError = await writeServices(supabase, data.id, parsed.data.services);
  if (servicesError) {
    return { ok: false, error: `Case study saved, but services failed: ${servicesError}` };
  }

  revalidatePublic();
  redirect(await caseStudiesListHref());
}

export async function updateCaseStudy(
  id: string,
  values: CaseStudyFormValues,
): Promise<ActionResult> {
  const parsed = caseStudyFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("case_studies")
    .update(toCaseStudyRow(parsed.data))
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not update case study: ${error.message}` };
  }

  const servicesError = await writeServices(supabase, id, parsed.data.services);
  if (servicesError) {
    return { ok: false, error: `Case study saved, but services failed: ${servicesError}` };
  }

  revalidatePublic();
  redirect(await caseStudiesListHref());
}

export async function deleteCaseStudy(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("case_studies").delete().eq("id", id);
  if (error) {
    return { ok: false, error: `Could not delete case study: ${error.message}` };
  }
  revalidatePublic();
  redirect(await caseStudiesListHref());
}

export async function approveCaseStudy(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("case_studies")
    .update({ testimonial_approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not approve testimonial: ${error.message}` };
  }
  revalidatePublic();
  revalidatePath(adminPath(await getAdminBasePath(), "/case-studies"));
  return { ok: true };
}

export async function revokeApproval(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("case_studies")
    .update({ testimonial_approved_at: null })
    .eq("id", id);
  if (error) {
    return { ok: false, error: `Could not revoke approval: ${error.message}` };
  }
  revalidatePublic();
  revalidatePath(adminPath(await getAdminBasePath(), "/case-studies"));
  return { ok: true };
}

/** Convenience used by the new-case-study page default slug seed. */
export function suggestSlug(clientName: string): string {
  return slugify(clientName);
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/case-studies/actions.ts"
git commit -m "feat(admin): add case study server actions"
```

---

## Part D — Reusable components

### Task 6: `TagInput` component + tests

**Files:**
- Create: `src/components/admin/TagInput.tsx`
- Create: `src/components/admin/TagInput.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { TagInput } from "./TagInput";

function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = useState<string[]>(initial);
  return <TagInput value={tags} onChange={setTags} placeholder="Add tech…" />;
}

describe("TagInput", () => {
  it("adds a tag when Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByPlaceholderText("Add tech…");
    await user.type(input, "Next.js{Enter}");
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("removes a tag when the X button is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["Supabase"]} />);
    await user.click(screen.getByRole("button", { name: /remove Supabase/i }));
    expect(screen.queryByText("Supabase")).toBeNull();
  });

  it("ignores empty input on Enter", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByPlaceholderText("Add tech…"), "{Enter}");
    expect(screen.queryAllByRole("button", { name: /remove/i })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/admin/TagInput.test.tsx`
Expected: FAIL — module `./TagInput` does not exist.

- [ ] **Step 3: Create `src/components/admin/TagInput.tsx`**

```typescript
"use client";

import { useState, type KeyboardEvent } from "react";

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface px-3 py-2"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
        >
          {tag}
          <button
            type="button"
            aria-label={`remove ${tag}`}
            onClick={() => remove(tag)}
            className="text-accent/70 hover:text-accent"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 min-w-[8rem] border-none bg-transparent text-sm outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/admin/TagInput.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/TagInput.tsx src/components/admin/TagInput.test.tsx
git commit -m "feat(admin): add reusable TagInput component"
```

---

### Task 7: `ServicesPicker` component

**Files:**
- Create: `src/components/admin/ServicesPicker.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import {
  CASE_STUDY_SERVICE_OPTIONS,
  type CaseStudyService,
} from "@/types/case-study";

export function ServicesPicker({
  value,
  onChange,
}: {
  value: CaseStudyService[];
  onChange: (next: CaseStudyService[]) => void;
}) {
  function toggle(service: CaseStudyService) {
    onChange(
      value.includes(service)
        ? value.filter((s) => s !== service)
        : [...value, service],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CASE_STUDY_SERVICE_OPTIONS.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={active}
            className={
              active
                ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full border px-3 py-1 text-xs font-medium text-ink"
            }
            style={active ? undefined : { borderColor: "var(--color-hairline)" }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ServicesPicker.tsx
git commit -m "feat(admin): add ServicesPicker chip multi-select"
```

---

### Task 8: `CaseStudyApproveButton` component

**Files:**
- Create: `src/components/admin/CaseStudyApproveButton.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useTransition } from "react";
import { approveCaseStudy } from "@/app/admin/(dashboard)/case-studies/actions";

export function CaseStudyApproveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await approveCaseStudy(id);
      if (!result.ok && result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Approving…" : "Approve"}
    </button>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/CaseStudyApproveButton.tsx
git commit -m "feat(admin): add CaseStudyApproveButton (server action wrapper)"
```

---

### Task 9: `PendingApprovalCallout` component + tests

**Files:**
- Create: `src/components/admin/PendingApprovalCallout.tsx`
- Create: `src/components/admin/PendingApprovalCallout.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingApprovalCallout } from "./PendingApprovalCallout";

describe("PendingApprovalCallout", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<PendingApprovalCallout count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a singular message for count = 1", () => {
    render(<PendingApprovalCallout count={1} />);
    expect(screen.getByText(/1 case study pending approval/i)).toBeInTheDocument();
  });

  it("renders a plural message for count > 1", () => {
    render(<PendingApprovalCallout count={3} />);
    expect(screen.getByText(/3 case studies pending approval/i)).toBeInTheDocument();
  });

  it("links to the pending-filtered list view", () => {
    render(<PendingApprovalCallout count={2} />);
    expect(screen.getByRole("link", { name: /review/i })).toHaveAttribute(
      "href",
      "/admin/case-studies?status=pending",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/admin/PendingApprovalCallout.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the component**

```typescript
"use client";

import Link from "next/link";
import { useAdminPath } from "./AdminPathContext";

export function PendingApprovalCallout({ count }: { count: number }) {
  const adminHref = useAdminPath();
  if (count === 0) return null;

  const noun = count === 1 ? "case study" : "case studies";

  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <span>
        ⚠️ <strong>{count} {noun}</strong> pending approval
      </span>
      <Link
        href={`${adminHref("/case-studies")}?status=pending`}
        className="rounded-lg bg-amber-900 px-3 py-1 text-xs font-semibold text-white"
      >
        Review →
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/admin/PendingApprovalCallout.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PendingApprovalCallout.tsx src/components/admin/PendingApprovalCallout.test.tsx
git commit -m "feat(admin): add PendingApprovalCallout dashboard banner"
```

---

## Part E — Form + List components

### Task 10: `CaseStudyForm` component + tests

**Files:**
- Create: `src/components/admin/CaseStudyForm.tsx`
- Create: `src/components/admin/CaseStudyForm.test.tsx`

- [ ] **Step 1: Write the failing render test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyForm } from "./CaseStudyForm";
import type { CaseStudyFormValues } from "@/types/case-study";

const initial: CaseStudyFormValues = {
  clientName: "North Bar",
  slug: "north-bar",
  clientSector: "Hospitality",
  year: 2024,
  logoUrl: null,
  brandColour: "",
  outcomeHeadline: "Outcome",
  storyProblem: "Problem",
  storySolution: "Solution",
  testimonialQuote: "Quote",
  testimonialAuthor: "Obi",
  testimonialRole: "Owner",
  techStack: ["Next.js"],
  services: ["custom_software"],
  publishStatus: "published",
  isFeatured: false,
  sortOrder: 0,
  testimonialApproved: false,
};

describe("CaseStudyForm", () => {
  it("renders all five sections", () => {
    render(
      <CaseStudyForm initial={initial} onSubmit={async () => ({ ok: true })} />,
    );
    expect(screen.getByText(/Basics/i)).toBeInTheDocument();
    expect(screen.getByText(/Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Testimonial/i)).toBeInTheDocument();
    expect(screen.getByText(/Classification/i)).toBeInTheDocument();
    expect(screen.getByText(/Display/i)).toBeInTheDocument();
  });

  it("shows the approval toggle off when testimonialApproved is false", () => {
    render(
      <CaseStudyForm initial={initial} onSubmit={async () => ({ ok: true })} />,
    );
    const checkbox = screen.getByRole("checkbox", { name: /testimonial approved/i });
    expect(checkbox).not.toBeChecked();
  });

  it("shows the approval toggle on when testimonialApproved is true", () => {
    render(
      <CaseStudyForm
        initial={{ ...initial, testimonialApproved: true }}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: /testimonial approved/i });
    expect(checkbox).toBeChecked();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/admin/CaseStudyForm.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `src/components/admin/CaseStudyForm.tsx`**

```typescript
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { slugify } from "@/lib/slugify";
import { useUpload } from "@/lib/use-upload";
import { ServicesPicker } from "./ServicesPicker";
import { TagInput } from "./TagInput";
import type { ActionResult } from "@/types/domain";
import type { CaseStudyFormValues } from "@/types/case-study";

const EMPTY: CaseStudyFormValues = {
  clientName: "",
  slug: "",
  clientSector: "",
  year: null,
  logoUrl: null,
  brandColour: "",
  outcomeHeadline: "",
  storyProblem: "",
  storySolution: "",
  testimonialQuote: "",
  testimonialAuthor: "",
  testimonialRole: "",
  techStack: [],
  services: [],
  publishStatus: "draft",
  isFeatured: false,
  sortOrder: 0,
  testimonialApproved: false,
};

const field = "w-full rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };
const sectionTitle = "text-sm font-semibold uppercase tracking-wide text-ink-muted";

export function CaseStudyForm({
  initial,
  onSubmit,
}: {
  initial?: CaseStudyFormValues;
  onSubmit: (values: CaseStudyFormValues) => Promise<ActionResult>;
}) {
  const [values, setValues] = useState<CaseStudyFormValues>(initial ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { upload, uploading } = useUpload();

  function set<K extends keyof CaseStudyFormValues>(key: K, value: CaseStudyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleClientName(name: string) {
    setValues((v) => ({
      ...v,
      clientName: name,
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
          value={values.clientName}
          onChange={(e) => handleClientName(e.target.value)}
          placeholder="Client name"
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
          value={values.clientSector}
          onChange={(e) => set("clientSector", e.target.value)}
          placeholder="Client sector (e.g. Hospitality)"
          className={field}
          style={fieldStyle}
        />
        <input
          type="number"
          value={values.year ?? ""}
          onChange={(e) =>
            set("year", e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder="Year"
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
          <label
            className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-ink"
            style={fieldStyle}
          >
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
        <div className="flex items-center gap-3">
          <label className="text-sm text-ink-muted">Brand colour</label>
          <input
            type="color"
            value={values.brandColour || "#000000"}
            onChange={(e) => set("brandColour", e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-lg border"
            style={fieldStyle}
          />
          <input
            type="text"
            value={values.brandColour}
            onChange={(e) => set("brandColour", e.target.value)}
            placeholder="#1f2937"
            className={`${field} max-w-[8rem]`}
            style={fieldStyle}
          />
        </div>
      </section>

      {/* Story */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Story</h2>
        <input
          required
          value={values.outcomeHeadline}
          onChange={(e) => set("outcomeHeadline", e.target.value)}
          placeholder="Outcome headline"
          className={field}
          style={fieldStyle}
        />
        <textarea
          required
          value={values.storyProblem}
          onChange={(e) => set("storyProblem", e.target.value)}
          placeholder="Problem paragraph"
          rows={4}
          className={field}
          style={fieldStyle}
        />
        <textarea
          required
          value={values.storySolution}
          onChange={(e) => set("storySolution", e.target.value)}
          placeholder="Solution paragraph"
          rows={4}
          className={field}
          style={fieldStyle}
        />
      </section>

      {/* Testimonial */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Testimonial</h2>
        <textarea
          required
          value={values.testimonialQuote}
          onChange={(e) => set("testimonialQuote", e.target.value)}
          placeholder="Quote"
          rows={3}
          className={field}
          style={fieldStyle}
        />
        <input
          required
          value={values.testimonialAuthor}
          onChange={(e) => set("testimonialAuthor", e.target.value)}
          placeholder="Author name"
          className={field}
          style={fieldStyle}
        />
        <input
          value={values.testimonialRole}
          onChange={(e) => set("testimonialRole", e.target.value)}
          placeholder="Author role (optional)"
          className={field}
          style={fieldStyle}
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={values.testimonialApproved}
            onChange={(e) => set("testimonialApproved", e.target.checked)}
          />
          Testimonial approved (public on /work when published)
        </label>
      </section>

      {/* Classification */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Classification</h2>
        <div>
          <label className="block text-xs text-ink-muted mb-2">Services</label>
          <ServicesPicker
            value={values.services}
            onChange={(next) => set("services", next)}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-2">Tech stack</label>
          <TagInput
            value={values.techStack}
            onChange={(next) => set("techStack", next)}
            placeholder="Type and press Enter"
          />
        </div>
      </section>

      {/* Display */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Display</h2>
        <select
          value={values.publishStatus}
          onChange={(e) =>
            set("publishStatus", e.target.value as CaseStudyFormValues["publishStatus"])
          }
          className={field}
          style={fieldStyle}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured on homepage
        </label>
        <input
          type="number"
          value={values.sortOrder}
          onChange={(e) => set("sortOrder", Number(e.target.value))}
          placeholder="Sort order"
          className={`${field} max-w-[8rem]`}
          style={fieldStyle}
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/admin/CaseStudyForm.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CaseStudyForm.tsx src/components/admin/CaseStudyForm.test.tsx
git commit -m "feat(admin): add CaseStudyForm component"
```

---

### Task 11: `CaseStudyList` component + tests

**Files:**
- Create: `src/components/admin/CaseStudyList.tsx`
- Create: `src/components/admin/CaseStudyList.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyList } from "./CaseStudyList";
import type { AdminCaseStudyRow } from "@/types/case-study";

const rows: AdminCaseStudyRow[] = [
  {
    id: "1",
    slug: "north-bar",
    clientName: "North Bar",
    clientSector: "Hospitality",
    year: 2024,
    isFeatured: true,
    publishStatus: "published",
    testimonialApprovedAt: null,
  },
  {
    id: "2",
    slug: "hull-mag",
    clientName: "Hull Mag",
    clientSector: "Publishing",
    year: 2024,
    isFeatured: false,
    publishStatus: "published",
    testimonialApprovedAt: "2026-04-15T10:00:00Z",
  },
];

describe("CaseStudyList", () => {
  it("shows a pending pill and Approve button on pending rows", () => {
    render(<CaseStudyList rows={rows} />);
    // North Bar is pending → has Approve button
    expect(screen.getByText("North Bar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("shows a live pill on approved rows", () => {
    render(<CaseStudyList rows={rows} />);
    // Hull Mag is live → status pill says Live
    const hullMagRow = screen.getByText("Hull Mag").closest("tr")!;
    expect(hullMagRow).toHaveTextContent(/live/i);
  });

  it("does not render an Approve button on live rows", () => {
    render(<CaseStudyList rows={[rows[1]]} />); // only Hull Mag
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
  });

  it("renders an empty-state message when there are no rows", () => {
    render(<CaseStudyList rows={[]} />);
    expect(screen.getByText(/no case studies yet/i)).toBeInTheDocument();
  });

  it("links each client name to its edit page", () => {
    render(<CaseStudyList rows={rows} />);
    expect(
      screen.getByRole("link", { name: /North Bar/ }),
    ).toHaveAttribute("href", "/admin/case-studies/1/edit");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/admin/CaseStudyList.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create `src/components/admin/CaseStudyList.tsx`**

```typescript
"use client";

import Link from "next/link";
import { statusFor } from "@/lib/case-study-status";
import type { AdminCaseStudyRow, CaseStudyStatus } from "@/types/case-study";
import { useAdminPath } from "./AdminPathContext";
import { CaseStudyApproveButton } from "./CaseStudyApproveButton";

const STATUS_STYLE: Record<CaseStudyStatus, string> = {
  pending: "bg-soon-bg text-soon",
  live: "bg-live-bg text-live",
  draft: "bg-black/5 text-ink-muted",
  archived: "bg-black/5 text-ink-muted",
};

const STATUS_LABEL: Record<CaseStudyStatus, string> = {
  pending: "🟡 Pending",
  live: "✅ Live",
  draft: "Draft",
  archived: "Archived",
};

export function CaseStudyList({ rows }: { rows: AdminCaseStudyRow[] }) {
  const adminHref = useAdminPath();

  if (rows.length === 0) {
    return (
      <div
        className="rounded-card border bg-surface p-8 text-center text-ink-muted"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        No case studies yet.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-card border bg-surface"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left text-ink-muted"
            style={{ borderColor: "var(--color-hairline)" }}
          >
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Sector</th>
            <th className="px-4 py-3 font-medium">Year</th>
            <th className="px-4 py-3 font-medium">Featured</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = statusFor(row);
            return (
              <tr
                key={row.id}
                className="border-b last:border-0"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                <td className="px-4 py-3 font-medium text-ink">
                  <Link
                    href={adminHref(`/case-studies/${row.id}/edit`)}
                    className="hover:text-accent"
                  >
                    {row.clientName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{row.clientSector ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{row.year ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {row.isFeatured ? "⭐" : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {status === "pending" && (
                    <CaseStudyApproveButton id={row.id} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/admin/CaseStudyList.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CaseStudyList.tsx src/components/admin/CaseStudyList.test.tsx
git commit -m "feat(admin): add CaseStudyList with status pills and inline approve"
```

---

## Part F — Pages

### Task 12: List page `/admin/case-studies`

**Files:**
- Create: `src/app/admin/(dashboard)/case-studies/page.tsx`

- [ ] **Step 1: Create the list page**

```typescript
import Link from "next/link";
import { getAdminCaseStudies } from "@/lib/data/admin";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { CaseStudyList } from "@/components/admin/CaseStudyList";

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending approval" },
  { value: "live", label: "Live" },
  { value: "featured", label: "Featured" },
] as const;

type Status = "pending" | "live" | "featured";

function asStatus(v: string | undefined): Status | undefined {
  if (v === "pending" || v === "live" || v === "featured") return v;
  return undefined;
}

export default async function AdminCaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const filter = {
    search: q?.trim() || undefined,
    status: asStatus(status),
  };
  const [rows, basePath] = await Promise.all([
    getAdminCaseStudies(filter),
    getAdminBasePath(),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Case studies</h1>
        <Link
          href={adminPath(basePath, "/case-studies/new")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          + Add case study
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by client name…"
          className="w-full max-w-sm rounded-lg border bg-surface px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
        {/* Preserve the active filter when searching */}
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const active = (status ?? "") === option.value;
          const href =
            option.value === ""
              ? adminPath(basePath, "/case-studies")
              : `${adminPath(basePath, "/case-studies")}?status=${option.value}`;
          return (
            <Link
              key={option.value || "all"}
              href={href}
              className={
                active
                  ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border px-3 py-1 text-xs font-medium text-ink"
              }
              style={active ? undefined : { borderColor: "var(--color-hairline)" }}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <CaseStudyList rows={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (with `dangerouslyDisableSandbox: true`)
Expected: PASS — new route `/admin/case-studies` listed in output.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/case-studies/page.tsx"
git commit -m "feat(admin): add case studies list page with filters"
```

---

### Task 13: New page `/admin/case-studies/new`

**Files:**
- Create: `src/app/admin/(dashboard)/case-studies/new/page.tsx`

- [ ] **Step 1: Create the new page**

```typescript
import { CaseStudyForm } from "@/components/admin/CaseStudyForm";
import { createCaseStudy } from "../actions";

export default function NewCaseStudyPage() {
  return (
    <div>
      <h1 className="px-8 pt-8 text-2xl font-bold text-ink">Add a case study</h1>
      <CaseStudyForm onSubmit={createCaseStudy} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (with `dangerouslyDisableSandbox: true`)
Expected: PASS — route `/admin/case-studies/new` listed.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/case-studies/new/page.tsx"
git commit -m "feat(admin): add new case study page"
```

---

### Task 14: Edit page `/admin/case-studies/[id]/edit`

**Files:**
- Create: `src/app/admin/(dashboard)/case-studies/[id]/edit/page.tsx`
- Create: `src/components/admin/DeleteCaseStudyButton.tsx`

- [ ] **Step 1: Create `DeleteCaseStudyButton`**

```typescript
"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/types/domain";

export function DeleteCaseStudyButton({
  onDelete,
}: {
  onDelete: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Delete this case study permanently? Its services links go with it. This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result && !result.ok) {
        setError(result.error ?? "Could not delete this case study.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create the edit page**

```typescript
import { notFound } from "next/navigation";
import { CaseStudyForm } from "@/components/admin/CaseStudyForm";
import { DeleteCaseStudyButton } from "@/components/admin/DeleteCaseStudyButton";
import { getCaseStudyForEdit } from "@/lib/data/admin";
import { updateCaseStudy, deleteCaseStudy } from "../../actions";
import type { CaseStudyFormValues } from "@/types/case-study";

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseStudy = await getCaseStudyForEdit(id);
  if (!caseStudy) notFound();

  // Map admin shape to form shape (timestamp → boolean).
  const initial: CaseStudyFormValues = {
    clientName: caseStudy.clientName,
    slug: caseStudy.slug,
    clientSector: caseStudy.clientSector ?? "",
    year: caseStudy.year,
    logoUrl: caseStudy.logoUrl,
    brandColour: caseStudy.brandColour ?? "",
    outcomeHeadline: caseStudy.outcomeHeadline,
    storyProblem: caseStudy.storyProblem,
    storySolution: caseStudy.storySolution,
    testimonialQuote: caseStudy.testimonialQuote,
    testimonialAuthor: caseStudy.testimonialAuthor,
    testimonialRole: caseStudy.testimonialRole ?? "",
    techStack: caseStudy.techStack,
    services: caseStudy.services,
    publishStatus: caseStudy.publishStatus,
    isFeatured: caseStudy.isFeatured,
    sortOrder: caseStudy.sortOrder,
    testimonialApproved: caseStudy.testimonialApprovedAt !== null,
  };

  async function handleUpdate(values: CaseStudyFormValues) {
    "use server";
    return updateCaseStudy(id, values);
  }

  async function handleDelete() {
    "use server";
    return deleteCaseStudy(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-2xl font-bold text-ink">Edit case study</h1>
        <DeleteCaseStudyButton onDelete={handleDelete} />
      </div>
      <CaseStudyForm initial={initial} onSubmit={handleUpdate} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` (with `dangerouslyDisableSandbox: true`)
Expected: PASS — route `/admin/case-studies/[id]/edit` listed.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(dashboard)/case-studies/[id]/edit/page.tsx" src/components/admin/DeleteCaseStudyButton.tsx
git commit -m "feat(admin): add case study edit page with delete button"
```

---

## Part G — Dashboard + Sidebar integration

### Task 15: Sidebar entry

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Add "Case studies" to the NAV array**

Replace the `NAV` constant in `src/components/admin/Sidebar.tsx`:

```typescript
const NAV = [
  { path: "/", label: "Dashboard" },
  { path: "/products", label: "Products" },
  { path: "/case-studies", label: "Case studies" },
  { path: "/categories", label: "Categories" },
  { path: "/enquiries", label: "Enquiries" },
];
```

- [ ] **Step 2: Run tests + typecheck**

Run: `npm test -- src/components/admin`
Expected: PASS (no Sidebar tests to break).

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/Sidebar.tsx
git commit -m "feat(admin): add case studies link to sidebar"
```

---

### Task 16: QuickActions swap

**Files:**
- Modify: `src/components/admin/QuickActions.tsx`
- Modify: `src/components/admin/QuickActions.test.tsx`

- [ ] **Step 1: Update the failing test first**

Replace the test body in `src/components/admin/QuickActions.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("links to the four admin areas", () => {
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /add product/i })).toHaveAttribute(
      "href",
      "/admin/products/new",
    );
    expect(
      screen.getByRole("link", { name: /manage products/i }),
    ).toHaveAttribute("href", "/admin/products");
    expect(
      screen.getByRole("link", { name: /tidy categories/i }),
    ).toHaveAttribute("href", "/admin/categories");
    expect(
      screen.getByRole("link", { name: /add case study/i }),
    ).toHaveAttribute("href", "/admin/case-studies/new");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- src/components/admin/QuickActions.test.tsx`
Expected: FAIL — "view enquiries" link no longer matches "add case study".

- [ ] **Step 3: Update the ACTIONS array in `src/components/admin/QuickActions.tsx`**

```typescript
const ACTIONS = [
  { path: "/products/new", label: "Add product", primary: true },
  { path: "/products", label: "Manage products", primary: false },
  { path: "/categories", label: "Tidy categories", primary: false },
  { path: "/case-studies/new", label: "Add case study", primary: false },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/admin/QuickActions.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/QuickActions.tsx src/components/admin/QuickActions.test.tsx
git commit -m "feat(admin): swap View enquiries for Add case study in quick actions"
```

---

### Task 17: Dashboard: 5th stat tile + pending callout

**Files:**
- Modify: `src/app/admin/(dashboard)/page.tsx`

- [ ] **Step 1: Update the dashboard page**

Replace the body of `src/app/admin/(dashboard)/page.tsx`. The full file:

```typescript
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardStats, getRecentSites } from "@/lib/data/admin";
import { adminDisplayName } from "@/lib/greeting";
import { StatCard } from "@/components/admin/StatCard";
import { DashboardBanner } from "@/components/admin/DashboardBanner";
import { RecentSites } from "@/components/admin/RecentSites";
import { QuickActions } from "@/components/admin/QuickActions";
import { PendingApprovalCallout } from "@/components/admin/PendingApprovalCallout";

const iconClass = "h-5 w-5";

const ICONS = {
  globe: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  ),
  check: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  pencil: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  tag: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.6 13.4 13 21a1.9 1.9 0 0 1-2.7 0L3 13.7V4h9.7l7.9 7.9a1.9 1.9 0 0 1 0 1.5Z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  ),
  briefcase: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, recentSites] = await Promise.all([
    getDashboardStats(),
    getRecentSites(),
  ]);

  const name = adminDisplayName(user ?? { user_metadata: {} });

  return (
    <div className="space-y-8 p-8">
      <DashboardBanner
        name={name}
        totalSites={stats.totalSites}
        addedThisWeek={stats.sitesAddedThisWeek}
      />

      <PendingApprovalCallout count={stats.pendingCaseStudyApprovals} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total products" value={stats.totalSites} icon={ICONS.globe} />
        <StatCard label="Published" value={stats.publishedSites} icon={ICONS.check} />
        <StatCard label="Drafts" value={stats.draftSites} icon={ICONS.pencil} />
        <StatCard label="Categories" value={stats.categories} icon={ICONS.tag} />
        <StatCard label="Case studies" value={stats.caseStudyCount} icon={ICONS.briefcase} />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:flex-[2]">
          <RecentSites sites={recentSites} />
        </div>
        <div className="lg:flex-[1]">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (with `dangerouslyDisableSandbox: true`)
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/page.tsx"
git commit -m "feat(admin): add case studies stat tile + pending approval callout"
```

---

## Part H — Verification + push

### Task 18: Full verification + push to main

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: PASS — all tests (previous + new) green. Should be ~155 tests passing.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no output).

- [ ] **Step 3: Run production build**

Run: `npm run build` (with `dangerouslyDisableSandbox: true`)
Expected: PASS. The route table should include:
- `/admin/case-studies`
- `/admin/case-studies/new`
- `/admin/case-studies/[id]/edit`

- [ ] **Step 4: Push to origin/main**

```bash
git push origin main
```

Expected: push succeeds, Vercel kicks off a deploy.

- [ ] **Step 5: Smoke check after deploy (manual)**

Open `https://admin.8caps.co.uk/case-studies` (or your preview deploy):
1. Sign in if needed
2. Confirm the list shows all 7 seeded case studies, each with 🟡 Pending and an [Approve] button
3. Click [Approve] on one row → it should flip to ✅ Live and the dashboard pending count should drop by 1
4. Open `/admin/case-studies/[id]/edit` for the just-approved row → toggling "Testimonial approved" off and saving should re-pend it
5. Visit the public `/work` page → the approved case study should appear; the rest should not

---

## Self-Review (from writing-plans skill)

**Spec coverage:**
- ✅ List view with status pills + quick approve — Task 11
- ✅ Edit form mirroring SiteForm — Task 10
- ✅ Dashboard pending callout + 5th stat tile — Tasks 9, 17
- ✅ Sidebar entry — Task 15
- ✅ QuickActions swap — Task 16
- ✅ Server actions (create/update/delete/approve/revoke) — Task 5
- ✅ Schema validation — Task 2
- ✅ Status helper — Task 3
- ✅ Data readers — Task 4
- ✅ Filters via URL — Task 12

**Placeholder scan:** No TBDs, no "implement later", every code block contains actual code, every step has an exact command.

**Type consistency:**
- `CaseStudyFormValues` defined in Task 1, used in Tasks 2, 5, 10, 13, 14 — all field names match
- `AdminCaseStudyRow` defined in Task 1, used in Tasks 4, 11 — fields match
- `statusFor` signature in Task 3 takes `{ publishStatus, testimonialApprovedAt }`; used by `CaseStudyList` in Task 11 with the same shape
- `approveCaseStudy(id)` in Task 5, called by `CaseStudyApproveButton` in Task 8 — same single-arg signature
- All action returns are `ActionResult` (from `@/types/domain`) — consistent

No issues found.
