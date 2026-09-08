"use client";

import { useMemo, useState } from "react";

import {
  demoThoughtEdges,
  demoThoughts,
} from "@/lib/mock/demo-analysis";
import {
  demoGlobalContext,
  demoThoughtContextMetadata,
} from "@/lib/mock/demo-context";
import { buildContextPackage } from "@/lib/refract/build-context-package";
import { compileContext } from "@/lib/refract/compile-context";
import {
  calculatePercentRemoved,
  estimateTokens,
} from "@/lib/refract/estimate-tokens";
import type {
  ContextItemSection,
  ContextItemState,
  ContextPackage,
  Thought,
} from "@/types/refract";

import { ContextItem } from "./context-item";
import { ContextMetrics } from "./context-metrics";
import { ContextPreview } from "./context-preview";

type ContextEditorProps = {
  thought: Thought;
  conversation: string;
};

const sectionOrder: ContextItemSection[] = [
  "current_goal",
  "global_constraints",
  "background_lineage",
  "core_insights",
  "related_ideas",
  "previous_hypotheses",
  "open_questions",
  "excluded",
];

const sectionLabels: Record<ContextItemSection, string> = {
  current_goal: "Current goal",
  global_constraints: "Global constraints",
  background_lineage: "Background / lineage",
  core_insights: "Core insights",
  related_ideas: "Related ideas",
  previous_hypotheses: "Previous hypotheses to reconsider",
  open_questions: "Open questions",
  excluded: "Excluded by suggestion",
};

export function ContextEditor({
  thought,
  conversation,
}: ContextEditorProps) {
  const initialSuggestions = useMemo(
    () =>
      buildContextPackage({
        targetThoughtId: thought.id,
        thoughts: demoThoughts,
        edges: demoThoughtEdges,
        globalContext: demoGlobalContext,
        metadata: demoThoughtContextMetadata,
      }).items,
    [thought],
  );
  const [items, setItems] = useState(initialSuggestions);
  const [exportReady, setExportReady] = useState(false);

  const suggestedContext = useMemo(
    () => compileContext(thought, initialSuggestions),
    [initialSuggestions, thought],
  );
  const compiledContext = useMemo(
    () => compileContext(thought, items),
    [items, thought],
  );
  const contextPackage: ContextPackage = {
    targetThoughtId: thought.id,
    items,
    compiledContext,
  };

  const originalTokens = estimateTokens(conversation);
  const suggestedTokens = estimateTokens(suggestedContext);
  const finalTokens = estimateTokens(contextPackage.compiledContext);
  const percentRemoved = calculatePercentRemoved(originalTokens, finalTokens);

  function updateItemState(itemId: string, state: ContextItemState) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, state } : item,
      ),
    );
    setExportReady(false);
  }

  function resetSuggestions() {
    setItems(
      buildContextPackage({
        targetThoughtId: thought.id,
        thoughts: demoThoughts,
        edges: demoThoughtEdges,
        globalContext: demoGlobalContext,
        metadata: demoThoughtContextMetadata,
      }).items,
    );
    setExportReady(false);
  }

  return (
    <main className="min-w-0 xl:grid xl:h-[calc(100dvh-4rem)] xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)] xl:overflow-hidden">
      <section
        aria-labelledby="context-editor-heading"
        className="flex min-w-0 flex-col bg-background xl:min-h-0"
      >
        <div className="flex min-h-20 items-center justify-between gap-5 border-b border-ink/10 px-5 py-4 sm:px-8">
          <div>
            <p className="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-accent">
              Continuation context
            </p>
            <h1
              id="context-editor-heading"
              className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-ink"
            >
              What should {thought.title} inherit?
            </h1>
          </div>
          <button
            type="button"
            onClick={resetSuggestions}
            className="shrink-0 text-xs font-medium text-muted underline decoration-ink/15 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Reset to suggested
          </button>
        </div>

        <div className="min-h-0 flex-1 px-5 py-7 sm:px-8 xl:overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <div className="mb-7 flex items-start justify-between gap-6">
              <p className="max-w-xl text-sm leading-6 text-muted">
                Refract suggested the information that may matter for this
                continuation. Choose what travels—and how the next AI should
                interpret it.
              </p>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  {items.length} items
                </p>
                <p className="mt-1 text-[10px] text-muted">AI suggested</p>
              </div>
            </div>

            <div className="space-y-8">
              {sectionOrder.map((section) => {
                const sectionItems = items.filter(
                  (item) => item.section === section,
                );

                if (sectionItems.length === 0) return null;

                return (
                  <section key={section} aria-labelledby={`${section}-heading`}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <h2
                        id={`${section}-heading`}
                        className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink"
                      >
                        {sectionLabels[section]}
                      </h2>
                      <span className="text-[10px] text-muted">
                        {sectionItems.length}
                      </span>
                    </div>
                    <div>
                      {sectionItems.map((item) => (
                        <ContextItem
                          key={item.id}
                          item={item}
                          onStateChange={(state) =>
                            updateItemState(item.id, state)
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-ink/10 bg-background px-5 py-4 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <ContextMetrics
              originalTokens={originalTokens}
              suggestedTokens={suggestedTokens}
              finalTokens={finalTokens}
              percentRemoved={percentRemoved}
            />
            <button
              type="button"
              onClick={() => setExportReady(true)}
              className="mt-4 flex h-11 w-full items-center justify-between bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
            >
              {exportReady ? "Context ready" : "Continue with this context"}
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3 8h9.5m-3-3 3 3-3 3"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <ContextPreview
        compiledContext={contextPackage.compiledContext}
        exportReady={exportReady}
      />
    </main>
  );
}
