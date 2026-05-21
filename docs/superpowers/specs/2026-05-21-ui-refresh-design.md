# 8Caps Public Site — UI Refresh Design Spec

**Date:** 2026-05-21
**Status:** Approved for planning
**Scope:** A visual restyle of the existing public site (the Plan 1 build). No new features, no new pages, no data-layer or routing changes — only design tokens, component styling, and section layout.

---

## 1. Goal

Restyle the public 8Caps site to feel **clean, modern, and credible**, built around an **Oxford Blue** palette. The current build uses an all-dark navy theme; this refresh moves to a **hybrid** light/dark treatment with a more polished, distinctive look.

This refresh was validated through visual mockups during brainstorming. James approved: hybrid theme, pattern + glow hero, Space Grotesk headings, and the full homepage composition.

---

## 2. Out of Scope

- **Content** — replacing the placeholder seed sites (Automated Panda, LeadHarbour, etc.) with real 8Caps websites is a separate data task, handled directly against the database once James supplies the real list. Not part of this refresh.
- New pages, new components, admin, auth, the enquiry pipeline — unchanged or still Plan 2.
- No changes to the data layer, Supabase schema, or routing.

---

## 3. Theme: Hybrid

The page alternates dark and light:

- **Dark (Oxford Blue):** site header, homepage hero, the CTA band, and the footer.
- **Light:** all content sections, alternating between **white** and a **soft light-grey** (`#f4f6f9`) for visual separation.

Page-level pattern for every route:

| Route | Dark band | Light body |
|---|---|---|
| Homepage | header, hero, CTA band, footer | featured (white), categories (grey), why (white) |
| Directory | header, compact page-title band, footer | filters + results grid (white) |
| Site profile | header, compact site-hero band, footer | overview / services / screenshots / related (white & grey) |
| About / Contact | header, footer | content (white) |

The directory and site-profile pages each get a **compact dark Oxford Blue band** at the top (page title / site hero) so every page opens on the dark brand colour, then drops to a light body.

---

## 4. Design Tokens

Replaces the current navy-family tokens in `src/app/globals.css` (`@theme` block, Tailwind v4).

| Token | Value | Use |
|---|---|---|
| `--color-oxford` | `#002147` | Primary dark — hero, header, buttons, headings on light |
| `--color-oxford-deep` | `#001731` | Footer, deepest dark |
| `--color-accent` | `#3d7bd9` | Accent blue — primary CTAs, links, highlights |
| `--color-accent-soft` | `#9cc3ec` | Light-blue eyebrow / accents on dark |
| `--color-surface` | `#ffffff` | White content sections + cards |
| `--color-surface-muted` | `#f4f6f9` | Light-grey alternating sections |
| `--color-ink` | `#1c2533` | Body text on light |
| `--color-ink-muted` | `#5b6675` | Secondary text on light |
| `--color-hairline` | `rgba(0,33,71,0.12)` | Card borders, dividers |
| `--color-live` / `--color-live-bg` | `#1a8a52` / `#e7f6ee` | "Live" status badge |
| `--color-soon` / `--color-soon-bg` | `#b9701a` / `#fdf0e3` | "Coming soon" status badge |
| `--radius-card` | `12px` | Cards |

Existing token names (`navy-*`, `accent-500`, `ink-*`) are replaced; component classes are updated to the new names.

---

## 5. Typography

- **Headings:** **Space Grotesk** (weights 500/600/700) — geometric, modern-tech character. Loaded via `next/font/google`.
- **Body:** **Inter** (kept) — neutral, highly legible.
- The eyebrow label (small uppercase text above the hero headline) uses Space Grotesk, letter-spaced, in `--color-accent-soft`.

Both fonts wired through `next/font/google` with CSS variables (`--font-heading`, `--font-body`).

---

## 6. Hero Treatment

The homepage hero background: solid Oxford Blue with **two layered effects**:

1. A faint **dot grid** — `radial-gradient(rgba(255,255,255,.085) 1px, transparent 1px)` at ~16px spacing.
2. A soft **corner glow** — `radial-gradient(circle at 82% 18%, rgba(61,123,217,.40), transparent 46%)`.

Hero content: eyebrow label → large Space Grotesk headline (~30px+, weight 700) → muted subtext → two CTAs (filled accent "Explore our services" + outlined "Contact 8Caps").

The compact dark bands on the directory and profile pages use the **same dot grid** but a smaller/subtler glow, so they read as the same family without competing with the full hero.

---

## 7. Component Styling

- **Header** — Oxford Blue, `8Caps` wordmark in Space Grotesk, nav links; the "Contact" link rendered as a small filled accent button.
- **Site cards (`SiteCard`)** — white, 1px `--color-hairline` border, `--radius-card` corners, subtle shadow on hover. Layout: logo chip (rounded square; gradient placeholder when no logo) + name (Space Grotesk) + category (muted) → summary → status badge → two buttons (filled "View details" + outlined "Visit website").
- **Status badge (`StatusBadge`)** — soft pill: green (`Live`) / amber (`Coming soon`) using the status tokens, with a leading dot.
- **Category cards** — white cards on the grey section: small coloured rounded-square icon + name (Space Grotesk) + one-line description.
- **Buttons (`ButtonLink`)** — primary = filled accent (on dark) or filled Oxford Blue (on light); secondary = outlined. Space Grotesk, weight 600, `~8px` radius.
- **CTA band (`CTASection`)** — full-width Oxford Blue → lighter-blue gradient, centred heading + white button.
- **Footer** — `--color-oxford-deep`, muted white text, copyright + nav links.
- **Why 8Caps** — four columns, each with a short accent tick bar above a Space Grotesk sub-heading.
- **Directory filters** — category filter as pill buttons; active pill filled accent, inactive outlined.

---

## 8. Files Touched

- `src/app/globals.css` — replace `@theme` tokens.
- `src/app/layout.tsx` — swap font setup (add Space Grotesk).
- All components in `src/components/**` — update Tailwind classes to new tokens; restyle per §7.
- `src/app/page.tsx`, `src/app/sites/page.tsx`, `src/app/sites/[slug]/page.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx` — update section background treatment (dark bands vs white/grey bodies); add the compact dark title bands to directory and profile pages.

No files created or deleted. No tests change behaviour — existing component tests (`SiteCard`, `StatusBadge`) assert text/links/roles, not styling, so they should keep passing; update them only if a class-name assertion breaks.

---

## 9. Success Criteria

- Every page opens on an Oxford Blue dark band and uses white / light-grey content sections.
- Space Grotesk on headings, Inter on body, both via `next/font`.
- Homepage matches the approved mockup (hero pattern + glow, white featured cards, grey categories, why, gradient CTA, deep-navy footer).
- `npm run build`, `npm test`, `npm run typecheck`, `npm run lint` all pass.
- No change to routes, data, or behaviour — purely visual.

---

## 10. Decisions Log

| Decision | Choice |
|---|---|
| Theme | Hybrid — dark Oxford Blue bands, white/grey content |
| Hero background | Dot grid + corner glow |
| Heading font | Space Grotesk (body stays Inter) |
| Primary dark | Oxford Blue `#002147` |
| Accent | `#3d7bd9` |
| Card radius | 12px |
| Logo | `8Caps` wordmark (no logo asset supplied) |
| Content replacement | Separate task — not part of this refresh |
