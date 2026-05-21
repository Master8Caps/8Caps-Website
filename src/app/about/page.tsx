import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CTASection } from "@/components/marketing/CTASection";

export const metadata: Metadata = {
  title: "About",
  description:
    "8Caps is a portfolio of digital services, platforms and specialist websites.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-surface py-14">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-bold text-ink">About 8Caps</h1>
          <p className="mt-5 text-ink-muted">
            8Caps is a portfolio of digital services, platforms, tools and
            specialist websites built to solve practical business problems.
            Every brand we operate is purpose-built for a specific audience and
            a specific job.
          </p>
          <p className="mt-4 text-ink-muted">
            This directory exists to give each of those products a credible,
            verifiable home — and to make it easy to find the right tool for
            your needs.
          </p>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
