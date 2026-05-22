import { ImageResponse } from "next/og";
import { buildLogoSvg } from "@/components/brand/logo-art";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "8Caps — A Portfolio of Digital Services";

/** The social-share (Open Graph) image: the logo lockup on Oxford blue. */
export default function OpengraphImage() {
  const svg = buildLogoSvg("lockup");
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={620} height={280} alt="" />
      </div>
    ),
    size,
  );
}
