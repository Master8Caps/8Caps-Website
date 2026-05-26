import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyCard } from "./CaseStudyCard";
import type { CaseStudy } from "@/types/case-study";

const cs: CaseStudy = {
  id: "1",
  slug: "north-bar",
  clientName: "North Bar",
  clientSector: "Hospitality",
  year: 2024,
  logoUrl: null,
  brandColour: null,
  outcomeHeadline: "Replaced two hours of weekly admin with a Sunday-night email.",
  storyProblem: "They needed a way to track bookings without a spreadsheet.",
  storySolution: "We built a custom booking dashboard with automated email drafts.",
  testimonialQuote: "It just works. No more chasing paperwork on a Monday morning.",
  testimonialAuthor: "Obi",
  testimonialRole: "Owner",
  techStack: ["Next.js", "Supabase", "Make.com"],
  isFeatured: true,
  sortOrder: 0,
  services: ["custom_software", "automation"],
};

describe("CaseStudyCard", () => {
  it("renders the client name, sector and year", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText("North Bar")).toBeInTheDocument();
    expect(screen.getByText(/Hospitality/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("renders the outcome headline", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(
      screen.getByText(/Replaced two hours of weekly admin/),
    ).toBeInTheDocument();
  });

  it("renders the testimonial quote and signed author", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText(/It just works/)).toBeInTheDocument();
    expect(screen.getByText(/Obi, Owner, North Bar/)).toBeInTheDocument();
  });

  it("renders both story paragraphs", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(
      screen.getByText(/track bookings without a spreadsheet/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/custom booking dashboard/),
    ).toBeInTheDocument();
  });

  it("renders tech stack tags", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Supabase")).toBeInTheDocument();
    expect(screen.getByText("Make.com")).toBeInTheDocument();
  });

  it("renders the service pillar tags", () => {
    render(<CaseStudyCard caseStudy={cs} />);
    expect(screen.getByText("Custom Software")).toBeInTheDocument();
    expect(screen.getByText("Automation")).toBeInTheDocument();
  });
});
