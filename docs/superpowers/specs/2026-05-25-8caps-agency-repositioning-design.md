# 8Caps Agency Repositioning — Design Spec

**Date:** 2026-05-25
**Status:** Approved for planning
**Scope:** Restructure and re-content the existing 8Caps site so it presents as
a UK software / AI / automation **agency** for SMBs, in time for a meeting with
a finance company that will refer borrowers to 8Caps to have apps built.

---

## 1. Goal & context

8Caps has a meeting next week with a UK finance company that lends to small
businesses to help them afford software and AI projects. The finance company
has a database of 2–3k UK businesses and emails them weekly. If the meeting
goes well, 8Caps becomes their referred build partner: the lender funds the
project, 8Caps builds it, both sides benefit.

The site needs to leave the lender with one clean impression: **"8Caps is a
credible, established UK software & AI partner — exactly who we want our
borrowers calling."**

The existing site (Plans 1 + 2) positions 8Caps as a *portfolio of its own
products*. The whole pitch is product-led: "browse our directory of
services." That framing is wrong for this audience. The reposition is
**agency-first**: 8Caps as the team that builds custom software, AI, and
automation for UK SMBs — with the existing portfolio of own products becoming
a credibility proof point, not the headline.

---

## 2. Strategic decisions (locked)

| Decision | Choice | Reason |
|---|---|---|
| Positioning angle | Agency-first; portfolio as proof | Matches the lender's referral context; portfolio alone doesn't convert a borrower |
| Page structure | Full agency site (6 pages) | Strongest pitch; enough surface area for the lender to verify credibility |
| Client work content | Multiple full case studies, no screenshots | Designed around logo + outcome + story + testimonial; screenshots optional |
| Team framing | Capabilities / disciplines, not headcount | 3 people but four disciplines presented — honest, not misleading |
| Service offerings | Three pillars — Custom Software, AI Solutions, Automation | Exactly matches what 8Caps does and what the lender's clients will recognise |
| Lead path | Working contact form (no Calendly in v1) | YAGNI; form + email via Resend is sufficient; Calendly can land later |
| Lender-specific asks | None — just a credible site | Compliance pages and pricing can land later if asked |
| Visual identity | Keep current Oxford Blue + white palette | `ui-ux-pro-max` skill takes a polish pass once structure is in |
| Scope variant | Tight MVP — polished, all 6 pages live | One week to meeting; depth where it matters, light where it's safe |

---

## 3. Site map

```
/             Home          — Agency hero + 3 services + featured work + featured products + trust
/services     Services      — NEW — Custom Software | AI Solutions | Automation
/work         Work          — NEW — 7 case study sections, each with testimonial
/products     Products      — Rework of /sites — own portfolio as "proof we ship"
/about        About         — Rework — story, years, disciplines, stats
/contact      Contact       — Upgrade from static page to working enquiry form
```

**URL changes:**

- `/sites` → `/products` (permanent redirect from `/sites` and `/sites/[slug]`
  preserved with their existing slugs — search engines and seed data stay
  valid)

**Header nav** updates to: **Services · Work · Products · About · Contact**

---

## 4. Page designs

### 4.1 Home `/`

Six bands top to bottom:

1. **Hero band** (dark navy + dot grid)
   - Eyebrow: *"UK Software & AI Studio"*
   - H1: *"We build the software, AI, and automations UK businesses need to grow."*
   - Subhead: *"Established 2022. Trusted by SMBs across the UK. We design, build, and ship the tools that make small businesses run faster."*
   - Dual CTA: **See our work** → `/work` · **Start a project** → `/contact`

2. **Stat strip** — three numbers: *3+ years operating · X projects shipped · Y products in portfolio*

3. **Services preview** — three cards (Custom Software / AI Solutions / Automation), each with icon, one-liner, link to anchor on `/services`

4. **Featured work** — three case study cards (logo + outcome headline + 1-line context + "Read story →") · "See all work →" tail link

5. **Featured products** — three own-product cards, reframed: *"We don't just build software — we run it. These are our own products."* · "See all products →" tail link

