"use client";

import type { ServiceInput } from "@/types/domain";

export function ServicesEditor({
  services,
  onChange,
}: {
  services: ServiceInput[];
  onChange: (next: ServiceInput[]) => void;
}) {
  function update(index: number, patch: Partial<ServiceInput>) {
    onChange(
      services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }
  function remove(index: number) {
    onChange(services.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...services, { name: "", description: "" }]);
  }

  return (
    <div className="space-y-3">
      {services.map((service, i) => (
        <div
          key={i}
          className="rounded-card border p-3 shadow-soft"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <input
            value={service.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Service name"
            className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--color-hairline)" }}
          />
          <input
            value={service.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Description"
            className="mt-2 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm"
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
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-lg border bg-surface px-3 py-2 text-sm font-medium text-ink transition-all duration-200 hover:bg-surface-muted active:scale-[0.98]"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        Add service
      </button>
    </div>
  );
}
