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
