import { describe, it, expect } from "vitest";
import { parseServiceFilter } from "./case-studies-filter";

describe("parseServiceFilter", () => {
  it("returns null for empty params", () => {
    expect(parseServiceFilter({})).toBeNull();
  });

  it("reads a valid service value", () => {
    expect(parseServiceFilter({ service: "custom_software" })).toBe("custom_software");
    expect(parseServiceFilter({ service: "ai" })).toBe("ai");
    expect(parseServiceFilter({ service: "automation" })).toBe("automation");
    expect(parseServiceFilter({ service: "lead_gen" })).toBe("lead_gen");
    expect(parseServiceFilter({ service: "ecommerce" })).toBe("ecommerce");
  });

  it("returns null for an invalid value", () => {
    expect(parseServiceFilter({ service: "banana" })).toBeNull();
  });

  it("takes the first value when given an array", () => {
    expect(parseServiceFilter({ service: ["ai", "custom_software"] })).toBe("ai");
  });
});
