# 📒 Notes for Next Session

Last updated: 2026-05-29

---

## ✅ Shipped in the latest session (2026-05-29)

- **Admin Dashboard `ui-ux-pro-max` full pass** — visual + UX elevation of the whole admin shell:
  - **Sidebar** — active-page highlight (`bg-white/10` + accent left bar + `aria-current="page"`), lucide icons on every nav item, and a **responsive mobile drawer** (fixed top bar + hamburger + scrim below `lg`; static sidebar at `lg+`).
  - **No more emoji as icons** — `PendingApprovalCallout`/`NewEnquiriesCallout` (⚠️/📨) and case-study statuses (🟡/✅/⭐) now use lucide SVGs (`AlertTriangle`, `Mail`, `Clock`, `CheckCircle2`, `Star`).
  - **Table consistency** — Enquiries & Case-studies tables gained `shadow-soft` + row hover to match Products.
  - **Shared `PageHeader`** component rolled across Products / Case studies / Enquiries / Categories for consistent title/description/action tops.
  - Layout switched to `min-h-dvh`; content clears the mobile top bar with `pt-14 lg:pt-0`.
  - All 180 tests still pass; typecheck clean; no new lint issues.

---

## ✅ Shipped in the previous session (2026-05-28)

- **Privacy Policy** — replaced the `/privacy` stub with a full UK GDPR notice built around the real data flow (contact form → Supabase → Resend): who we are, data collected, lawful basis, processors (Supabase/Resend/Vercel), international transfers, retention, cookies (essential-only), rights, ICO complaints. Registration details live as **flagged placeholder constants** at the top of `privacy/page.tsx` — see compliance section below.
- **Enquiries inbox** — `/admin/enquiries` is now a real inbox (no DB migration needed; the `enquiries.status` enum + admin RLS already existed):
  - List with New/Read/Archived/All filter tabs; unread rows bold + dot.
  - Detail page `/admin/enquiries/[id]` — auto-marks-read on open, with **Reply** (mailto), **Archive/Restore**, **Mark unread**.
  - **Sidebar badge** + **dashboard callout** showing the unread count.
- **`/work/[slug]` case-study detail pages** — each approved case study now has its own page (hero + challenge/solution + testimonial + tech stack), with `generateStaticParams` + `generateMetadata`. `/work` and the homepage cards became **compact summaries that link out** (avoids duplicate-content SEO penalty).
- **Sitemap** now includes the `/work/[slug]` routes (6 case studies currently live). Also fixed a pre-existing double-slash bug from a trailing slash in `NEXT_PUBLIC_SITE_URL`.
- **Admin polish** — `approveCaseStudy`/`revokeApproval` now revalidate the dashboard route too, so the pending count updates without a hard refresh.
- 13 new tests; 180 passing total. Public pages smoke-tested on the dev server.

---

## 🔝 Top priorities next time

