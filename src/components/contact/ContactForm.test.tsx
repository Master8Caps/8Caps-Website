import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("renders every form field", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Your name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByLabelText(/What kind of project/)).toBeInTheDocument();
    expect(screen.getByLabelText(/How did you hear/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tell us about your project/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send enquiry/i })).toBeInTheDocument();
  });

  it("renders all project type options", () => {
    render(<ContactForm />);
    expect(screen.getByRole("option", { name: "Custom Software" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "AI Solutions" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Automation" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Not sure yet" })).toBeInTheDocument();
  });
});
