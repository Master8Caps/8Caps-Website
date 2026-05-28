"use client";

import Image from "next/image";
import type { ScreenshotInput } from "@/types/domain";
import { useUpload } from "@/lib/use-upload";

export function ScreenshotsEditor({
  screenshots,
  onChange,
}: {
  screenshots: ScreenshotInput[];
  onChange: (next: ScreenshotInput[]) => void;
}) {
  const { upload, uploading } = useUpload();

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const uploaded: ScreenshotInput[] = [];
    for (const file of Array.from(files)) {
      const imageUrl = await upload(file, "screenshots");
      uploaded.push({ imageUrl, altText: "" });
    }
    onChange([...screenshots, ...uploaded]);
  }

  function update(index: number, altText: string) {
    onChange(
      screenshots.map((s, i) => (i === index ? { ...s, altText } : s)),
    );
  }
  function remove(index: number) {
    onChange(screenshots.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {screenshots.map((shot, i) => (
        <div
          key={shot.imageUrl}
          className="flex gap-3 rounded-card border p-3 shadow-soft"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <Image
            src={shot.imageUrl}
            alt={shot.altText || "Screenshot"}
            width={120}
            height={75}
            className="rounded object-cover"
          />
          <div className="flex-1">
            <input
              value={shot.altText}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Alt text"
              className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--color-hairline)" }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-2 rounded-md text-xs font-medium text-red-600 transition-all duration-200 hover:text-red-700 active:scale-[0.98]"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <label className="inline-block cursor-pointer rounded-lg border bg-surface px-3 py-2 text-sm font-medium text-ink transition-all duration-200 hover:bg-surface-muted active:scale-[0.98]"
        style={{ borderColor: "var(--color-hairline)" }}>
        {uploading ? "Uploading…" : "Add screenshots"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
