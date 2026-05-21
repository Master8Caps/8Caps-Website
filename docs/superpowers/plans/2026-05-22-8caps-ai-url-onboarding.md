# 8Caps AI URL Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin paste a website URL on the Add-website form and have the platform crawl it, analyse it with the Claude API, and pre-fill the form — streaming visible step-by-step progress and clear errors the whole way.

**Architecture:** A streaming Route Handler (`POST /api/admin/analyze-url`) runs a crawl → extract → analyse pipeline and emits newline-delimited JSON progress events. The crawler fetches the homepage plus up to 4 key pages with `fetch` + `cheerio`; the Claude API turns the extracted text into a structured listing via tool-use. A client panel on the site form consumes the stream, shows a live log, and pre-fills the form on completion.

**Tech Stack:** Next.js 16 (App Router, Route Handlers, streaming), TypeScript, `@anthropic-ai/sdk`, `cheerio`, Supabase (Storage for the logo grab), Vitest.

---

## Scope

**In scope:** the streaming analyse endpoint, the crawl/extract/analyse pipeline, the live-progress "Analyse a URL" panel, form pre-fill, and a best-effort logo grab.

**Out of scope:** re-analysing from the edit form; auto-publishing (generated content stays `draft`); screenshot capture; the AI creating new categories/tags; persisting crawl artifacts. See the spec `docs/superpowers/specs/2026-05-22-ai-url-onboarding-design.md`.

**Reference:** Plans 1 and 2 are live. Patterns to follow: the Supabase clients in `src/lib/supabase/`, the admin data layer `src/lib/data/admin.ts` (has `getAdminCategories` + `getAllTags`), the `SiteForm` component `src/components/admin/SiteForm.tsx`, the Oxford Blue tokens in `globals.css`.

**Testing approach:** the two pure functions — HTML text extraction and key-link discovery — and the NDJSON stream splitter are built test-first with Vitest. The crawler, the Claude call, the streaming route, and the panel component are verified by `npm run typecheck` / `npm run lint` / `npm run build` plus the manual checks each task lists — network and LLM I/O are not meaningfully unit-tested.

**Sandbox note:** the Bash sandbox blocks network. Run `npm install` and `npm run build` with `dangerouslyDisableSandbox: true`. `npm test` / `typecheck` / `lint` / `git` normally don't — retry with the flag if one hits `ECONNRESET`.

---

## File Structure

```
src/
├── types/onboarding.ts                      # NEW — AnalysisResult, AnalyzeEvent
├── lib/onboarding/
│   ├── extract.ts                           # NEW — HTML → {title,description,text} (pure)
│   ├── extract.test.ts                      # NEW
│   ├── links.ts                             # NEW — key-link discovery (pure)
│   ├── links.test.ts                        # NEW
│   ├── crawl.ts                             # NEW — fetch homepage + sub-pages + logo grab
│   ├── analyze.ts                           # NEW — Claude analysis call
│   ├── stream.ts                            # NEW — splitNdjson (pure)
│   └── stream.test.ts                       # NEW
├── app/api/admin/analyze-url/route.ts       # NEW — streaming endpoint
└── components/admin/
    ├── UrlAnalyzer.tsx                      # NEW — the "Analyse a URL" panel (client)
    └── SiteForm.tsx                         # MODIFY — render the panel, pre-fill on result
src/app/admin/(dashboard)/sites/new/page.tsx # MODIFY — enable the analyzer
.env.local / .env.example                    # MODIFY — ANTHROPIC_API_KEY
```

---

## Task 1: Install dependencies and add the API key

**Files:** `package.json`, `package-lock.json`, `.env.local`, `.env.example`

- [ ] **Step 1: Install `@anthropic-ai/sdk` and `cheerio`**

Run (with `dangerouslyDisableSandbox: true`):
```bash
npm install @anthropic-ai/sdk cheerio
```

- [ ] **Step 2: Add `ANTHROPIC_API_KEY` to `.env.local`**

Append this line to `.env.local` (James supplies the real key — if it is not available yet, add the line with an empty value so the file documents it):
```
ANTHROPIC_API_KEY=
```

- [ ] **Step 3: Add `ANTHROPIC_API_KEY` to `.env.example`**

