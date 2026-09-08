"use client";

import { useState } from "react";

import type { ThoughtDetailContent } from "@/lib/mock/demo-analysis";
import type { Thought } from "@/types/refract";

type ThoughtDetailProps = {
  thought: Thought;
  detail: ThoughtDetailContent;
};

const typeLabels: Record<Thought["type"], string> = {
  idea: "Idea",
  question: "Question",
  decision: "Decision",
  constraint: "Constraint",
  fact: "Insight",
  hypothesis: "Hypothesis",
  research: "Research",
  open_question: "Open question",
};

export function ThoughtDetail({ thought, detail }: ThoughtDetailProps) {
  const [contextMessage, setContextMessage] = useState("");

  return (
    <aside
      aria-labelledby="thought-detail-title"
      className="flex min-h-[640px] flex-col border-t border-ink/10 bg-surface lg:min-h-0 lg:border-l lg:border-t-0"
    >
      <div className="flex-1 px-5 py-6 sm:px-8 lg:overflow-y-auto lg:px-7">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          Selected thought
        </p>
        <h2
          id="thought-detail-title"
          className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink"
        >
          {thought.title}
        </h2>

        <dl className="mt-5 flex gap-6 border-b border-ink/10 pb-5 text-xs">
          <div>
            <dt className="text-muted">Type</dt>
            <dd className="mt-1 font-medium text-ink">
              {typeLabels[thought.type]}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-medium capitalize text-ink">
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  thought.status === "active" ? "bg-accent" : "bg-ink/25"
                }`}
              />
              {thought.status}
            </dd>
          </div>
        </dl>

        <section className="mt-6" aria-labelledby="summary-heading">
          <h3
            id="summary-heading"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-ink"
          >
            Summary
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted">{thought.summary}</p>
        </section>

        <section className="mt-7" aria-labelledby="established-heading">
          <h3
            id="established-heading"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-ink"
          >
            What was established
          </h3>
          <ul className="mt-3 space-y-3">
            {detail.established.map((item) => (
              <li
                key={item}
                className="grid grid-cols-[0.65rem_1fr] gap-2 text-sm leading-5 text-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.45rem] size-1 bg-accent/70"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7" aria-labelledby="questions-heading">
          <h3
            id="questions-heading"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-ink"
          >
            Open questions
          </h3>
          <ol className="mt-3 space-y-3">
            {detail.openQuestions.map((question, index) => (
              <li
                key={question}
                className="grid grid-cols-[1.15rem_1fr] gap-2 text-sm leading-5 text-muted"
              >
                <span className="font-mono text-[9px] text-ink/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-7 border-t border-ink/10 pt-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink">
              {thought.sourceMessageIds.length} source excerpts
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              Inspection coming next
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/10 bg-background/60 p-5 sm:px-8 lg:px-7">
        <button
          type="button"
          onClick={() => setContextMessage("Context builder coming next.")}
          className="flex h-11 w-full items-center justify-between bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
        >
          Build context
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
        <p
          role="status"
          aria-live="polite"
          className="mt-2 min-h-5 text-xs text-accent"
        >
          {contextMessage}
        </p>
      </div>
    </aside>
  );
}
