import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteForm } from "./SiteForm";
import type { Category, SiteFormValues } from "@/types/domain";

const categories: Category[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Finance", slug: "finance", description: null },
];

const withProposal: SiteFormValues = {
  name: "Acme",
  slug: "acme",
  url: "https://acme.com",
  logoUrl: null,
  shortSummary: "Summary",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  newCategoryName: "Trades",
  publishStatus: "draft",
  lifecycle: "live",
  visibility: "public",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  services: [],
  screenshots: [],
  tagIds: [],
};

describe("SiteForm category", () => {
  it("always offers an option to add a new category", () => {
    render(
      <SiteForm
        initial={{ ...withProposal, newCategoryName: null }}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(
      screen.getByRole("option", { name: /add a new category/i }),
    ).toBeInTheDocument();
  });

  it("shows an editable, pre-filled name field when a new category is set", () => {
    render(
      <SiteForm
        initial={withProposal}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(screen.getByLabelText(/new category name/i)).toHaveValue("Trades");
  });

  it("hides the name field when an existing category is selected", () => {
    render(
      <SiteForm
        initial={{
          ...withProposal,
          newCategoryName: null,
          categoryId: categories[0].id,
        }}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(screen.queryByLabelText(/new category name/i)).toBeNull();
  });

  it("reveals the name field when 'Add a new category' is chosen", async () => {
    const user = userEvent.setup();
    render(
      <SiteForm
        initial={{ ...withProposal, newCategoryName: null }}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(screen.queryByLabelText(/new category name/i)).toBeNull();
    await user.selectOptions(
      screen.getByLabelText("Category"),
      "__new_category__",
    );
    expect(screen.getByLabelText(/new category name/i)).toBeInTheDocument();
  });
});
