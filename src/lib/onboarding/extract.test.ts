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

  it("falls back to og:description when meta description is absent", () => {
    const html = `<html><head>
      <meta property="og:description" content="Bespoke websites built around your vision.">
      </head><body></body></html>`;
    expect(extractPageText(html).description).toBe(
      "Bespoke websites built around your vision.",
    );
  });

  it("falls back to twitter:description when meta and og are absent", () => {
    const html = `<html><head>
      <meta name="twitter:description" content="The Twitter blurb.">
      </head><body></body></html>`;
    expect(extractPageText(html).description).toBe("The Twitter blurb.");
  });

  it("prefers meta description over og/twitter when present", () => {
    const html = `<html><head>
      <meta name="description" content="Standard.">
      <meta property="og:description" content="OpenGraph.">
      </head><body></body></html>`;
    expect(extractPageText(html).description).toBe("Standard.");
  });

  it("harvests og:title, og:site_name and keywords into the text", () => {
    const html = `<html><head>
      <meta property="og:site_name" content="Blue Canoe">
      <meta property="og:title" content="Blue Canoe — Bespoke Web Design">
      <meta name="keywords" content="web design, bespoke, websites">
      </head><body></body></html>`;
    const { text } = extractPageText(html);
    expect(text).toContain("Site name: Blue Canoe");
    expect(text).toContain("OG title: Blue Canoe — Bespoke Web Design");
    expect(text).toContain("Keywords: web design, bespoke, websites");
  });

  it("adds a distinct og:description as an extra Summary line", () => {
    const html = `<html><head>
      <meta name="description" content="Primary blurb.">
      <meta property="og:description" content="Different OG blurb.">
      </head><body></body></html>`;
    const { description, text } = extractPageText(html);
    expect(description).toBe("Primary blurb.");
    expect(text).toContain("Summary: Different OG blurb.");
  });

  it("does not repeat a secondary description that matches the primary", () => {
    const html = `<html><head>
      <meta property="og:description" content="Same blurb.">
      <meta name="twitter:description" content="Same blurb.">
      </head><body></body></html>`;
    const { description, text } = extractPageText(html);
    expect(description).toBe("Same blurb.");
    expect(text).not.toContain("Summary:");
  });

  it("yields usable signal for a JS-rendered shell with an empty body", () => {
    // The class of page that previously failed the "no readable text" guard:
    // an empty app shell whose only content lives in <head> metadata.
    const html = `<html><head>
      <title>Blue Canoe — Bespoke Web Design</title>
      <meta name="description" content="Bespoke, hand-crafted websites built around your vision.">
      <meta property="og:title" content="Blue Canoe">
      </head><body><div id="root"></div></body></html>`;
    const result = extractPageText(html);
    expect(result.description).toContain("Bespoke, hand-crafted websites");
    expect(result.text).toContain("OG title: Blue Canoe");
  });
});
