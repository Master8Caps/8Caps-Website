import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="bg-oxford-deep py-10 text-sm text-white/60">
      <Container className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo variant="mark" className="h-6 w-auto" />
          <p>© {new Date().getFullYear()} 8Caps. All rights reserved.</p>
        </div>
        <div className="flex gap-5">
          <Link href="/sites" className="hover:text-white transition-colors">Directory</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </Container>
    </footer>
  );
}
