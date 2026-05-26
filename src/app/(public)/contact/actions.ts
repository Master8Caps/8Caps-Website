"use server";

import { contactFormSchema } from "@/lib/contact-form";
import { createPublicClient } from "@/lib/supabase/public";
import {
  createResendClient,
  getContactFromEmail,
  getContactToEmail,
} from "@/lib/resend";
import type { ActionResult } from "@/types/domain";

// The `enquiries` table's RLS allows public inserts via the anon key
// (Plan 1, migration `<ts>_rls.sql`), so the existing `createPublicClient()`
// works for the contact form insert too.

export async function submitContactForm(
  raw: FormData,
): Promise<ActionResult> {
  // 1. Validate.
  const parsed = contactFormSchema.safeParse({
    name: raw.get("name"),
    email: raw.get("email"),
    company: raw.get("company"),
    projectType: raw.get("projectType"),
    heardAbout: raw.get("heardAbout"),
    message: raw.get("message"),
    website: raw.get("website"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please check the form and try again.",
    };
  }

  const { name, email, company, projectType, heardAbout, message } = parsed.data;

  // 2. Save the enquiry.
  const supabase = createPublicClient();
  const { error: dbError } = await supabase.from("enquiries").insert({
    name,
    email,
    message,
    company: company || null,
    project_type: projectType,
    heard_about: heardAbout || null,
  });

  if (dbError) {
    console.error("[contact] DB insert failed:", dbError);
    return {
      ok: false,
      error:
        "Sorry — we couldn't save your message. Please email master@8caps.co.uk directly.",
    };
  }

  // 3. Send email notification (best-effort — DB insert is the source of truth).
  const resend = createResendClient();
  if (resend) {
    try {
      await resend.emails.send({
        from: `8Caps Website <${getContactFromEmail()}>`,
        to: getContactToEmail(),
        replyTo: email,
        subject: `New enquiry from ${name}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Company: ${company || "—"}`,
          `Project type: ${projectType}`,
          `Heard about us: ${heardAbout || "—"}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      });
    } catch (e) {
      console.error("[contact] Resend send failed:", e);
      // Don't fail the action — the enquiry is already saved.
    }
  } else {
    console.warn("[contact] RESEND_API_KEY not set; skipped email notification.");
  }

  return { ok: true };
}
