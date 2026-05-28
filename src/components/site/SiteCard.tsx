import Link from "next/link";
import Image from "next/image";
import type { SiteSummary } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SiteCard({ site }: { site: SiteSummary }) {
  return (
    <article
      className="flex flex-col rounded-card border bg-surface p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
      style={{ borderColor: "var(--color-hairline)" }}
    >
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
          /* Gradient placeholder chip */
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#002147,#3d7bd9)" }}
          >
            {site.name.charAt(0)}
          </div>
        )}
        <div>
          <h3
            className="font-semibold leading-tight text-ink"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {site.name}
          </h3>
          {site.category && (
            <p className="text-xs text-ink-muted">{site.category.name}</p>
          )}
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm text-ink-muted leading-relaxed">{site.shortSummary}</p>

      <div className="mt-4 flex items-center">
        <StatusBadge lifecycle={site.lifecycle} />
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/products/${site.slug}`}
          className="flex-1 rounded-lg bg-oxford px-3 py-2 text-center text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          View details
        </Link>
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border px-3 py-2 text-center text-sm font-semibold text-oxford transition-colors hover:bg-surface-muted"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          Visit website
        </a>
      </div>
    </article>
  );
}
