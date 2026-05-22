import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("links to the four admin areas", () => {
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /add website/i })).toHaveAttribute(
      "href",
      "/admin/sites/new",
    );
    expect(
      screen.getByRole("link", { name: /manage websites/i }),
    ).toHaveAttribute("href", "/admin/sites");
    expect(
      screen.getByRole("link", { name: /tidy categories/i }),
    ).toHaveAttribute("href", "/admin/categories");
    expect(
      screen.getByRole("link", { name: /view enquiries/i }),
    ).toHaveAttribute("href", "/admin/enquiries");
  });
});
