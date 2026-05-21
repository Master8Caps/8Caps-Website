/**
 * Splits a streamed NDJSON buffer into complete lines plus the trailing
 * partial line (`rest`) that has not been fully received yet.
 */
export function splitNdjson(buffer: string): { lines: string[]; rest: string } {
  const segments = buffer.split("\n");
  const rest = segments.pop() ?? "";
  const lines = segments.map((s) => s.trim()).filter((s) => s.length > 0);
  return { lines, rest };
}
