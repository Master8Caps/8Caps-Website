import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Automated Panda")).toBe("automated-panda");
  });

  it("strips punctuation and symbols", () => {
    expect(slugify("Lead & Harbour!")).toBe("lead-harbour");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   --  b")).toBe("a-b");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("returns an empty string for input with no usable characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
