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
