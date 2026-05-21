import Image from "next/image";
import type { SiteDetail } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";

export function SiteHero({ site }: { site: SiteDetail }) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      {site.logoUrl ? (
        <Image
          src={site.logoUrl}
          alt={`${site.name} logo`}
          width={80}
          height={80}
          className="rounded-xl"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-navy-800 text-2xl font-bold text-ink-400">
          {site.name.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <StatusBadge lifecycle={site.lifecycle} />
        </div>
        {site.category && (
          <p className="mt-1 text-sm text-ink-400">{site.category.name}</p>
        )}
        <p className="mt-3 max-w-2xl text-ink-400">{site.shortSummary}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={site.url} external>
            Visit website
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Enquire through 8Caps
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