1. **UI/UX revamp** — the big deferred one. Full visual pass on the public site + admin using `ui-ux-pro-max` (its own session — see below).
2. **Fill the compliance placeholders** — Companies House no., ICO reg, registered office. They now appear in **three** places that must stay in sync: `privacy/page.tsx` (top-of-file constants), `Footer.tsx`, and `contact/page.tsx`.
3. **Test the contact form end-to-end, then click-test the inbox** — submit a real enquiry from a throwaway email (needs `RESEND_API_KEY` on Vercel). Confirm both inboxes, then open `/admin/enquiries` and exercise open → auto-read → badge decrement → archive (this flow is code-complete + unit-tested but hasn't been click-tested with a live session).

---

## 🧱 Still ahead

### 🧰 Admin Dashboard

- [x] **UI/UX revamp** — `ui-ux-pro-max` full pass shipped 2026-05-29 (sidebar active-state + lucide icons + responsive mobile drawer; de-emoji'd callouts & case-study statuses; table consistency; shared `PageHeader`). See the changelog at the top.
- [x] **Enquiries inbox** — shipped 2026-05-28 (list + detail, mark-read/unread, archive, badge + callout)
- [x] **Case studies admin** `revalidatePath` after approve — dashboard count now updates without hard refresh
- [ ] **Case studies admin** small polish: empty-state on `/case-studies` filter chips (the enquiries list has one; case-studies still lacks a per-filter empty state)

### 📧 Resend

- [x] Pro account + DNS verified (SPF/DKIM/DMARC)
- [x] API key in `.env.local`
- [ ] **Confirm `RESEND_API_KEY` is set on Vercel** (Production + Preview) — needed for prod sends
- [ ] **Test a real form submission** end-to-end (the priority item above)
- [ ] Optional: `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` overrides on Vercel only if you want different addresses than the defaults (`noreply@`, `master@`)

### 📨 Email templates

- [x] Notification + auto-reply done
- [ ] **Internal "new enquiry" digest** (deferred — only worth it if volume picks up)

### ⚖️ Compliance / legal (UK GDPR required before form goes live)

- [x] **Privacy Policy** — full notice shipped at `/privacy` (placeholders for the registration details still need real values, below)
- [ ] **Companies House number** — replace `00000000` in `privacy/page.tsx`, `Footer.tsx`, `contact/page.tsx`
- [ ] **ICO registration number** — replace `ZA000000` in the same three files
- [ ] **Registered office address** — replace the placeholder in the same three files
- [ ] **Insurance details** (Professional Indemnity, Public Liability, Cyber) — surface on `/about` or the Trust footer if lender due-diligence wants it

### 📝 Content fills

- [x] Case study draft copy applied (all 7) — refinement happens via the admin UI now
- [x] Testimonial drafts applied (all 7); 6 are now approved + live on `/work`
- [x] Seed cleanup (3 placeholders archived)
- [ ] **Upload real logos + set brand colours** on each case study (check for remaining `placehold.co` stubs)
- [ ] **Real stat numbers** — `20+ Projects shipped`, `12+ UK sectors`, `6+ Products operating` placeholders on `/` and `/about`
- [ ] **Founding year confirmation** — "Since 2022" assumed; confirm exact date vs Companies House
- [ ] **Service pillar copy sign-off** — three pillars on `/services` currently use Claude's draft
- [ ] **Frame SFS URL** — still waiting on the URL; case study has draft copy based on tech stack only

### 🎨 UI/UX full passthrough (its own session)

- [ ] **Public site** — use `ui-ux-pro-max` for a full design review of all pages (now includes the new `/work/[slug]` detail pages + Privacy)
- [x] **Admin Dashboard** — full `ui-ux-pro-max` pass shipped 2026-05-29 (see Admin Dashboard section above)
- [ ] **Mobile responsive verification** — real devices, not just dev tools
- [ ] **Accessibility pass** — colour contrast, focus states, ARIA on the contact form

### ✨ Polish

- [ ] **Per-page OG images** — `/work` and case study pages especially
- [ ] **Sitemap submission** — `/sitemap.xml` to Google Search Console + Bing Webmaster Tools (now includes case-study detail pages)
- [ ] **Lighthouse audit** — perf / a11y / SEO / best-practices; aim ≥ 90 across the board
- [ ] **Lender-specific landing page** — `/partners/[lender-slug]` once the lender relationship is live (deferred from spec)
- [ ] **Calendly integration on `/contact`** — "Book a discovery call" button once you have a booking link
- [ ] **Cookie banner** — not needed yet (no analytics/tracking cookies; Privacy Policy says as much) — revisit only if cookie-setting scripts are added later

### 🔧 Operational

- [ ] **Update README** to reflect new positioning + page structure (still describes the old directory framing)
- [ ] **Update external references** to any old `/sites` URLs (social bios, email signatures, business cards)
- [ ] **Verify `/sites → /products` redirects** still working on live Vercel (smoke test)
