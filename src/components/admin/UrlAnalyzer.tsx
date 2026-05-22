"use client";

import { useState } from "react";
import { splitNdjson } from "@/lib/onboarding/stream";
import type { AnalysisResult, AnalyzeEvent } from "@/types/onboarding";

export function UrlAnalyzer({
  onResult,
}: {
  onResult: (
    result: AnalysisResult,
    analysedUrl: string,
    logoUrl: string | null,
  ) => void;
}) {
  const [url, setUrl] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [running, setRunning] = useState(false);

  async function analyse() {
    if (!url.trim()) return;
    setRunning(true);
    setLog([]);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/admin/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.body) throw new Error("No response from the server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let terminalSeen = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { lines, rest } = splitNdjson(buffer);
        buffer = rest;
        for (const line of lines) {
          const event = JSON.parse(line) as AnalyzeEvent;
          if (event.type === "progress") {
            setLog((l) => [...l, event.message]);
          } else if (event.type === "error") {
            terminalSeen = true;
            setError(event.message);
          } else if (event.type === "done") {
            terminalSeen = true;
            setLog((l) => [...l, "Done — review the fields below."]);
            setAnalysis(event.result);
            onResult(event.result, url.trim(), event.logoUrl);
          }
        }
      }

      // The stream closed without an error or done event — never leave the
      // admin staring at a stale log with no outcome.
      if (!terminalSeen) {
        setError(
          "The analysis stopped unexpectedly before finishing — please try again.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The analysis could not be run.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="rounded-card border bg-surface-muted p-5"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <h2
        className="text-sm font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Analyse a URL
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        Paste a website address and the AI will draft the fields below for you
        to review.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={running}
          className="w-full rounded-lg border bg-surface px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        />
        <button
          type="button"
          onClick={analyse}
          disabled={running || !url.trim()}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running ? "Analysing…" : "Analyse"}
        </button>
      </div>

      {log.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-oxford/90 p-3 font-mono text-xs text-white/80">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {analysis && (
        <div
          className="mt-3 rounded-lg border bg-surface p-3 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <p className="text-ink">
            <span className="font-semibold">AI confidence:</span>{" "}
            <span className="capitalize">{analysis.confidence}</span>
          </p>
          {analysis.suggestedNewCategory && (
            <p className="mt-1 text-ink-muted">
              <span className="font-semibold">New category proposed:</span>{" "}
              {analysis.suggestedNewCategory}
            </p>
          )}
          {analysis.notes && (
            <p className="mt-1 text-ink-muted">
              <span className="font-semibold">Notes:</span> {analysis.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
