"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitContactForm } from "@/app/(public)/contact/actions";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/lib/contact-form";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus({ kind: "submitting" });
    startTransition(async () => {
      const result = await submitContactForm(formData);
      if (result.ok) {
        setStatus({ kind: "success" });
      } else {
        setStatus({
          kind: "error",
          message: result.error ?? "Something went wrong. Please try again.",
        });
      }
    });
  }

  if (status.kind === "success") {
    return (
      <div
        className="rounded-card border bg-surface p-8 text-center shadow-soft"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <h2 className="text-2xl font-bold text-ink">Thanks — message received.</h2>
        <p className="mt-2 text-ink-muted">
          We&rsquo;ll be in touch within one working day.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-accent">
          ← Back to the homepage
        </Link>
      </div>
    );
  }

  const isBusy = status.kind === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Your name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Company" name="company" />

      <div>
        <label htmlFor="projectType" className="block text-sm font-semibold text-ink">
          What kind of project? <span className="text-accent">*</span>
        </label>
        <select
          id="projectType"
          name="projectType"
          required
          defaultValue="not_sure"
          className="mt-1 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          {PROJECT_TYPES.map((p) => (
            <option key={p} value={p}>
              {PROJECT_TYPE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <Field label="How did you hear about us?" name="heardAbout" />

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-ink">
          Tell us about your project <span className="text-accent">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={20}
          className="mt-1 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
      </div>

      {/* Honeypot — invisible to humans, bots will fill it. */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status.kind === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isBusy}
        className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {isBusy ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        className="mt-1 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
        style={{ borderColor: "var(--color-hairline)" }}
      />
    </div>
  );
}
