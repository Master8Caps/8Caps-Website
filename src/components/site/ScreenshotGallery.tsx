import Image from "next/image";
import type { Screenshot } from "@/types/domain";

export function ScreenshotGallery({
  screenshots,
}: {
  screenshots: Screenshot[];
}) {
  if (screenshots.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {screenshots.map((shot) => (
        <Image
          key={shot.id}
          src={shot.imageUrl}
          alt={shot.altText ?? ""}
          width={1200}
          height={750}
          className="rounded-card border border-white/10"
        />
      ))}
    </div>
  );
}
