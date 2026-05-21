import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { getFeaturedSites } from "@/lib/data/sites";
import { getCategories } from "@/lib/data/categories";

// Revalidate the static page hourly; admin publish actions in Plan 2 will
// trigger on-demand revalidation.
export const revalidate = 3600;

const WHY = [
  { title: "Credibility", body: "A single, verifiable home for every 8Caps brand." },
  { title: "Range of services", body: "Tools across automation, marketing, property and more." },
  { title: "Specialist websites", body: "Each product is purpose-built for its audience." },
  { title: "Practical solutions", body: "Everything here solves a real business problem." },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedSites(3),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero — Oxford Blue with dot grid + corner glow */}
      <section className="hero-surface py-20 text-white">
        <Container>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-accent-soft)", fontFamily: "var(--font-heading)" }}
          >
            8Caps Portfolio
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            A portfolio of digital services built to solve real business
            problems.
          </h1>
          <p className="mt-5 max-w-2xl text-white/70 text-base">
            8Caps builds and operates specialist websites, platforms and tools.
            Explore everything we offer in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/sites">Explore our services</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Contact 8Caps
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Featured — white */}
      <section className="bg-surface py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink">Featured websites</h2>
          <p className="mt-1 text-ink-muted">A selection of our flagship products.</p>
          <div className="mt-8">
            <DirectoryGrid sites={featured} />
          </div>
        </Container>
      </section>

      {/* Categories — light grey */}
      <section className="bg-surface-muted py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink">Browse by category</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/sites?category=${c.slug}`}
                className="rounded-card border bg-surface p-5 hover:shadow-md transition-shadow"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                <div
                  className="h-5 w-5 rounded-md mb-2"
                  style={{ background: "var(--color-oxford)" }}
                />
                <h3
                  className="font-semibold text-ink text-sm"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {c.name}
                </h3>
                {c.description && (
                  <p className="mt-1 text-xs text-ink-muted">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Why 8Caps — white */}
      <section className="bg-surface py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink">Why 8Caps</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <div key={item.title}>
                {/* Accent tick bar */}
                <div
                  className="h-0.5 w-7 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
                <h3
                  className="mt-2 font-semibold text-ink text-sm"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
