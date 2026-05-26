import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("links to the four admin areas", () => {
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /add product/i })).toHaveAttribute(
      "href",
      "/admin/products/new",
    );
    expect(
      screen.getByRole("link", { name: /manage products/i }),
    ).toHaveAttribute("href", "/admin/products");
    expect(
      screen.getByRole("link", { name: /tidy categories/i }),
    ).toHaveAttribute("href", "/admin/categories");
    expect(
      screen.getByRole("link", { name: /add case study/i }),
    ).toHaveAttribute("href", "/admin/case-studies/new");
  });
});
