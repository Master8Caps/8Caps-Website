import Link from "next/link";
import { Container } from "./Container";

const NAV = [
  { href: "/sites", label: "Directory" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          8Caps
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-400">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
