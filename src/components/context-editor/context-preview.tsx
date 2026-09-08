"use client";

import { useEffect, useRef, useState } from "react";

type ContextDocumentProps = {
  compiledContext: string;
  thoughtTitle: string;
  intentLabel: string;
  tokenEstimate: number;
};

type ContextInspectionProps = ContextDocumentProps & {
  onClose: () => void;
};

type ContextExportProps = ContextDocumentProps & {
  fullConversationTokens: number;
  removedTokens: number;
  percentRemoved: number;
  hasReduction: boolean;
  onEdit: () => void;
};

const numberFormatter = new Intl.NumberFormat("en-US");

function useCopyContext(compiledContext: string) {
  const [copyStatus, setCopyStatus] = useState("");
  const clearStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
    };
  }, []);

  async function copyContext() {
    if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);

    try {
      await navigator.clipboard.writeText(compiledContext);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Could not copy. Select the text and copy it manually.");
    }

    clearStatusTimer.current = setTimeout(() => setCopyStatus(""), 3000);
  }

  return { copyContext, copyStatus };
}

function ContextDocument({ compiledContext }: { compiledContext: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words border border-ink/10 bg-surface p-5 font-mono text-[11px] leading-6 text-ink/80 selection:bg-accent-soft sm:p-7">
      {compiledContext}
    </pre>
  );
}

export function ContextInspection({
  compiledContext,
  thoughtTitle,
  intentLabel,
  tokenEstimate,
  onClose,
}: ContextInspectionProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { copyContext, copyStatus } = useCopyContext(compiledContext);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close full context"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-ink/25"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-inspection-heading"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-ink/10 bg-[#f1f2ee] shadow-[-12px_0_40px_rgba(23,32,29,0.08)]"
      >
        <div className="flex min-h-16 items-center justify-between gap-5 border-b border-ink/10 px-5 py-3 sm:px-7">
          <div className="min-w-0">
            <h2
              id="context-inspection-heading"
              className="text-sm font-semibold text-ink"
            >
              Full context
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-muted">
              {thoughtTitle} · {intentLabel} · {tokenEstimate} tokens est.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={copyContext}
              className="text-xs font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Copy context
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center border border-ink/10 bg-surface text-muted transition-colors hover:bg-accent-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Close full context"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="m3.5 3.5 7 7m0-7-7 7"
                  stroke="currentColor"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <ContextDocument compiledContext={compiledContext} />
        </div>
        <p
          role="status"
          aria-live="polite"
          className="min-h-9 border-t border-ink/10 px-5 py-2 text-xs text-accent sm:px-7"
        >
          {copyStatus}
        </p>
      </aside>
    </div>
  );
}

export function ContextExport({
  compiledContext,
  thoughtTitle,
  intentLabel,
  tokenEstimate,
  fullConversationTokens,
  removedTokens,
  percentRemoved,
  hasReduction,
  onEdit,
}: ContextExportProps) {
  const { copyContext, copyStatus } = useCopyContext(compiledContext);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
      <div className="flex flex-col gap-6 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-accent">
            <span aria-hidden="true" className="size-1.5 bg-accent" />
            Final package ready to carry forward
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Continue: {thoughtTitle}
          </h1>
          <p className="mt-3 text-xs text-muted">{intentLabel}</p>
          <div className="mt-5 border-y border-ink/10 py-3 font-mono">
            {hasReduction ? (
              <>
                <p className="text-[13px] font-medium text-ink sm:text-sm">
                  <span className="mr-1.5 text-[9px] font-normal uppercase tracking-[0.08em] text-muted">
                    Full conversation
                  </span>
                  {numberFormatter.format(fullConversationTokens)}
                  <span aria-hidden="true" className="mx-2 text-muted">
                    →
                  </span>
                  <span className="mr-1.5 text-[9px] font-normal uppercase tracking-[0.08em] text-muted">
                    Final handoff
                  </span>
                  {numberFormatter.format(tokenEstimate)} tokens est.
                </p>
                <p className="mt-1 text-[11px] font-medium text-accent">
                  ↓ {numberFormatter.format(removedTokens)} tokens removed ·{" "}
                  {percentRemoved}% reduction
                </p>
              </>
            ) : (
              <p className="text-[13px] font-medium text-ink">
                Final handoff is {numberFormatter.format(tokenEstimate)} tokens
                est.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-muted underline decoration-ink/15 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Edit context
          </button>
          <button
            type="button"
            onClick={copyContext}
            className="inline-flex h-11 items-center gap-3 bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
          >
            Copy context
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
            >
              <rect
                x="5"
                y="5"
                width="7"
                height="7"
                stroke="currentColor"
              />
              <path d="M3 10V3h7" stroke="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="min-h-8 py-2 text-xs text-accent"
      >
        {copyStatus}
      </p>

      <div className="mt-2">
        <ContextDocument compiledContext={compiledContext} />
      </div>
    </main>
  );
}
