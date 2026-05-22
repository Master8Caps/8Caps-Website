import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentSites } from "./RecentSites";
import type { RecentSite } from "@/types/domain";

const sites: RecentSite[] = [
  { id: "1", name: "Riverside Plumbing", publishStatus: "published", categoryName: "Trades" },
  { id: "2", name: "Apex Accountancy", publishStatus: "draft", categoryName: null },
];

describe("RecentSites", () => {
  it("lists each site linking to its edit page", () => {
    render(<RecentSites sites={sites} />);
    expect(
      screen.getByRole("link", { name: /Riverside Plumbing/ }),
    ).toHaveAttribute("href", "/admin/sites/1/edit");
  });

  it("shows an empty message when there are no sites", () => {
    render(<RecentSites sites={[]} />);
    expect(screen.getByText(/no websites yet/i)).toBeInTheDocument();
  });
});