Append to `.env.example`:
```
# Anthropic API key for AI URL onboarding
ANTHROPIC_API_KEY=
```

- [ ] **Step 4: Verify the build still passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`). Expected: build succeeds, route table unchanged.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add @anthropic-ai/sdk and cheerio"
```

---

## Task 2: Onboarding types

**Files:** Create `src/types/onboarding.ts`

- [ ] **Step 1: Create `src/types/onboarding.ts`**

```ts
/** The structured listing the Claude analysis produces. */
export interface AnalysisResult {
  name: string;
  shortSummary: string;
  fullOverview: string;
  targetAudience: string;
  /** A slug from the existing category list, or null if none fits. */
  suggestedCategorySlug: string | null;
  /** Slugs from the existing tag list. */
  suggestedTagSlugs: string[];
  services: { name: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
  suggestedSlug: string;
  confidence: "low" | "medium" | "high";
  notes: string;
}

/** One event in the analyse endpoint's newline-delimited JSON stream. */
export type AnalyzeEvent =
  | { type: "progress"; message: string }
  | { type: "error"; message: string }
  | { type: "done"; result: AnalysisResult; logoUrl: string | null };
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/onboarding.ts
git commit -m "feat: add onboarding types"
```

---

## Task 3: HTML text extraction (test-first)

**Files:** Create `src/lib/onboarding/extract.ts`, `src/lib/onboarding/extract.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/onboarding/extract.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { extractPageText } from "./extract";

describe("extractPageText", () => {
  it("pulls the title and meta description", () => {
    const html = `<html><head><title>Acme Co</title>
      <meta name="description" content="We do widgets."></head>
      <body><p>Hello</p></body></html>`;
    const result = extractPageText(html);
    expect(result.title).toBe("Acme Co");
    expect(result.description).toBe("We do widgets.");
  });

  it("collects visible body text", () => {
    const html = `<body><h1>Widgets</h1><p>Fast and cheap.</p></body>`;
    expect(extractPageText(html).text).toContain("Widgets");
    expect(extractPageText(html).text).toContain("Fast and cheap.");
  });

  it("strips script, style, nav and footer content", () => {
    const html = `<body>
      <nav>Home About</nav>
      <script>var x = "tracking";</script>
      <style>.a{color:red}</style>
      <main>Real content here.</main>
      <footer>Copyright junk</footer>
    </body>`;
    const text = extractPageText(html).text;
    expect(text).toContain("Real content here.");
    expect(text).not.toContain("tracking");
    expect(text).not.toContain("color:red");
    expect(text).not.toContain("Copyright junk");
    expect(text).not.toContain("Home About");
  });

  it("collapses whitespace", () => {
    const html = `<body><p>a</p>\n\n   <p>b</p></body>`;
    expect(extractPageText(html).text).toBe("a b");
  });

  it("returns empty strings when fields are absent", () => {
    const result = extractPageText(`<body></body>`);
    expect(result.title).toBe("");
    expect(result.description).toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm test -- extract`. Expected: FAIL — `./extract` cannot be resolved.

- [ ] **Step 3: Create `src/lib/onboarding/extract.ts`**

```ts
import * as cheerio from "cheerio";

export interface ExtractedPage {
  title: string;
  description: string;
  text: string;
}

/** Extracts the title, meta description, and visible body text from raw HTML. */
export function extractPageText(html: string): ExtractedPage {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() ?? "";

  // Drop non-content nodes before reading the body text.
  $("script, style, noscript, nav, footer, svg, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return { title, description, text };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm test -- extract`. Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding/extract.ts src/lib/onboarding/extract.test.ts
git commit -m "feat: add HTML text extraction"
```

---

## Task 4: Key-link discovery (test-first)

**Files:** Create `src/lib/onboarding/links.ts`, `src/lib/onboarding/links.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/onboarding/links.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { discoverKeyLinks } from "./links";

const BASE = "https://acme.com/";

