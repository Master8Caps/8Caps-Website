# Admin Dashboard Refresh & Auto-Categories — Design

**Date:** 2026-05-22
**Status:** Approved

## Summary

Two related improvements to the 8Caps admin area:

1. **Auto-categories** — categories are assigned (and grown) by the AI URL
   analyzer instead of maintained by hand. The Categories page is repurposed
   from a manual editor into a tidy-up tool.
2. **Dashboard redesign** — the sparse stat-cards-and-buttons dashboard becomes
   a modern overview with a welcome banner, refreshed stat cards, a recent-sites
   feed, and a quick-actions panel.

Both changes live entirely in the admin area. The public site is unaffected
beyond categories appearing/changing as a by-product of normal use.

---

## Part 1 — Auto-Categories

### Problem

Categories are valuable for the public directory, but maintaining the category
list by hand across a growing number of websites (targeting 50+) is tedious.
The AI analyzer already picks a category from the *existing* list when a site is
added; it cannot create new ones, so the list still has to be seeded manually.

### Approach

The AI both **assigns** an existing category and **proposes new ones** when
nothing fits. The admin keeps a veto in the add-website form. The list grows as
a by-product of adding sites; the Categories page exists only to tidy it.

### Behaviour

**AI category selection (`src/lib/onboarding/analyze.ts`)**

- The analysis tool returns, for the category, either:
  - an existing category slug (current behaviour), or
  - a proposed new category name, or
  - nothing (only when no category genuinely applies — should be rare).
- The system prompt instructs the model to **strongly prefer an existing
  category** and, when proposing a new one, to keep the name **broad and
  reusable** (e.g. "Trades", not "Emergency Plumbing in Leeds").

**Result shape (`src/types/onboarding.ts`)**

`AnalysisResult` gains a field for the proposed new category. Final shape for
the category portion:

- `suggestedCategorySlug: string | null` — an existing category slug, or null.
- `suggestedNewCategory: string | null` — a proposed new category name, or null.

At most one of the two is non-null. Both null means "no category".

**Add-website form (`src/components/admin/SiteForm.tsx`)**

- The category `<select>` lists all existing categories. When the AI proposes a
  new category, an extra option is prepended and selected by default, labelled
  `✨ {name} — new category`.
- Choosing an existing category, "No category", or the proposed new option is
  the admin's override.
- Form state carries the proposed name in a new field on `SiteFormValues`:
  `newCategoryName: string | null`. When an existing category is selected,
  `categoryId` is set and `newCategoryName` is cleared; when the proposed-new
  option is selected, `categoryId` is null and `newCategoryName` holds the name.
- The `UrlAnalyzer` result panel notes when a new category is being proposed,
  alongside the existing confidence/notes display.

**Category creation on save (`src/app/admin/(dashboard)/sites/actions.ts`)**

- `createSite` / `updateSite` resolve the category before writing the site row.
  A helper `resolveCategoryId(supabase, values)`:
  - If `categoryId` is set, use it.
  - Else if `newCategoryName` is set, look up a category by case-insensitive
    name. If found, reuse it. If not, create it (slug from `slugify(name)`) and
    use the new id.
  - Else null.
- Creating the category only at site-save time means abandoned add-website
  forms never leave orphan categories behind.
- `siteFormSchema` (`src/lib/schemas.ts`) gains an optional, nullable
  `newCategoryName` string.

### Slugs are frozen on creation

A category's slug is generated **once**, when the category is first created,
and never changes again.

- Renaming a category edits only its display `name`; the slug stays put.
- This keeps public `/sites?category=<slug>` links stable forever — the slug is
  a permanent, human-readable handle, decoupled from the name.
- Accepted trade-off: after a rename the slug may drift from the name (slug
  `plumbers`, name `Plumbing & Heating`). The slug appears only in the URL query
  string, so this is invisible to users.
- Implementation change: `updateCategory` stops regenerating the slug from the
  name. `createCategory` keeps setting it once.

### Categories page becomes a tidy-up tool

Route stays `src/app/admin/(dashboard)/categories`. The manual "Add category"
input is removed. The page lists every category and supports tidying it.

**Each category row shows:**

- Name (inline-editable) and its **site count** (e.g. "Plumbers · 7 sites").
- **Rename** — saves the new name; slug unchanged.
- **Merge** — pick another category to merge *into*. All sites with this
  category are reassigned to the target, then this (now empty) category is
  deleted.
