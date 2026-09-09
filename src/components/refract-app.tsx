"use client";

import { useState } from "react";

import { ContextEditor } from "@/components/context-editor/context-editor";
import { ConversationImport } from "@/components/import/conversation-import";
import { ThoughtWorkspace } from "@/components/thought-map/thought-workspace";
import type { ImportedConversation } from "@/lib/importers/conversation-importer";
import {
  countMessageContentCharacters,
  DIRECT_ANALYSIS_MAX_CHARS,
} from "@/lib/refract/analysis-limits";
import type { RefractAnalysis } from "@/types/refract";

type AppView = "import" | "workspace" | "context";

const steps = [
  {
    number: "01",
    title: "Import",
    description: "Use a share link or paste a conversation.",
  },
  {
    number: "02",
    title: "Refract",
    description: "Recover the ideas and relationships inside it.",
  },
  {
    number: "03",
    title: "Continue",
    description: "Carry only the context that matters.",
  },
];

function ProductMark() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center border border-accent/30 bg-accent-soft"
      >
        <span className="size-1.5 bg-accent" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em]">
        Refract
      </span>
    </div>
  );
}

function getApiErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return undefined;
  }

  const error = payload.error;
  if (!error || typeof error !== "object" || !("message" in error)) {
    return undefined;
  }

  return typeof error.message === "string" ? error.message : undefined;
}

export function RefractApp() {
  const [view, setView] = useState<AppView>("import");
  const [conversation, setConversation] = useState("");
  const [importedMessages, setImportedMessages] = useState<
    ImportedConversation["messages"] | null
  >(null);
  const [analysis, setAnalysis] = useState<RefractAnalysis | null>(null);
  const [selectedThoughtId, setSelectedThoughtId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingLargeConversation, setIsAnalyzingLargeConversation] =
    useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const selectedThought =
    analysis?.thoughts.find((thought) => thought.id === selectedThoughtId) ??
    analysis?.thoughts[0];

  async function handleRefract(importedConversation?: ImportedConversation) {
    const normalizedMessages =
      importedConversation?.messages ?? importedMessages;
    const isLargeConversation = normalizedMessages
      ? countMessageContentCharacters(normalizedMessages) >
        DIRECT_ANALYSIS_MAX_CHARS
      : conversation.length > DIRECT_ANALYSIS_MAX_CHARS;

    if (importedConversation) {
      setImportedMessages(importedConversation.messages);
    }
    setIsAnalyzing(true);
    setIsAnalyzingLargeConversation(isLargeConversation);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          normalizedMessages
            ? { messages: normalizedMessages }
            : { transcript: conversation },
        ),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            "Refract could not analyze this conversation. Please try again.",
        );
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("analysis" in payload)
      ) {
        throw new Error("Refract received an invalid analysis. Please try again.");
      }

      const nextAnalysis = payload.analysis as RefractAnalysis;
      const firstThought = nextAnalysis.thoughts[0];

      if (!firstThought) {
        throw new Error("No continuable thoughts were found in this conversation.");
      }

      setAnalysis(nextAnalysis);
      setSelectedThoughtId(firstThought.id);
      setView("workspace");
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Refract could not analyze this conversation. Please try again.",
      );
      setView("import");
    } finally {
      setIsAnalyzing(false);
      setIsAnalyzingLargeConversation(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-ink/10 bg-background">
        <div
          className={`mx-auto flex h-16 w-full items-center px-5 sm:px-8 ${
            view === "import" ? "max-w-6xl" : "max-w-none"
          }`}
        >
          <ProductMark />

          {view === "import" ? (
            <p className="ml-auto hidden text-xs tracking-[0.02em] text-muted sm:block">
              Context engineering for AI conversations
            </p>
          ) : view === "workspace" ? (
            <>
              <div className="mx-auto hidden items-center gap-2 text-sm sm:flex">
                <span className="text-muted">Conversation</span>
                <span aria-hidden="true" className="text-ink/20">
                  /
                </span>
                <span className="font-medium text-ink">
                  {analysis?.conversationTitle ?? "Conversation"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setView("import")}
                className="ml-auto text-sm font-medium text-muted underline decoration-ink/15 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:ml-0"
              >
                New conversation
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto hidden min-w-0 items-center gap-2 text-sm sm:flex">
                <span className="text-muted">Conversation</span>
                <span aria-hidden="true" className="text-ink/20">
                  /
                </span>
                <span className="text-muted">
                  {analysis?.conversationTitle ?? "Conversation"}
                </span>
                <span aria-hidden="true" className="text-ink/20">
                  /
                </span>
                <span className="font-medium text-ink">
                  {selectedThought?.title ?? "Thought"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setView("workspace")}
                className="ml-auto shrink-0 text-sm font-medium text-muted underline decoration-ink/15 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:ml-0"
              >
                Back to thought map
              </button>
            </>
          )}
        </div>
      </header>

      {view === "import" ? (
        <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <section aria-labelledby="import-heading">
            <div className="mb-8 max-w-2xl">
              <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                New refraction
              </p>
              <h1
                id="import-heading"
                className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-ink"
              >
                Refract your conversation
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted sm:text-base">
                Import a ChatGPT conversation or paste any AI transcript.
                Refract will reconstruct the ideas inside it, so you can decide
                what should carry forward.
              </p>
            </div>

            <ConversationImport
              conversation={conversation}
              onConversationChange={(nextConversation) => {
                setConversation(nextConversation);
                setImportedMessages(null);
                setAnalysisError(null);
              }}
              onRefract={handleRefract}
              isAnalyzing={isAnalyzing}
              isAnalyzingLargeConversation={isAnalyzingLargeConversation}
              analysisError={analysisError}
            />
          </section>

          <section
            aria-labelledby="how-it-works-heading"
            className="mt-16 border-t border-ink/10 pt-7 sm:mt-20"
          >
            <h2
              id="how-it-works-heading"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted"
            >
              How it works
            </h2>
            <ol className="mt-6 grid gap-7 sm:grid-cols-3 sm:gap-10">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="grid grid-cols-[2rem_1fr] gap-2"
                >
                  <span className="pt-0.5 font-mono text-[10px] text-accent">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </main>
      ) : view === "workspace" && analysis && selectedThought ? (
        <ThoughtWorkspace
          thoughts={analysis.thoughts}
          relationships={analysis.edges}
          metadata={analysis.thoughtContextMetadata}
          selectedThoughtId={selectedThought.id}
          messageCount={analysis.messages.length}
          uncertainRoleCount={
            analysis.messages.filter((message) => message.role === "unknown")
              .length
          }
          onSelectThought={setSelectedThoughtId}
          onBuildContext={() => setView("context")}
        />
      ) : analysis && selectedThought ? (
        <ContextEditor
          key={`${analysis.conversationTitle}:${selectedThought.id}`}
          thought={selectedThought}
          conversation={conversation}
          thoughts={analysis.thoughts}
          edges={analysis.edges}
          globalContext={analysis.globalContext}
          metadata={analysis.thoughtContextMetadata}
        />
      ) : null}
    </div>
  );
}
