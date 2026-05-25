import { Clock, MessageSquare, Shield, Mail } from "lucide-react";

const ITEMS = [
  { icon: Clock, text: "We reply within one working day." },
  { icon: MessageSquare, text: "First call is a no-cost conversation." },
  { icon: Shield, text: "Everything you share is confidential." },
];

export function ContactWhatToExpect() {
  return (
    <aside
      className="rounded-card border bg-surface p-6"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <h2
        className="text-lg font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        What happens next
      </h2>
      <ul className="mt-4 space-y-3">
        {ITEMS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-ink-muted">
            <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{text}</span>
          </li>
        ))}
        <li className="flex items-start gap-3 text-sm text-ink-muted">
          <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Or email us directly:{" "}
            <a className="font-semibold text-ink underline" href="mailto:master@8caps.co.uk">
              master@8caps.co.uk
            </a>
          </span>
        </li>
      </ul>
    </aside>
  );
}