describe("discoverKeyLinks", () => {
  it("finds About / Services / Pricing / Contact links by path", () => {
    const html = `<body>
      <a href="/about">x</a>
      <a href="/services">x</a>
      <a href="/pricing">x</a>
      <a href="/contact">x</a>
    </body>`;
    const links = discoverKeyLinks(html, BASE);
    expect(links).toContain("https://acme.com/about");
    expect(links).toContain("https://acme.com/services");
    expect(links).toContain("https://acme.com/pricing");
    expect(links).toContain("https://acme.com/contact");
  });

  it("matches on link text when the path is opaque", () => {
    const html = `<body><a href="/p/9">Our Services</a></body>`;
    expect(discoverKeyLinks(html, BASE)).toContain("https://acme.com/p/9");
  });

  it("ignores external and irrelevant links", () => {
    const html = `<body>
      <a href="https://twitter.com/acme">About us</a>
      <a href="/blog/post-1">Blog</a>
    </body>`;
    expect(discoverKeyLinks(html, BASE)).toEqual([]);
  });

  it("dedupes and caps at the limit", () => {
    const html = `<body>
      <a href="/about">a</a><a href="/about">a</a>
      <a href="/about-us">b</a><a href="/services">c</a>
      <a href="/pricing">d</a><a href="/contact">e</a>
    </body>`;
    expect(discoverKeyLinks(html, BASE, 4).length).toBe(4);
  });

  it("does not return the homepage itself", () => {
    const html = `<body><a href="/">About</a></body>`;
    expect(discoverKeyLinks(html, BASE)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm test -- links`. Expected: FAIL — `./links` cannot be resolved.

- [ ] **Step 3: Create `src/lib/onboarding/links.ts`**

```ts
import * as cheerio from "cheerio";

const KEY_PATTERN = /about|services|pricing|contact|features/i;

/**
 * Finds same-origin links to key informational pages (About, Services,
 * Pricing, Contact, Features). Returns absolute URLs, deduped, capped at `limit`.
 */
export function discoverKeyLinks(
  html: string,
  baseUrl: string,
  limit = 4,
): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const found = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let abs: URL;
    try {
      abs = new URL(href, base);
    } catch {
      return;
    }
    if (abs.origin !== base.origin) return;

    abs.hash = "";
    if (abs.pathname === base.pathname) return; // skip the homepage itself

    const linkText = $(el).text();
    if (KEY_PATTERN.test(abs.pathname) || KEY_PATTERN.test(linkText)) {
      found.add(abs.toString());
    }
  });

  return [...found].slice(0, limit);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm test -- links`. Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding/links.ts src/lib/onboarding/links.test.ts
git commit -m "feat: add key-link discovery"
```

---

## Task 5: The crawler

**Files:** Create `src/lib/onboarding/crawl.ts`

- [ ] **Step 1: Create `src/lib/onboarding/crawl.ts`**

```ts
import * as cheerio from "cheerio";
import { extractPageText } from "./extract";
import { discoverKeyLinks } from "./links";
import { createServerSupabase } from "@/lib/supabase/server";

const TIMEOUT_MS = 15_000;
const USER_AGENT = "8CapsBot/1.0 (+https://8caps.co.uk)";
const MAX_TEXT = 15_000;

export interface CrawlResult {
  combinedText: string;
  logoUrl: string | null;
}

/** Fetches a URL as HTML with a timeout. Throws an Error with a plain message. */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`returned ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error(`is not an HTML page (${contentType || "unknown type"})`);
    }
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("timed out after 15s");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Best-effort: find a logo image, upload it to Storage, return its public URL. */
async function grabLogo(
  homepageHtml: string,
  homepageUrl: string,
  onProgress: (message: string) => void,
): Promise<string | null> {
  try {
    const $ = cheerio.load(homepageHtml);
    const candidate =
      $('meta[property="og:image"]').attr("content") ??
      $('link[rel="apple-touch-icon"]').attr("href") ??
      $('link[rel="icon"]').attr("href");
    if (!candidate) return null;

    const imageUrl = new URL(candidate, homepageUrl).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let bytes: ArrayBuffer;
    let contentType: string;
    try {
      const res = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
      if (!res.ok) return null;
      contentType = res.headers.get("content-type") ?? "image/png";
      if (!contentType.startsWith("image/")) return null;
      bytes = await res.arrayBuffer();
    } finally {
      clearTimeout(timer);
    }

    const ext = contentType.split("/")[1]?.split(";")[0] ?? "png";
    const path = `logos/crawled-${crypto.randomUUID()}.${ext}`;
    const supabase = await createServerSupabase();
    const { error } = await supabase.storage
      .from("site-media")
      .upload(path, bytes, { contentType, upsert: false });
    if (error) return null;

    const { data } = supabase.storage.from("site-media").getPublicUrl(path);
    onProgress(`Captured a logo candidate`);
    return data.publicUrl;
  } catch {
    return null; // logo grab is always non-fatal
  }
}

/**
 * Crawls a site: the submitted URL plus up to 4 key pages. Reports progress
 * through `onProgress`. Throws an Error (plain message) only if the submitted
 * URL itself cannot be fetched; sub-page failures are reported and skipped.
 */
export async function crawlSite(
  url: string,
  onProgress: (message: string) => void,
): Promise<CrawlResult> {
  let homepageHtml: string;
  try {
    onProgress(`Fetching ${url}`);
    homepageHtml = await fetchHtml(url);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "could not be reached";
    throw new Error(`Could not read the homepage — the site ${reason}.`);
  }
  onProgress("Fetched the homepage");

  const home = extractPageText(homepageHtml);
  const parts: string[] = [
    `PAGE: ${url}\nTITLE: ${home.title}\nDESCRIPTION: ${home.description}\n${home.text}`,
  ];

  const keyLinks = discoverKeyLinks(homepageHtml, url);
  if (keyLinks.length > 0) {
    onProgress(
      `Found ${keyLinks.length} key page${keyLinks.length === 1 ? "" : "s"}: ` +
        keyLinks.map((l) => new URL(l).pathname).join(", "),
    );
  } else {
    onProgress("No extra key pages found — using the homepage only");
  }

  for (const link of keyLinks) {
    const path = new URL(link).pathname;
    try {
      const html = await fetchHtml(link);
      const page = extractPageText(html);
      parts.push(`PAGE: ${link}\nTITLE: ${page.title}\n${page.text}`);
      onProgress(`Fetched ${path}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "failed";
      onProgress(`Skipped ${path} — ${reason}`);
    }
  }

  const combinedText = parts.join("\n\n---\n\n").slice(0, MAX_TEXT);
  if (combinedText.replace(/\s/g, "").length < 200) {
    throw new Error(
      "Reached the site but found almost no readable text to analyse.",
    );
  }
  onProgress(`Extracted ${combinedText.length} characters of text`);

  const logoUrl = await grabLogo(homepageHtml, url, onProgress);
  return { combinedText, logoUrl };
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/onboarding/crawl.ts
git commit -m "feat: add the site crawler"
```

---

## Task 6: The Claude analysis call

**Files:** Create `src/lib/onboarding/analyze.ts`

- [ ] **Step 1: Create `src/lib/onboarding/analyze.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/types/onboarding";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You analyse a company's website and produce a structured \
listing for the 8Caps services directory.

You are given visible text extracted from the site's homepage and a few key \
pages. Produce an accurate, concise, professional listing. Rules:
- Do not invent facts that the page content does not support.
- Write in British English.
- "shortSummary" is one clear sentence.
- "fullOverview" is 2-3 short paragraphs.
- "services" lists the concrete services or features the site offers.
- Choose the single best-fitting category SLUG from the provided list, or null \
if none genuinely fits.
- Choose only genuinely relevant tag SLUGs from the provided list.
- "suggestedSlug" is a lowercase, hyphenated slug derived from the site name.
- "confidence" reflects how well the page content supported the analysis.
- "notes" flags anything important that was missing or unclear.
Always call the save_site_analysis tool with your result.`;

const TOOL: Anthropic.Tool = {
  name: "save_site_analysis",
  description: "Save the structured analysis of the website.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "The website / brand name" },
      shortSummary: { type: "string", description: "One-sentence summary" },
      fullOverview: { type: "string", description: "2-3 paragraph overview" },
      targetAudience: { type: "string", description: "Who the site is for" },
      suggestedCategorySlug: {
        type: ["string", "null"],
        description: "Best-fitting category slug from the supplied list, or null",
      },
      suggestedTagSlugs: {
        type: "array",
        items: { type: "string" },
        description: "Relevant tag slugs from the supplied list",
      },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["name", "description"],
        },
      },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
      suggestedSlug: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      notes: { type: "string" },
    },
    required: [
      "name",
      "shortSummary",
      "fullOverview",
      "targetAudience",
      "suggestedCategorySlug",
      "suggestedTagSlugs",
      "services",
      "seoTitle",
      "seoDescription",
      "suggestedSlug",
      "confidence",
      "notes",
    ],
  },
};

export interface AnalyzeInput {
  text: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
}

/** Sends crawled site text to Claude and returns the structured analysis. */
export async function analyzeSite(input: AnalyzeInput): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("AI analysis is not configured (ANTHROPIC_API_KEY is unset).");
  }

  const client = new Anthropic({ apiKey });

  const categoryList = input.categories
    .map((c) => `- ${c.name} (slug: ${c.slug})`)
    .join("\n");
  const tagList = input.tags
    .map((t) => `- ${t.name} (slug: ${t.slug})`)
    .join("\n");

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL],
      tool_choice: { type: "tool", name: "save_site_analysis" },
      messages: [
        {
          role: "user",
          content:
            `Existing categories:\n${categoryList || "(none)"}\n\n` +
            `Existing tags:\n${tagList || "(none)"}\n\n` +
            `Website content:\n${input.text}`,
        },
      ],
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    throw new Error(`The AI request failed: ${reason}`);
  }

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The AI did not return a structured result.");
  }
  return toolUse.input as AnalysisResult;
}
```

- [ ] **Step 2: Typecheck**

Run `npm run typecheck`. Expected: no errors. (If `Anthropic.Tool` / `Anthropic.Message` type names differ in the installed SDK version, adjust to the SDK's exported names — do not change the runtime logic.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/onboarding/analyze.ts
git commit -m "feat: add Claude site analysis"
```

