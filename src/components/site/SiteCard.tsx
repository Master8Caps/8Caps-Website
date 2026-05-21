import Link from "next/link";
import Image from "next/image";
import type { SiteSummary } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SiteCard({ site }: { site: SiteSummary }) {
  return (
    <article className="flex flex-col rounded-card border border-white/10 bg-navy-900 p-5 transition-colors hover:border-white/25">
      <div className="flex items-center gap-3">
        {site.logoUrl ? (
          <Image
            src={site.logoUrl}
            alt={`${site.name} logo`}
            width={44}
            height={44}
            className="rounded-lg"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-800 text-sm font-bold text-ink-400">
            {site.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-semibold leading-tight">{site.name}</h3>
          {site.category && (
            <p className="text-xs text-ink-400">{site.category.name}</p>
          )}
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm text-ink-400">{site.shortSummary}</p>

      <div className="mt-4 flex items-center justify-between">
        <StatusBadge lifecycle={site.lifecycle} />
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/sites/${site.slug}`}
          className="flex-1 rounded-lg bg-accent-500 px-3 py-2 text-center text-sm font-semibold hover:bg-accent-600"
        >
          View details
        </Link>
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-center text-sm font-semibold hover:bg-white/10"
        >
          Visit website
        </a>
      </div>
    </article>
  );
}
