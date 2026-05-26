import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { TagInput } from "./TagInput";

function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = useState<string[]>(initial);
  return <TagInput value={tags} onChange={setTags} placeholder="Add tech…" />;
}

describe("TagInput", () => {
  it("adds a tag when Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByPlaceholderText("Add tech…");
    await user.type(input, "Next.js{Enter}");
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("removes a tag when the X button is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["Supabase"]} />);
    await user.click(screen.getByRole("button", { name: /remove Supabase/i }));
    expect(screen.queryByText("Supabase")).toBeNull();
  });

  it("ignores empty input on Enter", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByPlaceholderText("Add tech…"), "{Enter}");
    expect(screen.queryAllByRole("button", { name: /remove/i })).toHaveLength(0);
  });
});
