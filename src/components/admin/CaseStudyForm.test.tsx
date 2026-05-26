import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseStudyForm } from "./CaseStudyForm";
import type { CaseStudyFormValues } from "@/types/case-study";

const initial: CaseStudyFormValues = {
  clientName: "North Bar",
  slug: "north-bar",
  clientSector: "Hospitality",
  year: 2024,
  logoUrl: null,
  brandColour: "",
  outcomeHeadline: "Outcome",
  storyProblem: "Problem",
  storySolution: "Solution",
  testimonialQuote: "Quote",
  testimonialAuthor: "Obi",
  testimonialRole: "Owner",
  techStack: ["Next.js"],
  services: ["custom_software"],
  publishStatus: "published",
  isFeatured: false,
  sortOrder: 0,
  testimonialApproved: false,
};

describe("CaseStudyForm", () => {
  it("renders all five sections", () => {
    render(
      <CaseStudyForm initial={initial} onSubmit={async () => ({ ok: true })} />,
    );
    expect(screen.getByText(/Basics/i)).toBeInTheDocument();
    expect(screen.getByText(/Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Testimonial/i)).toBeInTheDocument();
    expect(screen.getByText(/Classification/i)).toBeInTheDocument();
    expect(screen.getByText(/Display/i)).toBeInTheDocument();
  });

  it("shows the approval toggle off when testimonialApproved is false", () => {
    render(
      <CaseStudyForm initial={initial} onSubmit={async () => ({ ok: true })} />,
    );
    const checkbox = screen.getByRole("checkbox", { name: /testimonial approved/i });
    expect(checkbox).not.toBeChecked();
  });

  it("shows the approval toggle on when testimonialApproved is true", () => {
    render(
      <CaseStudyForm
        initial={{ ...initial, testimonialApproved: true }}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: /testimonial approved/i });
    expect(checkbox).toBeChecked();
  });
});
