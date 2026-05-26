# Admin Case Studies CRUD — Design

**Date:** 2026-05-26
**Status:** Approved

## Summary

Add a dedicated `/admin/case-studies` section so case studies (the data behind
the public `/work` page) can be managed through the UI instead of via raw SQL.
The biggest current pain point is testimonial approval: each case study starts
with `testimonial_approved_at = NULL`, hidden from the public site by RLS, and
the only way to flip it on is a hand-written `UPDATE` in the Supabase SQL
editor. This CRUD lets the admin (and the rest of the team) manage approval,
copy, logos, services, tech stack, featured flag, and sort order through the
admin dashboard.

The data model is unchanged. This is a UI feature, not a schema change.

---

## Goals

1. One-click testimonial approval / revocation from the admin UI
2. Full create / edit / delete for case studies
3. Visibility of approval status — both in the list view and on the dashboard
4. Match the existing admin patterns (Sites form, Sidebar, QuickActions) so
   the new section feels native

## Non-goals (out of scope for v1)

- Bulk approval (rare workflow — ~7 cases at a time, single-clicking is fine)
- Approval audit log (who approved, change history)
- Email notification to client on approval
- "Duplicate from existing" workflow
- AI-assisted creation (case studies are agency-authored, not URL-analysed)
- Sector/service filtering on the list page (keep v1 lean — search + status
  filters cover the day-to-day need)
- Schema changes to `case_studies`

---

## Affected areas

### New routes (3)

```
/admin/case-studies              List + filters + quick approve
/admin/case-studies/new          Create form
/admin/case-studies/[id]/edit    Edit + delete + approval toggle
```

On the admin subdomain these surface as `admin.8caps.co.uk/case-studies/*`
(the middleware rewrite strips the `/admin` prefix automatically — no extra
work needed). The `useAdminPath` / `getAdminBasePath` helpers handle href
construction throughout.

### List view (`/admin/case-studies`)

- **Table columns:** Client (links to edit) · Sector · Year · Featured ⭐ ·
  Status pill · Actions
- **Status pill** per row: yellow "🟡 Pending" when `testimonial_approved_at`
  is null, green "✅ Live" otherwise
- **Quick action button:** pending rows get an inline `[Approve]` button that
  fires the `approveCaseStudy` server action and revalidates the page; live
  rows just get `[Edit]`
- **Search:** by `client_name` (case-insensitive `ilike`)
- **Filter chips** above the table: `All` (default) · `Pending approval` ·
  `Live` · `Featured`. Filters are URL-driven (`?status=pending&search=...`)
  so the dashboard callout can deep-link straight to `?status=pending`
- **Top-right CTA:** `+ Add case study`

### Edit form (`/admin/case-studies/[id]/edit` and `/new`)

Single-page form, same multi-section visual rhythm as `SiteForm`:

| Section | Fields |
|---|---|
| **Basics** | `client_name`, `slug` (auto from name, manual override unlocks once edited), `client_sector` (free text), `year` (number, optional), `logo_url` (image upload via existing `useUpload`), `brand_colour` (HTML5 colour picker + hex text input) |
| **Story** | `outcome_headline` (single line), `story_problem` (textarea), `story_solution` (textarea) |
| **Testimonial** | `testimonial_quote` (textarea), `testimonial_author`, `testimonial_role` (optional), **Testimonial approved** toggle (with "Approved YYYY-MM-DD" label when on; toggling off revokes) |
| **Classification** | `services` (multi-select chips from the `CaseStudyService` enum, using `CASE_STUDY_SERVICE_LABELS` for display), `tech_stack` (tag input — type + Enter to add, X to remove) |
| **Display** | `is_featured` toggle, `sort_order` (number) |

- **New page:** blank form, all defaults, `testimonial_approved_at` defaults
  to null (Pending)
