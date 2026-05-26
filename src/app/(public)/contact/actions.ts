"use server";

import { contactFormSchema } from "@/lib/contact-form";
import { createPublicClient } from "@/lib/supabase/public";
import {
  createResendClient,
  getContactFromEmail,
  getContactToEmail,
} from "@/lib/resend";
import {
  enquiryAutoReplyEmail,
  enquiryNotificationEmail,
} from "@/lib/email-templates";
import type { ActionResult } from "@/types/domain";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://8caps.co.uk";
}

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

  // 3. Send notification email + auto-reply (best-effort — DB insert is the
  // source of truth, so any email failure is logged but doesn't fail the form).
  const resend = createResendClient();
  if (!resend) {
    console.warn("[contact] RESEND_API_KEY not set; skipped both emails.");
    return { ok: true };
  }

  const siteUrl = getSiteUrl();
  const fromEmail = getContactFromEmail();
  const fromHeader = `8Caps Website <${fromEmail}>`;

  const notification = enquiryNotificationEmail({
    name,
    email,
    company: company || null,
    projectType,
    heardAbout: heardAbout || null,
    message,
    siteUrl,
  });

  const autoReply = enquiryAutoReplyEmail({ name, siteUrl });

  try {
    await resend.emails.send({
      from: fromHeader,
      to: getContactToEmail(),
      replyTo: email,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
    });
  } catch (e) {
    console.error("[contact] Resend notification send failed:", e);
  }

  try {
    await resend.emails.send({
      from: fromHeader,
      to: email,
      replyTo: getContactToEmail(),
      subject: autoReply.subject,
      html: autoReply.html,
      text: autoReply.text,
    });
  } catch (e) {
    console.error("[contact] Resend auto-reply send failed:", e);
  }

  return { ok: true };
}
