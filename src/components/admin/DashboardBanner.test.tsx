import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardBanner } from "./DashboardBanner";

describe("DashboardBanner", () => {
  it("greets the named user with a capitalised greeting and exclamation", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/^Good (Morning|Afternoon|Evening), James!$/)).toBeInTheDocument();
  });

  it("shows only the greeting when there is no name", () => {
    render(<DashboardBanner name={null} totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/^Good (Morning|Afternoon|Evening)!$/)).toBeInTheDocument();
  });

  it("summarises the directory size", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(screen.getByText(/42 products/)).toBeInTheDocument();
    expect(screen.getByText(/3 added this week/)).toBeInTheDocument();
  });

  it("links to the add-product page", () => {
    render(<DashboardBanner name="James" totalSites={42} addedThisWeek={3} />);
    expect(
      screen.getByRole("link", { name: /add a product/i }),
    ).toHaveAttribute("href", "/admin/products/new");
  });
});
