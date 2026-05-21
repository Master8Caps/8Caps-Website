# 8Caps — AI URL Onboarding Design Spec

**Date:** 2026-05-22
**Status:** Approved for planning
**Scope:** Let an admin paste a website URL on the Add-website form and have the platform crawl it, analyse it with the Claude API, and pre-fill the site form — with visible step-by-step progress and clear errors throughout.

---

## 1. Goal

When an admin adds a website to the directory, they should be able to enter just the URL and get a drafted profile back: the platform reads the site, the AI works out what it does, and the Add-website form is filled in for the admin to review, edit, and save. This is the "Phase 3" onboarding feature from the original project brief, now that the public site (Plan 1) and admin dashboard (Plan 2) are live.

A hard requirement: the admin must always **see what is happening** during the crawl, and any failure must produce a **specific, plain-English error** — never a silent stall.

---

## 2. Scope

**In scope:** a streaming analyse endpoint (crawl + extract + Claude analysis), a live progress log + clear errors, an "Analyse a URL" box on the Add-website form that pre-fills the form fields, and a best-effort logo grab.

**Out of scope:**
- Re-analysing from the **edit** form — onboarding is for new sites only.
- Auto-publishing — generated content always lands as a `draft` (the existing form default); the admin reviews and publishes manually.
- Automated screenshot capture — still a future idea.
- The AI creating new categories or tags — it only picks from 8Caps' existing lists.
- Persisting crawl artifacts (raw text, confidence) to the database — see §7.

This is one cohesive feature: one spec, one implementation plan.

---

## 3. Architecture — the analysis pipeline

A streaming Route Handler runs a three-stage pipeline. Stack additions: `cheerio` (HTML parsing) and `@anthropic-ai/sdk` (Claude).

### Endpoint

`POST /api/admin/analyze-url` — a Route Handler at `src/app/api/admin/analyze-url/route.ts`.

- **Auth:** the handler self-checks — `createServerSupabase()` → `getUser()`; no user → `401`. (The proxy middleware guards `/admin/*` pages, not `/api/*` routes, so the handler must verify the session itself.)
- **Body:** `{ url: string }`.
- **Response:** a streamed body of newline-delimited JSON events (see §4).
- **`export const maxDuration = 60`** — the crawl (up to 5 fetches) plus the Claude call must finish within the function timeout.

### Stage 1 — Crawl

- Fetch the submitted URL: an `AbortController` 15s timeout, a real `User-Agent`, redirects followed, only `text/html` responses accepted.
- Parse with `cheerio`. Discover up to **4** internal (same-origin) links whose href or link text matches About / Services / Pricing / Contact / Features. Fetch each with the same timeout/headers.
- **Per-page failures are non-fatal** — a failed sub-page emits a progress event and the crawl continues with whatever it got. The pipeline only hard-fails if the *submitted* URL itself cannot be fetched.
- Best-effort **logo grab:** from the homepage, read `og:image`, then `apple-touch-icon`, then `favicon`. If found, download it and upload it to the `site-media` Supabase Storage bucket; the resulting public URL becomes the logo candidate. Any failure here is silent — the feature proceeds without a logo.

### Stage 2 — Extract

Per fetched page: `<title>`, `meta[name=description]`, headings, and visible body text with `<script>` / `<style>` / `<nav>` / `<footer>` stripped. Concatenate across pages and **cap the total at ~15,000 characters** so the AI cost stays predictable.

### Stage 3 — Analyse

- Call the **Claude API** (`@anthropic-ai/sdk`, a current Sonnet-class model) with the extracted text plus the lists of 8Caps' **existing categories and tags** (name + slug each).
- Use **tool-use for structured output** — a single forced tool whose input schema is the analysis result — and **prompt caching** on the static instruction block.
- The model returns: `name`, `shortSummary`, `fullOverview`, `targetAudience`, `suggestedCategorySlug` (one of the supplied slugs, or `null`), `suggestedTagSlugs` (a subset of the supplied slugs), `services` (array of `{name, description}`), `seoTitle`, `seoDescription`, `suggestedSlug`, `confidence` (`"low" | "medium" | "high"`), and `notes` (free text on anything missing or unclear).

---

## 4. Progress and errors

The endpoint streams **newline-delimited JSON events** as it works. Three event types:

- `{ "type": "progress", "message": string }` — one per pipeline step.
- `{ "type": "error", "message": string }` — a fatal failure; the stream then ends.
- `{ "type": "done", "result": AnalysisResult }` — the final event with the analysis.

The client reads the stream and renders a **live progress log**, e.g.:

```
✓ Fetched homepage (200, 48 KB)
✓ Found 3 key pages: /about, /services, /contact
✓ Fetched /about (200)
⚠ /contact — timed out after 15s, skipped
✓ Extracted 12,430 characters of text
⏳ Analysing with Claude…
✓ Analysis complete — confidence: medium
```

The log stays visible after completion so the admin can see exactly what was read.

