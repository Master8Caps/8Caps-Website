import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How 8Caps collects, uses, shares, and protects the personal data you share with us.",
};

// TODO(james): replace these placeholders with the real registration details.
// The same three values also appear in components/layout/Footer.tsx and
// app/(public)/contact/page.tsx — update all three together. The 24-month
// retention figure is a sensible default; adjust if your record-keeping
// policy differs. See docs/notes.md → "Compliance / legal".
const COMPANY_NUMBER = "00000000";
const ICO_REGISTRATION = "ZA000000";
const REGISTERED_OFFICE = "[Registered office address — to be confirmed]";
const RETENTION_MONTHS = 24;
const LAST_UPDATED = "28 May 2026";
const CONTACT_EMAIL = "master@8caps.co.uk";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-ink-muted leading-relaxed">{children}</p>;
}

function MailLink() {
  return (
    <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <section className="bg-surface py-14">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink">Privacy notice</h1>
        <p className="mt-4 text-ink-muted leading-relaxed">
          This notice explains how 8Caps (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;) collects, uses, shares, and protects the personal
          data you give us, and the rights you have over that data. We are the
          data controller for the personal data described below and we are
          committed to handling it in line with UK data protection law (the UK
          GDPR and the Data Protection Act 2018).
        </p>

        <Section title="Who we are">
          <P>8Caps is a UK software, AI, and automation studio.</P>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-muted leading-relaxed">
            <li>
              Registered in England &amp; Wales, company number{" "}
              <em>{COMPANY_NUMBER}</em>.
            </li>
            <li>
              Registered office: <em>{REGISTERED_OFFICE}</em>.
            </li>
            <li>
              Registered with the Information Commissioner&rsquo;s Office (ICO),
              registration number <em>{ICO_REGISTRATION}</em>.
            </li>
            <li>
              Data protection contact: <MailLink />.
            </li>
          </ul>
        </Section>

        <Section title="The personal data we collect">
          <P>
            We only collect the data you choose to give us through the contact
            form on this site. When you submit an enquiry we collect:
          </P>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-muted leading-relaxed">
            <li>your name;</li>
            <li>your email address;</li>
            <li>your company name (if you provide it);</li>
            <li>the type of project you&rsquo;re enquiring about;</li>
            <li>how you heard about us (if you tell us); and</li>
            <li>the content of your message.</li>
          </ul>
          <P>
            We do not collect special category data, and we do not ask you to
            provide any more information than we need to respond to your
            enquiry. Our website does not run advertising or analytics tracking,
            so we do not build profiles of visitors or track you across other
            sites.
          </P>
        </Section>

        <Section title="How we use your data, and our lawful basis">
          <P>We use the data you submit to:</P>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-muted leading-relaxed">
            <li>
              respond to your enquiry and discuss the work you&rsquo;re
              interested in; and
            </li>
            <li>keep a record of our communications with you.</li>
          </ul>
          <P>
            Our lawful bases under Article 6 of the UK GDPR are: taking steps at
            your request before entering into a contract (Article 6(1)(b)); and
            our legitimate interests in responding to enquiries and running our
            business (Article 6(1)(f)). Where the law requires us to keep
            certain records — for example for tax and accounting once you become
            a client — we rely on compliance with a legal obligation (Article
            6(1)(c)).
          </P>
        </Section>

        <Section title="Who we share your data with">
          <P>
            We do not sell your data or share it for marketing. We do use a
            small number of trusted service providers (&ldquo;processors&rdquo;)
            who handle data on our behalf and only on our instructions:
          </P>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-muted leading-relaxed">
            <li>
              <strong className="text-ink">Supabase</strong> — hosts the
              database in which your enquiry is stored.
            </li>
            <li>
              <strong className="text-ink">Resend</strong> — delivers the
              notification email to us and the confirmation email to you.
            </li>
            <li>
              <strong className="text-ink">Vercel</strong> — hosts this website
              and its server infrastructure.
            </li>
          </ul>
          <P>
            We may also disclose your data where we are required to do so by law,
            or to establish, exercise, or defend our legal rights.
          </P>
        </Section>

        <Section title="International data transfers">
          <P>
            Some of our service providers are based outside the UK, which means
            your data may be transferred to and processed in other countries.
            Where that happens, we make sure the transfer is protected by
            appropriate safeguards recognised under UK data protection law —
            such as the UK International Data Transfer Agreement (IDTA), the UK
            Addendum to the EU Standard Contractual Clauses, or an adequacy
            decision — so your data receives an equivalent level of protection.
          </P>
        </Section>

        <Section title="How long we keep your data">
          <P>
            We keep enquiry data for as long as we need it to deal with your
            enquiry and for up to {RETENTION_MONTHS} months after our last
            contact with you, after which we delete it — unless you ask us to
            delete it sooner, or unless we need to keep it longer to meet a legal
            obligation (for example, where you become a client and we must
            retain financial records for the period required by UK law). You can
            ask us to delete your data at any time using the contact details
            below.
          </P>
        </Section>

        <Section title="Cookies">
          <P>
            This public website does not use analytics, advertising, or tracking
            cookies, so there is no cookie banner. The only cookies we set are
            strictly necessary cookies used to keep our team signed in to the
            private admin area of the site — these are essential for that area
            to work and are not used to track visitors.
          </P>
        </Section>

        <Section title="How we keep your data secure">
          <P>
            We take appropriate technical and organisational measures to protect
            your data, including encryption in transit, access controls on our
            database and admin area, and limiting access to the people who need
            it. No method of transmission or storage is completely secure, but
            we work to protect your data and to respond promptly if anything goes
            wrong.
          </P>
        </Section>

        <Section title="Your rights">
          <P>
            Under UK data protection law you have the right to:
          </P>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-muted leading-relaxed">
            <li>access the personal data we hold about you;</li>
            <li>ask us to correct data that is inaccurate or incomplete;</li>
            <li>ask us to delete your data (the &ldquo;right to erasure&rdquo;);</li>
            <li>ask us to restrict how we use your data;</li>
            <li>object to our processing based on legitimate interests;</li>
            <li>
              request a copy of your data in a portable format (data
              portability); and
            </li>
            <li>
              withdraw any consent you have given, without affecting processing
              we carried out before you withdrew it.
            </li>
          </ul>
          <P>
            To exercise any of these rights, email <MailLink />. We will respond
            within one month. There is normally no charge.
          </P>
        </Section>

        <Section title="Complaints">
          <P>
            If you have a concern about how we handle your data, please contact
            us first at <MailLink /> so we can try to put it right. You also have
            the right to complain to the Information Commissioner&rsquo;s Office
            (ICO), the UK supervisory authority, at{" "}
            <a
              className="underline"
              href="https://ico.org.uk/make-a-complaint/"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk/make-a-complaint
            </a>
            .
          </P>
        </Section>

        <Section title="Changes to this notice">
          <P>
            We may update this notice from time to time. When we do, we will
            change the &ldquo;last updated&rdquo; date below. Significant changes
            will be made clear on this page.
          </P>
        </Section>

        <p className="mt-10 text-xs text-ink-muted">
          Last updated: {LAST_UPDATED}.
        </p>
      </Container>
    </section>
  );
}
