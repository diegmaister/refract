import type { Thought, ThoughtEdge } from "@/types/refract";

export type ThoughtDetailContent = {
  established: string[];
  openQuestions: string[];
};

export const demoConversationTitle = "Interview project brainstorm";
export const demoSelectedThoughtId = "refract";

export const demoThoughts: Thought[] = [
  {
    id: "interview-project",
    title: "Interview Project",
    summary:
      "Find a compelling project that can demonstrate end-to-end product and engineering thinking in an interview.",
    type: "question",
    status: "active",
    sourceMessageIds: ["message-1", "message-2", "message-3"],
  },
  {
    id: "aux",
    title: "AUX",
    summary:
      "Explore an AI-assisted music experience that understands intent and dynamically manages a listening queue.",
    type: "idea",
    status: "parked",
    sourceMessageIds: ["message-3", "message-4"],
  },
  {
    id: "rabbit-hole",
    title: "Rabbit Hole",
    summary:
      "Explore a learning interface designed around branching curiosity rather than a linear sequence of answers.",
    type: "research",
    status: "parked",
    sourceMessageIds: ["message-5", "message-6", "message-9"],
  },
  {
    id: "overkill",
    title: "Overkill",
    summary:
      "Model criteria, alternatives and decision confidence for people who obsessively research purchases.",
    type: "research",
    status: "parked",
    sourceMessageIds: ["message-7", "message-8"],
  },
  {
    id: "nonlinear-thinking",
    title: "Nonlinear Thinking",
    summary:
      "Human exploration naturally branches, while conventional chat interfaces flatten that process into a linear transcript.",
    type: "hypothesis",
    status: "active",
    sourceMessageIds: [
      "message-5",
      "message-6",
      "message-8",
      "message-9",
    ],
  },
  {
    id: "context-pollution",
    title: "Context Pollution",
    summary:
      "Long AI conversations accumulate unrelated branches, discarded assumptions and global constraints into one inherited context.",
    type: "fact",
    status: "active",
    sourceMessageIds: [
      "message-5",
      "message-7",
      "message-8",
      "message-9",
    ],
  },
  {
    id: "refract",
    title: "Refract",
    summary:
      "Recover the thought structure inside messy AI conversations and let users intentionally control what context the next conversation inherits.",
    type: "idea",
    status: "active",
    sourceMessageIds: [
      "message-5",
      "message-7",
      "message-9",
      "message-10",
    ],
  },
];

export const demoThoughtEdges: ThoughtEdge[] = [
  { source: "interview-project", target: "aux", relation: "branch_of" },
  {
    source: "interview-project",
    target: "rabbit-hole",
    relation: "branch_of",
  },
  {
    source: "interview-project",
    target: "overkill",
    relation: "branch_of",
  },
  {
    source: "rabbit-hole",
    target: "nonlinear-thinking",
    relation: "led_to",
  },
  {
    source: "nonlinear-thinking",
    target: "context-pollution",
    relation: "led_to",
  },
  {
    source: "context-pollution",
    target: "refract",
    relation: "evolved_into",
  },
  { source: "overkill", target: "refract", relation: "related_to" },
];

export const demoThoughtPositions: Record<
  Thought["id"],
  { x: number; y: number }
> = {
  "interview-project": { x: 0, y: 245 },
  aux: { x: 300, y: 40 },
  "rabbit-hole": { x: 300, y: 230 },
  overkill: { x: 300, y: 420 },
  "nonlinear-thinking": { x: 620, y: 200 },
  "context-pollution": { x: 930, y: 200 },
  refract: { x: 1240, y: 245 },
};

export const demoThoughtDetails: Record<Thought["id"], ThoughtDetailContent> = {
  "interview-project": {
    established: [
      "The project should demonstrate product judgment as well as implementation craft.",
      "A personally observed problem will make the concept easier to defend.",
      "The experience needs a clear end-to-end workflow for the interview demo.",
    ],
    openQuestions: [
      "Which direction reveals the strongest product insight?",
      "What can be made convincing within the available time?",
    ],
  },
  aux: {
    established: [
      "The interesting problem is shaping a room's mood, not generating music.",
      "Queue management could adapt to intent and live feedback.",
      "The concept is vivid but depends on difficult sensing assumptions.",
    ],
    openQuestions: [
      "How would the system infer the room's energy?",
      "Is there enough user control to build trust?",
    ],
  },
  "rabbit-hole": {
    established: [
      "Curiosity rarely follows a single linear sequence.",
      "A learning tool could preserve the original question while supporting detours.",
      "The structure of exploration matters more than a stream of answers.",
    ],
    openQuestions: [
      "How should branches reconnect to the original learning goal?",
      "When does exploration become distraction?",
    ],
  },
  overkill: {
    established: [
      "Purchasing research combines criteria, alternatives and uncertain judgments.",
      "People often revisit the same comparisons after losing their rationale.",
      "Decision confidence is as important as the final recommendation.",
    ],
    openQuestions: [
      "Which decisions are complex enough to justify structure?",
      "How should changing criteria affect earlier conclusions?",
    ],
  },
  "nonlinear-thinking": {
    established: [
      "Exploration naturally creates branches and returns.",
      "Linear transcripts preserve chronology but obscure conceptual structure.",
      "Users should not have to organize a graph while they are thinking.",
    ],
    openQuestions: [
      "What is the smallest useful representation of a thought?",
      "How much structure can be inferred without feeling prescriptive?",
    ],
  },
  "context-pollution": {
    established: [
      "Unrelated branches remain in the model's working context.",
      "Discarded assumptions can be inherited as if they were still valid.",
      "Global constraints may matter even when they look semantically unrelated.",
    ],
    openQuestions: [
      "How should relevance account for constraints and lineage?",
      "When should stale context be reconsidered instead of dropped?",
    ],
  },
  refract: {
    established: [
      "Long conversations contain multiple conceptual branches.",
      "Users should not manually maintain a graph while thinking.",
      "Context should be compiled for a specific continuation goal.",
      "Inherited conclusions need explicit user control.",
    ],
    openQuestions: [
      "How should relevance be calculated?",
      "Should the product remain a sidecar or become a full interface?",
      "How should context evolve over time?",
    ],
  },
};
