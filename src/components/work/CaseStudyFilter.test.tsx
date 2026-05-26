import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyFilter } from "./CaseStudyFilter";

describe("CaseStudyFilter", () => {
  it("renders an 'All' pill and one pill per service", () => {
    render(<CaseStudyFilter active={null} />);
    expect(screen.getByRole("link", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Custom Software" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AI" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Automation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lead Gen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "E-commerce" })).toBeInTheDocument();
  });

  it("links 'All' to /work with no service param", () => {
    render(<CaseStudyFilter active={null} />);
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/work");
  });

  it("links each service pill to /work?service=<value>", () => {
    render(<CaseStudyFilter active={null} />);
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute(
      "href",
      "/work?service=ai",
    );
    expect(screen.getByRole("link", { name: "Custom Software" })).toHaveAttribute(
      "href",
      "/work?service=custom_software",
    );
  });
});
