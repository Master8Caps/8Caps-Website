import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Code } from "lucide-react";
import { ServicePillarSection } from "./ServicePillarSection";

describe("ServicePillarSection", () => {
  it("renders the pillar title, description, solves list, audience and CTA", () => {
    render(
      <ServicePillarSection
        anchorId="custom-software"
        icon={Code}
        title="Custom Software"
        description="We build the apps your business has outgrown spreadsheets for."
        solves={[
          "Spreadsheets that have outgrown themselves",
          "Tools that don't talk to each other",
        ]}
        audience="UK SMBs — typically £500k–£10m turnover."
        ctaHref="/contact"
        ctaLabel="Tell us about your project"
      />,
    );

    expect(screen.getByText("Custom Software")).toBeInTheDocument();
    expect(
      screen.getByText(/We build the apps your business has outgrown/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Spreadsheets that have outgrown themselves"),
    ).toBeInTheDocument();
    expect(screen.getByText(/UK SMBs/)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Tell us about your project" });
    expect(cta).toHaveAttribute("href", "/contact");
  });

  it("sets the anchor id so #links work", () => {
    const { container } = render(
      <ServicePillarSection
        anchorId="ai-solutions"
        icon={Code}
        title="AI"
        description="x"
        solves={[]}
        audience="x"
        ctaHref="/contact"
        ctaLabel="x"
      />,
    );
    expect(container.querySelector("#ai-solutions")).not.toBeNull();
  });
});
