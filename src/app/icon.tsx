import { ImageResponse } from "next/og";
import { buildLogoSvg } from "@/components/brand/logo-art";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The browser-tab favicon: the logo mark on a rounded Oxford-blue tile. */
export default function Icon() {
  const svg = buildLogoSvg("mark");
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
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
        <img src={dataUri} width={46} height={46} alt="" />
      </div>
    ),
    size,
  );
}
