import { EIGHT_PATH, CAPS_PATH, EIGHT_BOX, LOCKUP_BOX } from "./logo-glyphs";

// ── Cap geometry — native space is viewBox "0 0 178 100" (the approved mockup).
const CAP_NATIVE_WIDTH = 178;
const CAP_CROWN_BOTTOM_Y = 66; // cap-native y where the crown meets the head
const CAP_ANCHOR_X = 89; // cap-native x of the crown centre

// ── Tunable composition constants — adjust if the cap does not sit naturally.
const CAP_WIDTH_RATIO = 1.16; // cap width as a multiple of the "8" width
const CAP_OVERLAP = 70; // glyph units the crown base sits down into the "8"
const PAD = 36; // viewBox padding around the artwork

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Derived placement (glyph-unit coordinate space, shared with the glyphs).
const capScale = (EIGHT_BOX.w * CAP_WIDTH_RATIO) / CAP_NATIVE_WIDTH;
const capCenterX = EIGHT_BOX.x + EIGHT_BOX.w / 2;
// Map the cap-native anchor (CAP_ANCHOR_X, CAP_CROWN_BOTTOM_Y) onto
// (capCenterX, CAP_OVERLAP) in glyph space.
const capTx = capCenterX - CAP_ANCHOR_X * capScale;
const capTy = CAP_OVERLAP - CAP_CROWN_BOTTOM_Y * capScale;
// Topmost artwork ≈ cap-native y 14 (the button), scaled into glyph space.
const artTop = capTy + 14 * capScale - PAD;

const CAP_MARKUP =
  `<g transform="translate(${r(capTx)} ${r(capTy)}) ` +
  `scale(${r(capScale)}) rotate(-12 89 66)">` +
  `<path d="M40 66 C38 30 62 20 90 20 C122 20 134 40 134 66 Z" fill="#3d7bd9"/>` +
  `<path d="M68 64 C66 34 82 25 98 25" fill="none" stroke="#2a5fb0" stroke-width="3"/>` +
  `<path d="M98 25 C118 26 126 44 126 64" fill="none" stroke="#2a5fb0" stroke-width="3"/>` +
  `<path d="M120 66 C156 63 182 71 177 83 C152 79 132 71 113 68 Z" fill="#2a5fb0"/>` +
  `<circle cx="90" cy="20" r="4.5" fill="#9cc3ec"/>` +
  `</g>`;

const left = r(EIGHT_BOX.x - PAD);
const top = r(artTop);
const bottom = EIGHT_BOX.y + EIGHT_BOX.h + PAD;

/** viewBox for the mark alone (capped "8"). */
export const MARK_VIEWBOX = `${left} ${top} ${r(EIGHT_BOX.w + 2 * PAD)} ${r(bottom - top)}`;

/** viewBox for the full lockup (capped "8" + "Caps"). */
export const LOCKUP_VIEWBOX = `${left} ${top} ${r(LOCKUP_BOX.w + 2 * PAD)} ${r(LOCKUP_BOX.h + PAD - top)}`;

/** The inner SVG markup (no <svg> wrapper) for the given variant. */
export function logoInner(variant: "mark" | "lockup"): string {
  const eight = `<path d="${EIGHT_PATH}" fill="#ffffff"/>`;
  const caps = `<path d="${CAPS_PATH}" fill="#ffffff"/>`;
  return variant === "lockup"
    ? CAP_MARKUP + eight + caps
    : CAP_MARKUP + eight;
}

/** A complete, standalone SVG document string for the given variant. */
export function buildLogoSvg(variant: "mark" | "lockup"): string {
  const viewBox = variant === "lockup" ? LOCKUP_VIEWBOX : MARK_VIEWBOX;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${logoInner(variant)}</svg>`;
}
