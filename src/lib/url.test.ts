import { describe, it, expect } from "vitest";
import { normalizeUrl } from "./url";

describe("normalizeUrl", () => {
  it("prefixes https:// to a bare domain", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("leaves an existing https URL untouched", () => {
    expect(normalizeUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("leaves an existing http URL untouched", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("is case-insensitive about an existing scheme", () => {
    expect(normalizeUrl("HTTPS://Example.com")).toBe("HTTPS://Example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeUrl("   ")).toBe("");
  });

  it("handles a protocol-relative URL", () => {
    expect(normalizeUrl("//example.com")).toBe("https://example.com");
  });

  it("preserves subdomain, path and query", () => {
    expect(normalizeUrl("app.example.co.uk/x?y=1")).toBe(
      "https://app.example.co.uk/x?y=1",
    );
  });
});
