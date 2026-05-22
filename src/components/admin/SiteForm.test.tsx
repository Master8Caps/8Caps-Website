import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("SiteForm category select", () => {
  it("shows a 'new category' option when newCategoryName is set", () => {
    render(
      <SiteForm
        initial={withProposal}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(
      screen.getByRole("option", { name: /Trades — new category/ }),
    ).toBeInTheDocument();
  });

  it("does not show a 'new category' option when newCategoryName is null", () => {
    render(
      <SiteForm
        initial={{ ...withProposal, newCategoryName: null }}
        categories={categories}
        allTags={[]}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(screen.queryByRole("option", { name: /new category/ })).toBeNull();
  });
});
