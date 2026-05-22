/** A time-of-day greeting for the given 24-hour hour. */
export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface UserLike {
  user_metadata?: {
    display_name?: unknown;
    full_name?: unknown;
  } | null;
  email?: string | null;
}

/**
 * The friendliest available name for an admin user: their Supabase display
 * name, else the local-part of their email, else "there".
 */
export function adminDisplayName(user: UserLike): string {
  const meta = user.user_metadata ?? {};
  const candidate = meta.display_name ?? meta.full_name;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  const local = (user.email ?? "").split("@")[0];
  return local || "there";
}
