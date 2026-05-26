"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { slugify } from "@/lib/slugify";
import { useUpload } from "@/lib/use-upload";
import { ServicesPicker } from "./ServicesPicker";
import { TagInput } from "./TagInput";
import type { ActionResult } from "@/types/domain";
import type { CaseStudyFormValues } from "@/types/case-study";

const EMPTY: CaseStudyFormValues = {
  clientName: "",
  slug: "",
  clientSector: "",
  year: null,
  logoUrl: null,
  brandColour: "",
  outcomeHeadline: "",
  storyProblem: "",
  storySolution: "",
  testimonialQuote: "",
  testimonialAuthor: "",
  testimonialRole: "",
  techStack: [],
  services: [],
  publishStatus: "draft",
  isFeatured: false,
  sortOrder: 0,
  testimonialApproved: false,
};

const field = "w-full rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };
const sectionTitle = "text-sm font-semibold uppercase tracking-wide text-ink-muted";

export function CaseStudyForm({
  initial,
  onSubmit,
}: {
  initial?: CaseStudyFormValues;
  onSubmit: (values: CaseStudyFormValues) => Promise<ActionResult>;
}) {
  const [values, setValues] = useState<CaseStudyFormValues>(initial ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { upload, uploading } = useUpload();

  function set<K extends keyof CaseStudyFormValues>(key: K, value: CaseStudyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleClientName(name: string) {
    setValues((v) => ({
      ...v,
      clientName: name,
      slug: slugEdited ? v.slug : slugify(name),
    }));
  }

  async function handleLogo(file: File | null) {
    if (!file) return;
    const url = await upload(file, "logos");
    set("logoUrl", url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result && !result.ok) setError(result.error ?? "Something went wrong");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8 p-8">
      {/* Basics */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Basics</h2>
        <input
          required
          value={values.clientName}
          onChange={(e) => handleClientName(e.target.value)}
          placeholder="Client name"
          className={field}
          style={fieldStyle}
        />
        <input
          required
          value={values.slug}
          onChange={(e) => {
            setSlugEdited(true);
            set("slug", e.target.value);
          }}
          placeholder="slug"
          className={field}
          style={fieldStyle}
        />
        <input
          value={values.clientSector}
          onChange={(e) => set("clientSector", e.target.value)}
          placeholder="Client sector (e.g. Hospitality)"
          className={field}
          style={fieldStyle}
        />
        <input
          type="number"
          value={values.year ?? ""}
          onChange={(e) =>
            set("year", e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder="Year"
          className={field}
          style={fieldStyle}
        />
        <div className="flex items-center gap-3">
          {values.logoUrl && (
            <Image
              src={values.logoUrl}
              alt="Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
          )}
          <label
            className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-ink"
            style={fieldStyle}
          >
            {uploading ? "Uploading…" : values.logoUrl ? "Change logo" : "Upload logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-ink-muted">Brand colour</label>
          <input
            type="color"
            value={values.brandColour || "#000000"}
            onChange={(e) => set("brandColour", e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-lg border"
            style={fieldStyle}
          />
          <input
            type="text"
            value={values.brandColour}
            onChange={(e) => set("brandColour", e.target.value)}
            placeholder="#1f2937"
            className={`${field} max-w-[8rem]`}
            style={fieldStyle}
          />
        </div>
      </section>

      {/* Story */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Story</h2>
        <input
          required
          value={values.outcomeHeadline}
          onChange={(e) => set("outcomeHeadline", e.target.value)}
          placeholder="Outcome headline"
          className={field}
          style={fieldStyle}
        />
        <textarea
          required
          value={values.storyProblem}
          onChange={(e) => set("storyProblem", e.target.value)}
          placeholder="Problem paragraph"
          rows={4}
          className={field}
          style={fieldStyle}
        />
        <textarea
          required
          value={values.storySolution}
          onChange={(e) => set("storySolution", e.target.value)}
          placeholder="Solution paragraph"
          rows={4}
          className={field}
          style={fieldStyle}
        />
      </section>

      {/* Testimonial */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Testimonial</h2>
        <textarea
          required
          value={values.testimonialQuote}
          onChange={(e) => set("testimonialQuote", e.target.value)}
          placeholder="Quote"
          rows={3}
          className={field}
          style={fieldStyle}
        />
        <input
          required
          value={values.testimonialAuthor}
          onChange={(e) => set("testimonialAuthor", e.target.value)}
          placeholder="Author name"
          className={field}
          style={fieldStyle}
        />
        <input
          value={values.testimonialRole}
          onChange={(e) => set("testimonialRole", e.target.value)}
          placeholder="Author role (optional)"
          className={field}
          style={fieldStyle}
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            aria-label="Testimonial approved"
            checked={values.testimonialApproved}
            onChange={(e) => set("testimonialApproved", e.target.checked)}
          />
          Approved for publication (visible on /work when published)
        </label>
      </section>

      {/* Classification */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Classification</h2>
        <div>
          <label className="block text-xs text-ink-muted mb-2">Services</label>
          <ServicesPicker
            value={values.services}
            onChange={(next) => set("services", next)}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-2">Tech stack</label>
          <TagInput
            value={values.techStack}
            onChange={(next) => set("techStack", next)}
            placeholder="Type and press Enter"
          />
        </div>
      </section>

      {/* Display */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Display</h2>
        <select
          value={values.publishStatus}
          onChange={(e) =>
            set("publishStatus", e.target.value as CaseStudyFormValues["publishStatus"])
          }
          className={field}
          style={fieldStyle}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured on homepage
        </label>
        <input
          type="number"
          value={values.sortOrder}
          onChange={(e) => set("sortOrder", Number(e.target.value))}
          placeholder="Sort order"
          className={`${field} max-w-[8rem]`}
          style={fieldStyle}
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