---

## Task 7: The streaming analyse endpoint

**Files:** Create `src/app/api/admin/analyze-url/route.ts`

- [ ] **Step 1: Create `src/app/api/admin/analyze-url/route.ts`**

```ts
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminCategories, getAllTags } from "@/lib/data/admin";
import { crawlSite } from "@/lib/onboarding/crawl";
import { analyzeSite } from "@/lib/onboarding/analyze";
import type { AnalyzeEvent } from "@/types/onboarding";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  // Auth: this route is not under /admin, so the proxy middleware does not
  // guard it — verify the admin session here.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string") throw new Error();
    const parsed = new URL(body.url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }
    url = parsed.toString();
  } catch {
    return new Response(
      JSON.stringify({ type: "error", message: "That doesn't look like a valid URL." }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AnalyzeEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        const crawl = await crawlSite(url, (message) =>
          send({ type: "progress", message }),
        );

        send({ type: "progress", message: "Analysing with Claude…" });
        const [categories, tags] = await Promise.all([
          getAdminCategories(),
          getAllTags(),
        ]);
        const result = await analyzeSite({
          text: crawl.combinedText,
          categories,
          tags,
        });

        send({
          type: "progress",
          message: `Analysis complete — confidence: ${result.confidence}`,
        });
        send({ type: "done", result, logoUrl: crawl.logoUrl });
      } catch (err) {
        send({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "An unexpected error stopped the analysis.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Verify the build passes**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: build succeeds; `/api/admin/analyze-url` appears in the route table.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/analyze-url/route.ts"
git commit -m "feat: add streaming URL-analysis endpoint"
```

