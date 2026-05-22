import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardBanner } from "./DashboardBanner";

describe("DashboardBanner", () => {
  it("greets the named user", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/James/)).toBeInTheDocument();
  });

  it("summarises the directory size", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/42 websites/)).toBeInTheDocument();
    expect(screen.getByText(/3 added this week/)).toBeInTheDocument();
  });

  it("links to the add-website page", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(
      screen.getByRole("link", { name: /add a website/i }),
    ).toHaveAttribute("href", "/admin/sites/new");
  });
});