6. **Closing CTA** — *"Let's build something for your business."* → `/contact`

### 4.2 Services `/services`

Five bands. Each pillar gets equal weight.

1. **Hero band** (dark) — *"What we do"* · *"Three ways we help UK businesses grow."*

2. **Pillar 1 — Custom Software** (anchor `#custom-software`)
   - Icon + heading
   - *What it is* — 2 sentences
   - *What it solves* — 4 bullets
   - *Who it's for* — 1 line
   - *Example* — small case-study card linking to a real one on `/work`

3. **Pillar 2 — AI Solutions** (anchor `#ai-solutions`) — same structure. Claude API mentioned as a credibility signal.

4. **Pillar 3 — Automation** (anchor `#automation`) — same structure.

5. **Closing CTA** — *"Not sure which one you need? Tell us the problem — we'll tell you the shape of the fix."* → `/contact`

### 4.3 Work `/work`

The trust-builder for the lender. Designed around the constraint of no
screenshots — every case study sells on logo + outcome + story + testimonial.

1. **Hero band** (dark) — *"Selected work"* · *"Projects we've shipped for UK businesses."*

2. **Filter strip** — pills: *All · Custom Software · AI · Automation · Lead Gen* (search param-driven, URL is shareable)

3. **Seven full case study sections**, stacked. Each section:

   - Client logo + service tag pill(s)
   - Outcome headline
   - Meta line: *Client · Sector · Year*
   - *The story* — 2 short paragraphs (problem → what we built → what changed)
   - **Testimonial card** baked in: 2–3 line quote + *"— Name, Role at Company"*
   - *Built with:* tech/approach tags
   - Each section gets a soft accent colour band, all different, so they're
     visually distinguishable on scroll (substitutes for the missing
     screenshots)

   **The seven case studies:**

   | Client | Service tags | Testimonial from |
   |---|---|---|
   | North Bar | Custom Software · Automation · Lead Gen | Obi |
   | Hull Mag / Bestey | Automation · AI (newsletter) | Jane Gough |
   | Store More | AI Solutions · Automation | Dean Booty |
   | Frame SFS | Custom Software · Automation · Lead Gen | Alex Stark |
   | De Lacy Salons | Custom Software · AI Solutions · Automation | Kirsty Reader |
   | De Lacy at Home | Automation · E-commerce | Kerris Lacy |
   | Castle Sunset | AI Solutions · Automation · Lead Gen | Rebecca Curley |

4. **Closing CTA** — *"Could your business be next?"* → `/contact`

**ASA compliance note:** every testimonial must be approved in writing by its
named author before publication. Tracked in `docs/pre-meeting-notes.md`.

### 4.4 Products `/products`

Lightest rework — the existing `/sites` directory works; this is mostly copy
changes and a URL rename.

1. **Hero band** (dark)
   - Eyebrow: *"Our own products"*
   - H1: *"We don't just build software — we operate it."*
   - Subhead: *"Every project we ship for a client, we've already lived ourselves. These are the products 8Caps owns and runs in production — practical tools solving real business problems."*

2. **Trust lead-in** — one sentence: *"What this means for your project — we know exactly what 'shipped and running' looks like, because we're doing it every day."*

3. **Filter strip + search** — unchanged behaviour (category pills + search box)

4. **Product grid** — unchanged (`SiteCard`, featured first then alphabetical, Live / Coming soon badges)

5. **Closing CTA** — *"Want one of these for your business — or something completely different?"* → `/contact`

**Cleanup:** retire any seeded placeholder products (e.g. `LeadHarbour`,
`PropToolkit`) that don't correspond to real 8Caps products before the
meeting. Tracked in the implementation plan.

### 4.5 About `/about`

The "sound bigger than 3 people" page, played honestly by talking about
disciplines instead of headcount.

1. **Hero band** (dark)
   - Eyebrow: *"About 8Caps"*
   - H1: *"A UK studio building software, AI, and automation for SMBs."*
   - Subhead: *"Founded in 2022, 8Caps is a small, focused team that designs, ships, and operates the kind of practical tools UK businesses actually use every day."*

