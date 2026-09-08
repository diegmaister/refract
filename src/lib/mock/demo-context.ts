import type {
  ContextItemCategory,
  ContextItemSection,
  ContextItemState,
  ContextSeed,
  ContextSeedSelection,
  GlobalContext,
  ThoughtContextMetadata,
} from "@/types/refract";

function seed(
  id: string,
  title: string,
  content: string,
  category: ContextItemCategory,
  sourceMessageIds: string[],
  sourceThoughtId?: string,
): ContextSeed {
  return {
    id,
    title,
    content,
    category,
    sourceMessageIds,
    sourceThoughtId,
  };
}

function select(
  contextSeed: ContextSeed,
  section: ContextItemSection,
  state: ContextItemState = "carry",
  inclusionReason?: string,
): ContextSeedSelection {
  return { seed: contextSeed, section, state, inclusionReason };
}

const globalProjectGoal = seed(
  "global-project-goal",
  "Interview project framing",
  "Build a compelling interview project grounded in a real, defensible user problem.",
  "goal",
  ["message-1", "message-2"],
);
const productThinkingConstraint = seed(
  "global-product-thinking",
  "Product-thinking requirement",
  "The project should demonstrate product thinking, not only polished UI.",
  "constraint",
  ["message-1", "message-2"],
);
const engineeringConstraint = seed(
  "global-engineering",
  "End-to-end engineering requirement",
  "The project should demonstrate an end-to-end engineering workflow.",
  "constraint",
  ["message-1", "message-2"],
);
const scopeConstraint = seed(
  "global-scope",
  "Achievable demo scope",
  "Scope must remain achievable within the tight interview-demo timeline.",
  "constraint",
  ["message-1", "message-2"],
);

export const demoGlobalContext: GlobalContext = {
  goals: [globalProjectGoal],
  constraints: [
    productThinkingConstraint,
    engineeringConstraint,
    scopeConstraint,
  ],
  facts: [],
  preferences: [],
};

const allGlobalContextIds = [
  globalProjectGoal.id,
  productThinkingConstraint.id,
  engineeringConstraint.id,
  scopeConstraint.id,
];
const projectConstraintIds = [
  productThinkingConstraint.id,
  engineeringConstraint.id,
  scopeConstraint.id,
];

const interviewGoal = seed(
  "interview-goal",
  "Choose a compelling project direction",
  "Identify a focused project direction that demonstrates strong product judgment and implementation craft in an interview.",
  "goal",
  ["message-1", "message-2"],
  "interview-project",
);
const groundedProblem = seed(
  "grounded-problem",
  "Ground the idea in observed behavior",
  "A personally experienced problem will make the product decisions easier to explain and defend.",
  "decision",
  ["message-1", "message-2"],
  "interview-project",
);
const clearWorkflow = seed(
  "clear-workflow",
  "Show an end-to-end workflow",
  "The interview prototype needs a clear user journey rather than an isolated technical demonstration.",
  "decision",
  ["message-1", "message-2"],
  "interview-project",
);

const auxGoal = seed(
  "aux-goal",
  "AUX product direction",
  "Explore an AI-assisted music experience that helps someone shape listening intent and dynamically manage a queue.",
  "goal",
  ["message-3", "message-4"],
  "aux",
);
const auxMoodInsight = seed(
  "aux-mood-insight",
  "Shape mood instead of generating music",
  "The interesting user problem may be shaping a room's mood rather than generating music.",
  "insight",
  ["message-3", "message-4"],
  "aux",
);
const auxQueueInsight = seed(
  "aux-queue-insight",
  "Dynamic queue management",
  "Intent-aware queue management may be more valuable than a generic AI DJ wrapper.",
  "insight",
  ["message-3", "message-4"],
  "aux",
);
const auxQueueHypothesis = seed(
  "aux-queue-hypothesis",
  "Queue management as the core problem",
  "Queue management is the core user problem AUX should solve.",
  "hypothesis",
  ["message-3", "message-4"],
  "aux",
);
const auxBehaviorQuestion = seed(
  "aux-behavior-question",
  "Core listening behavior",
  "What is the core user behavior AUX should support: setting intent, responding to a room, or directly shaping the queue?",
  "open_question",
  ["message-3", "message-4"],
  "aux",
);
const auxCapabilitiesQuestion = seed(
  "aux-capabilities-question",
  "Required capabilities",
  "Which music, feedback, and sensing capabilities would a convincing AUX prototype actually require?",
  "open_question",
  ["message-3", "message-4"],
  "aux",
);

