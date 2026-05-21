import Link from "next/link";
import { Container } from "./Container";

const NAV = [
  { href: "/sites", label: "Directory" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-white/10 bg-oxford">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          8Caps
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/75 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Contact
          </Link>
        </nav>
      </Container>
    </header>
  );
}
