import type { AnalysisModelOutput } from "@/lib/refract/schemas/analysis";
import { sanitizeDisplayTitle } from "@/lib/refract/sanitize-display-title";
import type {
  ContextSeed,
  ContextSeedSelection,
  GlobalContext,
  Message,
  RefractAnalysis,
  Thought,
  ThoughtContextMetadata,
  ThoughtEdge,
} from "@/types/refract";

export class AnalysisIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisIntegrityError";
  }
}

function uniqueValidMessageIds(
  sourceMessageIds: string[],
  validMessageIds: Set<string>,
): string[] {
  return [
    ...new Set(sourceMessageIds.filter((id) => validMessageIds.has(id))),
  ];
}

function sanitizeSeed(
  seed: AnalysisModelOutput["globalContext"]["goals"][number],
  validMessageIds: Set<string>,
  validThoughtIds: Set<string>,
): ContextSeed | undefined {
  const sourceMessageIds = uniqueValidMessageIds(
    seed.sourceMessageIds,
    validMessageIds,
  );

  if (sourceMessageIds.length === 0) return undefined;

  return {
    id: seed.id,
    title: sanitizeDisplayTitle(seed.title, seed.id),
    content: seed.content.trim(),
    category: seed.category,
    sourceMessageIds,
    ...(seed.sourceThoughtId && validThoughtIds.has(seed.sourceThoughtId)
      ? { sourceThoughtId: seed.sourceThoughtId }
      : {}),
    priority: seed.priority,
  };
}

function sanitizeGlobalContext(
  globalContext: AnalysisModelOutput["globalContext"],
  validMessageIds: Set<string>,
  validThoughtIds: Set<string>,
): GlobalContext {
  const seenIds = new Set<string>();

  function sanitizeList(
    seeds: AnalysisModelOutput["globalContext"]["goals"],
  ): ContextSeed[] {
    return seeds.flatMap((seed) => {
      if (seenIds.has(seed.id)) return [];

      const sanitized = sanitizeSeed(seed, validMessageIds, validThoughtIds);
      if (!sanitized) return [];

      seenIds.add(sanitized.id);
      return [sanitized];
    });
  }

  return {
    goals: sanitizeList(globalContext.goals),
    constraints: sanitizeList(globalContext.constraints),
    facts: sanitizeList(globalContext.facts),
    preferences: sanitizeList(globalContext.preferences),
  };
}

function createUniqueSeedId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) suffix += 1;

  const id = `${baseId}-${suffix}`;
  usedIds.add(id);
  return id;
}

function fallbackGoalSelection(thought: Thought): ContextSeedSelection {
  return {
    seed: {
      id: `${thought.id}-continuation-goal`,
      title: `Continue ${thought.title}`,
      content: thought.summary,
      category: "goal",
      sourceMessageIds: [...thought.sourceMessageIds],
      sourceThoughtId: thought.id,
      priority: "essential",
    },
    section: "current_goal",
    state: "carry",
    inclusionReason:
      "Included because it defines the semantic thought selected for continuation.",
  };
}

function sanitizeMetadata(
  outputMetadata: AnalysisModelOutput["thoughtContextMetadata"],
  thoughts: Thought[],
  globalContext: GlobalContext,
  validMessageIds: Set<string>,
): ThoughtContextMetadata[] {
  const validThoughtIds = new Set(thoughts.map((thought) => thought.id));
  const validGlobalIds = new Set([
    ...globalContext.goals,
    ...globalContext.constraints,
    ...globalContext.facts,
    ...globalContext.preferences,
  ].map((seed) => seed.id));
  const firstMetadataByThought = new Map<string, (typeof outputMetadata)[number]>();

  for (const metadata of outputMetadata) {
    if (
      validThoughtIds.has(metadata.thoughtId) &&
      !firstMetadataByThought.has(metadata.thoughtId)
    ) {
      firstMetadataByThought.set(metadata.thoughtId, metadata);
    }
  }

  return thoughts.map((thought) => {
    const metadata = firstMetadataByThought.get(thought.id);
    const usedSeedIds = new Set(validGlobalIds);
    const context: ContextSeedSelection[] = (metadata?.context ?? []).flatMap(
      (selection) => {
        const sanitizedSeed = sanitizeSeed(
          selection.seed,
          validMessageIds,
          validThoughtIds,
        );

        if (!sanitizedSeed) return [];

        return [
          {
            seed: {
              ...sanitizedSeed,
              id: createUniqueSeedId(sanitizedSeed.id, usedSeedIds),
            },
            section: selection.section,
            state: selection.state,
            inclusionReason: selection.inclusionReason.trim(),
          },
        ];
      },
    );

    if (!context.some((selection) => selection.section === "current_goal")) {
      const fallback = fallbackGoalSelection(thought);
      fallback.seed.id = createUniqueSeedId(fallback.seed.id, usedSeedIds);
      context.unshift(fallback);
    }

    return {
      thoughtId: thought.id,
      globalContextItemIds: [
        ...new Set(
          (metadata?.globalContextItemIds ?? []).filter((id) =>
            validGlobalIds.has(id),
          ),
        ),
      ],
      context,
    };
  });
}

