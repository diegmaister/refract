"use client";

import { useEffect, useRef, useState } from "react";

type ContextPreviewProps = {
  compiledContext: string;
  exportReady: boolean;
};

export function ContextPreview({
  compiledContext,
  exportReady,
}: ContextPreviewProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const clearStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
    };
  }, []);

  async function handleCopy() {
    if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);

    try {
      await navigator.clipboard.writeText(compiledContext);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Could not copy. Select the preview and copy it manually.");
    }

    clearStatusTimer.current = setTimeout(() => setCopyStatus(""), 3000);
  }

  return (
    <aside
      aria-labelledby="preview-heading"
      className="border-t border-ink/10 bg-[#f1f2ee] xl:border-l xl:border-t-0"
    >
      <div className="sticky top-0 flex max-h-none flex-col xl:h-[calc(100dvh-4rem)]">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-ink/10 px-5 py-3 sm:px-7">
          <div>
            <h2
              id="preview-heading"
              className="text-sm font-semibold text-ink"
            >
              {exportReady ? "Final context package" : "Continuation preview"}
            </h2>
            <p className="mt-0.5 text-[10px] text-muted">
              {exportReady
                ? "Ready to copy into a new conversation"
                : "Updates as inheritance states change"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 text-xs font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Copy context
          </button>
        </div>

        {exportReady && (
          <div className="border-b border-accent/20 bg-accent-soft px-5 py-3 sm:px-7">
            <p className="flex items-center gap-2 text-xs font-medium text-accent">
              <span aria-hidden="true" className="size-1.5 bg-accent" />
              Final package ready to carry forward
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 p-5 sm:p-7 xl:overflow-y-auto">
          <pre className="min-h-[32rem] whitespace-pre-wrap break-words border border-ink/10 bg-surface p-5 font-mono text-[11px] leading-6 text-ink/80 selection:bg-accent-soft sm:p-6">
            {compiledContext}
          </pre>
        </div>

        <p
          role="status"
          aria-live="polite"
          className="min-h-9 border-t border-ink/10 px-5 py-2 text-xs text-accent sm:px-7"
        >
          {copyStatus}
        </p>
      </div>
    </aside>
  );
}