---

## Task 8: NDJSON stream splitter + UrlAnalyzer panel

**Files:** Create `src/lib/onboarding/stream.ts`, `src/lib/onboarding/stream.test.ts`, `src/components/admin/UrlAnalyzer.tsx`

- [ ] **Step 1: Write the failing test for the splitter**

Create `src/lib/onboarding/stream.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { splitNdjson } from "./stream";

describe("splitNdjson", () => {
  it("returns complete lines and keeps the partial remainder", () => {
    const { lines, rest } = splitNdjson('{"a":1}\n{"b":2}\n{"c"');
    expect(lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('{"c"');
  });

  it("returns no lines when the buffer has no newline", () => {
    const { lines, rest } = splitNdjson('{"partial"');
    expect(lines).toEqual([]);
    expect(rest).toBe('{"partial"');
  });

  it("drops blank lines", () => {
    const { lines, rest } = splitNdjson('{"a":1}\n\n{"b":2}\n');
    expect(lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm test -- stream`. Expected: FAIL — `./stream` cannot be resolved.

- [ ] **Step 3: Create `src/lib/onboarding/stream.ts`**

```ts
/**
 * Splits a streamed NDJSON buffer into complete lines plus the trailing
 * partial line (`rest`) that has not been fully received yet.
 */
export function splitNdjson(buffer: string): { lines: string[]; rest: string } {
  const segments = buffer.split("\n");
  const rest = segments.pop() ?? "";
  const lines = segments.map((s) => s.trim()).filter((s) => s.length > 0);
  return { lines, rest };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm test -- stream`. Expected: all 3 tests PASS.

