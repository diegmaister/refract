import type {
  ContinuationIntent,
  ContinuationIntentSelection,
} from "@/types/refract";

export type ContinuationIntentOption = {
  type: ContinuationIntent;
  title: string;
  description: string;
};

export const continuationIntentOptions: ContinuationIntentOption[] = [
  {
    type: "continue",
    title: "Continue from here",
    description:
      "Continue developing this thought from its current state without restarting the discussion.",
  },
  {
    type: "open_questions",
    title: "Work through open questions",
    description:
      "Focus the next conversation on the unresolved questions carried in this package.",
  },
  {
    type: "challenge",
    title: "Challenge the current thinking",
    description:
      "Critically test assumptions and explore alternatives instead of simply continuing the existing direction.",
  },
  {
    type: "standby",
    title: "Read and standby",
    description:
      "Load the context but do not advance the discussion until you give another instruction.",
  },
  {
    type: "custom",
    title: "Custom instruction",
    description:
      "Tell the next AI exactly how you want it to use this context.",
  },
];

export function getContinuationIntentLabel(
  intent: ContinuationIntentSelection,
): string {
  return (
    continuationIntentOptions.find((option) => option.type === intent.type)
      ?.title ?? "Custom instruction"
  );
}

export function getContinuationIntentInstruction(
  intent: ContinuationIntentSelection,
): string {
  switch (intent.type) {
    case "continue":
      return "Continue from the current objective using the inherited context as the working state. Do not re-explain or restart ideas that are already established.";
    case "open_questions":
      return "Use the inherited context as established working state and focus primarily on the open questions. Work through them rather than restarting the broader discussion.";
    case "challenge":
      return "Use the inherited context as background, but critically evaluate its assumptions, decisions, and hypotheses. Surface weaknesses and consider credible alternative directions rather than simply reinforcing the current approach.";
    case "standby":
      return "Read and internalize the inherited context. Do not continue the analysis, answer the open questions, propose solutions or next steps, or introduce new directions. Briefly acknowledge that the context is loaded, then wait for the user's next message.";
    case "custom": {
      const customInstruction = intent.customInstruction?.trim();

      if (!customInstruction) {
        throw new Error("A custom continuation intent cannot be empty.");
      }

      return customInstruction;
    }
  }
}
