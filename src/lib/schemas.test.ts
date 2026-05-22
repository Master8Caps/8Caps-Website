import { describe, it, expect } from "vitest";
import { siteFormSchema, categoryRenameSchema } from "./schemas";

const validSite = {
  name: "Test Site",
  slug: "test-site",
  url: "https://example.com",
  logoUrl: null,
  shortSummary: "A short summary.",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  newCategoryName: null,
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

describe("siteFormSchema — newCategoryName", () => {
  it("accepts a string newCategoryName", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, newCategoryName: "Trades" })
        .success,
    ).toBe(true);
  });

  it("accepts a null newCategoryName", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, newCategoryName: null })
        .success,
    ).toBe(true);
  });
});

describe("categoryRenameSchema", () => {
  it("accepts a non-empty name", () => {
    expect(categoryRenameSchema.safeParse({ name: "Trades" }).success).toBe(
      true,
    );
  });

  it("rejects an empty name", () => {
    expect(categoryRenameSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
