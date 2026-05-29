import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="bg-oxford-deep py-10 text-sm text-white/60">
      <Container className="flex flex-col gap-6">
        {/* Top row: logo + copyright on the left, primary nav on the right */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo variant="mark" className="h-12 w-auto" />
            <p>© {new Date().getFullYear()} 8Caps. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <Link href="/work" className="hover:text-white transition-colors">
              Work
            </Link>
            <Link href="/products" className="hover:text-white transition-colors">
              Products
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Compliance row */}
        <div className="border-t border-white/10 pt-4 text-xs">
          {/* PLACEHOLDERS — replace once the real details land. */}
          <p>
            Registered in England &amp; Wales · Company No. <em>00000000</em> ·
            ICO registration <em>ZA000000</em> · Registered office:{" "}
            <em>Address placeholder</em>.
          </p>
        </div>
      </Container>
    </footer>
  );
}
