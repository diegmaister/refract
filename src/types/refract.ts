export type Message = {
  id: string;
  index: number;
  role: "user" | "assistant";
  content: string;
};

export type ThoughtType =
  | "idea"
  | "question"
  | "decision"
  | "constraint"
  | "fact"
  | "hypothesis"
  | "research"
  | "open_question";

export type ThoughtStatus = "active" | "parked" | "discarded" | "resolved";

export type Thought = {
  id: string;
  title: string;
  summary: string;
  type: ThoughtType;
  status: ThoughtStatus;
  sourceMessageIds: string[];
};

export type EdgeType =
  | "led_to"
  | "related_to"
  | "depends_on"
  | "contradicts"
  | "evolved_into"
  | "branch_of";

export type ThoughtEdge = {
  source: string;
  target: string;
  relation: EdgeType;
};

export type ContextItemState = "carry" | "drop" | "reconsider";

export type ContextItemCategory =
  | "goal"
  | "constraint"
  | "fact"
  | "insight"
  | "decision"
  | "hypothesis"
  | "open_question";

export type ContextItem = {
  id: string;
  content: string;
  category: ContextItemCategory;
  sourceMessageIds: string[];
  inclusionReason: string;
  state: ContextItemState;
};

export type ContextItemSection =
  | "current_goal"
  | "global_constraints"
  | "background_lineage"
  | "core_insights"
  | "related_ideas"
  | "previous_hypotheses"
  | "open_questions"
  | "excluded";

export type ContextSuggestion = ContextItem & {
  title: string;
  section: ContextItemSection;
};

export type ContextPackage = {
  targetThoughtId: string;
  items: ContextItem[];
  compiledContext: string;
};

export type ContextSeed = {
  id: string;
  title: string;
  content: string;
  category: ContextItemCategory;
  sourceMessageIds: string[];
  sourceThoughtId?: string;
};

export type GlobalContext = {
  goals: ContextSeed[];
  constraints: ContextSeed[];
  facts: ContextSeed[];
  preferences: ContextSeed[];
};

export type ContextSeedSelection = {
  seed: ContextSeed;
  section: ContextItemSection;
  state: ContextItemState;
  inclusionReason?: string;
};

export type ThoughtContextMetadata = {
  thoughtId: string;
  globalContextItemIds: string[];
  context: ContextSeedSelection[];
};

export type SuggestedContextPackage = Omit<ContextPackage, "items"> & {
  items: ContextSuggestion[];
};
