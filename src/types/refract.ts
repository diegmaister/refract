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