- [ ] **Step 5: Create `src/components/admin/UrlAnalyzer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { splitNdjson } from "@/lib/onboarding/stream";
import type { AnalysisResult, AnalyzeEvent } from "@/types/onboarding";

export function UrlAnalyzer({
  onResult,
}: {
  onResult: (
    result: AnalysisResult,
    analysedUrl: string,
    logoUrl: string | null,
  ) => void;
}) {
  const [url, setUrl] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function analyse() {
    if (!url.trim()) return;
    setRunning(true);
    setLog([]);
    setError(null);

    try {
      const res = await fetch("/api/admin/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.body) throw new Error("No response from the server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { lines, rest } = splitNdjson(buffer);
        buffer = rest;
        for (const line of lines) {
          const event = JSON.parse(line) as AnalyzeEvent;
          if (event.type === "progress") {
            setLog((l) => [...l, event.message]);
          } else if (event.type === "error") {
            setError(event.message);
          } else if (event.type === "done") {
            setLog((l) => [...l, "Done — review the fields below."]);
            onResult(event.result, url.trim(), event.logoUrl);
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The analysis could not be run.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="rounded-card border bg-surface-muted p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <h2
        className="text-sm font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Analyse a URL
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        Paste a website address and the AI will draft the fields below for you
        to review.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={running}
          className="w-full rounded-lg border bg-surface px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
        <button
          type="button"
          onClick={analyse}
          disabled={running || !url.trim()}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running ? "Analysing…" : "Analyse"}
        </button>
      </div>

      {log.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-oxford/90 p-3 font-mono text-xs text-white/80">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify build + tests**

Run `npm test -- stream` (3 pass) and `npm run build` (with `dangerouslyDisableSandbox: true`, succeeds).

- [ ] **Step 7: Commit**

```bash
git add src/lib/onboarding/stream.ts src/lib/onboarding/stream.test.ts src/components/admin/UrlAnalyzer.tsx
git commit -m "feat: add NDJSON splitter and UrlAnalyzer panel"
```

---

## Task 9: Wire the analyzer into the site form

**Files:** Modify `src/components/admin/SiteForm.tsx`, `src/app/admin/(dashboard)/sites/new/page.tsx`

- [ ] **Step 1: Add the analyzer to `SiteForm.tsx`**

Open `src/components/admin/SiteForm.tsx`. Make three changes:

**(a)** Add the imports near the existing imports:
```tsx
import { UrlAnalyzer } from "./UrlAnalyzer";
import type { AnalysisResult } from "@/types/onboarding";
```

**(b)** Add an `enableUrlAnalysis` prop. Change the component's props destructuring and type to include it:
```tsx
export function SiteForm({
  initial,
  categories,
  allTags,
  onSubmit,
  enableUrlAnalysis = false,
}: {
  initial?: SiteFormValues;
  categories: Category[];
  allTags: Tag[];
  onSubmit: (values: SiteFormValues) => Promise<ActionResult>;
  enableUrlAnalysis?: boolean;
}) {
```

**(c)** Add an `applyAnalysis` handler inside the component (after the existing `set` / `handleName` helpers) and render `<UrlAnalyzer>` at the top of the returned `<form>`, before the "Basics" section:
```tsx
  function applyAnalysis(
    result: AnalysisResult,
    analysedUrl: string,
    logoUrl: string | null,
  ) {
    const category = categories.find(
      (c) => c.slug === result.suggestedCategorySlug,
    );
    const tagIds = allTags
      .filter((t) => result.suggestedTagSlugs.includes(t.slug))
      .map((t) => t.id);
    setSlugEdited(true); // keep the AI slug; don't let name-typing overwrite it
    setValues((v) => ({
      ...v,
      name: result.name,
      slug: result.suggestedSlug,
      url: analysedUrl,
      logoUrl: logoUrl ?? v.logoUrl,
      shortSummary: result.shortSummary,
      fullOverview: result.fullOverview,
      targetAudience: result.targetAudience,
      categoryId: category?.id ?? v.categoryId,
      seoTitle: result.seoTitle,
      seoDescription: result.seoDescription,
      services: result.services,
      tagIds,
    }));
  }
```

In the returned JSX, immediately inside `<form onSubmit={handleSubmit} ...>` and before the Basics `<section>`, add:
```tsx
      {enableUrlAnalysis && <UrlAnalyzer onResult={applyAnalysis} />}
```

- [ ] **Step 2: Enable it on the new-site page**

Open `src/app/admin/(dashboard)/sites/new/page.tsx` and add the `enableUrlAnalysis` prop to the `<SiteForm>` element:
```tsx
      <SiteForm
        categories={categories}
        allTags={tags}
        onSubmit={createSite}
        enableUrlAnalysis
      />
```
(The edit page is left unchanged — no analyzer there.)

- [ ] **Step 3: Verify typecheck + build**

Run `npm run typecheck` then `npm run build` (with `dangerouslyDisableSandbox: true`). Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/SiteForm.tsx "src/app/admin/(dashboard)/sites/new/page.tsx"
git commit -m "feat: wire URL analyzer into the add-website form"
```

---

## Task 10: Full verification and deploy

**Files:** none (verification)

- [ ] **Step 1: Run the full test suite**

Run `npm test`. Expected: all tests pass — the Plan 1/2 tests plus the new `extract`, `links`, and `stream` suites.

- [ ] **Step 2: Typecheck and lint**

Run `npm run typecheck` then `npm run lint`. Expected: both clean.

- [ ] **Step 3: Production build**

Run `npm run build` (with `dangerouslyDisableSandbox: true`).
Expected: succeeds; `/api/admin/analyze-url` in the route table.

- [ ] **Step 4: Manual smoke test**

Requires `ANTHROPIC_API_KEY` set in `.env.local` and a logged-in admin. Run `npm run build && npm start` (with `dangerouslyDisableSandbox: true`), then:
- Sign in, go to `/admin/sites/new`.
- Paste a real website URL into "Analyse a URL", click Analyse.
- Confirm the progress log fills in step by step (fetching, key pages, extraction, analysing).
- Confirm the form fields populate, and the confidence shows in the log.
- Try a bad URL (e.g. `https://thisdoesnotexist.example`) and confirm a clear error appears and the form is still usable.
- Save the drafted site and confirm it appears in `/admin/sites` as a draft.

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "chore: AI URL onboarding complete"
git push
```

---

## Self-Review Notes

- **Spec coverage:** streaming endpoint (Task 7) · crawl homepage + up to 4 key pages (Task 5, using Tasks 3-4) · `fetch`+`cheerio` extraction (Tasks 3-5) · Claude tool-use analysis with prompt caching (Task 6) · NDJSON progress events + live log + clear errors (Tasks 7-8) · "Analyse a URL" panel on the add form with field pre-fill (Tasks 8-9) · best-effort logo grab to `site-media` (Task 5) · category/tag picked from existing lists only (Task 6 tool prompt + Task 9 mapping) · no DB changes · draft-by-default preserved (Task 9 leaves publish status untouched). `ANTHROPIC_API_KEY` + deps (Task 1).
- **Type consistency:** `AnalysisResult` and `AnalyzeEvent` (Task 2) are used unchanged by `analyze.ts` (Task 6), the route (Task 7), `UrlAnalyzer` (Task 8), and `SiteForm.applyAnalysis` (Task 9). `crawlSite` returns `CrawlResult` (Task 5) consumed by the route (Task 7). `splitNdjson` (Task 8) is consumed only by `UrlAnalyzer`.
- **Edit form untouched:** `enableUrlAnalysis` defaults to `false`; only the new-site page opts in.
- **Auth:** the route handler self-checks the session (the proxy guards `/admin/*` pages, not `/api/*`).
