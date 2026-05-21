import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the 8Caps team.",
};

export default function ContactPage() {
  return (
    <section className="bg-surface py-14">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Contact 8Caps</h1>
        <p className="mt-4 text-ink-muted">
          Have a question about one of our services, or want to be pointed to
          the right tool? Email us and we will get back to you.
        </p>
        <div className="mt-6">
          <ButtonLink href="mailto:master@8caps.co.uk" external>
            master@8caps.co.uk
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-ink-muted">
          An online enquiry form is coming soon.
        </p>
      </Container>
    </section>
  );
}
