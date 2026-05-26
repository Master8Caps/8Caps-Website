import { z } from "zod";

export const PROJECT_TYPES = ["custom_software", "ai", "automation", "not_sure"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  custom_software: "Custom Software",
  ai: "AI Solutions",
  automation: "Automation",
  not_sure: "Not sure yet",
};

/**
 * Contact form schema. `website` is a honeypot — a real visitor will never
 * see it; bots fill every visible-looking field, so a non-empty value means
 * "treat this submission as spam".
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  company: z.string().trim().max(200).optional().default(""),
  projectType: z.enum(PROJECT_TYPES),
  heardAbout: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(20, "Tell us a bit more — at least 20 characters").max(5000),
  website: z.string().max(0, "Spam check failed").optional().default(""),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
