import type { SiteSummary } from "@/types/domain";
import { SiteCard } from "./SiteCard";

export function DirectoryGrid({ sites }: { sites: SiteSummary[] }) {
  if (sites.length === 0) {
    return (
      <p className="rounded-card border border-white/10 bg-navy-900 p-8 text-center text-ink-400">
        No websites match your search.
      </p>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} />
      ))}
    </div>
  );
}
