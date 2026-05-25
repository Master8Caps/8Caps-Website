import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Code } from "lucide-react";
import { DisciplineCard } from "./DisciplineCard";

describe("DisciplineCard", () => {
  it("renders the title and description", () => {
    render(
      <DisciplineCard
        icon={Code}
        title="Software engineering"
        description="TypeScript, Next.js, React, Supabase, Postgres."
      />,
    );
    expect(screen.getByText("Software engineering")).toBeInTheDocument();
    expect(
      screen.getByText(/TypeScript, Next.js, React, Supabase, Postgres./),
    ).toBeInTheDocument();
  });
});
