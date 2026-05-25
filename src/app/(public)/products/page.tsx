import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { DirectoryGrid } from "@/components/site/DirectoryGrid";
import { CategoryFilter } from "@/components/site/CategoryFilter";
import { Pagination } from "@/components/site/Pagination";
import { getDirectorySites } from "@/lib/data/sites";
import { getCategories } from "@/lib/data/categories";
import { parseDirectoryParams } from "@/lib/directory";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse every website, tool and service operated by 8Caps.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseDirectoryParams(await searchParams);
  const [result, categories] = await Promise.all([
    getDirectorySites(params),
    getCategories(),
  ]);

  const baseParams = new URLSearchParams();
  if (params.query) baseParams.set("q", params.query);
  if (params.category) baseParams.set("category", params.category);
  if (params.lifecycle) baseParams.set("lifecycle", params.lifecycle);

  return (
    <>
      {/* Compact dark Oxford Blue band — dot grid + subtler glow */}
      <section className="band-surface py-10 text-white">
        <Container>
          <h1 className="text-3xl font-bold">Website directory</h1>
          <p className="mt-2 text-white/65">
            {result.total} {result.total === 1 ? "website" : "websites"} operated
            by 8Caps.
          </p>
        </Container>
      </section>

      {/* Light body — filters + results */}
      <section className="bg-surface py-10">
        <Container>
          {/* Search */}
          <form action="/products" method="get" className="flex gap-3">
            <input
              type="search"
              name="q"
              defaultValue={params.query}
              placeholder="Search by name or keyword…"
              className="w-full max-w-md rounded-lg border px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ borderColor: "var(--color-hairline)" }}
            />
            {params.category && (
              <input type="hidden" name="category" value={params.category} />
            )}
            {params.lifecycle && (
              <input type="hidden" name="lifecycle" value={params.lifecycle} />
            )}
            <button
              type="submit"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>

          {/* Category filter */}
          <div className="mt-5">
            <CategoryFilter
              categories={categories}
              activeCategory={params.category}
              query={params.query}
              lifecycle={params.lifecycle}
            />
          </div>

          {/* Results */}
          <div className="mt-8">
            <DirectoryGrid sites={result.sites} />
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            baseParams={baseParams}
          />
        </Container>
      </section>
    </>
  );
}
