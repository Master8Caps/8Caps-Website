import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders 'Live' for the live lifecycle", () => {
    render(<StatusBadge lifecycle="live" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders 'Coming soon' for the coming_soon lifecycle", () => {
    render(<StatusBadge lifecycle="coming_soon" />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
