# Admin Dashboard Refresh & Auto-Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the AI assign and grow the category list automatically, turn the Categories page into a tidy-up tool, and redesign the admin dashboard with a welcome banner, refreshed stat cards, a recent-sites feed and a quick-actions panel.

**Architecture:** The AI URL analyzer gains the ability to propose a new category; new categories are created at site-save time (no orphans); category slugs are frozen on creation so public links never break. The Categories page is repurposed for renaming, merging and deleting. The dashboard is recomposed from new presentational components fed by extended data-layer functions.

**Tech Stack:** Next.js (App Router, server components + server actions), TypeScript, Supabase, Zod, Tailwind v4, Vitest + Testing Library.

---

## Notes for the implementer

- Run commands from the project root: `C:\Users\James\OneDrive\Documents\SaaS Products\8Caps`.
- `npm test` runs Vitest once; `npm run typecheck` runs `tsc --noEmit`; `npm run build` runs the Next.js build.
- ⚠️ `npm run build` and any `npm install` need the sandbox disabled (`dangerouslyDisableSandbox: true` on the Bash call) — they fail with `ECONNRESET` otherwise.
- The repo tests **pure functions and components** only; it has no Supabase-mocking harness. Tasks that touch the database are implemented directly and verified with `npm run typecheck` + `npm run build` + a manual check, matching the existing codebase.
- Commit after every task.

---

## Part A — Auto-Categories

### Task 1: Types and schemas

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/types/onboarding.ts`
- Modify: `src/lib/schemas.ts`
- Test: `src/lib/schemas.test.ts`

- [ ] **Step 1: Add the failing schema tests**

Replace the `categorySchema` import and its `describe` block in `src/lib/schemas.test.ts`. The file's top import becomes:

```ts
import { siteFormSchema, categoryRenameSchema } from "./schemas";
```

Add `newCategoryName: null` to the `validSite` fixture object (alongside `categoryId: null`).

Replace the whole `describe("categorySchema", ...)` block with:

```ts
describe("siteFormSchema — newCategoryName", () => {
  it("accepts a string newCategoryName", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, newCategoryName: "Trades" })
        .success,
    ).toBe(true);
  });

  it("accepts a null newCategoryName", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, newCategoryName: null })
        .success,
    ).toBe(true);
  });
});

