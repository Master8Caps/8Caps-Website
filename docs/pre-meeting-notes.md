# 8Caps Pre-Meeting Notes — Things to Action

Working notes for the agency-repositioning build. Items here are **not blockers
for the design / implementation work** — they're external dependencies (content,
legal, third-party accounts) that need to land before the site can go fully live
for the finance-company meeting.

---

## 🚨 Immediate blockers for `/contact` going live

Without these three, the working contact form cannot be turned on safely or
legally:

- [ ] **Resend account + domain verification for `8caps.co.uk`** — sign up at
      resend.com, add DNS records (SPF, DKIM, DMARC) so enquiry-form emails
      send from `noreply@8caps.co.uk` (or similar) and land in
      `master@8caps.co.uk` reliably. ~5 minutes once DNS access is confirmed.
- [ ] **Privacy Policy live on the site** — UK GDPR requirement the moment a
      form starts collecting personal data. Template via Iubenda / Termly /
      solicitor-drafted is fine.
- [ ] **ICO registration number** — required because the contact form collects
      personal data. Surfaces in the `/contact` closing band and the footer.

---

## 📋 Wider pre-meeting gather list

(From the earlier conversation — kept here so nothing slips.)

### Testimonials — sign-offs to collect

Written approval (text/email is fine) from each of the seven clients for the
final quote wording, name, and logo use. Keep approvals on file — ASA can ask
for them up to 3 years later.

- [ ] Obi — **North Bar**
- [ ] Jane Gough — **Hull Mag / Bestey**
- [ ] Dean Booty — **Store More**
- [ ] Alex Stark — **Frame SFS**
- [ ] Kirsty Reader — **De Lacy Salons**
- [ ] Kerris Lacy — **De Lacy at Home**
- [ ] Rebecca Curley — **Castle Sunset**

### Client logos

- [ ] High-resolution logo file per client (SVG ideal, transparent PNG @ 1000px+ otherwise)
- [ ] Optional: each client's brand colour (helps with case study card design)

### Case study content (per client)

For each of the seven:

- [ ] Sector / industry
- [ ] Year the work was done
- [ ] Problem they had — 2–3 sentences
- [ ] What you built — 2–3 sentences
- [ ] Headline outcome — single number, % saved, or change to lead with
- [ ] Tech / approach used (Next.js · Supabase · Claude API · Make.com etc.)

### Company & compliance details

- [ ] Legal company name (as on Companies House)
- [ ] Companies House registration number
- [ ] Registered office address
- [ ] VAT number (if VAT-registered)
- [ ] Exact founding date (confirms "Established 2022" or actual year)
- [ ] Professional Indemnity insurance — provider, cover amount, policy number, renewal date
- [ ] Public Liability insurance — same details
- [ ] Cyber Liability insurance (if held)
- [ ] Any certifications — Cyber Essentials, ISO 27001, BCS, partner badges

### Trust numbers (for stats strips on `/` and `/about`)

- [ ] Total projects shipped
- [ ] Number of distinct UK clients served
- [ ] Number of sectors served
- [ ] Number of own products currently operating

### Legal pages

- [ ] **Privacy Policy** — see blockers above
- [ ] **Cookie Policy** — only if/when analytics or third-party cookies are added
- [ ] **Terms of Service** — optional but professional

### Production / email plumbing

- [ ] Confirm 8caps.co.uk DNS access for Resend setup
- [ ] Confirm `master@8caps.co.uk` is the inbox for enquiry notifications

### Service-pillar copy sign-off

For each of the three pillars on `/services`:

- [ ] **Custom Software** — 2-sentence description + 4 problems it solves
- [ ] **AI Solutions** — same
- [ ] **Automation** — same

(Drafted by Claude → reviewed by James in a single pass.)

### Brand confirmation

- [ ] Confirm 8Caps logo files in the repo are final
- [ ] Confirm Oxford Blue + accent palette is locked, or open to a refresh from
      the `ui-ux-pro-max` skill

### Products on `/products`

The original Plan 1 seed inserted three placeholder products that are not real
8Caps properties. They appear publicly on `/products` until archived. Run the
following in the Supabase SQL editor so RLS hides them:

```sql
update sites
   set publish_status = 'archived'
 where slug in ('leadharbour', 'proptoolkit', 'stealth-project');
```

- [ ] Run the SQL above against the hosted database
- [ ] Confirm `/products` no longer lists the three placeholders
- [ ] Add any other genuine 8Caps products via the admin dashboard (`/admin/sites`)

---

## ⚠️ Priority order if time is tight

1. **Testimonial sign-offs + logos** — without these, `/work` can't go live
2. **ICO + insurance + Companies House** — without these, the footer and
   `/about` can't be honest
3. **Privacy Policy** — non-negotiable the moment the contact form goes live
