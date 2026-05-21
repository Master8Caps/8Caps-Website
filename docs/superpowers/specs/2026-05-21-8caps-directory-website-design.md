# 8Caps Directory Website — Design Spec

**Date:** 2026-05-21
**Status:** Approved for planning
**Scope:** Phases 1–2 of the original project context (public directory site + admin dashboard). The AI crawler / URL onboarding pipeline (original "Phase 3") is explicitly **out of scope** and will get its own spec once this is live.

---

## 1. Goal

Build a marketing directory website for **8Caps** that acts as a credibility hub for outreach and a browsable catalogue of all websites, brands, tools, and services owned or operated by 8Caps.

This spec covers:

1. A public-facing site: homepage, searchable directory, individual site profile pages, about, and contact.
2. A private admin dashboard for managing sites, categories, images, and enquiries.

It does **not** cover automated crawling or LLM content generation.

---

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Per original brief |
| Styling | Tailwind CSS | Per original brief |
| Database | Supabase (Postgres) | |
| Auth | Supabase Auth — email + password | 5 equal admin accounts |
| File storage | Supabase Storage | Logos + screenshots |
| Transactional email | Resend | Enquiry notifications to `master@8caps.co.uk` |
| Hosting | Vercel | Natural fit for Next.js |

**Rendering strategy**

- Public pages use **ISR** (Incremental Static Regeneration): statically rendered, revalidated when an admin publishes a change. Fast, cheap, SEO-friendly.
- Admin pages are dynamic, server-rendered, and gated behind authentication.

**Data access**

- A single typed data-access layer (`lib/data/*`) sits between pages and Supabase. Built directly on Supabase from day one — no throwaway mock-data layer.
- The database is seeded with a handful of real sites so every page has content from the first build.

---

## 3. Data Model

All tables in Supabase Postgres. Row Level Security (RLS) enabled on every table.

### profiles

Admin users. A row here grants admin access. All 5 admins are equal — no role distinction.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK, references `auth.users` |
| email | text | |
| full_name | text | |
| created_at | timestamptz | |

### sites

The doc's original single `status` field is split into three fields, because the original brief used "status" two contradictory ways (a publishing workflow state vs. a public-facing lifecycle label).

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique, used in `/sites/[slug]` |
| url | text | external website URL |
| logo_url | text | Supabase Storage |
| short_summary | text | |
| full_overview | text | |
| target_audience | text | |
| category_id | uuid | FK → categories |
| publish_status | enum | `draft｜published｜archived` — only `published` is publicly visible |
| lifecycle | enum | `live｜coming_soon` — public-facing label |
| visibility | enum | `public｜private` — `private` = the brief's "Internal" |
| is_featured | boolean | shown in homepage Featured section |
| seo_title | text | |
| seo_description | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**AI fields deferred:** `generated_by_ai`, `ai_confidence`, `raw_crawl_text` are intentionally omitted here. They belong to the Phase 3 crawler spec and are trivial to add later as a migration.

### services

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| site_id | uuid | FK → sites |
| name | text | |
| description | text | |
| sort_order | int | |

### categories

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique |
| description | text | |

### screenshots

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| site_id | uuid | FK → sites |
| image_url | text | Supabase Storage |
| alt_text | text | |
| sort_order | int | |

### tags

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique |

### site_tags

Join table — a site has one category but many tags.

| Field | Type | Notes |
|---|---|---|
| site_id | uuid | FK → sites |
| tag_id | uuid | FK → tags |

### enquiries

New table — not in the original brief. Captures Contact/Enquiry form submissions.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| site_id | uuid | FK → sites, **nullable** (null = general enquiry) |
| name | text | |
| email | text | |
| message | text | |
| status | enum | `new｜read｜archived` |
| created_at | timestamptz | |

### RLS summary

- **Public (anon) read:** `sites` where `publish_status = 'published'` and `visibility = 'public'`; their related `services`, `screenshots`, `site_tags`, plus all `categories` and `tags`.
- **Authenticated profiles only:** all writes; reading drafts/private sites; the full `enquiries` table.
- **Public insert:** `enquiries` (the contact form) — insert-only, no read.

