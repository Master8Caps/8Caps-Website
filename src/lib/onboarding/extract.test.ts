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
