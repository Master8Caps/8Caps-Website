import {
  Workflow,
  Target,
  Building2,
  Megaphone,
  Sparkles,
  Database,
  Tag,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps a category slug to its icon. Categories are admin-editable, so any
 * slug not listed here falls back to a generic tag icon.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  automation: Workflow,
  "lead-generation": Target,
  property: Building2,
  marketing: Megaphone,
  "ai-tools": Sparkles,
  "data-services": Database,
};

export function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Tag;
}
