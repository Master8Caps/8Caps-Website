import { Container } from "@/components/layout/Container";
import Link from "next/link";

export function CTASection() {
  return (
    <section
      className="py-20 text-center text-white"
      style={{
        backgroundColor: "#002147",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(61,123,217,0.45), transparent 50%), radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(135deg,#002147,#0a4a92)",
        backgroundSize: "auto, 16px 16px, auto",
      }}
    >
      <Container>
        <h2 className="text-2xl font-bold text-balance sm:text-3xl">
          Looking for a service, or have a question?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-white/75">
          Get in touch with the 8Caps team and we will point you to the right
          tool or service.
        </p>
        <div className="mt-7">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-oxford shadow-soft transition-all duration-200 hover:shadow-lift active:scale-[0.98]"
          >
            Contact 8Caps
          </Link>
        </div>
      </Container>
    </section>
  );
}
