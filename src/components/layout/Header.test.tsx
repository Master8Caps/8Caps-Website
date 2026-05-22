import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
  it("shows the logo as a link to the home page", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: "8Caps" });
    expect(link).toHaveAttribute("href", "/");
  });
});
