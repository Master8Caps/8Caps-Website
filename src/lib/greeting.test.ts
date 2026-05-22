import { describe, it, expect } from "vitest";
import { greetingFor, adminDisplayName } from "./greeting";

describe("greetingFor", () => {
  it("says good morning before noon", () => {
    expect(greetingFor(9)).toBe("Good morning");
  });
  it("says good afternoon from noon", () => {
    expect(greetingFor(13)).toBe("Good afternoon");
  });
  it("says good evening from 18:00", () => {
    expect(greetingFor(20)).toBe("Good evening");
  });
});

describe("adminDisplayName", () => {
  it("uses the display name when present", () => {
    expect(
      adminDisplayName({
        user_metadata: { display_name: "James" },
        email: "master@8caps.co.uk",
      }),
    ).toBe("James");
  });
  it("falls back to the email local-part", () => {
    expect(
      adminDisplayName({ user_metadata: {}, email: "master@8caps.co.uk" }),
    ).toBe("master");
  });
  it("falls back to 'there' with no name or email", () => {
    expect(adminDisplayName({ user_metadata: {}, email: null })).toBe("there");
  });
});
