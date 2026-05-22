import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Greeting } from "./Greeting";

describe("Greeting", () => {
  it("includes the name when one is given", () => {
    render(<Greeting name="James" fallbackHour={13} />);
    expect(
      screen.getByText(/^Good (Morning|Afternoon|Evening), James!$/),
    ).toBeInTheDocument();
  });

  it("shows only the greeting when there is no name", () => {
    render(<Greeting name={null} fallbackHour={13} />);
    expect(
      screen.getByText(/^Good (Morning|Afternoon|Evening)!$/),
    ).toBeInTheDocument();
  });
});
