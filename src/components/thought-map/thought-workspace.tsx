"use client";

import { useState } from "react";

import {
  demoSelectedThoughtId,
  demoThoughtDetails,
  demoThoughtEdges,
  demoThoughts,
} from "@/lib/mock/demo-analysis";

import { ThoughtDetail } from "./thought-detail";
import { ThoughtMap } from "./thought-map";

export function ThoughtWorkspace() {
  const [selectedThoughtId, setSelectedThoughtId] = useState(
    demoSelectedThoughtId,
  );
  const selectedThought =
    demoThoughts.find((thought) => thought.id === selectedThoughtId) ??
    demoThoughts[0];

  return (
    <main className="grid min-w-0 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_23rem] lg:overflow-hidden">
      <section
        aria-labelledby="thought-map-heading"
        className="flex min-w-0 flex-col bg-background"
      >
        <div className="flex min-h-16 items-center justify-between gap-5 border-b border-ink/10 px-5 py-3 sm:px-8">
          <div>
            <h1
              id="thought-map-heading"
              className="text-sm font-semibold tracking-[-0.01em] text-ink"
            >
              Thought map
            </h1>
            <p className="mt-0.5 hidden text-xs text-muted sm:block">
              Select a thought to inspect what it carries.
            </p>
          </div>
          <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            {demoThoughts.length} thoughts
            <span aria-hidden="true" className="mx-2 text-ink/20">
              ·
            </span>
            {demoThoughtEdges.length} relationships
          </p>
        </div>

        <div className="h-[34rem] min-h-0 w-full sm:h-[40rem] lg:h-auto lg:flex-1">
          <ThoughtMap
            thoughts={demoThoughts}
            relationships={demoThoughtEdges}
            selectedThoughtId={selectedThought.id}
            onSelectThought={setSelectedThoughtId}
          />
        </div>
      </section>

      <ThoughtDetail
        key={selectedThought.id}
        thought={selectedThought}
        detail={demoThoughtDetails[selectedThought.id]}
      />
    </main>
  );
}
