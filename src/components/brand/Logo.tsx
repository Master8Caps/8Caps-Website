/**
 * The 8Caps logo. `lockup` is the full icon + "Caps" wordmark; `mark` is the
 * icon alone. Size it with `className` (e.g. `h-7 w-auto`).
 *
 * The artwork lives as static SVG files under /public/brand (high-res PNGs in
 * an SVG wrapper), referenced by URL rather than inlined — at 200KB+ each they
 * must not be baked into the page markup. Both are white/transparent, intended
 * for the dark Oxford-blue surfaces they sit on.
 */
const SOURCES = {
  lockup: { src: "/brand/8caps-logo-transparent.svg", width: 1200, height: 600 },
  mark: { src: "/brand/8caps-icon-transparent.svg", width: 512, height: 512 },
} as const;

export function Logo({
  variant = "lockup",
  className,
}: {
  variant?: "mark" | "lockup";
  className?: string;
}) {
  const { src, width, height } = SOURCES[variant];
  return (
    // A plain <img> (not next/image) avoids needing dangerouslyAllowSVG; the
    // intrinsic width/height reserve the aspect ratio to prevent layout shift.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="8Caps"
      className={className}
      width={width}
      height={height}
      decoding="async"
    />
  );
}
