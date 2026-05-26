import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string(),
});

const screenshotSchema = z.object({
  imageUrl: z.string().url("Screenshot must have a valid URL"),
  altText: z.string(),
});

export const siteFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  url: z.string().url("Must be a valid URL"),
  logoUrl: z.string().url().nullable(),
  shortSummary: z.string().min(1, "Short summary is required"),
  fullOverview: z.string(),
  targetAudience: z.string(),
  categoryId: z.string().uuid().nullable(),
  newCategoryName: z.string().nullable(),
  publishStatus: z.enum(["draft", "published", "archived"]),
  lifecycle: z.enum(["live", "coming_soon"]),
  visibility: z.enum(["public", "private"]),
  isFeatured: z.boolean(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  services: z.array(serviceSchema),
  screenshots: z.array(screenshotSchema),
  tagIds: z.array(z.string().uuid()),
});

export const categoryRenameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type SiteFormInput = z.infer<typeof siteFormSchema>;

const caseStudyServiceSchema = z.enum([
  "custom_software",
  "ai",
  "automation",
  "lead_gen",
  "ecommerce",
]);

const currentYear = new Date().getFullYear();

export const caseStudyFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  clientSector: z.string(),
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(currentYear + 1, "Year is in the future")
    .nullable(),
  logoUrl: z.string().url().nullable(),
  brandColour: z
    .union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex like #1f2937")]),
  outcomeHeadline: z.string().min(1, "Outcome headline is required"),
  storyProblem: z.string().min(1, "Problem paragraph is required"),
  storySolution: z.string().min(1, "Solution paragraph is required"),
  testimonialQuote: z.string().min(1, "Testimonial quote is required"),
  testimonialAuthor: z.string().min(1, "Testimonial author is required"),
  testimonialRole: z.string(),
  techStack: z.array(z.string().min(1)),
  services: z.array(caseStudyServiceSchema),
  publishStatus: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0),
  testimonialApproved: z.boolean(),
});

export type CaseStudyFormInput = z.infer<typeof caseStudyFormSchema>;
