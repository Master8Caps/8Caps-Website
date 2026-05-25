import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { SiteHero } from "@/components/site/SiteHero";
import { ScreenshotGallery } from "@/components/site/ScreenshotGallery";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { getSiteBySlug, getRelatedSites, getAllSiteSlugs } from "@/lib/data/sites";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllSiteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return { title: "Website not found" };
  return {
    title: site.seoTitle ?? site.name,
    description: site.seoDescription ?? site.shortSummary,
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const related = await getRelatedSites(
    site.id,
    site.category?.id ?? null,
    3,
  );

  return (
    <>
      {/* Compact dark Oxford Blue band — dot grid + subtler glow */}
      <section className="band-surface py-12 text-white">
        <Container>
          <SiteHero site={site} />
        </Container>
      </section>

      {/* Light body — overview / services / screenshots / related */}
      <section className="bg-surface py-14">
        <Container>
          {site.fullOverview && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-ink">Overview</h2>
              <p className="mt-3 text-ink-muted">{site.fullOverview}</p>
            </div>
          )}

          {site.services.length > 0 && (
            <div className={site.fullOverview ? "mt-12" : undefined}>
              <h2 className="text-xl font-bold text-ink">Services offered</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {site.services.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-card border bg-surface p-4"
                    style={{ borderColor: "var(--color-hairline)" }}
                  >
                    <h3 className="font-semibold text-ink">{s.name}</h3>
                    {s.description && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {site.targetAudience && (
            <div className="mt-12 max-w-3xl">
              <h2 className="text-xl font-bold text-ink">Who it helps</h2>
              <p className="mt-3 text-ink-muted">{site.targetAudience}</p>
            </div>
          )}

          {site.screenshots.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-ink">Screenshots</h2>
              <div className="mt-4">
                <ScreenshotGallery screenshots={site.screenshots} />
              </div>
            </div>
          )}

          {site.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {site.tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full border px-3 py-1 text-xs text-ink-muted"
                  style={{ borderColor: "var(--color-hairline)" }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-ink">Related websites</h2>
              <div className="mt-4">
                <DirectoryGrid sites={related} />
              </div>
            </div>
          )}
        </Container>
      </section>

      <CTASection />
    </>
  );
}
