import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="py-16">
      <Container>
        <div className="rounded-card bg-gradient-to-br from-accent-600 to-navy-800 p-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Looking for a service, or have a question?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Get in touch with the 8Caps team and we will point you to the right
            tool or service.
          </p>
          <div className="mt-6">
            <ButtonLink href="/contact" variant="secondary">
              Contact 8Caps
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
