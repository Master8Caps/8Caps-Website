import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("exposes '8Caps' as its accessible name", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "8Caps" })).toBeInTheDocument();
  });

  it("defaults to the lockup source", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "8Caps" })).toHaveAttribute(
      "src",
      "/brand/8caps-logo-transparent.svg",
    );
  });

  it("renders the mark variant source", () => {
    render(<Logo variant="mark" />);
    expect(screen.getByRole("img", { name: "8Caps" })).toHaveAttribute(
      "src",
      "/brand/8caps-icon-transparent.svg",
    );
  });

  it("applies a passed className", () => {
    render(<Logo className="h-7 w-auto" />);
    expect(screen.getByRole("img", { name: "8Caps" })).toHaveClass(
      "h-7",
      "w-auto",
    );
  });
});
