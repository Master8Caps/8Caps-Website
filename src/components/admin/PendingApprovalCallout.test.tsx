import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingApprovalCallout } from "./PendingApprovalCallout";

describe("PendingApprovalCallout", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<PendingApprovalCallout count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a singular message for count = 1", () => {
    const { container } = render(<PendingApprovalCallout count={1} />);
    const span = container.querySelector("span");
    expect(span?.textContent).toMatch(/1\s+case study\s+pending approval/);
  });

  it("renders a plural message for count > 1", () => {
    const { container } = render(<PendingApprovalCallout count={3} />);
    const span = container.querySelector("span");
    expect(span?.textContent).toMatch(/3\s+case studies\s+pending approval/);
  });

  it("links to the pending-filtered list view", () => {
    render(<PendingApprovalCallout count={2} />);
    expect(screen.getByRole("link", { name: /review/i })).toHaveAttribute(
      "href",
      "/admin/case-studies?status=pending",
    );
  });
});
