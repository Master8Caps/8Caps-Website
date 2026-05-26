"use client";

import { useTransition } from "react";
import { approveCaseStudy } from "@/app/admin/(dashboard)/case-studies/actions";

export function CaseStudyApproveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await approveCaseStudy(id);
      if (!result.ok && result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Approving…" : "Approve"}
    </button>
  );
}