describe("categoryRenameSchema", () => {
  it("accepts a non-empty name", () => {
    expect(categoryRenameSchema.safeParse({ name: "Trades" }).success).toBe(
      true,
    );
  });

  it("rejects an empty name", () => {
    expect(categoryRenameSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/schemas.test.ts`
Expected: FAIL — `categoryRenameSchema` is not exported; `validSite` rejected unless `newCategoryName` is in the schema.

- [ ] **Step 3: Update `src/lib/schemas.ts`**

In `siteFormSchema`, add this field (place it just after the `categoryId` line):

```ts
  newCategoryName: z.string().nullable(),
```

Delete the `categorySchema` declaration and the `CategoryInput` type export. Add in their place:

```ts
export const categoryRenameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
```

The remaining `SiteFormInput` export stays as-is.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Update `src/types/domain.ts`**

Add `newCategoryName` to `SiteFormValues` (just after the `categoryId` line):

```ts
  newCategoryName: string | null;
```

Add `sitesAddedThisWeek` to `DashboardStats`:

```ts
export interface DashboardStats {
  totalSites: number;
  publishedSites: number;
  draftSites: number;
  categories: number;
  sitesAddedThisWeek: number;
}
```

Add these two new interfaces at the end of the file:

```ts
/** A category with its site count, for the admin tidy-up tool. */
export interface AdminCategory extends Category {
  siteCount: number;
}

/** A site row in the dashboard "recently added" panel. */
export interface RecentSite {
  id: string;
  name: string;
  publishStatus: PublishStatus;
  categoryName: string | null;
}
```

- [ ] **Step 6: Update `src/types/onboarding.ts`**

In the `AnalysisResult` interface, add `suggestedNewCategory` directly after `suggestedCategorySlug`:

```ts
  /** A slug from the existing category list, or null if none fits. */
  suggestedCategorySlug: string | null;
  /** A proposed new category name when no existing category fits, else null. */
  suggestedNewCategory: string | null;
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: Errors only in files updated by later tasks (`analyze.ts`, `admin.ts`, `SiteForm.tsx`, `sites/actions.ts`, `categories/actions.ts`, `CategoryManager.tsx`, `getSiteForEdit`). That is expected — those are fixed in their own tasks. No errors in `schemas.ts`, `domain.ts`, `onboarding.ts`.

- [ ] **Step 8: Commit**

```bash
git add src/types/domain.ts src/types/onboarding.ts src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat: add types and schema for auto-categories"
```

---

### Task 2: AI analyzer proposes new categories

**Files:**
- Modify: `src/lib/onboarding/analyze.ts`

No unit test — this module calls the Claude API and has no existing test. Verified by typecheck and the end-to-end manual check in Task 16.

- [ ] **Step 1: Update the system prompt**

In `src/lib/onboarding/analyze.ts`, replace the single category rule line in `SYSTEM_PROMPT`:

```
- Choose the single best-fitting category SLUG from the provided list, or null \
if none genuinely fits.
```

with:

```
- For the category: strongly prefer an existing category — set \
"suggestedCategorySlug" to the best-fitting slug from the provided list. Only \
if no existing category genuinely fits, leave "suggestedCategorySlug" null and \
set "suggestedNewCategory" to a short, broad, reusable category name (e.g. \
"Trades", not "Emergency Plumbing in Leeds"). Never set both.
```

- [ ] **Step 2: Add the tool input property**

In the `TOOL` definition's `properties`, add directly after `suggestedCategorySlug`:

```ts
      suggestedNewCategory: {
        type: ["string", "null"],
        description:
          "A new broad category name when no existing category fits, else null",
      },
```

Add `"suggestedNewCategory"` to the `required` array (right after `"suggestedCategorySlug"`).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No errors in `analyze.ts` (the `AnalysisResult` cast at the end still holds — Task 1 added the field).

- [ ] **Step 4: Commit**

```bash
git add src/lib/onboarding/analyze.ts
git commit -m "feat: let the AI propose a new category"
```

---

### Task 3: getAdminCategories returns site counts

**Files:**
- Modify: `src/lib/data/admin.ts`

Database-touching change — verified by typecheck and build.

- [ ] **Step 1: Update the import and `getAdminCategories`**

In `src/lib/data/admin.ts`, add `AdminCategory` to the type import from `@/types/domain`.

Replace the whole `getAdminCategories` function with:

```ts
interface AdminCategoryRaw {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sites: { count: number }[];
}

/** All categories with their site counts, alphabetical. */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, sites (count)")
    .order("name");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);

  return ((data ?? []) as unknown as AdminCategoryRaw[]).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    siteCount: c.sites[0]?.count ?? 0,
  }));
}
```

(`AdminCategory` extends `Category`, so callers that expect `Category[]` — `SiteForm`, the analyzer route — keep working unchanged.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No new errors in `admin.ts`. (`getSiteForEdit` will still error until Task 5 — that is expected.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/admin.ts
git commit -m "feat: include site counts in getAdminCategories"
```

---

### Task 4: Category server actions — simplify, drop create, add merge

**Files:**
- Modify: `src/app/admin/(dashboard)/categories/actions.ts`

- [ ] **Step 1: Rewrite the actions file**

Replace the entire contents of `src/app/admin/(dashboard)/categories/actions.ts` with:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { categoryRenameSchema } from "@/lib/schemas";
import type { ActionResult } from "@/types/domain";

function revalidateCategoryPages() {
  revalidatePath("/");
  revalidatePath("/sites");
  revalidatePath("/admin/categories");
}

/** Rename a category. The slug is frozen on creation and never changes. */
export async function updateCategory(
  id: string,
  name: string,
): Promise<ActionResult> {
  const parsed = categoryRenameSchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

/** Delete a category. Its sites become uncategorised (FK is ON DELETE SET NULL). */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPages();
  return { ok: true };
}

/** Move every site from `sourceId` to `targetId`, then delete the source. */
export async function mergeCategory(
  sourceId: string,
  targetId: string,
): Promise<ActionResult> {
  if (sourceId === targetId) {
    return { ok: false, error: "Cannot merge a category into itself." };
  }
  const supabase = await createServerSupabase();

  const reassign = await supabase
    .from("sites")
    .update({ category_id: targetId })
    .eq("category_id", sourceId);
  if (reassign.error) return { ok: false, error: reassign.error.message };

  const del = await supabase.from("categories").delete().eq("id", sourceId);
  if (del.error) return { ok: false, error: del.error.message };

  revalidateCategoryPages();
  return { ok: true };
}
```

(`createCategory` is removed — categories are now born from the AI in Task 5.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors in `categories/actions.ts`. (`CategoryManager.tsx` still errors — fixed in Task 7.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/categories/actions.ts"
git commit -m "feat: replace category create with merge + name-only rename"
```

---

### Task 5: Resolve categories on site save

**Files:**
- Modify: `src/app/admin/(dashboard)/sites/actions.ts`
- Modify: `src/lib/data/admin.ts` (one line in `getSiteForEdit`)

- [ ] **Step 1: Add `newCategoryName` to the edit-form mapping**

In `src/lib/data/admin.ts`, inside `getSiteForEdit`'s returned object, add directly after `categoryId: row.category_id,`:

```ts
    newCategoryName: null,
```

- [ ] **Step 2: Add `resolveCategoryId` to the sites actions**

In `src/app/admin/(dashboard)/sites/actions.ts`, add the import for `slugify`:

```ts
import { slugify } from "@/lib/slugify";
```

Add this helper above `createSite`:

```ts
type CategoryResolution =
  | { ok: true; categoryId: string | null }
  | { ok: false; error: string };

/**
 * Decide a site's `category_id`. An explicit `categoryId` wins. Otherwise a
 * `newCategoryName` is matched case-insensitively to an existing category, or
 * a fresh category is created with a slug frozen at creation time.
 */
async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  values: SiteFormValues,
): Promise<CategoryResolution> {
  if (values.categoryId) {
    return { ok: true, categoryId: values.categoryId };
  }
  const name = values.newCategoryName?.trim();
  if (!name) return { ok: true, categoryId: null };

  const existing = await supabase
    .from("categories")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (existing.error) return { ok: false, error: existing.error.message };
  if (existing.data) return { ok: true, categoryId: existing.data.id };

  const created = await supabase
    .from("categories")
    .insert({ name, slug: slugify(name) })
    .select("id")
    .single();
  if (created.error) {
    return { ok: false, error: `Could not create category: ${created.error.message}` };
  }
  return { ok: true, categoryId: created.data.id };
}
```

- [ ] **Step 3: Wire `resolveCategoryId` into `createSite`**

In `createSite`, replace the `supabase` insert block. After `const supabase = await createServerSupabase();` add:

```ts
  const category = await resolveCategoryId(supabase, parsed.data);
  if (!category.ok) return { ok: false, error: category.error };
```

Then change the insert to override `category_id`:

```ts
  const { data, error } = await supabase
    .from("sites")
    .insert({ ...toSiteRow(parsed.data), category_id: category.categoryId })
    .select("id")
    .single();
```

- [ ] **Step 4: Wire `resolveCategoryId` into `updateSite`**

In `updateSite`, after `const supabase = await createServerSupabase();` add:

```ts
  const category = await resolveCategoryId(supabase, parsed.data);
  if (!category.ok) return { ok: false, error: category.error };
```

Then change the update call:

```ts
  const { error } = await supabase
    .from("sites")
    .update({ ...toSiteRow(parsed.data), category_id: category.categoryId })
    .eq("id", id);
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: No errors in `sites/actions.ts` or `admin.ts`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(dashboard)/sites/actions.ts" src/lib/data/admin.ts
git commit -m "feat: create or match a category when saving a site"
```

---

### Task 6: SiteForm — proposed-category dropdown

**Files:**
- Modify: `src/components/admin/SiteForm.tsx`
- Test: `src/components/admin/SiteForm.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/SiteForm.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteForm } from "./SiteForm";
import type { Category, SiteFormValues } from "@/types/domain";

const categories: Category[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Finance", slug: "finance", description: null },
];

const withProposal: SiteFormValues = {
  name: "Acme",
  slug: "acme",
  url: "https://acme.com",
  logoUrl: null,
  shortSummary: "Summary",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  newCategoryName: "Trades",
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

describe("SiteForm category select", () => {
  it("shows a 'new category' option when newCategoryName is set", () => {
    render(
      <SiteForm
        initial={withProposal}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(
      screen.getByRole("option", { name: /Trades — new category/ }),
    ).toBeInTheDocument();
  });

  it("does not show a 'new category' option when newCategoryName is null", () => {
    render(
      <SiteForm
        initial={{ ...withProposal, newCategoryName: null }}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(screen.queryByRole("option", { name: /new category/ })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/admin/SiteForm.test.tsx`
Expected: FAIL — the `newCategoryName` field is missing from `EMPTY`, and no "new category" option is rendered.

- [ ] **Step 3: Add `newCategoryName` to the `EMPTY` constant**

In `src/components/admin/SiteForm.tsx`, in the `EMPTY` object add directly after `categoryId: null,`:

```ts
  newCategoryName: null,
```

- [ ] **Step 4: Track the AI's proposal in local state**

Just after the `useState`/`useTransition`/`useUpload` lines in `SiteForm`, add:

```tsx
  const [proposedCategory, setProposedCategory] = useState<string | null>(
    initial?.newCategoryName ?? null,
  );
  const NEW_CATEGORY = "__new_category__";
```

- [ ] **Step 5: Set the proposal in `applyAnalysis`**

In `applyAnalysis`, replace the `const category = ...` line and the `categoryId` line of the `setValues` object so the analyzer result drives both fields. Replace:

```tsx
    const category = categories.find(
      (c) => c.slug === result.suggestedCategorySlug,
    );
```

with:

```tsx
    const category = categories.find(
      (c) => c.slug === result.suggestedCategorySlug,
    );
    setProposedCategory(result.suggestedNewCategory);
```

Then in the same function's `setValues` call, replace `categoryId: category?.id ?? v.categoryId,` with:

```tsx
      categoryId: category?.id ?? null,
      newCategoryName: result.suggestedNewCategory,
```

- [ ] **Step 6: Render the proposal in the category `<select>`**

Replace the category `<select>` block (the one with `value={values.categoryId ?? ""}`) with:

```tsx
        <select
          value={
            values.newCategoryName ? NEW_CATEGORY : values.categoryId ?? ""
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === NEW_CATEGORY) {
              setValues((prev) => ({
                ...prev,
                categoryId: null,
                newCategoryName: proposedCategory,
              }));
            } else {
              setValues((prev) => ({
                ...prev,
                categoryId: v || null,
                newCategoryName: null,
              }));
            }
          }}
          className={field}
          style={fieldStyle}
        >
          <option value="">No category</option>
          {proposedCategory && (
            <option value={NEW_CATEGORY}>
              ✨ {proposedCategory} — new category
            </option>
          )}
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- src/components/admin/SiteForm.test.tsx`
Expected: PASS

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: No errors in `SiteForm.tsx`.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/SiteForm.tsx src/components/admin/SiteForm.test.tsx
git commit -m "feat: offer the AI's proposed category in the site form"
```

---

### Task 7: Surface the proposed category in UrlAnalyzer

**Files:**
- Modify: `src/components/admin/UrlAnalyzer.tsx`

- [ ] **Step 1: Add a "new category" note to the result panel**

In `src/components/admin/UrlAnalyzer.tsx`, inside the `{analysis && (...)}` block, add directly after the `confidence` `<p>` and before the `{analysis.notes && ...}` line:

```tsx
          {analysis.suggestedNewCategory && (
            <p className="mt-1 text-ink-muted">
              <span className="font-semibold">New category proposed:</span>{" "}
              {analysis.suggestedNewCategory}
            </p>
          )}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors in `UrlAnalyzer.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/UrlAnalyzer.tsx
git commit -m "feat: note a proposed new category in the analyzer panel"
```

---

### Task 8: Categories page becomes a tidy-up tool

**Files:**
- Modify: `src/components/admin/CategoryManager.tsx`
- Modify: `src/app/admin/(dashboard)/categories/page.tsx`
- Test: `src/components/admin/CategoryManager.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/CategoryManager.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryManager } from "./CategoryManager";
import type { AdminCategory } from "@/types/domain";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const categories: AdminCategory[] = [
  { id: "a", name: "Finance", slug: "finance", description: null, siteCount: 7 },
  { id: "b", name: "Trades", slug: "trades", description: null, siteCount: 0 },
];

describe("CategoryManager", () => {
  it("shows each category's site count", () => {
    render(<CategoryManager categories={categories} />);
    expect(screen.getByText(/7 sites/)).toBeInTheDocument();
    expect(screen.getByText(/0 sites/)).toBeInTheDocument();
  });

  it("has no 'add category' control", () => {
    render(<CategoryManager categories={categories} />);
    expect(
      screen.queryByPlaceholderText(/new category name/i),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/admin/CategoryManager.test.tsx`
Expected: FAIL — `CategoryManager` still expects `Category[]`, still renders the add form, shows no counts.

- [ ] **Step 3: Rewrite `CategoryManager.tsx`**

Replace the entire contents of `src/components/admin/CategoryManager.tsx` with:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategory } from "@/types/domain";
import {
  updateCategory,
  deleteCategory,
  mergeCategory,
} from "@/app/admin/(dashboard)/categories/actions";

const field = "rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };

export function CategoryManager({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  if (categories.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No categories yet — they appear here automatically as you add websites.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {categories.map((c) => (
        <CategoryRow
          key={c.id}
          category={c}
          others={categories.filter((o) => o.id !== c.id)}
          disabled={pending}
          onRename={(name) => run(() => updateCategory(c.id, name))}
          onMerge={(targetId) => run(() => mergeCategory(c.id, targetId))}
          onDelete={() => run(() => deleteCategory(c.id))}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  others,
  disabled,
  onRename,
  onMerge,
  onDelete,
}: {
  category: AdminCategory;
  others: AdminCategory[];
  disabled: boolean;
  onRename: (name: string) => void;
  onMerge: (targetId: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [mergeTarget, setMergeTarget] = useState("");

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
      <span className="text-sm text-ink-muted">
        {category.siteCount} {category.siteCount === 1 ? "site" : "sites"}
      </span>
      <button
        type="button"
        disabled={disabled || name.trim() === category.name}
        onClick={() => onRename(name.trim())}
        className="rounded-lg border px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
        style={fieldStyle}
      >
        Rename
      </button>

      <span className="ml-auto flex items-center gap-2">
        <select
          value={mergeTarget}
          onChange={(e) => setMergeTarget(e.target.value)}
          className={field}
          style={fieldStyle}
          disabled={disabled || others.length === 0}
        >
          <option value="">Merge into…</option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || !mergeTarget}
          onClick={() => {
            const target = others.find((o) => o.id === mergeTarget);
            if (
              target &&
              confirm(
                `Move all sites from "${category.name}" into "${target.name}" and delete "${category.name}"?`,
              )
            ) {
              onMerge(mergeTarget);
            }
          }}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
          style={fieldStyle}
        >
          Merge
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (
              confirm(
                `Delete "${category.name}"? Sites in it become uncategorised.`,
              )
            ) {
              onDelete();
            }
          }}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
        >
          Delete
        </button>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Update the categories page copy**

In `src/app/admin/(dashboard)/categories/page.tsx`, replace the description paragraph text:

```tsx
      <p className="mt-1 text-sm text-ink-muted">
        Categories are assigned automatically as you add websites. Use this page
        to rename, merge duplicates, or remove ones you don&apos;t need.
      </p>
```

(The `getAdminCategories` import and `CategoryManager` usage stay unchanged — `getAdminCategories` now returns `AdminCategory[]`.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/components/admin/CategoryManager.test.tsx`
Expected: PASS

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/CategoryManager.tsx src/components/admin/CategoryManager.test.tsx "src/app/admin/(dashboard)/categories/page.tsx"
git commit -m "feat: turn the categories page into a tidy-up tool"
```

---

## Part B — Dashboard Redesign

### Task 9: Greeting and display-name helpers

**Files:**
- Create: `src/lib/greeting.ts`
- Test: `src/lib/greeting.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/greeting.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { greetingFor, adminDisplayName } from "./greeting";

describe("greetingFor", () => {
  it("says good morning before noon", () => {
    expect(greetingFor(9)).toBe("Good morning");
  });
  it("says good afternoon from noon", () => {
    expect(greetingFor(13)).toBe("Good afternoon");
  });
  it("says good evening from 18:00", () => {
    expect(greetingFor(20)).toBe("Good evening");
  });
});

describe("adminDisplayName", () => {
  it("uses the display name when present", () => {
    expect(
      adminDisplayName({
        user_metadata: { display_name: "James" },
        email: "master@8caps.co.uk",
      }),
    ).toBe("James");
  });
  it("falls back to the email local-part", () => {
    expect(
      adminDisplayName({ user_metadata: {}, email: "master@8caps.co.uk" }),
    ).toBe("master");
  });
  it("falls back to 'there' with no name or email", () => {
    expect(adminDisplayName({ user_metadata: {}, email: null })).toBe("there");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/greeting.test.ts`
Expected: FAIL — `./greeting` does not exist.

- [ ] **Step 3: Create `src/lib/greeting.ts`**

```ts
/** A time-of-day greeting for the given 24-hour hour. */
export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface UserLike {
  user_metadata?: {
    display_name?: unknown;
    full_name?: unknown;
  } | null;
  email?: string | null;
}

/**
 * The friendliest available name for an admin user: their Supabase display
 * name, else the local-part of their email, else "there".
 */
export function adminDisplayName(user: UserLike): string {
  const meta = user.user_metadata ?? {};
  const candidate = meta.display_name ?? meta.full_name;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  const local = (user.email ?? "").split("@")[0];
  return local || "there";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/greeting.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/greeting.ts src/lib/greeting.test.ts
git commit -m "feat: add greeting and display-name helpers"
```

---

### Task 10: Dashboard data — recent sites and weekly count

**Files:**
- Modify: `src/lib/data/admin.ts`

- [ ] **Step 1: Add `sitesAddedThisWeek` to `getDashboardStats`**

In `src/lib/data/admin.ts`, add `RecentSite` to the type import from `@/types/domain`.

In `getDashboardStats`, replace the `Promise.all` block and `return` so a fifth query is included:

```ts
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total, published, draft, categories, thisWeek] = await Promise.all([
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
  ]);

  return {
    totalSites: total.count ?? 0,
    publishedSites: published.count ?? 0,
    draftSites: draft.count ?? 0,
    categories: categories.count ?? 0,
    sitesAddedThisWeek: thisWeek.count ?? 0,
  };
```

- [ ] **Step 2: Add `getRecentSites`**

Add this function at the end of `src/lib/data/admin.ts`:

```ts
interface RecentSiteRaw {
  id: string;
  name: string;
  publish_status: RecentSite["publishStatus"];
  category: { name: string } | null;
}

/** The most recently created sites, newest first — for the dashboard feed. */
export async function getRecentSites(limit = 5): Promise<RecentSite[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, publish_status, category:categories (name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load recent sites: ${error.message}`);

  return ((data ?? []) as unknown as RecentSiteRaw[]).map((r) => ({
    id: r.id,
    name: r.name,
    publishStatus: r.publish_status,
    categoryName: r.category?.name ?? null,
  }));
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No errors in `admin.ts`. (`page.tsx` for the dashboard errors until Task 15 — expected.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/admin.ts
git commit -m "feat: add recent-sites and weekly-count dashboard data"
```

---

### Task 11: StatCard gains an icon

**Files:**
- Modify: `src/components/admin/StatCard.tsx`
- Test: `src/components/admin/StatCard.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/StatCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Total websites" value={42} />);
    expect(screen.getByText("Total websites")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the icon when given one", () => {
    render(
      <StatCard
        label="Drafts"
        value={3}
        icon={<svg data-testid="card-icon" />}
      />,
    );
    expect(screen.getByTestId("card-icon")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/admin/StatCard.test.tsx`
Expected: FAIL — `StatCard` has no `icon` prop.

- [ ] **Step 3: Update `StatCard.tsx`**

Replace the entire contents of `src/components/admin/StatCard.tsx` with:

```tsx
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: ReactNode;
}) {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-3xl font-bold text-oxford"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </div>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/admin/StatCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/StatCard.tsx src/components/admin/StatCard.test.tsx
git commit -m "feat: add an optional icon to StatCard"
```

---

### Task 12: DashboardBanner component

**Files:**
- Create: `src/components/admin/DashboardBanner.tsx`
- Test: `src/components/admin/DashboardBanner.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/DashboardBanner.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardBanner } from "./DashboardBanner";

describe("DashboardBanner", () => {
  it("greets the named user", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/James/)).toBeInTheDocument();
  });

  it("summarises the directory size", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/42 websites/)).toBeInTheDocument();
    expect(screen.getByText(/3 added this week/)).toBeInTheDocument();
  });

  it("links to the add-website page", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(
      screen.getByRole("link", { name: /add a website/i }),
    ).toHaveAttribute("href", "/admin/sites/new");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/admin/DashboardBanner.test.tsx`
Expected: FAIL — the component does not exist.

- [ ] **Step 3: Create `DashboardBanner.tsx`**

```tsx
import Link from "next/link";
import { greetingFor } from "@/lib/greeting";

export function DashboardBanner({
  name,
  totalSites,
  addedThisWeek,
}: {
  name: string;
  totalSites: number;
  addedThisWeek: number;
}) {
  const greeting = greetingFor(new Date().getHours());
  const sitesWord = totalSites === 1 ? "website" : "websites";

  return (
    <div className="band-surface flex flex-wrap items-center justify-between gap-4 rounded-card p-6">
      <div>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {greeting}, {name}
        </h1>
        <p className="mt-1 text-sm text-accent-soft">
          {totalSites} {sitesWord} in the directory · {addedThisWeek} added this
          week
        </p>
      </div>
      <Link
        href="/admin/sites/new"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        + Add a website
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/admin/DashboardBanner.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/DashboardBanner.tsx src/components/admin/DashboardBanner.test.tsx
git commit -m "feat: add the dashboard welcome banner"
```

---

### Task 13: RecentSites component

**Files:**
- Create: `src/components/admin/RecentSites.tsx`
- Test: `src/components/admin/RecentSites.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/RecentSites.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentSites } from "./RecentSites";
import type { RecentSite } from "@/types/domain";

const sites: RecentSite[] = [
  { id: "1", name: "Riverside Plumbing", publishStatus: "published", categoryName: "Trades" },
  { id: "2", name: "Apex Accountancy", publishStatus: "draft", categoryName: null },
];

describe("RecentSites", () => {
  it("lists each site linking to its edit page", () => {
    render(<RecentSites sites={sites} />);
    expect(
      screen.getByRole("link", { name: /Riverside Plumbing/ }),
    ).toHaveAttribute("href", "/admin/sites/1/edit");
  });

  it("shows an empty message when there are no sites", () => {
    render(<RecentSites sites={[]} />);
    expect(screen.getByText(/no websites yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/admin/RecentSites.test.tsx`
Expected: FAIL — the component does not exist.

- [ ] **Step 3: Create `RecentSites.tsx`**

```tsx
import Link from "next/link";
import type { RecentSite } from "@/types/domain";

export function RecentSites({ sites }: { sites: RecentSite[] }) {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Recently added</h2>
        <Link
          href="/admin/sites"
          className="text-sm font-semibold text-accent"
        >
          View all →
        </Link>
      </div>

      {sites.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No websites yet.</p>
      ) : (
        <ul className="mt-2">
          {sites.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--color-hairline)" }}
            >
              <Link
                href={`/admin/sites/${s.id}/edit`}
                className="text-sm font-medium text-ink hover:text-accent"
              >
                {s.name}
                {s.categoryName && (
                  <span className="text-ink-muted"> · {s.categoryName}</span>
                )}
              </Link>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={
                  s.publishStatus === "published"
                    ? { background: "var(--color-live-bg)", color: "var(--color-live)" }
                    : { background: "var(--color-soon-bg)", color: "var(--color-soon)" }
                }
              >
                {s.publishStatus === "published" ? "Published" : "Draft"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/admin/RecentSites.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/RecentSites.tsx src/components/admin/RecentSites.test.tsx
git commit -m "feat: add the dashboard recent-sites panel"
```

---

### Task 14: QuickActions component

**Files:**
- Create: `src/components/admin/QuickActions.tsx`
- Test: `src/components/admin/QuickActions.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/QuickActions.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("links to the four admin areas", () => {
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /add website/i })).toHaveAttribute(
      "href",
      "/admin/sites/new",
    );
    expect(
      screen.getByRole("link", { name: /manage websites/i }),
    ).toHaveAttribute("href", "/admin/sites");
    expect(
      screen.getByRole("link", { name: /tidy categories/i }),
    ).toHaveAttribute("href", "/admin/categories");
    expect(
      screen.getByRole("link", { name: /view enquiries/i }),
    ).toHaveAttribute("href", "/admin/enquiries");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/admin/QuickActions.test.tsx`
Expected: FAIL — the component does not exist.

- [ ] **Step 3: Create `QuickActions.tsx`**

```tsx
import Link from "next/link";

const ACTIONS = [
  { href: "/admin/sites/new", label: "Add website", primary: true },
  { href: "/admin/sites", label: "Manage websites", primary: false },
  { href: "/admin/categories", label: "Tidy categories", primary: false },
  { href: "/admin/enquiries", label: "View enquiries", primary: false },
];

export function QuickActions() {
  return (
    <div
      className="rounded-card border bg-surface p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
      <div className="mt-3 flex flex-col gap-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={
              a.primary
                ? "rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white"
                : "rounded-lg border px-4 py-2 text-center text-sm font-medium text-ink"
            }
            style={a.primary ? undefined : { borderColor: "var(--color-hairline)" }}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/admin/QuickActions.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/QuickActions.tsx src/components/admin/QuickActions.test.tsx
git commit -m "feat: add the dashboard quick-actions panel"
```

---

### Task 15: Recompose the dashboard page

**Files:**
- Modify: `src/app/admin/(dashboard)/page.tsx`

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire contents of `src/app/admin/(dashboard)/page.tsx` with:

```tsx
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardStats, getRecentSites } from "@/lib/data/admin";
import { adminDisplayName } from "@/lib/greeting";
import { StatCard } from "@/components/admin/StatCard";
import { DashboardBanner } from "@/components/admin/DashboardBanner";
import { RecentSites } from "@/components/admin/RecentSites";
import { QuickActions } from "@/components/admin/QuickActions";

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

  const name = adminDisplayName(user ?? { user_metadata: {}, email: null });

  return (
    <div className="space-y-8 p-8">
      <DashboardBanner
        name={name}
        totalSites={stats.totalSites}
        addedThisWeek={stats.sitesAddedThisWeek}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total websites" value={stats.totalSites} icon={ICONS.globe} />
        <StatCard label="Published" value={stats.publishedSites} icon={ICONS.check} />
        <StatCard label="Drafts" value={stats.draftSites} icon={ICONS.pencil} />
        <StatCard label="Categories" value={stats.categories} icon={ICONS.tag} />
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

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests green.

- [ ] **Step 4: Build the project**

Run (with `dangerouslyDisableSandbox: true`): `npm run build`
Expected: Build succeeds with no type or lint errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(dashboard)/page.tsx"
git commit -m "feat: recompose the admin dashboard"
```

---

### Task 16: Set the Supabase display name and verify end-to-end

**Files:** none (data + manual verification).

- [ ] **Step 1: Set the admin display name**

Using the Supabase MCP tool `apply_migration` is not appropriate here (this is data, not schema). Use `execute_sql` to run:

```sql
update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"James"}'::jsonb
where email = 'master@8caps.co.uk';
```

Then confirm with:

```sql
select email, raw_user_meta_data->>'display_name' as display_name
from auth.users where email = 'master@8caps.co.uk';
```

Expected: one row, `display_name` = `James`.

- [ ] **Step 2: Manual verification**

Run `npm run dev` and, signed in as the admin, check:

1. **Dashboard** (`/admin`) — the welcome banner reads "Good [morning/afternoon/evening], James"; four stat cards show icons; the "Recently added" panel lists recent sites with status pills and links to their edit pages; quick actions link correctly.
2. **Add a website** (`/admin/sites/new`) — run the URL analyzer on a site whose type has no existing category. The category dropdown shows `✨ <name> — new category` selected by default; the analyzer panel notes the proposed new category. Switch the dropdown to an existing category and back. Save with the new category selected.
3. **Categories** (`/admin/categories`) — the just-created category appears with a site count of 1. Rename it (the public `/sites?category=<slug>` link still works — slug unchanged). Add a second site that produces a near-duplicate category, then merge one into the other and confirm the sites move and the source disappears.
4. **Delete** an empty category and confirm it is removed.

- [ ] **Step 3: Final commit (if any docs/notes changed)**

No code change is expected in this task. If the manual check surfaced a bug, fix it under a new commit referencing the affected task.

---

## Self-Review Notes

- **Spec coverage:** AI proposes new categories (Task 2), result shape (Task 1), add-form override dropdown (Task 6), analyzer panel note (Task 7), creation on save with case-insensitive reuse (Task 5), frozen slugs (Task 4 — `updateCategory` no longer touches the slug), tidy-up page with counts/rename/merge/delete (Tasks 3, 4, 8), welcome banner (Task 12), refreshed stat cards (Task 11), recent-sites feed (Tasks 10, 13), quick actions (Task 14), page recompose (Task 15), display name (Task 16). All spec sections are covered.
- **Type consistency:** `AdminCategory`, `RecentSite`, `DashboardStats.sitesAddedThisWeek`, `SiteFormValues.newCategoryName`, `AnalysisResult.suggestedNewCategory` are defined in Task 1 and consumed consistently in later tasks. `categoryRenameSchema` is defined in Task 1 and used in Task 4. `getAdminCategories` → `AdminCategory[]`, `getRecentSites` → `RecentSite[]`, `mergeCategory(sourceId, targetId)`, `updateCategory(id, name)` signatures match across all callers.
- **Out of scope (unchanged):** no charts, no bulk re-categorisation, no slug-redirect system, no public-site visual changes.
