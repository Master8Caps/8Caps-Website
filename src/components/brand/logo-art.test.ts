import { describe, it, expect } from "vitest";
import { buildLogoSvg, MARK_VIEWBOX, LOCKUP_VIEWBOX } from "./logo-art";
import { CAPS_PATH } from "./logo-glyphs";

describe("buildLogoSvg", () => {
  it("returns a well-formed standalone SVG", () => {
    const svg = buildLogoSvg("mark");
    expect(svg.startsWith("<svg xmlns=")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("includes the cap crown in both variants", () => {
    expect(buildLogoSvg("mark")).toContain("M40 66 C38 30");
    expect(buildLogoSvg("lockup")).toContain("M40 66 C38 30");
  });

  it("omits the wordmark in the mark, includes it in the lockup", () => {
    expect(buildLogoSvg("mark")).not.toContain(CAPS_PATH);
    expect(buildLogoSvg("lockup")).toContain(CAPS_PATH);
  });

  it("uses different viewBoxes for mark and lockup", () => {
    expect(MARK_VIEWBOX).not.toEqual(LOCKUP_VIEWBOX);
  });
});
