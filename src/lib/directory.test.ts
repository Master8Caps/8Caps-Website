import { describe, it, expect } from "vitest";
import { parseDirectoryParams, getPagination, PAGE_SIZE } from "./directory";

describe("parseDirectoryParams", () => {
  it("returns defaults for empty params", () => {
    expect(parseDirectoryParams({})).toEqual({
      query: "",
      category: null,
      lifecycle: null,
      page: 1,
    });
  });

  it("reads query, category and lifecycle", () => {
    expect(
      parseDirectoryParams({ q: "panda", category: "automation", lifecycle: "live" }),
    ).toEqual({ query: "panda", category: "automation", lifecycle: "live", page: 1 });
  });

  it("ignores an invalid lifecycle value", () => {
    expect(parseDirectoryParams({ lifecycle: "banana" }).lifecycle).toBeNull();
  });

  it("clamps page to a minimum of 1", () => {
    expect(parseDirectoryParams({ page: "0" }).page).toBe(1);
    expect(parseDirectoryParams({ page: "-3" }).page).toBe(1);
    expect(parseDirectoryParams({ page: "notanumber" }).page).toBe(1);
  });

  it("reads a valid page number", () => {
    expect(parseDirectoryParams({ page: "4" }).page).toBe(4);
  });

  it("takes the first value when a param is an array", () => {
    expect(parseDirectoryParams({ q: ["a", "b"] }).query).toBe("a");
  });
});

describe("getPagination", () => {
  it("computes range and totals for page 1", () => {
    const p = getPagination(1, 50);
    expect(p.from).toBe(0);
    expect(p.to).toBe(PAGE_SIZE - 1);
    expect(p.totalPages).toBe(Math.ceil(50 / PAGE_SIZE));
    expect(p.hasPrev).toBe(false);
    expect(p.hasNext).toBe(true);
  });

  it("computes range for a middle page", () => {
    const p = getPagination(2, 50);
    expect(p.from).toBe(PAGE_SIZE);
    expect(p.to).toBe(PAGE_SIZE * 2 - 1);
    expect(p.hasPrev).toBe(true);
  });

  it("reports no next page on the last page", () => {
    const total = PAGE_SIZE + 1;
    const p = getPagination(2, total);
    expect(p.hasNext).toBe(false);
  });

  it("handles zero results", () => {
    const p = getPagination(1, 0);
    expect(p.totalPages).toBe(0);
    expect(p.hasNext).toBe(false);
    expect(p.hasPrev).toBe(false);
  });
});