- **Delete** — removes the category; its sites become uncategorised (the
  `sites.category_id` FK is `on delete set null`). Useful for one-off junk.

**Data (`src/lib/data/admin.ts`)**

- A new admin type `AdminCategory` extends `Category` with `siteCount: number`.
  The public `Category` type is left unchanged.
- `getAdminCategories` returns `AdminCategory[]`, fetching the count via a
  Supabase aggregate (`categories` select with `sites(count)`).

**Server actions (`src/app/admin/(dashboard)/categories/actions.ts`)**

- Remove `createCategory` (no longer used).
- `updateCategory` — accepts a name only; no longer touches the slug.
- `deleteCategory` — unchanged.
- New `mergeCategory(sourceId, targetId)`:
  - `update sites set category_id = targetId where category_id = sourceId`
  - then `delete categories where id = sourceId`
  - If the second step fails, the source is left empty (harmless — deletable
    via the tidy tool). No cross-statement transaction is needed.
- All category actions revalidate the public category-bearing pages, as today.

**Component (`src/components/admin/CategoryManager.tsx`)**

Rewritten for the tidy-up role: no add form; each row gains a site count, a
merge control (a select of the other categories plus a confirm), and keeps
rename and delete. Delete and merge are guarded by a confirm dialog.

---

## Part 2 — Dashboard Redesign

### Problem

The current dashboard (`src/app/admin/(dashboard)/page.tsx`) is four stat cards
and two buttons on a plain background — functional but dated and sparse.

### Approach

A welcome banner over a two-column body: refreshed stat cards on top, a
recent-sites feed beside a quick-actions panel below. Chosen layout combines a
welcome banner with a stats + activity-feed body. Uses only the existing 8Caps
palette and fonts; no new dependencies.

### Components

**`DashboardBanner.tsx` (new)**

- Oxford-blue background reusing the `.band-surface` dot-grid style.
- Time-aware greeting: "Good morning/afternoon/evening, {name}".
- `name` resolves from the Supabase user: `user_metadata.display_name` →
  `user_metadata.full_name` → the email local-part → "there".
- One-line summary: total websites and a count added this week.
- Primary "+ Add a website" button linking to `/admin/sites/new`.

**`StatCard.tsx` (updated)**

- Same four counts (Total websites / Published / Drafts / Categories).
- Adds a small inline SVG icon in a soft-blue tile. SVGs are hand-written in the
  component; no icon-library dependency.

**`RecentSites.tsx` (new)** — bottom-left panel, 2/3 width.

- The last 5 websites by `created_at`, newest first.
- Each row: website name · category name, a Published/Draft status pill, and a
  link to that site's edit page (`/admin/sites/{id}/edit`).
- A "View all →" link to `/admin/sites`.

**`QuickActions.tsx` (new)** — bottom-right panel, 1/3 width.

- Links: Add website, Manage websites, Tidy categories, View enquiries.

### Data (`src/lib/data/admin.ts`)

- `getDashboardStats()` — gains a `sitesAddedThisWeek` count (sites with
  `created_at` within the last 7 days). The `DashboardStats` type in
  `src/types/domain.ts` gains the matching field.
- `getRecentSites(limit = 5)` — new. Returns id, name, `publish_status`, and
  category name for the most recently created sites.

### Page composition

`src/app/admin/(dashboard)/page.tsx` is recomposed to render
`DashboardBanner`, the `StatCard` row, then a flex row of `RecentSites` and
`QuickActions`. The page fetches the current user (for the greeting name)
in addition to the stats and recent sites.

### One-off setup

The Supabase user `master@8caps.co.uk` has no display name. As a build step,
set `user_metadata.display_name` to "James" on that account so the greeting
reads "Good morning, James". This is a data change applied during
implementation, not part of the code.

---

## Out of Scope

- Charts or time-series analytics on the dashboard.
- Bulk re-categorisation of existing sites — they keep their current categories.
- A category redirect/slug-history system — frozen slugs make it unnecessary.
- Any change to the public directory's look or behaviour.

## Testing

- Unit tests follow existing patterns (Vitest, co-located `*.test.tsx`).
- `resolveCategoryId` — covers existing-id, new-name-creates, new-name-reuses
  (case-insensitive), and no-category paths.
- `mergeCategory` — sites reassigned to target, source deleted.
- `slugify` already tested; verify `updateCategory` no longer regenerates slug.
- Dashboard data functions — `getRecentSites` ordering and limit.
