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
