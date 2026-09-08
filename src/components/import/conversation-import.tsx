"use client";

import { ChangeEvent, useRef, useState } from "react";

import { demoConversation } from "@/lib/mock/demo-conversation";

type Feedback =
  | { kind: "idle"; message: "" }
  | { kind: "error" | "success"; message: string };

export function ConversationImport() {
  const [conversation, setConversation] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({
    kind: "idle",
    message: "",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    if (!conversation.trim()) {
      setFeedback({
        kind: "error",
        message: "Paste a conversation or load the demo to continue.",
      });
      textareaRef.current?.focus();
      return;
    }

    setFeedback({
      kind: "success",
      message: "Conversation ready to refract.",
    });
  }

  function handleDemoLoad() {
    setConversation(demoConversation);
    setFeedback({ kind: "idle", message: "" });
    textareaRef.current?.focus();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      setConversation(text);
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
      <div className="group relative">
        <label htmlFor="conversation" className="sr-only">
          AI conversation transcript
        </label>
        <textarea
          ref={textareaRef}
          id="conversation"
          name="conversation"
          value={conversation}
          onChange={(event) => {
            setConversation(event.target.value);
            if (feedback.kind !== "idle") {
              setFeedback({ kind: "idle", message: "" });
            }
          }}
          aria-describedby="conversation-hint conversation-feedback"
          aria-invalid={feedback.kind === "error"}
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
            className="text-sm font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent/40 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
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
              className="sr-only"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-3 bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:min-w-32"
        >
          Refract
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
        role={feedback.kind === "error" ? "alert" : "status"}
        aria-live="polite"
        className="mt-3 min-h-6 text-sm"
      >
        {feedback.kind === "error" && (
          <p className="text-[#a44032]">{feedback.message}</p>
        )}
        {feedback.kind === "success" && (
          <p className="inline-flex items-center gap-2 font-medium text-accent">
            <span aria-hidden="true" className="size-1.5 bg-accent" />
            {feedback.message}
          </p>
        )}
      </div>

      <p id="conversation-hint" className="mt-1 text-xs leading-5 text-muted/80">
        Plain text only. Your transcript stays in this browser for this demo.
      </p>
    </div>
  );
}
