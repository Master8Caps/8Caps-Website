import * as cheerio from "cheerio";

export interface ExtractedPage {
  title: string;
  description: string;
  text: string;
}

/**
 * Extracts the title, description, and visible body text from raw HTML.
 *
 * Social/SEO metadata (OpenGraph, Twitter card, keywords) is harvested too:
 * client-rendered SPA shells often serve an empty `<body>` but still include
 * these tags, so they're frequently the only readable signal on such sites.
 */
export function extractPageText(html: string): ExtractedPage {
  const $ = cheerio.load(html);

  const meta = (selector: string) => $(selector).attr("content")?.trim() ?? "";

  const title = $("title").first().text().trim();

  const metaDesc = meta('meta[name="description"]');
  const ogDesc = meta('meta[property="og:description"]');
  const twDesc = meta('meta[name="twitter:description"]');

  // Prefer the standard meta description, then OpenGraph, then Twitter — a
  // page may omit one but include another.
  const description = metaDesc || ogDesc || twDesc;

  // Secondary descriptions that differ from the primary add real signal,
  // especially on SPA shells whose <body> is empty. Dedupe so the same blurb
  // isn't repeated.
  const extraDescriptions = [...new Set([ogDesc, twDesc])].filter(
    (d) => d && d !== description,
  );

  // Labelled metadata worth handing to the AI. og:title is often a cleaner
  // brand name than the <title>; site_name and keywords add context.
  const labelled: Array<[string, string]> = [
    ["Site name", meta('meta[property="og:site_name"]')],
    ["OG title", meta('meta[property="og:title"]')],
    ["Keywords", meta('meta[name="keywords"]')],
  ];

  // Drop non-content nodes before reading the body text.
  $("script, style, noscript, nav, footer, svg, iframe").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const metaBlock = [
    ...labelled.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    ...extraDescriptions.map((d) => `Summary: ${d}`),
  ].join("\n");

  const text = [metaBlock, bodyText].filter(Boolean).join("\n");

  return { title, description, text };
}
