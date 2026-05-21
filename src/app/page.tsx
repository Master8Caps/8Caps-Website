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
      {/* Hero */}
      <section className="py-20">
        <Container>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            A portfolio of digital services built to solve practical business
            problems.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-400">
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

      {/* Featured */}
      <section className="bg-navy-900 py-16">
        <Container>
          <h2 className="text-2xl font-bold">Featured websites</h2>
          <p className="mt-1 text-ink-400">A selection of our flagship products.</p>
          <div className="mt-8">
            <DirectoryGrid sites={featured} />
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-bold">Browse by category</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/sites?category=${c.slug}`}
                className="rounded-card border border-white/10 bg-navy-900 p-5 hover:border-white/25"
              >
                <h3 className="font-semibold">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 text-sm text-ink-400">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Why 8Caps */}
      <section className="bg-navy-900 py-16">
        <Container>
          <h2 className="text-2xl font-bold">Why 8Caps</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold text-accent-500">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-400">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
