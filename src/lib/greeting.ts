/** A time-of-day greeting for the given 24-hour hour. */
export function greetingFor(hour: number): string {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/** The current hour (0-23) in UK time, regardless of where the server runs. */
export function londonHour(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(hour, 10) % 24;
}

interface UserLike {
  user_metadata?: {
    display_name?: unknown;
    full_name?: unknown;
  } | null;
}

/**
 * The admin user's Supabase display name, or null when they have not set one.
 * Callers show just the greeting (no name) when this is null.
 */
export function adminDisplayName(user: UserLike): string | null {
  const meta = user.user_metadata ?? {};
  const candidate = meta.display_name ?? meta.full_name;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}
