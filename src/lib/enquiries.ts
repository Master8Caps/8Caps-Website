import type { EnquiryStatus } from "@/types/domain";

/** Short, locale-stable date for the inbox (e.g. "28 May 2026"). Formatted in
 *  UTC so it renders identically on the server and the client. */
export function formatEnquiryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "🔵 New",
  read: "Read",
  archived: "Archived",
};

export const ENQUIRY_STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: "bg-soon-bg text-soon",
  read: "bg-black/5 text-ink-muted",
  archived: "bg-black/5 text-ink-muted",
};
