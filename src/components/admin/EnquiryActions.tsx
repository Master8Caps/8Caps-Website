"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEnquiryStatus } from "@/app/admin/(dashboard)/enquiries/actions";
import type { EnquiryStatus } from "@/types/domain";
import { useAdminPath } from "./AdminPathContext";

const SECONDARY =
  "rounded-lg border px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-60";
const PRIMARY =
  "rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60";

export function EnquiryActions({
  id,
  status,
}: {
  id: string;
  status: EnquiryStatus;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const adminHref = useAdminPath();

  function run(next: EnquiryStatus, returnToList: boolean) {
    startTransition(async () => {
      const result = await setEnquiryStatus(id, next);
      if (!result.ok) {
        alert(result.error ?? "Something went wrong.");
        return;
      }
      if (returnToList) router.push(adminHref("/enquiries"));
    });
  }

  if (status === "archived") {
    return (
      <button
        type="button"
        onClick={() => run("read", false)}
        disabled={pending}
        className={PRIMARY}
      >
        {pending ? "Restoring…" : "Restore to inbox"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "read" && (
        <button
          type="button"
          onClick={() => run("new", true)}
          disabled={pending}
          className={SECONDARY}
          style={{ borderColor: "var(--color-hairline)" }}
        >
          Mark unread
        </button>
      )}
      <button
        type="button"
        onClick={() => run("archived", true)}
        disabled={pending}
        className={SECONDARY}
        style={{ borderColor: "var(--color-hairline)" }}
      >
        {pending ? "Working…" : "Archive"}
      </button>
    </div>
  );
}
