import { describe, it, expect } from "vitest";
import { splitNdjson } from "./stream";

describe("splitNdjson", () => {
  it("returns complete lines and keeps the partial remainder", () => {
    const { lines, rest } = splitNdjson('{"a":1}\n{"b":2}\n{"c"');
    expect(lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('{"c"');
  });

  it("returns no lines when the buffer has no newline", () => {
    const { lines, rest } = splitNdjson('{"partial"');
    expect(lines).toEqual([]);
    expect(rest).toBe('{"partial"');
  });

  it("drops blank lines", () => {
    const { lines, rest } = splitNdjson('{"a":1}\n\n{"b":2}\n');
    expect(lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe("");
  });
});
