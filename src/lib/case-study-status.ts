import type { PublishStatus } from "@/types/domain";
import type { CaseStudyStatus } from "@/types/case-study";

/**
 * Derive the admin-visible status of a case study from its two gating
 * columns. Pending means published-but-unapproved — that's the case the
 * admin needs to act on. Live means published-and-approved (the only state
 * that's visible to the public, per RLS).
 */
export function statusFor(row: {
  publishStatus: PublishStatus;
  testimonialApprovedAt: string | null;
}): CaseStudyStatus {
  if (row.publishStatus === "draft") return "draft";
  if (row.publishStatus === "archived") return "archived";
  return row.testimonialApprovedAt ? "live" : "pending";
}
