import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";

export interface ServicePillarSectionProps {
  anchorId: string;
  icon: LucideIcon;
  title: string;
  description: string;
  solves: string[];
  audience: string;
  ctaHref: string;
  ctaLabel: string;
}

export function ServicePillarSection({
  anchorId,
  icon: Icon,
  title,
  description,
  solves,
  audience,
  ctaHref,
  ctaLabel,
}: ServicePillarSectionProps) {
  return (
    <section id={anchorId} className="bg-surface py-20">
      <Container className="max-w-3xl">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--color-oxford)" }}
          >
            <Icon size={20} strokeWidth={1.75} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        </div>

        <p className="mt-4 text-ink-muted leading-relaxed">{description}</p>

        {solves.length > 0 && (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-ink-muted">
              What it solves
            </h3>
            <ul className="mt-3 space-y-2">
              {solves.map((item) => (
                <li key={item} className="flex gap-3 text-ink-muted">
                  <span
                    className="mt-2 h-1 w-3 shrink-0 rounded-full"
                    style={{ background: "var(--color-accent)" }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Who it&rsquo;s for
        </h3>
        <p className="mt-2 text-ink-muted">{audience}</p>

        <div className="mt-8">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:shadow-lift hover:brightness-110 active:scale-[0.98]"
          >
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}
