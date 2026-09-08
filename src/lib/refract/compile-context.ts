import { getContinuationIntentInstruction } from "@/lib/refract/continuation-intent";
import type {
  ContextItemSection,
  ContextSuggestion,
  ContinuationIntentSelection,
  Thought,
} from "@/types/refract";

type CompileContextInput = {
  targetThought: Thought;
  items: ContextSuggestion[];
  continuationIntent: ContinuationIntentSelection;
};

type OutputSection = {
  heading: string;
  sourceSections: ContextItemSection[];
  useBullets?: boolean;
};

const outputSections: OutputSection[] = [
  {
    heading: "Current objective",
    sourceSections: ["current_goal"],
  },
  {
    heading: "Global context",
    sourceSections: ["global_constraints"],
    useBullets: true,
  },
  {
    heading: "Relevant background",
    sourceSections: ["background_lineage"],
    useBullets: true,
  },
  {
    heading: "Established insights",
    sourceSections: ["core_insights"],
    useBullets: true,
  },
  {
    heading: "Related developments",
    sourceSections: ["related_ideas", "previous_hypotheses", "excluded"],
    useBullets: true,
  },
  {
    heading: "Open questions",
    sourceSections: ["open_questions"],
    useBullets: true,
  },
];

export function compileReconsideredItem(item: ContextSuggestion): string {
  return `A previous discussion proposed: ${item.content}`;
}

export function compileContext({
  targetThought,
  items,
  continuationIntent,
}: CompileContextInput): string {
  const intentInstruction = getContinuationIntentInstruction(
    continuationIntent,
  );
  const carriedItems = items.filter((item) => item.state === "carry");
  const reconsideredItems = items.filter(
    (item) => item.state === "reconsider",
  );

  const sections = outputSections.flatMap((section) => {
    const sectionItems = carriedItems.filter((item) =>
      section.sourceSections.includes(item.section),
    );

    if (sectionItems.length === 0) return [];

    const content = sectionItems
      .map((item) =>
        section.useBullets ? `- ${item.content}` : item.content,
      )
      .join("\n");

    return [`# ${section.heading}\n\n${content}`];
  });

  if (reconsideredItems.length > 0) {
    const reconsideredContent = reconsideredItems
      .map((item) => `- ${compileReconsideredItem(item)}`)
      .join("\n");

    const openQuestionsIndex = sections.findIndex((section) =>
      section.startsWith("# Open questions"),
    );

    sections.splice(
      openQuestionsIndex === -1 ? sections.length : openQuestionsIndex,
      0,
      `# Hypotheses to reconsider\n\n${reconsideredContent}\n\nThese are prior hypotheses or conclusions, not accepted truth. Re-evaluate them independently when relevant.`,
    );
  }

  const workingInstructions = [
    "Continue from the current working state rather than reconstructing the previous conversation.",
    "Treat carried goals, constraints, facts, and established insights as the current working context.",
    "Treat items under \"Hypotheses to reconsider\" as unsettled rather than accepted truth.",
    "Do not infer omitted details from unrelated branches that were intentionally dropped.",
    `Apply this continuation intent: ${intentInstruction}`,
  ].join("\n\n");

  return [
    `# Continue: ${targetThought.title}`,
    "You are continuing a line of thought from an earlier AI conversation. Use the context below as the working state for this discussion.",
    `# Continuation intent\n\n${intentInstruction}`,
    ...sections,
    `# Working instructions\n\n${workingInstructions}`,
  ].join("\n\n");
}
