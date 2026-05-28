import { describe, it, expect } from "vitest";
import { formatEnquiryDate } from "./enquiries";

describe("formatEnquiryDate", () => {
  it("formats an ISO timestamp as a short en-GB date in UTC", () => {
    expect(formatEnquiryDate("2026-05-28T09:30:00Z")).toBe("28 May 2026");
  });

  it("uses UTC, so a late-evening UTC time keeps the same calendar day", () => {
    expect(formatEnquiryDate("2026-01-01T23:59:00Z")).toBe("1 Jan 2026");
  });
});
