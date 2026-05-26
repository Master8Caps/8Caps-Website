import { describe, it, expect } from "vitest";
import {
  enquiryAutoReplyEmail,
  enquiryNotificationEmail,
} from "./email-templates";

const baseNotification = {
  name: "Jane Smith",
  email: "jane@example.com",
  company: "Acme Ltd",
  projectType: "New website",
  heardAbout: "Google",
  message: "Hi there,\nWe need a new site for our consultancy.",
  siteUrl: "https://8caps.co.uk",
};

describe("enquiryNotificationEmail", () => {
  it("includes the name + project type in the subject", () => {
    const { subject } = enquiryNotificationEmail(baseNotification);
    expect(subject).toBe("New enquiry from Jane Smith — New website");
  });

  it("renders every field in the html", () => {
    const { html } = enquiryNotificationEmail(baseNotification);
    expect(html).toContain("Jane Smith");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("Acme Ltd");
    expect(html).toContain("New website");
    expect(html).toContain("Google");
    expect(html).toContain("We need a new site for our consultancy.");
  });

  it("renders a Reply CTA using the lead's first name and a mailto link", () => {
    const { html } = enquiryNotificationEmail(baseNotification);
    expect(html).toMatch(/mailto:jane%40example\.com\?subject=/);
    expect(html).toContain("Reply to Jane");
  });

  it("shows em-dash placeholders for missing optional fields", () => {
    const { html } = enquiryNotificationEmail({
      ...baseNotification,
      company: null,
      heardAbout: null,
    });
    // Two em-dashes in the company/heardAbout rows
    const dashes = html.match(/>—</g);
    expect(dashes?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("escapes HTML in user input to prevent injection", () => {
    const { html } = enquiryNotificationEmail({
      ...baseNotification,
      name: "<script>alert('xss')</script>",
      message: "Hello <b>bold</b> world",
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Hello &lt;b&gt;bold&lt;/b&gt; world");
  });

  it("provides a plain-text fallback containing every field", () => {
    const { text } = enquiryNotificationEmail(baseNotification);
    expect(text).toContain("Name: Jane Smith");
    expect(text).toContain("Email: jane@example.com");
    expect(text).toContain("Company: Acme Ltd");
    expect(text).toContain("Project type: New website");
    expect(text).toContain("We need a new site for our consultancy.");
  });
});

describe("enquiryAutoReplyEmail", () => {
  const input = { name: "Jane Smith", siteUrl: "https://8caps.co.uk" };

  it("addresses the enquirer by first name in the subject and body", () => {
    const { subject, html, text } = enquiryAutoReplyEmail(input);
    expect(subject).toBe("Thanks Jane — we've got your enquiry");
    expect(html).toContain("Hi Jane,");
    expect(text).toContain("Hi Jane,");
  });

  it("sets a 'usually within the day' SLA expectation", () => {
    const { html, text } = enquiryAutoReplyEmail(input);
    expect(html).toMatch(/usually within the day/i);
    expect(text).toMatch(/usually within the day/i);
  });

  it("signs off as 'The 8Caps team'", () => {
    const { html, text } = enquiryAutoReplyEmail(input);
    expect(html).toContain("The 8Caps team");
    expect(text).toContain("The 8Caps team");
  });

  it("invites a reply with attachments", () => {
    const { html, text } = enquiryAutoReplyEmail(input);
    expect(html).toMatch(/hit reply/i);
    expect(text).toMatch(/hit reply/i);
  });

  it("falls back to the full name when there is no last name", () => {
    const { subject } = enquiryAutoReplyEmail({
      name: "Cher",
      siteUrl: "https://8caps.co.uk",
    });
    expect(subject).toBe("Thanks Cher — we've got your enquiry");
  });

  it("escapes HTML in the enquirer's name", () => {
    const { html } = enquiryAutoReplyEmail({
      name: "<script>alert('hi')</script>",
      siteUrl: "https://8caps.co.uk",
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
