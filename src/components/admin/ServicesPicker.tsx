"use client";

import {
  CASE_STUDY_SERVICE_OPTIONS,
  type CaseStudyService,
} from "@/types/case-study";

export function ServicesPicker({
  value,
  onChange,
}: {
  value: CaseStudyService[];
  onChange: (next: CaseStudyService[]) => void;
}) {
  function toggle(service: CaseStudyService) {
    onChange(
      value.includes(service)
        ? value.filter((s) => s !== service)
        : [...value, service],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CASE_STUDY_SERVICE_OPTIONS.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={active}
            className={
              active
                ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full border px-3 py-1 text-xs font-medium text-ink"
            }
            style={active ? undefined : { borderColor: "var(--color-hairline)" }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
