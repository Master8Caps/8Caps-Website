import type { ProjectType } from "@/lib/contact-form";

export type PublishStatus = "draft" | "published" | "archived";
export type SiteLifecycle = "live" | "coming_soon";
export type SiteVisibility = "public" | "private";
export type EnquiryStatus = "new" | "read" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface Screenshot {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

/** A site as shown in lists (directory cards, homepage). */
export interface SiteSummary {
  id: string;
  name: string;
  slug: string;
  url: string;
  logoUrl: string | null;
  shortSummary: string;
  lifecycle: SiteLifecycle;
  isFeatured: boolean;
  category: Category | null;
}

/** A site with all related data, for the profile page. */
export interface SiteDetail extends SiteSummary {
  fullOverview: string | null;
  targetAudience: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  services: Service[];
  screenshots: Screenshot[];
  tags: Tag[];
}

export interface Enquiry {
  id: string;
  siteId: string | null;
  name: string;
  email: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

/** A contact-form submission as shown in the admin inbox. Carries the extra
 *  fields the contact form added after the original `Enquiry` shape. */
export interface AdminEnquiry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectType: ProjectType | null;
  heardAbout: string | null;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

/** One service row in the site form. */
export interface ServiceInput {
  name: string;
  description: string;
}

/** One screenshot row in the site form. */
export interface ScreenshotInput {
  imageUrl: string;
  altText: string;
}

/** The full editable shape of a site, as used by the admin site form. */
export interface SiteFormValues {
  name: string;
  slug: string;
  url: string;
  logoUrl: string | null;
  shortSummary: string;
  fullOverview: string;
  targetAudience: string;
  categoryId: string | null;
  newCategoryName: string | null;
  publishStatus: PublishStatus;
  lifecycle: SiteLifecycle;
  visibility: SiteVisibility;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  services: ServiceInput[];
  screenshots: ScreenshotInput[];
  tagIds: string[];
  /** Names of brand-new tags to create on save and attach to this product. */
  newTags: string[];
}

/** A site row in the admin list view. */
export interface AdminSiteRow {
  id: string;
  name: string;
  slug: string;
  publishStatus: PublishStatus;
  lifecycle: SiteLifecycle;
  visibility: SiteVisibility;
  isFeatured: boolean;
  categoryName: string | null;
  updatedAt: string;
}

/** Dashboard counts. */
export interface DashboardStats {
  totalSites: number;
  publishedSites: number;
  draftSites: number;
  categories: number;
  sitesAddedThisWeek: number;
  caseStudyCount: number;
  pendingCaseStudyApprovals: number;
  newEnquiries: number;
}

/** Result returned by a Server Action on the validation / DB-error path. */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** A category with its site count, for the admin tidy-up tool. */
export interface AdminCategory extends Category {
  siteCount: number;
}

/** A site row in the dashboard "recently added" panel. */
export interface RecentSite {
  id: string;
  name: string;
  publishStatus: PublishStatus;
  categoryName: string | null;
}
