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
const fieldLabel = "block text-sm font-medium text-ink";
const fieldHelp = "mt-0.5 text-xs text-ink-muted";

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
      <section className="space-y-5">
        <h2 className={sectionTitle}>Basics</h2>

        <div>
          <label className={fieldLabel}>Client name</label>
          <p className={fieldHelp}>The business name as it should appear on /work, e.g. &ldquo;North Bar Engineer&rdquo;.</p>
          <input
            required
            value={values.clientName}
            onChange={(e) => handleClientName(e.target.value)}
            placeholder="North Bar Engineer"
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>URL slug</label>
          <p className={fieldHelp}>Used in the public URL <code>/work/&#123;slug&#125;</code>. Lowercase letters, numbers, hyphens only. Auto-filled from the name &mdash; edit if you need to.</p>
          <input
            required
            value={values.slug}
            onChange={(e) => {
              setSlugEdited(true);
              set("slug", e.target.value);
            }}
            placeholder="north-bar-engineer"
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Client sector</label>
          <p className={fieldHelp}>Industry the client operates in. Free text &mdash; e.g. Engineering, Hospitality, Publishing.</p>
          <input
            value={values.clientSector}
            onChange={(e) => set("clientSector", e.target.value)}
            placeholder="Engineering"
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Year of project delivery</label>
          <p className={fieldHelp}>When 8Caps delivered the work for this client &mdash; not when the client was founded. Leave blank if unknown.</p>
          <input
            type="number"
            min={2000}
            max={new Date().getFullYear() + 1}
            value={values.year ?? ""}
            onChange={(e) =>
              set("year", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="2024"
            className={`${field} mt-2 max-w-[10rem]`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Client logo</label>
          <p className={fieldHelp}>Uploaded to Supabase Storage. Shown on the /work card and detail page.</p>
          <div className="mt-2 flex items-center gap-3">
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
        </div>

        <div>
          <label className={fieldLabel}>Brand colour</label>
          <p className={fieldHelp}>Optional. Primary brand colour from the client&rsquo;s site &mdash; tints accents on the case study card.</p>
          <div className="mt-2 flex items-center gap-3">
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
        </div>
      </section>

      {/* Story */}
      <section className="space-y-5">
        <h2 className={sectionTitle}>Story</h2>

        <div>
          <label className={fieldLabel}>Outcome headline</label>
          <p className={fieldHelp}>One-line summary of what the project achieved. Shown at the top of the case study.</p>
          <input
            required
            value={values.outcomeHeadline}
            onChange={(e) => set("outcomeHeadline", e.target.value)}
            placeholder="A modern presence and lead pipeline for…"
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Problem</label>
          <p className={fieldHelp}>What the client was struggling with before 8Caps got involved. 2&ndash;4 sentences.</p>
          <textarea
            required
            value={values.storyProblem}
            onChange={(e) => set("storyProblem", e.target.value)}
            placeholder="They were doing X manually and Y was a bottleneck…"
            rows={4}
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Solution</label>
          <p className={fieldHelp}>What 8Caps built and how it addressed the problem. 2&ndash;4 sentences.</p>
          <textarea
            required
            value={values.storySolution}
            onChange={(e) => set("storySolution", e.target.value)}
            placeholder="We built X on Y, with automation that…"
            rows={4}
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="space-y-5">
        <h2 className={sectionTitle}>Testimonial</h2>

        <div>
          <label className={fieldLabel}>Quote</label>
          <p className={fieldHelp}>The client&rsquo;s exact words. Keep it natural &mdash; 1&ndash;3 sentences works best.</p>
          <textarea
            required
            value={values.testimonialQuote}
            onChange={(e) => set("testimonialQuote", e.target.value)}
            placeholder="Couldn’t fault the team, the new system has saved us hours every week…"
            rows={3}
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Author name</label>
          <p className={fieldHelp}>Full name of the person being quoted.</p>
          <input
            required
            value={values.testimonialAuthor}
            onChange={(e) => set("testimonialAuthor", e.target.value)}
            placeholder="Jane Smith"
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={fieldLabel}>Author role <span className="text-ink-muted">(optional)</span></label>
          <p className={fieldHelp}>e.g. Owner, Director, Editor.</p>
          <input
            value={values.testimonialRole}
            onChange={(e) => set("testimonialRole", e.target.value)}
            placeholder="Owner"
            className={`${field} mt-2`}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              aria-label="Testimonial approved"
              checked={values.testimonialApproved}
              onChange={(e) => set("testimonialApproved", e.target.checked)}
            />
            <span>
              <span className="font-medium">Approved for publication</span>
              <span className="text-ink-muted"> &mdash; required for the case study to appear on /work, in addition to setting status to Published.</span>
            </span>
          </label>
        </div>
      </section>

      {/* Classification */}
      <section className="space-y-5">
        <h2 className={sectionTitle}>Classification</h2>

        <div>
          <label className={fieldLabel}>Services</label>
          <p className={fieldHelp}>Which service pillars apply to this project. Drives the &ldquo;Filter by service&rdquo; chips on /work.</p>
          <div className="mt-2">
            <ServicesPicker
              value={values.services}
              onChange={(next) => set("services", next)}
            />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Tech stack</label>
          <p className={fieldHelp}>Tools / platforms used in the build. Type a name and press <kbd className="rounded border px-1">Enter</kbd> to add.</p>
          <div className="mt-2">
            <TagInput
              value={values.techStack}
              onChange={(next) => set("techStack", next)}
              placeholder="Next.js, Supabase, Make.com…"
            />
          </div>
        </div>
      </section>

      {/* Display */}
      <section className="space-y-5">
        <h2 className={sectionTitle}>Display</h2>

        <div>
          <label className={fieldLabel}>Publish status</label>
          <p className={fieldHelp}>
            <strong>Draft</strong> &mdash; not visible anywhere public.
            {" "}<strong>Published</strong> &mdash; visible on /work <em>only if</em> the testimonial above is also approved.
            {" "}<strong>Archived</strong> &mdash; hidden, but kept for posterity.
          </p>
          <select
            value={values.publishStatus}
            onChange={(e) =>
              set("publishStatus", e.target.value as CaseStudyFormValues["publishStatus"])
            }
            className={`${field} mt-2 max-w-[14rem]`}
            style={fieldStyle}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
            />
            <span>
              <span className="font-medium">Featured on homepage</span>
              <span className="text-ink-muted"> &mdash; shown in the &ldquo;Featured work&rdquo; block on the home page (top 3).</span>
            </span>
          </label>
        </div>

        <div>
          <label className={fieldLabel}>Sort order</label>
          <p className={fieldHelp}>Lower numbers appear first on /work. Use <code>0</code> for the case study you want at the very top.</p>
          <input
            type="number"
            min={0}
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            placeholder="0"
            className={`${field} mt-2 max-w-[8rem]`}
            style={fieldStyle}
          />
        </div>
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
