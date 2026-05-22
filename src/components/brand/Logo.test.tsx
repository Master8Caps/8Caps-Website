import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";
import { MARK_VIEWBOX, LOCKUP_VIEWBOX } from "./logo-art";

describe("Logo", () => {
  it("exposes '8Caps' as its accessible name", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "8Caps" })).toBeInTheDocument();
  });

  it("defaults to the lockup variant", () => {
    const { container } = render(<Logo />);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      LOCKUP_VIEWBOX,
    );
  });

  it("renders the mark variant with the mark viewBox", () => {
    const { container } = render(<Logo variant="mark" />);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      MARK_VIEWBOX,
    );
  });

  it("applies a passed className", () => {
    const { container } = render(<Logo className="h-7 w-auto" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe(
      "h-7 w-auto",
    );
  });
});
