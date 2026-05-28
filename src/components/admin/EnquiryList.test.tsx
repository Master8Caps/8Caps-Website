import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnquiryList } from "./EnquiryList";
import type { AdminEnquiry } from "@/types/domain";

const rows: AdminEnquiry[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@acme.co",
    company: "Acme Ltd",
    projectType: "ai",
    heardAbout: "referral",
    message: "We need an AI assistant for triage.",
    status: "new",
    createdAt: "2026-05-28T09:30:00Z",
  },
  {
    id: "2",
    name: "Tom Smith",
    email: "tom@example.com",
    company: null,
    projectType: null,
    heardAbout: null,
    message: "Looking for some automation help across the board here.",
    status: "read",
    createdAt: "2026-05-20T12:00:00Z",
  },
];

describe("EnquiryList", () => {
  it("renders an empty-state message when there are no rows", () => {
    render(<EnquiryList rows={[]} />);
    expect(screen.getByText(/no enquiries here yet/i)).toBeInTheDocument();
  });

  it("links each sender to their detail page", () => {
    render(<EnquiryList rows={rows} />);
    expect(screen.getByRole("link", { name: /Jane Doe/ })).toHaveAttribute(
      "href",
      "/admin/enquiries/1",
    );
  });

  it("maps the project type to a friendly label, with a dash when missing", () => {
    render(<EnquiryList rows={rows} />);
    expect(screen.getByText("AI Solutions")).toBeInTheDocument();
    const tomRow = screen.getByText("Tom Smith").closest("tr")!;
    expect(tomRow).toHaveTextContent("—");
  });

  it("marks unread (new) rows with a New pill and an unread dot", () => {
    render(<EnquiryList rows={rows} />);
    const janeRow = screen.getByText("Jane Doe").closest("tr")!;
    expect(janeRow).toHaveTextContent(/new/i);
    expect(screen.getByLabelText("Unread")).toBeInTheDocument();
  });

  it("does not show an unread dot on read rows", () => {
    render(<EnquiryList rows={[rows[1]]} />);
    expect(screen.queryByLabelText("Unread")).toBeNull();
    const tomRow = screen.getByText("Tom Smith").closest("tr")!;
    expect(tomRow).toHaveTextContent(/read/i);
  });
});
