"use client";

import { useEffect, useRef } from "react";
import { setEnquiryStatus } from "@/app/admin/(dashboard)/enquiries/actions";
import type { EnquiryStatus } from "@/types/domain";

/** Fire-and-forget: when a 'new' enquiry's detail page opens, mark it read.
 *  Renders nothing. Guarded so React StrictMode's double-invoke (dev) doesn't
 *  send the update twice; the action is idempotent regardless. */
export function MarkEnquiryRead({
  id,
  status,
}: {
  id: string;
  status: EnquiryStatus;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (status === "new" && !fired.current) {
      fired.current = true;
      void setEnquiryStatus(id, "read");
    }
  }, [id, status]);

  return null;
}
