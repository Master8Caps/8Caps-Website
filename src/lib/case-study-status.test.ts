import { describe, it, expect } from "vitest";
import { statusFor } from "./case-study-status";

describe("statusFor", () => {
  it("returns 'draft' when publishStatus is draft", () => {
    expect(statusFor({ publishStatus: "draft", testimonialApprovedAt: null })).toBe("draft");
  });

  it("returns 'archived' when publishStatus is archived", () => {
    expect(statusFor({ publishStatus: "archived", testimonialApprovedAt: null })).toBe("archived");
  });

  it("returns 'pending' when published but testimonial not approved", () => {
    expect(
      statusFor({ publishStatus: "published", testimonialApprovedAt: null }),
    ).toBe("pending");
  });

  it("returns 'live' when published and testimonial approved", () => {
    expect(
      statusFor({
        publishStatus: "published",
        testimonialApprovedAt: "2026-05-25T10:00:00Z",
      }),
    ).toBe("live");
  });
});
