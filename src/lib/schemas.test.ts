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