**Error messages are specific and plain-English** — never generic. Examples:
- `Could not reach the site — the URL returned 404.`
- `The request timed out after 15s — the site may be slow or blocking automated requests.`
- `That doesn't look like a valid URL.`
- `Reached the site but found almost no readable text to analyse.`
- `The AI analysis failed (<reason>). You can still fill the form in manually.`

A fatal error never blocks the admin: the form remains fully usable for manual entry.

---

## 5. Admin experience

The Add-website form (`SiteForm` on `/admin/sites/new`) gains an **"Analyse a URL"** panel at the top:

- A URL input + an **Analyse** button.
- On Analyse: the client `POST`s to `/api/admin/analyze-url` and reads the stream, rendering the live progress log (§4) and a busy state on the button.
- On the `done` event the form fields **pre-fill**: name, slug (from `suggestedSlug`), URL, short summary, full overview, target audience, services, SEO title/description; category is set if `suggestedCategorySlug` matches an existing category; tags are ticked from `suggestedTagSlugs`; the logo candidate (if any) is set as the logo.
- The AI's **confidence** and **notes** are shown in the panel so the admin knows what to scrutinise.
- The admin then reviews and edits every field normally and clicks Save. `publishStatus` defaults to `draft`, so AI-drafted content is never published without review.

The edit form is unchanged — onboarding is a new-site flow only.

---

## 6. What the AI fills

| Form field | Source |
|---|---|
| Name, slug, short summary, full overview, target audience | Generated |
| Services (name + description rows) | Generated |
| SEO title, SEO description | Generated |
| Category | Set only if the AI's `suggestedCategorySlug` matches an existing category; otherwise left empty |
| Tags | Ticked from `suggestedTagSlugs`, intersected with existing tags |
| URL | The submitted URL |
| Logo | The best-effort logo candidate, if one was found |
| Publish status / lifecycle / visibility / featured | Not touched by the AI — left at the form defaults |

The AI never invents categories or tags; it chooses from the lists it is given.

---

## 7. Data

**No database changes.** The `sites` table and all related tables are untouched. The raw crawl text, the confidence rating, and the notes are **ephemeral** — shown in the analyse panel during review, never persisted. Rationale: the existing `draft` workflow plus mandatory admin review already cover "AI content must be checked"; persisting crawl artifacts would add schema weight for little ongoing value (YAGNI). The brief's once-mooted `generated_by_ai` / `ai_confidence` / `raw_crawl_text` columns are intentionally not added.

---

## 8. Environment & dependencies

| Item | Notes |
|---|---|
| `@anthropic-ai/sdk` | New dependency — the Claude client |
| `cheerio` | New dependency — server-side HTML parsing |
| `ANTHROPIC_API_KEY` | New env var — `.env.local` + Vercel. **Manual setup by James:** an Anthropic account + API key. |

The logo grab reuses the existing `site-media` Storage bucket from Plan 2.

---

## 9. Build order

1. Install `@anthropic-ai/sdk` + `cheerio`; add `ANTHROPIC_API_KEY` to the env files.
2. HTML extraction + key-link discovery utilities (pure functions — test-first).
3. The crawler (fetch homepage + sub-pages, per-page error handling, logo grab).
4. The Claude analysis call (tool-use structured output, prompt caching).
5. The streaming Route Handler `POST /api/admin/analyze-url` (auth check, pipeline orchestration, NDJSON progress events, `maxDuration`).
6. The "Analyse a URL" panel component — stream consumer, progress log, error display.
7. Wire the panel into the Add-website form and pre-fill the fields on `done`.
8. Full verification + deploy.

---

## 10. Testing

- **Test-first:** the HTML-to-text extraction and the key-link discovery (pure functions over HTML strings).
- **Components:** the progress-log rendering and the stream-event parsing.
- **Crawler, Claude call, streaming handler:** verified by `npm run build` / `typecheck` / `lint` and manual checks against real URLs — network and LLM I/O are not meaningfully unit-tested.
- All of `npm test` / `typecheck` / `lint` / `build` must pass per plan.

---

## 11. Decisions Log

| Decision | Choice |
|---|---|
| Onboard flow | "Analyse a URL" box on the existing Add-website form |
| Crawl scope | Homepage + up to 4 key pages (About/Services/Pricing/Contact/Features) |
| Page reader | `fetch` + `cheerio` (no headless browser, no scraping API) |
| Delivery | Streaming Route Handler, newline-delimited JSON progress events |
| Progress | Live step-by-step log, kept visible after completion |
| Errors | Specific plain-English messages; sub-page failures non-fatal |
| LLM | Claude API, Sonnet-class model, tool-use structured output + prompt caching |
| Category / tags | AI picks only from existing lists; never creates new ones |
| Logo | Best-effort grab of OG image / favicon, uploaded to `site-media` |
| Persistence | None — no new DB columns; crawl text / confidence / notes are ephemeral |
| Auto-publish | Never — generated content saves as `draft` for review |
| Scope | One spec, one implementation plan |