function logContextDiagnostics(
  metadata: ThoughtContextMetadata[],
  globalContext: GlobalContext,
) {
  const globalSeedsById = new Map(
    [
      ...globalContext.goals,
      ...globalContext.constraints,
      ...globalContext.facts,
      ...globalContext.preferences,
    ].map((seed) => [seed.id, seed] as const),
  );

  console.info(
    "[Refract] context metadata diagnostics",
    metadata.map((entry) => {
      const priorities = { essential: 0, recommended: 0, supporting: 0 };
      const selectedGlobals = entry.globalContextItemIds.flatMap((id) => {
        const seed = globalSeedsById.get(id);
        return seed ? [seed] : [];
      });

      for (const seed of selectedGlobals) priorities[seed.priority] += 1;
      for (const selection of entry.context) {
        priorities[selection.seed.priority] += 1;
      }

      return {
        thoughtId: entry.thoughtId,
        totalCandidateSeeds: selectedGlobals.length + entry.context.length,
        ...priorities,
        dropped: entry.context.filter((item) => item.state === "drop").length,
        reconsider: entry.context.filter(
          (item) => item.state === "reconsider",
        ).length,
      };
    }),
  );
}

export function validateAndSanitizeAnalysis(
  modelOutput: AnalysisModelOutput,
  messages: Message[],
): RefractAnalysis {
  const validMessageIds = new Set(messages.map((message) => message.id));
  const seenThoughtIds = new Set<string>();

  for (const thought of modelOutput.thoughts) {
    if (seenThoughtIds.has(thought.id)) {
      throw new AnalysisIntegrityError(
        `The analysis returned a duplicate thought ID: ${thought.id}`,
      );
    }
    seenThoughtIds.add(thought.id);
  }

  const thoughts: Thought[] = modelOutput.thoughts.flatMap((thought) => {
    const sourceMessageIds = uniqueValidMessageIds(
      thought.sourceMessageIds,
      validMessageIds,
    );

    if (sourceMessageIds.length === 0) return [];

    return [
      {
        ...thought,
        title: sanitizeDisplayTitle(thought.title, thought.id),
        summary: thought.summary.trim(),
        sourceMessageIds,
      },
    ];
  });

  if (thoughts.length === 0) {
    throw new AnalysisIntegrityError(
      "The analysis did not contain any thoughts with valid provenance.",
    );
  }

  const validThoughtIds = new Set(thoughts.map((thought) => thought.id));
  const seenEdges = new Set<string>();
  const edges: ThoughtEdge[] = modelOutput.edges.filter((edge) => {
    if (
      !validThoughtIds.has(edge.source) ||
      !validThoughtIds.has(edge.target) ||
      edge.source === edge.target
    ) {
      return false;
    }

    const key = `${edge.source}:${edge.target}:${edge.relation}`;
    if (seenEdges.has(key)) return false;

    seenEdges.add(key);
    return true;
  });
  const globalContext = sanitizeGlobalContext(
    modelOutput.globalContext,
    validMessageIds,
    validThoughtIds,
  );
  const thoughtContextMetadata = sanitizeMetadata(
    modelOutput.thoughtContextMetadata,
    thoughts,
    globalContext,
    validMessageIds,
  );

  if (process.env.NODE_ENV === "development") {
    logContextDiagnostics(thoughtContextMetadata, globalContext);
  }

  return {
    conversationTitle: sanitizeDisplayTitle(
      modelOutput.conversationTitle,
      undefined,
      "Conversation",
    ),
    messages,
    thoughts,
    edges,
    globalContext,
    thoughtContextMetadata,
  };
}
