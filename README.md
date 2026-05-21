# 8Caps Website

Marketing directory website for **8Caps** — a credibility hub and browsable
catalogue of the websites, tools, and services 8Caps owns and operates.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — Postgres database (public read via Row Level Security)
- **Vitest** + **React Testing Library** for tests
- Deployed on **Vercel**

## Getting started

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable / anon key (read-only public access) |
| `NEXT_PUBLIC_SITE_URL` | Public base URL of the site (e.g. the Vercel domain; `http://localhost:3000` in dev) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the test suite |
| `npm run typecheck` | Type-check with `tsc` |
| `npm run lint` | Lint with ESLint |

## Database

The schema, Row Level Security policies, and seed data live in `supabase/`:

- `supabase/migrations/` — schema and RLS migrations
- `supabase/seed.sql` — sample categories, tags, and sites

Public pages read through a typed data-access layer in `src/lib/data/`. RLS
restricts the anon key to sites that are `published` and `public`.

## Project status

This is **Plan 1** — the public-facing site (homepage, directory, profile
pages, about, contact, SEO). The admin dashboard, authentication, and the
enquiry-submission pipeline are Plan 2.

- Design spec: `docs/superpowers/specs/2026-05-21-8caps-directory-website-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-21-8caps-foundation-public-site.md`
