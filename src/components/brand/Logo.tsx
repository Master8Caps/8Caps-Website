import { MARK_VIEWBOX, LOCKUP_VIEWBOX, logoInner } from "./logo-art";

/**
 * The 8Caps logo. `lockup` is the capped "8" plus the "Caps" wordmark;
 * `mark` is the capped "8" alone. Size it with `className` (e.g. `h-7`).
 */
export function Logo({
  variant = "lockup",
  className,
}: {
  variant?: "mark" | "lockup";
  className?: string;
}) {
  return (
    <svg
      viewBox={variant === "lockup" ? LOCKUP_VIEWBOX : MARK_VIEWBOX}
      role="img"
      aria-label="8Caps"
      className={className}
      // logoInner is a static, self-authored SVG markup string built from
      // committed constants — no user input, no XSS surface.
      dangerouslySetInnerHTML={{ __html: logoInner(variant) }}
    />
  );
}
