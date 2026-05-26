import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyList } from "./CaseStudyList";
import type { AdminCaseStudyRow } from "@/types/case-study";

vi.mock("./CaseStudyApproveButton", () => ({
  CaseStudyApproveButton: ({ id }: { id: string }) => (
    <button>Approve</button>
  ),
}));

const rows: AdminCaseStudyRow[] = [
  {
    id: "1",
    slug: "north-bar",
    clientName: "North Bar",
    clientSector: "Hospitality",
    year: 2024,
    isFeatured: true,
    publishStatus: "published",
    testimonialApprovedAt: null,
  },
  {
    id: "2",
    slug: "hull-mag",
    clientName: "Hull Mag",
    clientSector: "Publishing",
    year: 2024,
    isFeatured: false,
    publishStatus: "published",
    testimonialApprovedAt: "2026-04-15T10:00:00Z",
  },
];

describe("CaseStudyList", () => {
  it("shows a pending pill and Approve button on pending rows", () => {
    render(<CaseStudyList rows={rows} />);
    expect(screen.getByText("North Bar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("shows a live pill on approved rows", () => {
    render(<CaseStudyList rows={rows} />);
    const hullMagRow = screen.getByText("Hull Mag").closest("tr")!;
    expect(hullMagRow).toHaveTextContent(/live/i);
  });

  it("does not render an Approve button on live rows", () => {
    render(<CaseStudyList rows={[rows[1]]} />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
  });

  it("renders an empty-state message when there are no rows", () => {
    render(<CaseStudyList rows={[]} />);
    expect(screen.getByText(/no case studies yet/i)).toBeInTheDocument();
  });

  it("links each client name to its edit page", () => {
    render(<CaseStudyList rows={rows} />);
    expect(
      screen.getByRole("link", { name: /North Bar/ }),
    ).toHaveAttribute("href", "/admin/case-studies/1/edit");
  });
});
