"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  importedConversationSchema,
  type ImportedConversation,
} from "@/lib/importers/conversation-importer";
import { isSupportedChatGptShareUrl } from "@/lib/importers/chatgpt-share-url";
import { demoConversation } from "@/lib/mock/demo-conversation";

type Feedback =
  | { kind: "idle"; message: "" }
  | { kind: "error"; message: string };

type ConversationImportProps = {
  conversation: string;
  onConversationChange: (conversation: string) => void;
  onRefract: (importedConversation?: ImportedConversation) => Promise<void>;
  isAnalyzing: boolean;
  isAnalyzingLargeConversation: boolean;
  analysisError: string | null;
};

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

export function ConversationImport({
  conversation,
  onConversationChange,
  onRefract,
  isAnalyzing,
  isAnalyzingLargeConversation,
  analysisError,
}: ConversationImportProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<Feedback>({
    kind: "idle",
    message: "",
  });
  const [feedback, setFeedback] = useState<Feedback>({
    kind: "idle",
    message: "",
  });
  const shareInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const manualError =
    feedback.kind === "error" ? feedback.message : analysisError;
  const normalizedShareUrl = shareUrl.trim();
  const shareUrlIsValid = isSupportedChatGptShareUrl(normalizedShareUrl);
  const shareValidationError =
    normalizedShareUrl && !shareUrlIsValid
      ? "Enter a public chatgpt.com/share link."
      : shareFeedback.kind === "error"
        ? shareFeedback.message
        : null;
  const isBusy = isImporting || isAnalyzing;

  async function handleShareSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!shareUrlIsValid) {
      setShareFeedback({
        kind: "error",
        message: "Enter a public chatgpt.com/share link.",
      });
      shareInputRef.current?.focus();
      return;
    }

    setIsImporting(true);
    setShareFeedback({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/import/chatgpt-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedShareUrl }),
      });
      const payload: unknown = await response.json();
      const importedConversation = importedConversationSchema.safeParse(
        payload && typeof payload === "object" && "conversation" in payload
          ? payload.conversation
          : undefined,
      );

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            "We couldn't import this share link. You can still paste the conversation below.",
        );
      }

      if (!importedConversation.success) {
        throw new Error("The imported conversation had an unexpected format.");
      }

      onConversationChange(importedConversation.data.rawTranscript);
      setIsImporting(false);
      await onRefract(importedConversation.data);
    } catch (error) {
      setShareFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't import this share link. You can still paste the conversation below.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  function handleSubmit() {
    if (!conversation.trim()) {
      setFeedback({
        kind: "error",
        message: "Paste a conversation or load the demo to continue.",
      });
      textareaRef.current?.focus();
      return;
    }

    void onRefract();
  }

  function handleDemoLoad() {
    onConversationChange(demoConversation);
    setFeedback({ kind: "idle", message: "" });
    textareaRef.current?.focus();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      onConversationChange(text);
      setFeedback({ kind: "idle", message: "" });
      textareaRef.current?.focus();
    } catch {
      setFeedback({
        kind: "error",
        message: "That file could not be read. Try a different .txt or .md file.",
      });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div>
      <form onSubmit={handleShareSubmit} noValidate>
        <label
          htmlFor="chatgpt-share-url"
          className="text-sm font-semibold text-ink"
        >
          Import a conversation
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            ref={shareInputRef}
            id="chatgpt-share-url"
            name="chatgpt-share-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={shareUrl}
            disabled={isBusy}
            onChange={(event) => {
              setShareUrl(event.target.value);
              if (shareFeedback.kind !== "idle") {
                setShareFeedback({ kind: "idle", message: "" });
              }
            }}
            aria-describedby="share-url-hint share-url-feedback"
            aria-invalid={Boolean(shareValidationError)}
            placeholder="Paste ChatGPT share link…"
            className="h-12 min-w-0 flex-1 border border-ink/15 bg-surface px-4 text-[15px] text-ink shadow-[0_1px_0_rgba(23,32,29,0.02),0_8px_28px_rgba(23,32,29,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/55 hover:border-ink/25 focus:border-accent/70 focus:shadow-[0_0_0_3px_rgba(40,102,87,0.10)] disabled:cursor-wait disabled:opacity-65"
          />
          <button
            type="submit"
            disabled={!shareUrlIsValid || isBusy}
            aria-busy={isImporting}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-3 bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:bg-ink/45 sm:min-w-44"
          >
            {isImporting
              ? "Importing conversation…"
              : isAnalyzing
                ? isAnalyzingLargeConversation
                  ? "Refracting large conversation…"
                  : "Refracting conversation…"
                : "Import & Refract"}
            {!isBusy && (
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
            )}
          </button>
        </div>

        <div
          id="share-url-feedback"
          role={shareValidationError ? "alert" : "status"}
          aria-live="polite"
          className="mt-2 min-h-5 text-xs"
        >
          {shareValidationError && (
            <p className="text-[#a44032]">{shareValidationError}</p>
          )}
          {isImporting && (
            <p className="font-medium text-muted">Importing conversation…</p>
          )}
        </div>

        <p id="share-url-hint" className="mt-1 text-xs leading-5 text-muted/80">
          ChatGPT shared links can be viewed by anyone with the link. You can
          delete the share after importing.
        </p>
      </form>

      <div className="my-7 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/75">
          or paste the conversation manually
        </span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="group relative">
        <label htmlFor="conversation" className="sr-only">
          AI conversation transcript
        </label>
        <textarea
          ref={textareaRef}
          id="conversation"
          name="conversation"
          value={conversation}
          disabled={isBusy}
          onChange={(event) => {
            onConversationChange(event.target.value);
            if (feedback.kind !== "idle") {
              setFeedback({ kind: "idle", message: "" });
            }
          }}
          aria-describedby="conversation-hint conversation-feedback"
          aria-invalid={Boolean(manualError)}
          placeholder={`User: I need an idea for my interview project...\n\nAssistant: What kinds of problems are you interested in?\n\nUser: I've been thinking about...`}
          spellCheck="true"
          className="min-h-80 w-full resize-y border border-ink/15 bg-surface px-5 py-5 text-[15px] leading-7 text-ink shadow-[0_1px_0_rgba(23,32,29,0.02),0_10px_35px_rgba(23,32,29,0.035)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/50 hover:border-ink/25 focus:border-accent/70 focus:shadow-[0_0_0_3px_rgba(40,102,87,0.10),0_10px_35px_rgba(23,32,29,0.04)] sm:min-h-96 sm:px-6 sm:py-6"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 size-4 border-b border-r border-ink/20 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-h-10 flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={handleDemoLoad}
            disabled={isBusy}
            className="text-sm font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent/40 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50"
          >
            Load demo conversation
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted transition-colors hover:text-ink focus-within:rounded-sm focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-accent">
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
            >
              <path
                d="M5.25 7.75 8.9 4.1a2.12 2.12 0 0 1 3 3L7.35 11.65a3.12 3.12 0 0 1-4.42-4.42l4.2-4.2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Upload .txt or .md
            <input
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleFileChange}
              disabled={isBusy}
              className="sr-only"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy}
          aria-busy={isAnalyzing}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-3 bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-wait disabled:bg-ink/55 sm:min-w-32"
        >
          {isAnalyzing
            ? isAnalyzingLargeConversation
              ? "Refracting large conversation…"
              : "Refracting…"
            : analysisError
              ? "Retry"
              : "Refract"}
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

      <div
        id="conversation-feedback"
        role={manualError ? "alert" : "status"}
        aria-live="polite"
        className="mt-3 min-h-6 text-sm"
      >
        {manualError && <p className="text-[#a44032]">{manualError}</p>}
        {isAnalyzing && (
          <div className="text-muted">
            <p className="font-medium text-ink">
              {isAnalyzingLargeConversation
                ? "Refracting a large conversation…"
                : "Refracting conversation…"}
            </p>
            <p className="mt-1 text-xs">
              {isAnalyzingLargeConversation
                ? "Recovering recurring thoughts across the full chat."
                : "Recovering recurring thoughts, constraints, and relationships."}
            </p>
          </div>
        )}
      </div>

      <p id="conversation-hint" className="mt-1 text-xs leading-5 text-muted/80">
        Plain text only. Analysis uses your configured OpenAI account.
      </p>
    </div>
  );
}
