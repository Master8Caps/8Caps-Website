import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary";

const STYLES: Record<Variant, string> = {
  primary: "bg-accent-500 text-white hover:bg-accent-600",
  secondary: "border border-white/20 text-white hover:bg-white/10",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  external?: boolean;
}) {
  const className = `inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${STYLES[variant]}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
