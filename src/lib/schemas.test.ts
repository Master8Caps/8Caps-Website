import { describe, it, expect } from "vitest";
import { siteFormSchema, categoryRenameSchema, caseStudyFormSchema } from "./schemas";
import type { CaseStudyFormValues } from "@/types/case-study";

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
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
  services: [],
  screenshots: [],
  tagIds: [],
  newTags: [],
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

  it("accepts a bare domain and normalises it to https://", () => {
    const result = siteFormSchema.safeParse({
      ...validSite,
      url: "example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.url).toBe("https://example.com");
  });

  it("rejects an unsalvageable url", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, url: "https://" }).success,
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

  it("accepts Postgres-lenient UUIDs for categoryId and tagIds", () => {
    // Seed/placeholder ids like this are valid in a Postgres `uuid` column
    // but fail zod v4's RFC-strict .uuid(); the form must accept them.
    const seed = "11111111-1111-1111-1111-111111111101";
    const result = siteFormSchema.safeParse({
      ...validSite,
      categoryId: seed,
      tagIds: [seed],
    });
    expect(result.success).toBe(true);
  });

  it("still rejects a categoryId that isn't UUID-shaped", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, categoryId: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it("rejects a negative sortOrder", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, sortOrder: -1 }).success,
    ).toBe(false);
  });

  it("accepts new tag names to create", () => {
    expect(
      siteFormSchema.safeParse({ ...validSite, newTags: ["Property", "AI"] })
        .success,
    ).toBe(true);
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

const validCaseStudy: CaseStudyFormValues = {
  clientName: "North Bar",
  slug: "north-bar",
  clientSector: "Hospitality",
  year: 2024,
  logoUrl: null,
  brandColour: "",
  outcomeHeadline: "Sold out every weekend",
  storyProblem: "Couldn't manage bookings.",
  storySolution: "Built a booking widget.",
  testimonialQuote: "It changed our business.",
  testimonialAuthor: "Obi",
  testimonialRole: "Owner",
  techStack: ["Next.js", "Supabase"],
  services: ["custom_software"],
  publishStatus: "draft",
  isFeatured: false,
  sortOrder: 0,
  testimonialApproved: false,
};

describe("caseStudyFormSchema", () => {
  it("accepts a fully populated valid case study", () => {
    expect(caseStudyFormSchema.safeParse(validCaseStudy).success).toBe(true);
  });

  it("requires clientName", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, clientName: "" }).success,
    ).toBe(false);
  });

  it("rejects an invalid slug", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, slug: "North Bar" }).success,
    ).toBe(false);
  });

  it("accepts an empty brandColour", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, brandColour: "" }).success,
    ).toBe(true);
  });

  it("rejects a non-hex brandColour", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, brandColour: "blue" }).success,
    ).toBe(false);
  });

  it("accepts a valid hex brandColour", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, brandColour: "#1f2937" }).success,
    ).toBe(true);
  });

  it("rejects year < 2000", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, year: 1999 }).success,
    ).toBe(false);
  });

  it("accepts a null year", () => {
    expect(
      caseStudyFormSchema.safeParse({ ...validCaseStudy, year: null }).success,
    ).toBe(true);
  });

  it("rejects an invalid service value", () => {
    expect(
      caseStudyFormSchema.safeParse({
        ...validCaseStudy,
        services: ["custom_software", "nonsense" as never],
      }).success,
    ).toBe(false);
  });
});
