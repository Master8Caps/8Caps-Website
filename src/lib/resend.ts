import { Resend } from "resend";

/**
 * Returns a Resend client, or null if no API key is configured. The contact
 * form's server action handles the null path by still saving the enquiry to
 * the database and surfacing a soft warning in the server log — so the form
 * keeps working before Resend DNS is fully set up.
 */
export function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getContactFromEmail(): string {
  return process.env.CONTACT_FROM_EMAIL ?? "noreply@8caps.co.uk";
}

export function getContactToEmail(): string {
  return process.env.CONTACT_TO_EMAIL ?? "master@8caps.co.uk";
}