2. **Stats strip** — *Since 2022 · X projects shipped · Y sectors served · Z products operating*

3. **What we do** — three short prose blocks: *What we build · Who we build it for · Why this approach works*

4. **Our disciplines** — four cards (replaces a team page):
   - **Software engineering** — TypeScript, Next.js, React, Supabase, Postgres — modern, fast, maintainable.
   - **AI engineering** — Claude API, prompt engineering, retrieval, AI voice agents, document AI.
   - **Automation engineering** — Make.com, n8n, Zapier, custom orchestration — workflows that don't break.
   - **Design & product** — Interface design, UX, brand — we don't ship ugly.

5. **How we work** — three steps: *Talk · Build · Operate*

6. **Closing CTA** — *"If your business has a problem that software, AI, or automation could solve — tell us about it."* → `/contact`

### 4.6 Contact `/contact`

The conversion endpoint. Lender's borrower lands, fills the form, 8Caps gets an
email. Everything else is window dressing.

1. **Hero band** (dark, shorter)
   - Eyebrow: *"Get in touch"*
   - H1: *"Tell us what you're trying to solve."*
   - Subhead: *"Drop us a line and we'll come back within one working day."*

2. **Form + "what to expect" — side-by-side on desktop, stacked on mobile**

   **Left column — the form:**

   | Field | Type | Required |
   |---|---|---|
   | Your name | text | ✓ |
   | Email | email (validated) | ✓ |
   | Company | text | optional |
   | What kind of project? | select: *Custom Software · AI Solutions · Automation · Not sure yet* | ✓ |
   | How did you hear about us? | text | optional — quietly captures lender referrals |
   | Tell us about your project | textarea (min 20 chars) | ✓ |

   Submit: **Send enquiry**. Disabled during submit; success replaces form
   with a confirmation card.

   **Right column — reassurance panel:**
   - ⏱ *We reply within one working day*
   - 💬 *First call is a no-cost conversation*
   - 🛡 *Everything you share is confidential*
   - 📧 *Or email us directly:* `master@8caps.co.uk`

3. **Closing band** (light) — registered office, Companies House number, ICO number visible.

**Behaviour & plumbing:**

- Server action validates with Zod, writes to existing `enquiries` table (RLS
  already allows anon insert), sends email via **Resend** to
  `master@8caps.co.uk`
- **Spam protection:** honeypot field — no CAPTCHA needed at this volume
- **"How did you hear about us?"** captures lender referrals without a
  dedicated landing page
- **Success state:** confirmation card with link back home
- **Failure state:** keeps form filled, error inline

---

## 5. Shared bits

### Header

Updated nav: **Services · Work · Products · About · Contact**

### Footer

- Existing links retained
- **Add:** registered office address, Companies House number, ICO registration
  number, copyright line (already there). These also serve the lender's "is
  this a real business" sniff test.

### Redirects

- `/sites` → `/products` (308)
- `/sites/[slug]` → `/products/[slug]` (308) — preserves slugs so existing
  links keep working

### Compliance pages

- `/privacy` — must exist before `/contact` form goes live
- `/terms` — optional, drafted from a template
- Cookie Policy — deferred (no third-party cookies in MVP)

### Existing /admin remains untouched

No changes to `/admin/*` in this spec — admin dashboard already works for
managing the products that will appear on `/products`. Case studies for
`/work` are content-managed via either an `admin/case_studies` extension
(future) or seeded directly during the MVP build.

---

## 6. Data model changes

Most of the data model is already in place. The only additions:

