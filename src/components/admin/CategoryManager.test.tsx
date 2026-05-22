import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryManager } from "./CategoryManager";
import type { AdminCategory } from "@/types/domain";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const categories: AdminCategory[] = [
  { id: "a", name: "Finance", slug: "finance", description: null, siteCount: 7 },
  { id: "b", name: "Trades", slug: "trades", description: null, siteCount: 0 },
];

describe("CategoryManager", () => {
  it("shows each category's site count", () => {
    render(<CategoryManager categories={categories} />);
    expect(screen.getByText(/7 sites/)).toBeInTheDocument();
    expect(screen.getByText(/0 sites/)).toBeInTheDocument();
  });

  it("has no 'add category' control", () => {
    render(<CategoryManager categories={categories} />);
    expect(
      screen.queryByPlaceholderText(/new category name/i),
    ).toBeNull();
  });
});
