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
