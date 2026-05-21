import { Container } from "@/components/layout/Container";
import Link from "next/link";

export function CTASection() {
  return (
    <section
      className="py-16 text-white text-center"
      style={{ background: "linear-gradient(135deg,#002147,#0a4a92)" }}
    >
      <Container>
        <h2 className="text-2xl font-bold sm:text-3xl">
          Looking for a service, or have a question?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/75 text-sm">
          Get in touch with the 8Caps team and we will point you to the right
          tool or service.
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-oxford hover:opacity-90 transition-opacity"
          >
            Contact 8Caps
          </Link>
        </div>
      </Container>
    </section>
  );
}
