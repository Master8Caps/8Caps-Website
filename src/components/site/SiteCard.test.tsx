import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteCard } from "./SiteCard";
import type { SiteSummary } from "@/types/domain";

const site: SiteSummary = {
  id: "1",
  name: "Automated Panda",
  slug: "automated-panda",
  url: "https://automatedpanda.com",
  logoUrl: null,
  shortSummary: "Workflow automation for small businesses.",
  lifecycle: "live",
  isFeatured: true,
  category: { id: "c1", name: "Automation", slug: "automation", description: null },
};

describe("SiteCard", () => {
  it("shows the site name, summary and category", () => {
    render(<SiteCard site={site} />);
    expect(screen.getByText("Automated Panda")).toBeInTheDocument();
    expect(
      screen.getByText("Workflow automation for small businesses."),
    ).toBeInTheDocument();
    expect(screen.getByText("Automation")).toBeInTheDocument();
  });

  it("links 'View details' to the site profile", () => {
    render(<SiteCard site={site} />);
    const link = screen.getByRole("link", { name: /view details/i });
    expect(link).toHaveAttribute("href", "/sites/automated-panda");
  });

  it("links 'Visit website' to the external URL", () => {
    render(<SiteCard site={site} />);
    const link = screen.getByRole("link", { name: /visit website/i });
    expect(link).toHaveAttribute("href", "https://automatedpanda.com");
  });
});
