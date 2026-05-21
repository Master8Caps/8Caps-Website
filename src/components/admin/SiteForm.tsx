"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type {
  ActionResult,
  Category,
  SiteFormValues,
  Tag,
} from "@/types/domain";
import { slugify } from "@/lib/slugify";
import { useUpload } from "@/lib/use-upload";
import { ServicesEditor } from "./ServicesEditor";
import { ScreenshotsEditor } from "./ScreenshotsEditor";
import { TagSelector } from "./TagSelector";

const EMPTY: SiteFormValues = {
  name: "",
  slug: "",
  url: "",
  logoUrl: null,
  shortSummary: "",
  fullOverview: "",
  targetAudience: "",
  categoryId: null,
  publishStatus: "draft",
  lifecycle: "live",
  visibility: "public",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  services: [],
  screenshots: [],
  tagIds: [],
};

const field = "w-full rounded-lg border px-3 py-2 text-sm";
const fieldStyle = { borderColor: "var(--color-hairline)" };
const sectionTitle = "text-sm font-semibold uppercase tracking-wide text-ink-muted";

export function SiteForm({
  initial,
  categories,
  allTags,
  onSubmit,
}: {
  initial?: SiteFormValues;
  categories: Category[];
  allTags: Tag[];
  onSubmit: (values: SiteFormValues) => Promise<ActionResult>;
}) {
  const [values, setValues] = useState<SiteFormValues>(initial ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { upload, uploading } = useUpload();

  function set<K extends keyof SiteFormValues>(key: K, value: SiteFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleName(name: string) {
    setValues((v) => ({
      ...v,
      name,
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
      // A successful action redirects and never returns; only errors arrive here.
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
          value={values.name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Website name"
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
          required
          type="url"
          value={values.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://example.com"
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
          <label className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-ink"
            style={fieldStyle}>
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
      </section>

      {/* Content */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Content</h2>
        <input
          required
          value={values.shortSummary}
          onChange={(e) => set("shortSummary", e.target.value)}
          placeholder="Short summary"
          className={field}
          style={fieldStyle}
        />
        <textarea
          value={values.fullOverview}
          onChange={(e) => set("fullOverview", e.target.value)}
          placeholder="Full overview"
          rows={4}
          className={field}
          style={fieldStyle}
        />
        <textarea
          value={values.targetAudience}
          onChange={(e) => set("targetAudience", e.target.value)}
          placeholder="Who it helps"
          rows={2}
          className={field}
          style={fieldStyle}
        />
      </section>

      {/* Classification */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Classification</h2>
        <select
          value={values.categoryId ?? ""}
          onChange={(e) => set("categoryId", e.target.value || null)}
          className={field}
          style={fieldStyle}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={values.publishStatus}
            onChange={(e) =>
              set("publishStatus", e.target.value as SiteFormValues["publishStatus"])
            }
            className={field}
            style={fieldStyle}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={values.lifecycle}
            onChange={(e) =>
              set("lifecycle", e.target.value as SiteFormValues["lifecycle"])
            }
            className={field}
            style={fieldStyle}
          >
            <option value="live">Live</option>
            <option value="coming_soon">Coming soon</option>
          </select>
          <select
            value={values.visibility}
            onChange={(e) =>
              set("visibility", e.target.value as SiteFormValues["visibility"])
            }
            className={field}
            style={fieldStyle}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured on the homepage
        </label>
      </section>

      {/* SEO */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>SEO</h2>
        <input
          value={values.seoTitle}
          onChange={(e) => set("seoTitle", e.target.value)}
          placeholder="SEO title"
          className={field}
          style={fieldStyle}
        />
        <textarea
          value={values.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          placeholder="SEO description"
          rows={2}
          className={field}
          style={fieldStyle}
        />
      </section>

      {/* Services */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Services</h2>
        <ServicesEditor
          services={values.services}
          onChange={(next) => set("services", next)}
        />
      </section>

      {/* Screenshots */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Screenshots</h2>
        <ScreenshotsEditor
          screenshots={values.screenshots}
          onChange={(next) => set("screenshots", next)}
        />
      </section>

      {/* Tags */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Tags</h2>
        <TagSelector
          allTags={allTags}
          selected={values.tagIds}
          onChange={(next) => set("tagIds", next)}
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save website"}
      </button>
    </form>
  );
}
