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