---

## 4. Public Site

| Route | Page | Contents |
|---|---|---|
| `/` | Homepage | Hero (headline, subheadline, dual CTA), Featured sites, Categories grid, Why 8Caps, Contact CTA |
| `/sites` | Directory | Server-side filtering + pagination (sized for ~25–100 sites). Search by name/keyword; filter by category and lifecycle/visibility |
| `/sites/[slug]` | Site profile | Hero (name, logo, URL, summary), overview, services, who it helps, key features, screenshot gallery, dual CTA (visit site / enquire), related sites (up to 3 others in the same category) |
| `/about` | About 8Caps | Static positioning content |
| `/contact` | Contact | Enquiry form → saves to `enquiries` + emails via Resend |

**SEO:** per-site `seo_title` / `seo_description`, Open Graph tags, generated `sitemap.xml`, `robots.txt`.

**Design direction** (from the brief): professional, clean, credible, minimal, slightly premium. Dark/navy base with white content sections, subtle gradients, clean rounded cards, strong typography, simple icons, clear CTAs.

---

## 5. Admin Dashboard

All routes under `/admin/*`, gated behind Supabase Auth. Login at `/admin/login` (email + password). The 5 admin accounts are created via Supabase invite — no in-app user-management UI.

| Route | Page |
|---|---|
| `/admin/login` | Email + password login |
| `/admin` | Dashboard overview — site counts, recent enquiries |
| `/admin/sites` | Site list with search |
| `/admin/sites/new` | Create site |
| `/admin/sites/[id]/edit` | Edit site — full fields, services, tags, draft/publish/archive, featured toggle, logo + screenshot uploads |
| `/admin/categories` | Manage categories |
| `/admin/enquiries` | Enquiry inbox — new / read / archived |
| `/admin/settings` | Site settings — editable homepage hero text and "Why 8Caps" content. Lowest priority; a thin page |

---

## 6. Components

Reusable components (no hardcoding content into pages):

`SiteCard`, `SiteHero`, `CategoryFilter`, `DirectoryGrid`, `CTASection`, `AdminLayout`, `SiteForm`, `StatusBadge`, `EnquiryForm`, `ScreenshotGallery`, `Pagination`.

TypeScript types/interfaces defined up front for: `Site`, `Service`, `Category`, `Screenshot`, `Tag`, `Enquiry`, `Profile`.

---

## 7. Build Order

1. **Foundation** — Next.js scaffold, Supabase schema + migrations + seed data, typed data-access layer, TypeScript types.
2. **Public site** — homepage, directory (search + pagination), site profile pages, about, contact.
3. **Admin** — auth + login, site CRUD, categories, logo/screenshot uploads.
4. **Enquiries & polish** — contact form → DB + Resend email, admin enquiry inbox, SEO (metadata, sitemap, OG tags).

---

## 8. Out of Scope (future specs)

- **AI URL onboarding** — crawl a submitted URL, extract content, analyze with the Claude API, generate a draft site profile for admin review. Will use Claude (not OpenAI) and prompt caching. Separate spec once this project is live.
- Original brief's "Future Ideas": automated screenshots, traffic analytics, case studies, testimonials, team pages, lead routing, multi-language, public API, SEO audits, uptime monitoring.

---

## 9. Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| First-build scope | Directory + admin (Phases 1–2) | AI crawler is a separate subsystem; ship a working base first |
| Mock data step | Skipped | Build the data layer once, directly on Supabase, to avoid rework |
| Enquiry handling | Save to DB **and** email | A record of every lead plus immediate notification |
| Admin users | 5 equal admins, no `editor` role | No real second permission level needed (YAGNI) |
| Login method | Email + password | User preference |
| Directory size | ~25–100 sites | Justifies server-side filtering + pagination |
| LLM provider (future) | Claude API | Already in the Anthropic ecosystem; one less vendor |
| `ai_confidence` field | Deferred + treated as a soft hint | LLM self-reported confidence is unreliable; review is mandatory regardless |
