import { describe, it, expect } from "vitest";
import { siteFormSchema, categorySchema } from "./schemas";

const validSite = {
  name: "Test Site",
  slug: "test-site",
  url: "https://example.com",
  logoUrl: null,
  shortSummary: "A short summary.",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  publishStatus: "draft",
  lifecycle: "live",
  visibility: "public",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  services: [],
  screenshots: [],
  tagIds: [],
};

describe("siteFormSchema", () => {
  it("accepts a valid site", () => {
    expect(siteFormSchema.safeParse(validSite).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, name: "" }).success,
    ).toBe(false);
  });

  it("rejects a non-URL url", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, url: "not-a-url" }).success,
    ).toBe(false);
  });

  it("rejects an invalid publishStatus", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, publishStatus: "wrong" })
        .success,
    ).toBe(false);
  });

  it("rejects an empty slug", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, slug: "" }).success,
    ).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts a valid category", () => {
    expect(
      categorySchema.safeParse({
        name: "Automation",
        slug: "automation",
        description: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      categorySchema.safeParse({ name: "", slug: "x", description: "" })
        .success,
    ).toBe(false);
  });
});