### case_studies (new table)

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| slug | text | unique |
| client_name | text | "North Bar" |
| client_sector | text | "Hospitality" |
| year | int | 2024 |
| logo_url | text | Supabase Storage |
| brand_colour | text | optional, hex code for card tint |
| outcome_headline | text | the big stat / change |
| story_problem | text | paragraph 1 |
| story_solution | text | paragraph 2 |
| testimonial_quote | text | the quote |
| testimonial_author | text | "Obi" |
| testimonial_role | text | "Owner" |
| testimonial_approved_at | timestamptz | filled when written sign-off received — null until then; only non-null rows are visible |
| tech_stack | text[] | tags shown on the card |
| publish_status | publish_status enum | reuses existing `draft|published|archived` |
| is_featured | boolean | shown on homepage Featured Work band |
| sort_order | int | display order on `/work` |
| created_at, updated_at | timestamptz | standard |

### case_study_services (join table)

| Field | Type |
|---|---|
| case_study_id | uuid (FK) |
| service | enum (`custom_software|ai|automation|lead_gen|ecommerce`) |

Drives the `/work` filter pills and the service tag pills on each card.

**RLS:** public read of `case_studies` where `publish_status = 'published'`
AND `testimonial_approved_at IS NOT NULL`. The `approved_at` gate enforces the
ASA rule structurally — an unapproved testimonial can't accidentally be made
public.

### enquiries — no schema changes

Existing table is sufficient. The server action just needs writing.

### Cleanup of seed data

The current seed includes placeholder sites (`LeadHarbour`, `PropToolkit`,
`Stealth Project`) that aren't real 8Caps products. The implementation plan
will retire or replace these so `/products` shows only genuine 8Caps
properties.

---

## 7. Components

Reusable, no hardcoded content:

- **`CaseStudyCard`** — the big case study section (logo, outcome, story, testimonial, tags)
- **`CaseStudyFilter`** — service pill row, search-param driven
- **`ServicePillarSection`** — the repeating block on `/services` (what / solves / who / example / CTA)
- **`StatStrip`** — 3-or-4 number band, reused on `/` and `/about`
- **`DisciplineCard`** — discipline + one-liner card, used on `/about`
- **`ContactForm`** — the enquiry form with server action, validation, honeypot
- **`ContactWhatToExpect`** — the right-column reassurance panel
- **`TrustFooter`** — extension to existing `Footer` showing Companies House / ICO / address

Existing components stay where they make sense: `SiteCard`, `Container`, `Button`, `Header`, `CTASection`, etc.

---

## 8. Build order

1. **Data layer + redirects** — `case_studies` schema + RLS + types + data access; `/sites` → `/products` redirects
2. **`/products` rework** — copy changes only, mostly content
3. **`/services` page** — three pillars, new component
4. **`/work` page** — seven case study sections, new components, filter
5. **`/about` rework** — disciplines, stats, prose
6. **`/` rework** — agency hero, services preview, featured work, stat strip
7. **`/contact` upgrade** — working form, Resend integration, server action, validation
8. **Shared bits** — header nav update, footer compliance info, `/privacy` stub
9. **Content pass** — fill in real case study text (gated by approvals — see pre-meeting notes), pillar copy, stats
10. **`ui-ux-pro-max` polish pass** — visual refinement across all pages

Tasks 1–8 are structure / plumbing — they can ship before the content lands.
Task 9 is the content gate. Task 10 is the final polish.

---

## 9. Out of scope (future work)

- Calendly / booking integration on `/contact`
- Lender-specific co-branded landing page (`/partners/[slug]`)
- Multi-step "Get a quote" wizard
- Cookie banner / consent management (no third-party cookies in MVP)
- Pricing page / indicative ranges
- Blog / insights
- Individual `/work/[slug]` detail pages (case studies live inline on `/work`
  for now)
- Admin UI for case studies — seeded directly for MVP; admin CRUD can follow

---

## 10. Open items

Tracked in `docs/pre-meeting-notes.md`:

- Testimonial sign-offs from all seven named clients
- Client logos
- Resend account + DNS verification
- Privacy Policy draft
- ICO registration number
- Companies House number + insurance details
- The exact "trust numbers" (projects shipped, sectors served, etc.)
- Service pillar copy sign-off
- Confirmation of founding year ("Established 2022" placeholder)

These are content / external dependencies — none of them block structural
implementation.
