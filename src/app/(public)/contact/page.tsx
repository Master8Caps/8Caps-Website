import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactWhatToExpect } from "@/components/contact/ContactWhatToExpect";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell 8Caps about your software, AI, or automation project. We reply within one working day.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-surface py-14 text-white">
        <Container className="max-w-3xl">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: "var(--color-accent-soft)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Get in touch
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Tell us what you&rsquo;re trying to solve.
          </h1>
          <p className="mt-4 text-white/70">
            Drop us a line and we&rsquo;ll come back within one working day. No
            sales pressure — just a real conversation about whether we can help.
          </p>
        </Container>
      </section>

      {/* Form + reassurance */}
      <section className="bg-surface-muted py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
            <div className="lg:col-span-1">
              <ContactWhatToExpect />
            </div>
          </div>
        </Container>
      </section>

      {/* Compliance band */}
      <section className="bg-surface py-10">
        <Container>
          <p className="text-xs text-ink-muted leading-relaxed">
            {/* PLACEHOLDERS — replace once the real details land (see docs/pre-meeting-notes.md). */}
            <strong className="text-ink">8Caps</strong> &middot; Registered in
            England &amp; Wales · Company No. <em>00000000</em> · ICO
            registration <em>ZA000000</em> · Registered office: <em>Address
            placeholder</em>.
          </p>
        </Container>
      </section>
    </>
  );
}
