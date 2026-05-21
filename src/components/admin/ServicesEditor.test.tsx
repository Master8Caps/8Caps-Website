import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesEditor } from "./ServicesEditor";
import type { ServiceInput } from "@/types/domain";

describe("ServicesEditor", () => {
  it("renders existing service rows", () => {
    const services: ServiceInput[] = [
      { name: "Service A", description: "desc" },
    ];
    render(<ServicesEditor services={services} onChange={() => {}} />);
    expect(screen.getByDisplayValue("Service A")).toBeInTheDocument();
  });

  it("calls onChange with a new empty row when Add is clicked", async () => {
    const onChange = vi.fn();
    render(<ServicesEditor services={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /add service/i }));
    expect(onChange).toHaveBeenCalledWith([{ name: "", description: "" }]);
  });
});
