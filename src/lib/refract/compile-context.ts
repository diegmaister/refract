import type {
  ContextItemCategory,
  ContextItemSection,
  ContextSuggestion,
  Thought,
} from "@/types/refract";

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

const sectionHeadings: Record<ContextItemSection, string> = {
  current_goal: "Current goal",
  global_constraints: "Global constraints",
  background_lineage: "Background and lineage",
  core_insights: "Core insights",
  related_ideas: "Related ideas",
  previous_hypotheses: "Previous hypotheses to reconsider",
  open_questions: "Open questions",
  excluded: "Reintroduced context",
};

const reconsiderLabels: Record<ContextItemCategory, string> = {
  goal: "goal",
  constraint: "constraint",
  fact: "claim",
  insight: "insight",
  decision: "decision",
  hypothesis: "hypothesis",
  open_question: "question",
};

export function compileReconsideredItem(item: ContextSuggestion): string {
  return `A previous discussion proposed: ${item.content} Treat this as a prior ${reconsiderLabels[item.category]} rather than an accepted conclusion, and independently reconsider it.`;
}

export function compileContext(
  targetThought: Thought,
  items: ContextSuggestion[],
): string {
  const includedItems = items.filter((item) => item.state !== "drop");
  const sections = sectionOrder.flatMap((section) => {
    const sectionItems = includedItems.filter(
      (item) => item.section === section,
    );

    if (sectionItems.length === 0) return [];

    const content = sectionItems.map((item) => {
      const compiledItem =
        item.state === "reconsider"
          ? compileReconsideredItem(item)
          : item.content;

      return section === "current_goal" ? compiledItem : `- ${compiledItem}`;
    });

    return [`# ${sectionHeadings[section]}\n\n${content.join("\n")}`];
  });

  return `# Continue: ${targetThought.title}\n\n${sections.join("\n\n")}`;
}