const rabbitGoal = seed(
  "rabbit-goal",
  "Rabbit Hole product direction",
  "Explore a nonlinear learning experience that lets people follow branching curiosity without losing their original question.",
  "goal",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const curiosityBranches = seed(
  "curiosity-branches",
  "Curiosity branches naturally",
  "Curiosity rarely follows a single linear sequence.",
  "insight",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const preserveOriginalQuestion = seed(
  "preserve-original-question",
  "Preserve the original question",
  "A learning experience should preserve the original question while allowing useful detours.",
  "insight",
  ["message-5"],
  "rabbit-hole",
);
const explorationStructure = seed(
  "exploration-structure",
  "Structure over answer streams",
  "The structure of exploration can be more useful than simply streaming a sequence of answers.",
  "insight",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const reconnectQuestion = seed(
  "reconnect-question",
  "Reconnect branches",
  "How should exploratory branches reconnect to the original learning question?",
  "open_question",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const distractionQuestion = seed(
  "distraction-question",
  "Exploration or distraction",
  "When does productive exploration become distraction?",
  "open_question",
  ["message-5", "message-6"],
  "rabbit-hole",
);

const overkillGoal = seed(
  "overkill-goal",
  "Overkill product direction",
  "Explore structured purchasing research that preserves criteria, rationale, and decision confidence.",
  "goal",
  ["message-7", "message-8"],
  "overkill",
);
const comparisonStructure = seed(
  "comparison-structure",
  "Structure comparisons explicitly",
  "Explicit comparison structure can be more useful than another generic purchasing chat.",
  "insight",
  ["message-7", "message-8"],
  "overkill",
);
const weightedCriteria = seed(
  "weighted-criteria",
  "Make criteria explicit",
  "Weighted criteria could make changing priorities and tradeoffs visible during evaluation.",
  "hypothesis",
  ["message-7"],
  "overkill",
);
const stoppingProblem = seed(
  "stopping-problem",
  "Knowing when to stop",
  "Knowing when research is sufficient is part of the purchasing problem, not merely a final calculation.",
  "insight",
  ["message-7"],
  "overkill",
);
const explicitDecisionState = seed(
  "explicit-decision-state",
  "Make decision state explicit",
  "Criteria, rejected options, and decision rationale should be explicit instead of buried in conversational history.",
  "decision",
  ["message-7", "message-8"],
  "overkill",
);
const purchasingBreadthQuestion = seed(
  "purchasing-breadth-question",
  "Breadth of the problem",
  "Is purchasing research broad enough to support a compelling standalone product?",
  "open_question",
  ["message-7"],
  "overkill",
);
const externalResearchQuestion = seed(
  "external-research-question",
  "External research burden",
  "How much external product research would Overkill need to become genuinely useful?",
  "open_question",
  ["message-7"],
  "overkill",
);
const confidenceQuestion = seed(
  "confidence-question",
  "Confidence and stopping criteria",
  "How should Overkill communicate decision confidence and help someone stop researching?",
  "open_question",
  ["message-7", "message-8"],
  "overkill",
);

const nonlinearGoal = seed(
  "nonlinear-goal",
  "Nonlinear Thinking direction",
  "Explore the broader idea that human thinking branches while conventional chat remains linear.",
  "goal",
  ["message-5", "message-6", "message-8"],
  "nonlinear-thinking",
);
const humanExplorationBranches = seed(
  "human-exploration-branches",
  "Human exploration branches",
  "Human exploration naturally creates branches, detours, and returns.",
  "insight",
  ["message-5", "message-6"],
  "nonlinear-thinking",
);
const linearTranscriptsHideStructure = seed(
  "linear-transcripts-hide-structure",
  "Linear transcripts hide structure",
  "Chronological transcripts preserve messages but obscure the conceptual structure connecting them.",
  "insight",
  ["message-6", "message-8"],
  "nonlinear-thinking",
);
const primaryInterfaceQuestion = seed(
  "primary-interface-question",
  "Primary interface",
  "What should the primary interface for nonlinear thinking be?",
  "open_question",
  ["message-6"],
  "nonlinear-thinking",
);
const visibleStructureQuestion = seed(
  "visible-structure-question",
  "Visible structure",
  "How much inferred structure should users see while they are thinking?",
  "open_question",
  ["message-6"],
  "nonlinear-thinking",
);

const pollutionGoal = seed(
  "pollution-goal",
  "Context Pollution direction",
  "Understand how long AI conversations accumulate irrelevant, stale, or misleading inherited context.",
  "goal",
  ["message-7", "message-8", "message-9"],
  "context-pollution",
);
const unrelatedBranchesPersist = seed(
  "unrelated-branches-persist",
  "Unrelated branches persist",
  "Unrelated conversational branches remain in the model's working context.",
  "insight",
  ["message-7", "message-8"],
  "context-pollution",
);
const discardedAssumptionsPersist = seed(
  "discarded-assumptions-persist",
  "Discarded assumptions persist",
  "Rejected or stale assumptions may continue to be inherited as though they were still valid.",
  "insight",
  ["message-8"],
  "context-pollution",
);
const dissimilarConstraintsMatter = seed(
  "dissimilar-constraints-matter",
  "Dissimilar constraints still matter",
  "Global constraints can remain important even when their wording is semantically dissimilar to the selected idea.",
  "insight",
  ["message-8", "message-9"],
  "context-pollution",
);
const relevanceQuestion = seed(
  "relevance-question",
  "Relevance calculation",
  "How should relevance account for lineage, dependencies, related thoughts, and global constraints?",
  "open_question",
  ["message-8", "message-9"],
  "context-pollution",
);
const staleAssumptionQuestion = seed(
  "stale-assumption-question",
  "Detect stale assumptions",
  "How should stale or rejected assumptions be detected before context is inherited?",
  "open_question",
  ["message-8"],
  "context-pollution",
);

const refractGoal = seed(
  "refract-goal",
  "Current Refract product goal",
  "Build a context-engineering layer that reconstructs thought structure and lets users control what the next conversation inherits.",
  "goal",
  ["message-9", "message-10"],
  "refract",
);
const messagesAsEvidence = seed(
  "messages-as-evidence",
  "Messages are evidence",
  "Individual messages should remain provenance while higher-level ideas become the primary objects users navigate.",
  "insight",
  ["message-8", "message-9"],
  "refract",
);
const noManualGraph = seed(
  "no-manual-graph",
  "Do not make users maintain the graph",
  "Users should think naturally without manually organizing or maintaining a graph during exploration.",
  "decision",
  ["message-6", "message-9"],
  "refract",
);
const goalSpecificContext = seed(
  "goal-specific-context",
  "Compile for a continuation goal",
  "Context should be compiled for a specific continuation goal instead of copying the entire transcript.",
  "decision",
  ["message-9", "message-10"],
  "refract",
);
const graphPrimaryHypothesis = seed(
  "graph-primary-hypothesis",
  "Graph as primary interaction model",
  "A graph may be the best primary interaction model for representing nonlinear AI conversations.",
  "hypothesis",
  ["message-6", "message-9"],
  "nonlinear-thinking",
);
const sidecarQuestion = seed(
  "sidecar-question",
  "Sidecar or full interface",
  "Should Refract remain a context layer between existing AI tools or eventually become a complete AI interface?",
  "open_question",
  ["message-9", "message-10"],
  "refract",
);
const evolutionQuestion = seed(
  "evolution-question",
  "Context evolution",
  "How should inherited context update as the user continues thinking over time?",
  "open_question",
  ["message-10"],
  "refract",
);

const nonlinearLaterInsight = seed(
  "nonlinear-later-insight",
  "Nonlinear Thinking",
  "Nonlinear Thinking generalized Rabbit Hole's branching-curiosity insight beyond the learning use case.",
  "insight",
  ["message-5", "message-6", "message-8"],
  "nonlinear-thinking",
);
const refractRabbitApplication = seed(
  "refract-rabbit-application",
  "Later application in Refract",
  "Refract later applied the branching-thinking insight to the problem of continuing long AI conversations.",
  "insight",
  ["message-9", "message-10"],
  "refract",
);
const refractExplicitState = seed(
  "refract-explicit-state",
  "Later explicit-state insight",
  "Refract later generalized Overkill's insight that useful state should be explicit rather than buried in conversational history.",
  "insight",
  ["message-7", "message-9", "message-10"],
  "refract",
);
const pollutionConsequence = seed(
  "pollution-consequence",
  "Context Pollution",
  "Context Pollution emerged as a consequence of flattening multiple conceptual branches into one inherited transcript.",
  "insight",
  ["message-7", "message-8"],
  "context-pollution",
);
const refractSolution = seed(
  "refract-solution",
  "Refract as a proposed solution",
  "Refract emerged as a proposed way to reconstruct branches and deliberately compile cleaner continuation context.",
  "insight",
  ["message-9", "message-10"],
  "refract",
);
const rabbitContribution = seed(
  "rabbit-contribution",
  "Rabbit Hole",
  "Rabbit Hole showed that curiosity branches away from an original question while remaining connected to it.",
  "insight",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const overkillContribution = seed(
  "overkill-contribution",
  "Overkill",
  "Overkill highlighted the value of explicit criteria, state, and decisions instead of relying only on conversational history.",
  "insight",
  ["message-7", "message-8"],
  "overkill",
);

const auxCandidate = seed(
  "aux-candidate",
  "AUX candidate direction",
  "AUX is a possible interview direction centered on intent-aware music and queue management.",
  "hypothesis",
  ["message-3", "message-4"],
  "aux",
);
const rabbitCandidate = seed(
  "rabbit-candidate",
  "Rabbit Hole candidate direction",
  "Rabbit Hole is a possible interview direction centered on nonlinear learning and branching curiosity.",
  "hypothesis",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const overkillCandidate = seed(
  "overkill-candidate",
  "Overkill candidate direction",
  "Overkill is a possible interview direction centered on structured purchasing decisions.",
  "hypothesis",
  ["message-7", "message-8"],
  "overkill",
);

const auxMechanics = seed(
  "aux-mechanics",
  "AUX music mechanics",
  "AUX-specific music sensing, mood detection, and queue-management mechanics.",
  "fact",
  ["message-3", "message-4"],
  "aux",
);
const purchasingMechanics = seed(
  "purchasing-mechanics",
  "Overkill purchasing mechanics",
  "Overkill-specific product comparison, criteria weighting, and purchasing-research mechanics.",
  "fact",
  ["message-7"],
  "overkill",
);
const rabbitMechanics = seed(
  "rabbit-mechanics",
  "Rabbit Hole learning mechanics",
  "Rabbit Hole-specific learning paths and branch-reconnection mechanics.",
  "fact",
  ["message-5", "message-6"],
  "rabbit-hole",
);
const refractImplementation = seed(
  "refract-implementation",
  "Refract implementation decisions",
  "Refract-specific context compilation and conversation-provenance implementation decisions.",
  "fact",
  ["message-9", "message-10"],
  "refract",
);

const excludeReason =
  "Excluded because this belongs to an unrelated product branch and does not materially help continue the selected thought.";

export const demoThoughtContextMetadata: ThoughtContextMetadata[] = [
  {
    thoughtId: "interview-project",
    globalContextItemIds: projectConstraintIds,
    context: [
      select(interviewGoal, "current_goal"),
      select(groundedProblem, "core_insights"),
      select(clearWorkflow, "core_insights"),
      select(auxCandidate, "related_ideas", "reconsider"),
      select(rabbitCandidate, "related_ideas", "reconsider"),
      select(overkillCandidate, "related_ideas", "reconsider"),
      select(
        seed(
          "interview-direction-question",
          "Strongest direction",
          "Which direction reveals the strongest product insight?",
          "open_question",
          ["message-1", "message-2"],
          "interview-project",
        ),
        "open_questions",
      ),
      select(
        seed(
          "interview-scope-question",
          "Convincing scope",
          "What can be made convincing within the available time?",
          "open_question",
          ["message-1", "message-2"],
          "interview-project",
        ),
        "open_questions",
      ),
    ],
  },
  {
    thoughtId: "aux",
    globalContextItemIds: allGlobalContextIds,
    context: [
      select(auxGoal, "current_goal"),
      select(auxMoodInsight, "core_insights"),
      select(auxQueueInsight, "core_insights"),
      select(auxQueueHypothesis, "previous_hypotheses", "reconsider"),
      select(auxBehaviorQuestion, "open_questions"),
      select(auxCapabilitiesQuestion, "open_questions"),
      select(purchasingMechanics, "excluded", "drop", excludeReason),
      select(rabbitMechanics, "excluded", "drop", excludeReason),
      select(refractImplementation, "excluded", "drop", excludeReason),
    ],
  },
  {
    thoughtId: "rabbit-hole",
    globalContextItemIds: allGlobalContextIds,
    context: [
      select(rabbitGoal, "current_goal"),
      select(curiosityBranches, "core_insights"),
      select(preserveOriginalQuestion, "core_insights"),
      select(explorationStructure, "core_insights"),
      select(nonlinearLaterInsight, "related_ideas"),
      select(refractRabbitApplication, "related_ideas", "reconsider"),
      select(auxMechanics, "excluded", "drop", excludeReason),
      select(purchasingMechanics, "excluded", "drop", excludeReason),
      select(reconnectQuestion, "open_questions"),
      select(distractionQuestion, "open_questions"),
    ],
  },
  {
    thoughtId: "overkill",
    globalContextItemIds: allGlobalContextIds,
    context: [
      select(overkillGoal, "current_goal"),
      select(comparisonStructure, "core_insights"),
      select(weightedCriteria, "core_insights"),
      select(stoppingProblem, "core_insights"),
      select(explicitDecisionState, "core_insights"),
      select(refractExplicitState, "related_ideas", "reconsider"),
      select(auxMechanics, "excluded", "drop", excludeReason),
      select(rabbitMechanics, "excluded", "drop", excludeReason),
      select(purchasingBreadthQuestion, "open_questions"),
      select(externalResearchQuestion, "open_questions"),
      select(confidenceQuestion, "open_questions"),
    ],
  },
  {
    thoughtId: "nonlinear-thinking",
    globalContextItemIds: allGlobalContextIds,
    context: [
      select(nonlinearGoal, "current_goal"),
      select(humanExplorationBranches, "core_insights"),
      select(linearTranscriptsHideStructure, "core_insights"),
      select(pollutionConsequence, "related_ideas"),
      select(graphPrimaryHypothesis, "previous_hypotheses", "reconsider"),
      select(auxMechanics, "excluded", "drop", excludeReason),
      select(purchasingMechanics, "excluded", "drop", excludeReason),
      select(primaryInterfaceQuestion, "open_questions"),
      select(visibleStructureQuestion, "open_questions"),
    ],
  },
  {
    thoughtId: "context-pollution",
    globalContextItemIds: allGlobalContextIds,
    context: [
      select(pollutionGoal, "current_goal"),
      select(unrelatedBranchesPersist, "core_insights"),
      select(discardedAssumptionsPersist, "core_insights"),
      select(dissimilarConstraintsMatter, "core_insights"),
      select(refractSolution, "related_ideas"),
      select(graphPrimaryHypothesis, "previous_hypotheses", "reconsider"),
      select(auxMechanics, "excluded", "drop", excludeReason),
      select(purchasingMechanics, "excluded", "drop", excludeReason),
      select(relevanceQuestion, "open_questions"),
      select(staleAssumptionQuestion, "open_questions"),
    ],
  },
  {
    thoughtId: "refract",
    globalContextItemIds: allGlobalContextIds,
    context: [
      select(refractGoal, "current_goal"),
      select(linearTranscriptsHideStructure, "core_insights"),
      select(messagesAsEvidence, "core_insights"),
      select(noManualGraph, "core_insights"),
      select(goalSpecificContext, "core_insights"),
      select(rabbitContribution, "related_ideas"),
      select(overkillContribution, "related_ideas"),
      select(graphPrimaryHypothesis, "previous_hypotheses", "reconsider"),
      select(auxMechanics, "excluded", "drop", excludeReason),
      select(relevanceQuestion, "open_questions"),
      select(sidecarQuestion, "open_questions"),
      select(evolutionQuestion, "open_questions"),
    ],
  },
];
