import { describe, it, expect } from "vitest";
import { contactFormSchema } from "./contact-form";

describe("contactFormSchema", () => {
  const valid = {
    name: "Test User",
    email: "test@example.com",
    company: "",
    projectType: "custom_software" as const,
    heardAbout: "",
    message: "Hi I have a project I want to talk about.",
    website: "", // honeypot
  };

  it("accepts a valid submission", () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, name: "" }).success,
    ).toBe(false);
  });

  it("rejects a too-short message", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, message: "Too short" }).success,
    ).toBe(false);
  });

  it("rejects an invalid projectType", () => {
    const bad = { ...valid, projectType: "banana" as unknown as "custom_software" };
    expect(contactFormSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects when honeypot is filled (bot)", () => {
    expect(
      contactFormSchema.safeParse({ ...valid, website: "https://spam.example" })
        .success,
    ).toBe(false);
  });
});
