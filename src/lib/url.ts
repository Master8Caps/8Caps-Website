/**
 * Normalise a user-entered web address so a bare domain works without a scheme.
 *
 * `example.com` → `https://example.com`; an existing http(s) URL is left as-is.
 * A blank/whitespace string returns "" so required-field validation still fires
 * (rather than silently becoming "https://").
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Drop any leading slashes (e.g. a protocol-relative "//example.com") before
  // prefixing, so we never produce "https:///example.com".
  return `https://${trimmed.replace(/^\/+/, "")}`;
}
