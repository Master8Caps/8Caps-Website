import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Privacy",
  description: "8Caps privacy notice — how we handle the data you give us.",
};

export default function PrivacyPage() {
  return (
    <section className="bg-surface py-14">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink">Privacy notice</h1>
        <p className="mt-4 text-ink-muted">
          {/* PLACEHOLDER — replace with the real privacy policy once drafted.
              Tracked in docs/pre-meeting-notes.md. */}
          We respect your privacy. This is a placeholder notice until the full
          privacy policy is published. The contact form on this site collects
          your name, email address, company name, project information, and
          message text — we use this only to reply to your enquiry and to
          maintain a record of communications. We do not share this data with
          third parties.
        </p>
        <p className="mt-4 text-ink-muted">
          To request a copy of, correction to, or deletion of any data we hold
          about you, email{" "}
          <a className="underline" href="mailto:master@8caps.co.uk">
            master@8caps.co.uk
          </a>
          .
        </p>
        <p className="mt-4 text-xs text-ink-muted">
          Last updated: pending — full policy in progress.
        </p>
      </Container>
    </section>
  );
}