- **Edit page:** prefilled, with a `[Delete]` button top-right (matches
  Sites' `DeleteSiteButton` confirm-then-delete pattern)
- **No URL analyzer / AI assist**

### Dashboard additions (`/admin`)

Modifies `src/app/admin/(dashboard)/page.tsx` and related components:

- **New pending-approval callout** (rendered only when `pendingCount > 0`):
  a yellow band above the stat row with "⚠️ N case studies pending approval
  — Review" linking to `/admin/case-studies?status=pending`. New component:
  `PendingApprovalCallout`.
- **5th stat tile** added to the stats grid: "Case studies" (count of all
  case studies, regardless of approval state), linking to the list view.
  Grid switches from 4 columns to a 5-column layout on `lg` (responsive
  to 2-col on `sm`).
- **Sidebar** (`src/components/admin/Sidebar.tsx`) gains a new nav item
  "Case studies" between Products and Categories.
- **QuickActions** swaps "View enquiries" out and adds "Add case study"
  (the Enquiries page is still a stub; once it's real we can re-add).

---

## Data layer

### New module: `src/lib/data/case-studies-admin.ts`

```typescript
// Admin reads — bypass RLS via the server client; include pending rows.
listAdminCaseStudies(filter?: {
  search?: string;
  status?: "pending" | "live" | "featured";
}): Promise<AdminCaseStudyRow[]>

getCaseStudyForEdit(id: string): Promise<AdminCaseStudy | null>

getPendingApprovalCount(): Promise<number>
```

- `listAdminCaseStudies` orders by `is_featured desc, sort_order asc`,
  applies search via `ilike("client_name", `%${search}%`)`, and translates
  the `status` filter into the right `is`/`not.is` clause on
  `testimonial_approved_at` (plus `is_featured = true` for "featured").
- `getCaseStudyForEdit` fetches the row including the M2M
  `case_study_services` rows, mapped to the form shape.
- `getPendingApprovalCount` runs `count` on rows where
  `testimonial_approved_at` is null — used by the dashboard callout.

### New row/type shapes

`src/types/case-study.ts` already exports `CaseStudy` (public-shaped, no
approval field). For admin we add:

```typescript
export interface AdminCaseStudy extends CaseStudy {
  testimonialApprovedAt: string | null; // ISO timestamp or null
}

export interface AdminCaseStudyRow {
  id: string;
  clientName: string;
  clientSector: string | null;
  year: number | null;
  isFeatured: boolean;
  testimonialApprovedAt: string | null;
}

export interface CaseStudyFormValues {
  clientName: string;
  slug: string;
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
  services: CaseStudyService[];
  isFeatured: boolean;
  sortOrder: number;
  testimonialApproved: boolean; // form-side bool; mapped to NOW()/null on save
}
```

### New server actions: `src/app/admin/(dashboard)/case-studies/actions.ts`

```typescript
createCaseStudy(values: CaseStudyFormValues): Promise<ActionResult>
updateCaseStudy(id: string, values: CaseStudyFormValues): Promise<ActionResult>
deleteCaseStudy(id: string): Promise<ActionResult>
approveCaseStudy(id: string): Promise<ActionResult>      // list-view quick action
revokeApproval(id: string): Promise<ActionResult>        // edit-page toggle off
```

- `createCaseStudy` / `updateCaseStudy` upsert the row and replace
  `case_study_services` child rows on every save (same delete-then-insert
  pattern that `writeChildren` already uses for sites)
- `approveCaseStudy` writes `testimonial_approved_at = now()`
- `revokeApproval` writes `testimonial_approved_at = null`
- All four mutating actions call `revalidatePath("/work")` and
  `revalidatePath("/work/[slug]", "page")` so the public site reflects
  changes immediately. Approve/revoke also revalidate the homepage
  (featured case studies block) via `revalidatePath("/")`.
- All return-typed `redirect()` flows for the create/update happy path use
  the existing `getAdminBasePath()` + `adminPath()` helpers (i.e.
  `redirect(adminPath(basePath, "/case-studies"))`).

### Schema validation

Extend `src/lib/schemas.ts` with `caseStudyFormSchema` (Zod):

- `clientName`, `slug`, `outcomeHeadline`, `storyProblem`, `storySolution`,
  `testimonialQuote`, `testimonialAuthor` are required, non-empty strings
- `slug` matches `/^[a-z0-9-]+$/` (matches existing `sites.slug` rule)
- `year` is optional integer between 2000 and current year + 1
- `brandColour` is optional hex `/^#[0-9a-f]{6}$/i`
- `services` is `CaseStudyService[]` (zod enum)
- `techStack` is `string[]` with each entry trimmed and non-empty
- `sortOrder` is integer ≥ 0

---

## Component reuse and additions

### Reused

- `useUpload` (Supabase Storage) for logo uploads
- `DeleteSiteButton` pattern → adapt to a generic `DeleteButton` or copy with
  case-study-specific copy
- `Sidebar`, `QuickActions`, `DashboardBanner` — all updated with new entries
- `AdminPathContext` / `useAdminPath` for hrefs

### New components (`src/components/admin/`)

- `CaseStudyForm.tsx` — the multi-section edit/create form (mirrors
  `SiteForm`'s structure)
- `CaseStudyList.tsx` — the table with search, filter chips, and per-row
  approve button. Server-rendered with client-side filter form via
  `<form method="get">` (no extra client state needed — URL is the source
  of truth)
- `CaseStudyApproveButton.tsx` — a client component that wraps the
  `approveCaseStudy` action in a server action form; renders the
  `[Approve]` button on pending rows
- `ServicesPicker.tsx` — chip multi-select for the `CaseStudyService` enum
  (could go in `case-studies/` subfolder if it stays case-study specific)
- `TagInput.tsx` — generic tag input for `tech_stack` (type + Enter to add)
- `PendingApprovalCallout.tsx` — dashboard banner; takes `count` and
  renders the yellow band when > 0

---

## URL routing and host behaviour

No middleware changes needed. The existing `decideRoute` logic already
handles arbitrary `/admin/*` paths:

- Apex `8caps.co.uk/admin/case-studies/*` → 308 to subdomain
- Subdomain `admin.8caps.co.uk/case-studies/*` → internal rewrite to
  `/admin/case-studies/*`
- Localhost / preview deploys → `/admin/case-studies/*` works directly

The new sidebar/links use `useAdminPath("/case-studies/...")` and
`adminPath(basePath, "/case-studies/...")` so they render correctly on
both hosts.

---

## Testing

Following the existing project pattern (heavy on pure-function unit tests
+ component render tests, no server-action integration tests):

### Pure / lib tests

- `caseStudyFormSchema` validation: required fields, slug format, year
  bounds, hex colour, services enum
- A small `case-study-status.ts` helper exporting
  `statusFor(testimonialApprovedAt)` → `"pending" | "live"` — easily tested
- List filter logic: `filterCaseStudies(rows, { search, status })` if we
  end up filtering server-side via Supabase query options instead of
  in-memory, then the test moves to the data-layer integration list

### Component tests

- `CaseStudyList`: renders rows, status pills, approve button only on
  pending rows, deep-link from filter chips
- `CaseStudyForm`: renders all sections, required-field validation
  surfaces errors, services picker toggles correctly, tech-stack tag
  input adds/removes
- `PendingApprovalCallout`: renders only when `count > 0`, hides
  otherwise, links to the correct filtered URL
- `Sidebar`: updated test asserts the new "Case studies" entry

### Out of scope for v1 tests

- Server actions (matches existing project coverage — actions are not
  unit-tested today)
- E2E flows (no Playwright/Cypress in the project)

---

## Migration / rollout

Single commit + push to `main`. Vercel auto-deploys. No database changes,
no env vars, no destructive operations. After deploy:

- Existing case studies remain pending (their `testimonial_approved_at`
  is unchanged)
- Admin can immediately use the list view to approve them through the UI
- The instructions in `docs/notes.md` about running raw SQL to approve
  testimonials become obsolete (a follow-up notes update can mention the
  new UI flow)

---

## Open questions deliberately left for implementation

These are minor enough that the implementation plan can decide without
re-spec'ing:

- Exact `sort_order` increment when adding a new case study (default to
  next-highest + 10? or `max + 1`?)
- Whether to show `testimonial_approved_at`'s actual date as a hover
  tooltip on the "Live" pill
- Empty-state copy on the list view when there are zero case studies
- The 5-column stat grid breakpoint behaviour on `md` (likely a 2x3 grid
  with one tile alone on the bottom row — needs a CSS sanity check)
