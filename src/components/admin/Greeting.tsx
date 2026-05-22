"use client";

import { useEffect, useState } from "react";
import { greetingFor } from "@/lib/greeting";

/**
 * The dashboard greeting line. It first renders with a server-provided
 * fallback hour (so the first paint is correct and hydration matches), then
 * corrects to the visitor's own timezone once it hydrates in the browser.
 */
export function Greeting({
  name,
  fallbackHour,
}: {
  name: string | null;
  fallbackHour: number;
}) {
  const [hour, setHour] = useState(fallbackHour);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const greeting = greetingFor(hour);
  return <>{name ? `${greeting}, ${name}!` : `${greeting}!`}</>;
}
