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
