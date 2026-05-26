/**
 * Branded email templates for the 8Caps contact form.
 *
 * Hand-rolled HTML (not React Email) — keeps the stack dep-free and the
 * markup obviously inspectable. Both templates return `{ subject, html, text }`
 * so the caller can attach `text` as a fallback for spam filters and
 * accessibility-aware clients.
 */

const OXFORD = "#002147";
const ACCENT = "#3d7bd9";
const INK = "#1c2533";
const INK_MUTED = "#5b6675";
const SURFACE_MUTED = "#f4f6f9";
const HAIRLINE = "rgba(0, 33, 71, 0.12)";

/** Escape a string so it can be safely placed inside HTML text content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EnquiryNotificationInput {
  name: string;
  email: string;
  company: string | null;
  projectType: string;
  heardAbout: string | null;
  message: string;
  siteUrl: string;
}

export interface EnquiryAutoReplyInput {
  name: string;
  siteUrl: string;
}

/**
 * Notification email sent to the 8Caps team when a lead submits the form.
 * Formatted fields in a table, message in a callout box, primary CTA button
 * to reply directly to the lead.
 */
export function enquiryNotificationEmail(
  input: EnquiryNotificationInput,
): EmailTemplate {
  const { name, email, company, projectType, heardAbout, message, siteUrl } = input;
  const first = firstNameOf(name);

  const subject = `New enquiry from ${name} — ${projectType}`;

  const rows = [
    { label: "Name", value: escapeHtml(name) },
    {
      label: "Email",
      value: `<a href="mailto:${escapeHtml(email)}" style="color: ${ACCENT}; text-decoration: none;">${escapeHtml(email)}</a>`,
    },
    { label: "Company", value: company ? escapeHtml(company) : "—" },
    { label: "Project type", value: escapeHtml(projectType) },
    { label: "Heard about", value: heardAbout ? escapeHtml(heardAbout) : "—" },
  ];

  const rowsHtml = rows
    .map(
      (row, i) => `
              <tr>
                <td style="padding: 8px 0;${i < rows.length - 1 ? ` border-bottom: 1px solid ${HAIRLINE};` : ""} color: ${INK_MUTED}; font-size: 13px; width: 130px;">${row.label}</td>
                <td style="padding: 8px 0;${i < rows.length - 1 ? ` border-bottom: 1px solid ${HAIRLINE};` : ""} color: ${INK}; font-size: 14px;">${row.value}</td>
              </tr>`,
    )
    .join("");

  const replySubject = `Re: your enquiry to 8Caps`;
  const replyHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(replySubject)}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background: ${SURFACE_MUTED}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${INK};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${SURFACE_MUTED}; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: ${OXFORD}; color: #ffffff; padding: 24px 32px; text-align: center; font-weight: 700; font-size: 18px; letter-spacing: 0.08em;">
              8CAPS
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 8px; color: ${INK_MUTED}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">New website enquiry</p>
              <h1 style="margin: 0 0 24px; font-size: 22px; color: ${INK}; font-weight: 700;">${escapeHtml(name)} got in touch</h1>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">${rowsHtml}
              </table>
              <p style="margin: 0 0 8px; color: ${INK_MUTED}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Message</p>
              <div style="background: ${SURFACE_MUTED}; padding: 16px; border-radius: 6px; color: ${INK}; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
              <div style="margin-top: 32px; text-align: center;">
                <a href="${replyHref}" style="display: inline-block; background: ${ACCENT}; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Reply to ${escapeHtml(first)}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background: ${SURFACE_MUTED}; color: ${INK_MUTED}; font-size: 12px; text-align: center;">
              Sent from the 8Caps contact form · <a href="${escapeHtml(siteUrl)}" style="color: ${ACCENT}; text-decoration: none;">8caps.co.uk</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `New enquiry from ${name}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "—"}`,
    `Project type: ${projectType}`,
    `Heard about: ${heardAbout || "—"}`,
    "",
    "Message:",
    message,
    "",
    `Reply: ${email}`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Auto-reply sent to the enquirer immediately after they submit. Sets the
 * "as soon as we can — usually within the day" expectation and invites
 * follow-up attachments via reply.
 */
export function enquiryAutoReplyEmail(
  input: EnquiryAutoReplyInput,
): EmailTemplate {
  const { name, siteUrl } = input;
  const first = firstNameOf(name);

  const subject = `Thanks ${first} — we've got your enquiry`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background: ${SURFACE_MUTED}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${INK};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${SURFACE_MUTED}; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: ${OXFORD}; color: #ffffff; padding: 24px 32px; text-align: center; font-weight: 700; font-size: 18px; letter-spacing: 0.08em;">
              8CAPS
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; line-height: 1.6; font-size: 15px; color: ${INK};">
              <p style="margin: 0 0 16px;">Hi ${escapeHtml(first)},</p>
              <p style="margin: 0 0 16px;">Thanks for getting in touch with 8Caps. We've received your enquiry and the team will come back to you as soon as we can &mdash; usually within the day.</p>
              <p style="margin: 0 0 16px;">In the meantime, if you want to send anything else over (screenshots, brief, references, the works) just hit reply to this email and it'll land in our inbox.</p>
              <p style="margin: 24px 0 0; color: ${INK_MUTED};">&mdash; The 8Caps team</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background: ${SURFACE_MUTED}; color: ${INK_MUTED}; font-size: 12px; text-align: center;">
              <a href="${escapeHtml(siteUrl)}" style="color: ${ACCENT}; text-decoration: none;">8caps.co.uk</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${first},`,
    "",
    "Thanks for getting in touch with 8Caps. We've received your enquiry and the team will come back to you as soon as we can — usually within the day.",
    "",
    "In the meantime, if you want to send anything else over (screenshots, brief, references, the works) just hit reply to this email and it'll land in our inbox.",
    "",
    "— The 8Caps team",
    "",
    siteUrl,
  ].join("\n");

  return { subject, html, text };
}
