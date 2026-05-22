# 8Caps Logo & Favicon — Design

**Date:** 2026-05-22
**Status:** Approved

## Summary

8Caps has no real logo today — the public header, footer and admin sidebar
all just render the word "8Caps" as text, and the site uses a default
`favicon.ico`. This project creates a proper brand logo, wires it into every
surface, and replaces the favicon. It also generates a social-share (Open
Graph) image.

The logo is a visual pun on the name: the numeral **8** wearing a **baseball
cap**, which reads as "8" + "Caps". The capped-8 is the symbol; followed by the
word "Caps" it forms the full "8Caps" lockup.

Out of scope: the automatic logo *fetching* for directory sites (the URL
analyzer already does this — untouched here).

## Logo design

**The mark** — the numeral "8" set in Space Grotesk (the site's heading font),
white, wearing a side-view baseball cap tilted ~12°:

- Cap crown: accent blue `#3d7bd9`, with two thin panel seams in `#2a5fb0`
- Cap brim: darker accent `#2a5fb0`
- Cap button: soft blue `#9cc3ec`

**The lockup** — the mark immediately followed by "Caps" (Space Grotesk bold,
white). Together they read "8Caps".

**Two forms:**

- **Lockup** (mark + "Caps") — used in the public header, public footer and
  admin sidebar.
- **Mark** (the capped 8 alone) — used for the favicon and any tight space.

**One colourway.** Every surface the logo appears on is dark Oxford blue
(`bg-oxford` / `bg-oxford-deep`), so a single white-on-dark logo covers every
placement. No light-background variant is needed.

## Build approach

The logo is delivered as **plain, self-contained SVG** — no runtime dependency
on the webfont, no flicker.

The letterforms ("8" and "Caps") are real Space Grotesk glyphs **converted to
SVG outline paths once, at build time**:

- A one-off script uses `opentype.js` to load the Space Grotesk TTF and extract
  the outline path data for the glyphs "8" and "Caps".
- The resulting path strings are committed into the source. The extraction
  script does **not** run at runtime or in CI; it is a one-time generation step.
- Space Grotesk is SIL OFL licensed, so embedding its outlines is permitted.

## Components and files

### `src/components/brand/logo-art.tsx` (new)

The single source of truth for the logo geometry. Exports the raw SVG building
blocks so every consumer renders identical art:

- `MarkArt` — the SVG children for the mark: the tilted cap (`<path>`s for
  crown, seams, brim, button) plus the outlined "8" `<path>`.
- `WordmarkArt` — the SVG children for the outlined "Caps".
- `MARK_VIEWBOX` and `LOCKUP_VIEWBOX` — viewBox constants for the two forms.

This file is pure data/markup — no behaviour.

### `src/components/brand/Logo.tsx` (new)

The React component used for in-app placements.

- Props: `variant?: "lockup" | "mark"` (default `"lockup"`) and `className?`
  (for sizing, e.g. `h-7`).
- Renders an `<svg>` composed from `logo-art.tsx`: `MarkArt` always, plus
  `WordmarkArt` when `variant === "lockup"`. The viewBox is `MARK_VIEWBOX` or
  `LOCKUP_VIEWBOX` accordingly.
- The `<svg>` carries `role="img"` and `aria-label="8Caps"` — the letters are
  outlined paths with no text nodes, so this is the accessible name.
- No fixed pixel size; the parent sizes it via `className`.

### `src/app/icon.tsx` (new)

The favicon, generated with Next's `ImageResponse` from the shared geometry:
the **mark** on a rounded **Oxford-blue** tile, so the white "8" stays legible
on any browser-tab background.

### `src/app/opengraph-image.tsx` (new)

The social-share image, generated with `ImageResponse`: the full **lockup**
centred on an Oxford-blue background, sized 1200×630. Next.js automatically
wires this into page metadata (and reuses it as the Twitter image).

### `src/app/favicon.ico` (removed)

Replaced by `icon.tsx`.

### Placement changes

- **`src/components/layout/Header.tsx`** — the `<Link href="/">8Caps</Link>`
  text becomes `<Link href="/"><Logo variant="lockup" /></Link>`, sized to fit
  the 16-unit-tall header bar.
- **`src/components/layout/Footer.tsx`** — a `<Logo variant="mark" />` is added
  beside the `© {year} 8Caps. All rights reserved.` line.
- **`src/components/admin/Sidebar.tsx`** — the `8Caps Admin` text link becomes
  `<Logo variant="lockup" />` followed by a small "Admin" label, still linking
  to `/admin`.

## Accessibility

The logo SVG has no text nodes (the letters are outline paths), so the `<svg>`
must expose `role="img"` and `aria-label="8Caps"`. The header and sidebar
logos remain wrapped in their existing links to `/` and `/admin`.

## Testing

- **`Logo`** (`src/components/brand/Logo.test.tsx`) — renders with the
  accessible name "8Caps"; the `lockup` variant includes the wordmark geometry
  and uses the lockup viewBox while `mark` does not; the default variant is
  `lockup`.
- **`Header`** — the logo is present and the link wrapping it points to `/`.
- **Favicon and social image** — verified manually: the favicon shows in the
  browser tab, and the generated `opengraph-image` route renders the lockup on
  Oxford blue.

Tests follow the existing repo conventions (Vitest + Testing Library,
co-located `*.test.tsx`).

## Out of Scope

- Automatic logo fetching for directory sites (the URL analyzer already does
  this).
- A light-background logo variant — every current surface is dark.
- An animated logo.
- A separate `apple-icon` — `icon.tsx` covers browser favicons; an Apple touch
  icon can be added later if needed.
