# 📒 Notes for Next Session

Last updated: 2026-05-27

---

## ✅ Shipped in the previous session

- Admin moved to `admin.8caps.co.uk` (host-routing middleware + DNS + clean URLs)
- Admin nav rename: Sites → Products (URL, sidebar, copy, legacy redirect)
- Walked every admin page and tagged what needed reshaping
- Full **case studies CRUD** at `/admin/case-studies` — list with quick-approve, edit form, dashboard pending callout, 5th stat tile, sidebar entry
- RLS bug fix: added `is_admin()` SELECT/INSERT/UPDATE/DELETE on `case_studies` + `case_study_services` (had been hiding rows from admin reads)
- Case-study content drafted + applied for all 7 clients (outcome / problem / solution / testimonial). All still **pending approval** — won't appear on `/work` until you flip the toggle.
- Two name fixes: North Bar → "North Bar Engineer" + sector "Engineering". Frame SFS sector → "Engineering".
- Form labels + help text pass on `CaseStudyForm` — every field now has a visible label and one-line explanation (year field specifically clarified)
- Branded HTML **email templates** (notification + auto-reply) replacing the plain-text dump in `contact/actions.ts`. 12 new tests.
- Seed cleanup: archived `leadharbour`, `proptoolkit`, `stealth-project` placeholder products

---

## 🔝 Top priorities next time

Quick wins first, then content / compliance.

1. **Test the contact form end-to-end** — assuming `RESEND_API_KEY` is set on Vercel and DNS has propagated, submit a real enquiry from a throwaway email. Check both inboxes (lead gets the auto-reply, `master@8caps.co.uk` gets the notification with the Reply CTA).
2. **Approve real case study testimonials** — pick one (probably De Lacy Salons for the dress rehearsal), read it on the admin edit page, refine the testimonial wording if needed, hit **Approve** in the list view. Open `/work` in incognito to verify the layout holds with real-length paragraphs.
3. **Upload real logos + set brand colours** on each case study via the admin edit form (currently `placehold.co` stubs). Open each client's site, grab their primary hex via DevTools, paste into the colour picker.

---

## 🧱 Still ahead

### 🧰 Admin Dashboard

- [ ] **UI/UX revamp** — full visual pass (own session, paired with the public-site revamp below using `ui-ux-pro-max`)
- [ ] **Enquiries inbox** — `/admin/enquiries` is still a stub page. Once Resend is live, building the inbox UI is the next obvious follow-up (table, mark-as-read, archive)
- [ ] **Case studies admin** small polish: empty-state on `/case-studies` filter chips, `revalidatePath` after approve so the dashboard count updates without hard refresh

### 📧 Resend

- [x] Pro account + DNS verified (SPF/DKIM/DMARC)
- [x] API key in `.env.local`
- [ ] **Confirm `RESEND_API_KEY` is set on Vercel** (Production + Preview) — needed for prod sends
- [ ] **Test a real form submission** end-to-end (the priority-1 item above)
- [ ] Optional: `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` overrides on Vercel only if you want different addresses than the defaults (`noreply@`, `master@`)

### 📨 Email templates

- [x] Notification + auto-reply done
- [ ] **Internal "new enquiry" digest** (deferred — only worth it if volume picks up)

### ⚖️ Compliance / legal (UK GDPR required before form goes live)

- [ ] **Privacy Policy** — real text replacing the stub at `/privacy`. I can draft boilerplate around your actual data flows (contact form → Supabase → Resend) once you say go.
- [ ] **Companies House number** — replace `00000000` placeholder in footer + contact compliance band
- [ ] **ICO registration number** — replace `ZA000000` placeholder
- [ ] **Registered office address** — replace `Address placeholder`
- [ ] **Insurance details** (Professional Indemnity, Public Liability, Cyber) — surface on `/about` or the Trust footer if lender due-diligence wants it

### 📝 Content fills

- [x] Case study draft copy applied (all 7) — refinement happens via the admin UI now
- [x] Testimonial drafts applied (all 7) — review with your boss, refine, then **Approve** per row
- [x] Seed cleanup (3 placeholders archived)
- [ ] **Real stat numbers** — `20+ Projects shipped`, `12+ UK sectors`, `6+ Products operating` placeholders on `/` and `/about`
- [ ] **Founding year confirmation** — "Since 2022" assumed; confirm exact date vs Companies House
- [ ] **Service pillar copy sign-off** — three pillars on `/services` currently use Claude's draft
- [ ] **Frame SFS URL** — still waiting on the URL; case study has draft copy based on tech stack only

### 🎨 UI/UX full passthrough (its own session)

- [ ] **Public site** — use `ui-ux-pro-max` for a full design review of all six pages
- [ ] **Admin Dashboard** — same treatment
- [ ] **Mobile responsive verification** — real devices, not just dev tools
- [ ] **Accessibility pass** — colour contrast, focus states, ARIA on the contact form

### ✨ Polish

- [ ] **Per-page OG images** — `/work` and case study pages especially
- [ ] **Sitemap submission** — `/sitemap.xml` to Google Search Console + Bing Webmaster Tools
- [ ] **Lighthouse audit** — perf / a11y / SEO / best-practices; aim ≥ 90 across the board
- [ ] **Lender-specific landing page** — `/partners/[lender-slug]` once the lender relationship is live (deferred from spec)
- [ ] **Calendly integration on `/contact`** — "Book a discovery call" button once you have a booking link
- [ ] **Cookie banner** — only if analytics or other cookie-setting scripts are added later

### 🔧 Operational

- [ ] **Update README** to reflect new positioning + page structure (still describes the old directory framing)
- [ ] **Update external references** to any old `/sites` URLs (social bios, email signatures, business cards)
- [ ] **Verify `/sites → /products` redirects** still working on live Vercel (smoke test)
