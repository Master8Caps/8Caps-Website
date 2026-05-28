import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary";

// primary  = filled accent (works on light + dark)
// secondary = outlined, for use on the dark hero / bands
const STYLES: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-soft hover:brightness-110 hover:shadow-lift",
  secondary: "border border-white/30 text-white hover:bg-white/10 hover:border-white/55",
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
  const className = `inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${STYLES[variant]}`;

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
