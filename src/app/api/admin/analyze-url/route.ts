import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminCategories, getAllTags } from "@/lib/data/admin";
import { crawlSite } from "@/lib/onboarding/crawl";
import { analyzeSite } from "@/lib/onboarding/analyze";
import type { AnalyzeEvent } from "@/types/onboarding";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  // Auth: this route is not under /admin, so the proxy middleware does not
  // guard it — verify the admin session here.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string") throw new Error();
    const parsed = new URL(body.url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }
    url = parsed.toString();
  } catch {
    return new Response(
      JSON.stringify({ type: "error", message: "That doesn't look like a valid URL." }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AnalyzeEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        const crawl = await crawlSite(url, (message) =>
          send({ type: "progress", message }),
        );

        send({ type: "progress", message: "Analysing with Claude…" });
        const [categories, tags] = await Promise.all([
          getAdminCategories(),
          getAllTags(),
        ]);
        const result = await analyzeSite({
          text: crawl.combinedText,
          categories,
          tags,
        });

        send({
          type: "progress",
          message: `Analysis complete — confidence: ${result.confidence}`,
        });
        send({ type: "done", result, logoUrl: crawl.logoUrl });
      } catch (err) {
        send({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "An unexpected error stopped the analysis.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
