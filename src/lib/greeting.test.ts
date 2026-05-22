import { describe, it, expect } from "vitest";
import { greetingFor, londonHour, adminDisplayName } from "./greeting";

describe("greetingFor", () => {
  it("says good morning before noon", () => {
    expect(greetingFor(9)).toBe("Good Morning");
  });
  it("says good afternoon from noon", () => {
    expect(greetingFor(13)).toBe("Good Afternoon");
  });
  it("says good evening from 18:00", () => {
    expect(greetingFor(20)).toBe("Good Evening");
  });
});

describe("londonHour", () => {
  it("returns the GMT hour in winter", () => {
    expect(londonHour(new Date("2026-01-15T09:30:00Z"))).toBe(9);
  });
  it("returns the BST hour (UTC+1) in summer", () => {
    expect(londonHour(new Date("2026-07-15T09:30:00Z"))).toBe(10);
  });
  it("handles a late-evening BST time without rolling past 23", () => {
    expect(londonHour(new Date("2026-07-15T22:30:00Z"))).toBe(23);
  });
});

describe("adminDisplayName", () => {
  it("uses the display name when present", () => {
    expect(
      adminDisplayName({ user_metadata: { display_name: "James" } }),
    ).toBe("James");
  });
  it("falls back to full_name", () => {
    expect(adminDisplayName({ user_metadata: { full_name: "Phil" } })).toBe(
      "Phil",
    );
  });
  it("returns null when no display name is set", () => {
    expect(adminDisplayName({ user_metadata: {} })).toBeNull();
  });
});
