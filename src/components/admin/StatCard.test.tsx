import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Total websites" value={42} />);
    expect(screen.getByText("Total websites")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the icon when given one", () => {
    render(
      <StatCard
        label="Drafts"
        value={3}
        icon={<svg data-testid="card-icon" />}
      />,
    );
    expect(screen.getByTestId("card-icon")).toBeInTheDocument();
  });
});
