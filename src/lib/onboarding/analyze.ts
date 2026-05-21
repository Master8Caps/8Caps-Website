import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/types/onboarding";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You analyse a company's website and produce a structured \
listing for the 8Caps services directory.

You are given visible text extracted from the site's homepage and a few key \
pages. Produce an accurate, concise, professional listing. Rules:
- Do not invent facts that the page content does not support.
- Write in British English.
- "shortSummary" is one clear sentence.
- "fullOverview" is 2-3 short paragraphs.
- "services" lists the concrete services or features the site offers.
- Choose the single best-fitting category SLUG from the provided list, or null \
if none genuinely fits.
- Choose only genuinely relevant tag SLUGs from the provided list.
- "suggestedSlug" is a lowercase, hyphenated slug derived from the site name.
- "confidence" reflects how well the page content supported the analysis.
- "notes" flags anything important that was missing or unclear.
Always call the save_site_analysis tool with your result.`;

const TOOL: Anthropic.Tool = {
  name: "save_site_analysis",
  description: "Save the structured analysis of the website.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "The website / brand name" },
      shortSummary: { type: "string", description: "One-sentence summary" },
      fullOverview: { type: "string", description: "2-3 paragraph overview" },
      targetAudience: { type: "string", description: "Who the site is for" },
      suggestedCategorySlug: {
        type: ["string", "null"],
        description: "Best-fitting category slug from the supplied list, or null",
      },
      suggestedTagSlugs: {
        type: "array",
        items: { type: "string" },
        description: "Relevant tag slugs from the supplied list",
      },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["name", "description"],
        },
      },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
      suggestedSlug: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      notes: { type: "string" },
    },
    required: [
      "name",
      "shortSummary",
      "fullOverview",
      "targetAudience",
      "suggestedCategorySlug",
      "suggestedTagSlugs",
      "services",
      "seoTitle",
      "seoDescription",
      "suggestedSlug",
      "confidence",
      "notes",
    ],
  },
};

export interface AnalyzeInput {
  text: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
}

/** Sends crawled site text to Claude and returns the structured analysis. */
export async function analyzeSite(input: AnalyzeInput): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("AI analysis is not configured (ANTHROPIC_API_KEY is unset).");
  }

  const client = new Anthropic({ apiKey });

  const categoryList = input.categories
    .map((c) => `- ${c.name} (slug: ${c.slug})`)
    .join("\n");
  const tagList = input.tags
    .map((t) => `- ${t.name} (slug: ${t.slug})`)
    .join("\n");

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL],
      tool_choice: { type: "tool", name: "save_site_analysis" },
      messages: [
        {
          role: "user",
          content:
            `Existing categories:\n${categoryList || "(none)"}\n\n` +
            `Existing tags:\n${tagList || "(none)"}\n\n` +
            `Website content:\n${input.text}`,
        },
      ],
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    throw new Error(`The AI request failed: ${reason}`);
  }

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The AI did not return a structured result.");
  }
  return toolUse.input as AnalysisResult;
}
