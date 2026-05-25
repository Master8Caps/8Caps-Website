import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatStrip } from "./StatStrip";

describe("StatStrip", () => {
  it("renders every stat label and value", () => {
    render(
      <StatStrip
        stats={[
          { value: "3+", label: "Years operating" },
          { value: "20", label: "Projects shipped" },
          { value: "12", label: "UK sectors" },
        ]}
      />,
    );

    expect(screen.getByText("3+")).toBeInTheDocument();
    expect(screen.getByText("Years operating")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("Projects shipped")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("UK sectors")).toBeInTheDocument();
  });
});
