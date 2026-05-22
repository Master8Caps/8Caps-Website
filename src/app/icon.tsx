import { ImageResponse } from "next/og";
import { buildLogoSvg, MARK_WIDTH, MARK_HEIGHT } from "@/components/brand/logo-art";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The browser-tab favicon: the logo mark on a rounded Oxford-blue tile. */
export default function Icon() {
  const svg = buildLogoSvg("mark");
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  // Fit the (tall) mark inside the tile without cropping: scale to a target
  // height, derive the width from the mark's own aspect ratio.
  const imgHeight = 50;
  const imgWidth = Math.round((imgHeight * MARK_WIDTH) / MARK_HEIGHT);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#002147",
          borderRadius: 14,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={imgWidth} height={imgHeight} alt="" />
      </div>
    ),
    size,
  );
}
