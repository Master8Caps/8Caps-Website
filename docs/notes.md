# Notes for Tomorrow's Session

Things to pick up next session after the agency-repositioning work merges to
main. Ordered roughly by sequence (some unlock others).

---

## 🧰 Admin Dashboard

- [ ] **Admin Dashboard review** — walk through every admin page now that the
      public site has been reframed. Likely needs a revamp to account for the
      new additions. **Confirm with James first** before any structural work.
- [ ] **Admin CRUD for `case_studies`** — currently the only way to manage
      case studies (and to set `testimonial_approved_at`) is via raw SQL.
      Worth a dedicated `/admin/case-studies` section so James (and the rest
      of the team) can manage testimonial approval, story copy, logos, and
      featured flags through the UI.
- [ ] **Admin nav consistency** — admin sidebar still says "Sites" but the
      public URL is `/products`. Worth renaming for consistency or making the
      shift explicit.
- [ ] **Admin Dashboard UI/UX revamp** — full pass (paired with public-site
      pass below, but the admin has different needs).

## 🌐 Admin subdomain migration

- [ ] **Move admin to `admin.8caps.co.uk`** (away from `8caps.co.uk/admin`).
      Cleaner separation, easier auth scoping, easier to lock down in front of
      Vercel / a WAF later. Will need:
  - Vercel project config (or separate deployment)
  - DNS records on `8caps.co.uk` for the `admin` subdomain
  - Middleware / routing update so `/admin/*` no longer resolves on the main
    domain
  - Possibly a tenant-style monorepo split if the apps drift apart

## ✅ Testimonial approval (instructions)

Each of the seven seeded case studies starts with `testimonial_approved_at =
NULL`, which means RLS hides it from the public `/work` page. Once a client
signs off in writing on their final quote wording:

1. Note the approval (date + client) in the file/folder you keep approvals in
2. Run, in the Supabase SQL editor:

   ```sql
   update case_studies
      set testimonial_approved_at = now()
    where slug = 'north-bar'; -- swap to the client you got approval from
   ```

3. Refresh `/work` — that case study should now appear

Available slugs: `north-bar`, `hull-mag`, `store-more`, `frame-sfs`,
`de-lacy-salons`, `de-lacy-at-home`, `castle-sunset`.

To reverse if you need to retract: `set testimonial_approved_at = null`.

**Better long-term:** build the admin CRUD above and make this a button click
instead of SQL.

## 📧 Resend

- [ ] **Sign up for Resend Pro** (or whichever tier suits the volume)
- [ ] **Verify the `8caps.co.uk` sending domain** in the Resend dashboard —
      requires adding SPF, DKIM, and DMARC DNS records
- [ ] **Get the API key** and set it in:
  - `.env.local` (worktree + main checkout)
  - Vercel environment variables (production deployment)
- [ ] **Test a real form submission** end-to-end once domain is verified —
      DB insert + email landing in `master@8caps.co.uk`

## 📨 Email templates

- [ ] **Notification email to 8Caps** — currently a plain-text dump in
      `src/app/(public)/contact/actions.ts`. Worth a proper HTML template
      with branding, formatted fields, and a "reply to lead" CTA.
- [ ] **Auto-reply to the enquirer** — currently nothing. Worth a short
      branded confirmation email so the lead knows we got it. Sets
      expectations (one-working-day reply, etc.).
- [ ] **Internal "new enquiry" Slack/email digest** (optional) — bundle daily
      / weekly enquiry summaries for the team.

## 🎨 UI/UX full passthrough

- [ ] **Public site** — use the newly installed `ui-ux-pro-max` skill for a
      full design review of all six pages. Hero variants, typography polish,
      microinteractions, mobile responsiveness, visual rhythm.
- [ ] **Admin Dashboard** — same treatment. Admin UIs tend to drift over
      time; worth a deliberate refresh now.
- [ ] **Mobile responsive verification** — every new page (`/`, `/services`,
      `/work`, `/products`, `/about`, `/contact`) on real devices, not just
      browser dev tools.
- [ ] **Accessibility pass** — colour contrast, focus states, ARIA where
      needed (especially the contact form).

---

## 🆕 Other things worth flagging (additions from Claude)

### Pre-deploy / deploy blockers

- [ ] **Merge worktree branch to `main`** — the 30 commits on
      `worktree-agency-repositioning` need to land before any of the new pages
      go live on Vercel. Will likely be a clean fast-forward or PR merge.
- [ ] **Real env vars on Vercel** — production needs `RESEND_API_KEY`,
      `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` set. Currently they only exist
      in local `.env.local`.
- [ ] **Verify Vercel build succeeds** with the real env vars — the worktree
      had dummy keys so the build couldn't be tested end-to-end here.

### Compliance / legal content

- [ ] **Privacy Policy** — real text to replace the stub at `/privacy`. UK
      GDPR requires this before the form goes live in production.
- [ ] **Companies House number** — replace `00000000` placeholder in footer
      + contact compliance band
- [ ] **ICO registration number** — replace `ZA000000` placeholder
- [ ] **Registered office address** — replace `Address placeholder`
- [ ] **Insurance details** (Professional Indemnity, Public Liability,
      Cyber) — worth surfacing on `/about` or the Trust footer if the lender
      considers them due-diligence requirements

### Content fills (mostly tracked in pre-meeting-notes.md but worth
repeating)

- [ ] **Real stat numbers** — `20+ Projects shipped`, `12+ UK sectors`,
      `6+ Products operating` are all placeholders on `/` and `/about`
- [ ] **Founding year confirmation** — "Since 2022" assumed; confirm exact
      date vs Companies House
- [ ] **Case study content** for each of the seven — outcome headlines,
      problem paragraph, solution paragraph, real testimonial wording
- [ ] **Client logos** — high-res files for all seven cases
- [ ] **Service pillar copy sign-off** — three pillars on `/services`
      currently use Claude's draft copy
- [ ] **Seed cleanup** — archive `leadharbour`, `proptoolkit`,
      `stealth-project` placeholder products (SQL in `pre-meeting-notes.md`)

### Polish nice-to-haves

- [ ] **Per-page OG images** — currently the global OG image is used. The
      `/work` and case study pages would benefit from custom social-share
      images.
- [ ] **Sitemap submission** — submit `/sitemap.xml` to Google Search
      Console (and Bing Webmaster Tools) so the new pages get indexed quickly
- [ ] **Lighthouse audit** — perf, accessibility, SEO, best-practices.
      Marketing sites should be ≥ 90 across the board.
- [ ] **Lender-specific landing page** (deferred from spec) — co-branded
      `/partners/[lender-slug]` once the lender relationship is live, with
      tracked enquiries. Probably overkill for v1 but worth a placeholder
      decision.
- [ ] **Calendly integration on `/contact`** (also deferred) — add a "Book a
      discovery call" button once you have a booking link
- [ ] **Cookie banner** (deferred — none of our scripts currently set
      cookies, but if analytics gets added later, we need it)

### Operational

- [ ] **Verify `/sites → /products` redirects** work on Vercel after deploy
      (not just in local dev)
- [ ] **Update README** to reflect the new positioning and page structure —
      it still describes the directory framing
- [ ] **Update any external references** to old `/sites` URLs (anywhere
      8Caps is linked from — social bios, email signatures, business cards)
