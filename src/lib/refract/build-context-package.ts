import { compileContext } from "@/lib/refract/compile-context";
import { applyContextDensity } from "@/lib/refract/context-density";
import type {
  ContextDensity,
  ContextSeed,
  ContextSeedSelection,
  ContextSuggestion,
  GlobalContext,
  SuggestedContextPackage,
  Thought,
  ThoughtContextMetadata,
  ThoughtEdge,
} from "@/types/refract";

type BuildContextPackageInput = {
  targetThoughtId: string;
  thoughts: Thought[];
  edges: ThoughtEdge[];
  globalContext: GlobalContext;
  metadata: ThoughtContextMetadata[];
  density?: ContextDensity;
};

const conceptualDevelopmentRelations = new Set<ThoughtEdge["relation"]>([
  "branch_of",
  "led_to",
  "evolved_into",
]);

// This chooses one compact conceptual path for display. It does not determine
// the target thought's identity or restrict its source-message provenance.
function findRepresentativeConceptualLineage(
  targetThoughtId: string,
  edges: ThoughtEdge[],
): string[] {
  function visit(thoughtId: string, visited: Set<string>): string[] {
    if (visited.has(thoughtId)) return [thoughtId];

    const nextVisited = new Set(visited).add(thoughtId);
    const contributors = edges
      .filter(
        (edge) =>
          edge.target === thoughtId &&
          conceptualDevelopmentRelations.has(edge.relation),
      )
      .map((edge) => edge.source);

    if (contributors.length === 0) return [thoughtId];

    const contributorPaths = contributors.map((contributorId) =>
      visit(contributorId, nextVisited),
    );
    const longestContributorPath = contributorPaths.reduce((longest, path) =>
      path.length > longest.length ? path : longest,
    );

    return [...longestContributorPath, thoughtId];
  }

  return visit(targetThoughtId, new Set());
}

function findConceptuallyConnectedThoughts(
  startThoughtId: string,
  edges: ThoughtEdge[],
  direction: "contributors" | "developments",
): Set<string> {
  const reachable = new Set<string>();
  const queue = [startThoughtId];

  while (queue.length > 0) {
    const currentThoughtId = queue.shift();
    if (!currentThoughtId) continue;

    for (const edge of edges) {
      if (!conceptualDevelopmentRelations.has(edge.relation)) continue;

      const nextThoughtId =
        direction === "contributors" && edge.target === currentThoughtId
          ? edge.source
          : direction === "developments" && edge.source === currentThoughtId
            ? edge.target
            : undefined;

      if (!nextThoughtId || reachable.has(nextThoughtId)) continue;

      reachable.add(nextThoughtId);
      queue.push(nextThoughtId);
    }
  }

  return reachable;
}

function getRelationshipReason(
  seed: ContextSeed,
  targetThought: Thought,
  edges: ThoughtEdge[],
): string {
  if (!seed.sourceThoughtId) {
    return "Included because this context was explicitly marked as relevant to the selected continuation.";
  }

  if (seed.sourceThoughtId === targetThought.id) {
    return "Included because this was established within the selected thought.";
  }

  const contributors = findConceptuallyConnectedThoughts(
    targetThought.id,
    edges,
    "contributors",
  );
  if (contributors.has(seed.sourceThoughtId)) {
    return "Included because this thought conceptually contributed to the selected thought's development.";
  }

  const developments = findConceptuallyConnectedThoughts(
    targetThought.id,
    edges,
    "developments",
  );
  if (developments.has(seed.sourceThoughtId)) {
    return "Included because this thought develops a useful consequence of the selected idea.";
  }

  const isDependency = edges.some(
    (edge) =>
      edge.relation === "depends_on" &&
      edge.source === targetThought.id &&
      edge.target === seed.sourceThoughtId,
  );

  if (isDependency) {
    return "Included because the selected thought directly depends on this context.";
  }

  const isDirectlyRelated = edges.some(
    (edge) =>
      edge.relation === "related_to" &&
      ((edge.source === targetThought.id &&
        edge.target === seed.sourceThoughtId) ||
        (edge.target === targetThought.id &&
          edge.source === seed.sourceThoughtId)),
  );

  if (isDirectlyRelated) {
    return "Included because the thought map records a direct conceptual relationship.";
  }

  return "Included through explicit relevance metadata for this mocked continuation.";
}

function createSuggestion(
  selection: ContextSeedSelection,
  targetThought: Thought,
  edges: ThoughtEdge[],
): ContextSuggestion {
  return {
    ...selection.seed,
    sourceMessageIds: [...selection.seed.sourceMessageIds],
    section: selection.section,
    state: selection.state,
    suggestedState: selection.state,
    priority: selection.seed.priority,
    inclusionReason:
      selection.inclusionReason ??
      getRelationshipReason(selection.seed, targetThought, edges),
  };
}

function createGlobalSuggestion(seed: ContextSeed): ContextSuggestion {
  const isGoal = seed.category === "goal";

  return {
    ...seed,
    sourceMessageIds: [...seed.sourceMessageIds],
    section: "global_constraints",
    state: "carry",
    suggestedState: "carry",
    priority: "essential",
    inclusionReason: isGoal
      ? "Included because this thought is being evaluated as part of the global interview-project goal."
      : "Included because this global constraint applies even when it is semantically dissimilar to the selected thought.",
  };
}

function createLineageSuggestion(
  lineage: Thought[],
  targetThought: Thought,
): ContextSuggestion | undefined {
  if (lineage.length < 2) return undefined;

  return {
    id: `${targetThought.id}-lineage`,
    title: `${targetThought.title} evolved from ${lineage
      .slice(Math.max(0, lineage.length - 4), -1)
      .map((thought) => thought.title)
      .join(" → ")}`,
    content: `${targetThought.title} developed through this line of thinking: ${lineage
      .map((thought) => thought.title)
      .join(" → ")}.`,
    category: "fact",
    section: "background_lineage",
    sourceMessageIds: [
      ...new Set(lineage.flatMap((thought) => thought.sourceMessageIds)),
    ],
    inclusionReason:
      "Included because these conceptual relationships establish how the selected thought developed.",
    state: "carry",
    suggestedState: "carry",
    priority: lineage.length > 2 ? "essential" : "recommended",
  };
}

export function buildContextPackage({
  targetThoughtId,
  thoughts,
  edges,
  globalContext,
  metadata,
  density = "balanced",
}: BuildContextPackageInput): SuggestedContextPackage {
  const targetThought = thoughts.find(
    (thought) => thought.id === targetThoughtId,
  );
  const targetMetadata = metadata.find(
    (entry) => entry.thoughtId === targetThoughtId,
  );

  if (!targetThought) {
    throw new Error(`Cannot build context for unknown thought: ${targetThoughtId}`);
  }

  if (!targetMetadata) {
    throw new Error(`Missing context metadata for thought: ${targetThoughtId}`);
  }

  const globalSeeds = [
    ...globalContext.goals,
    ...globalContext.constraints,
    ...globalContext.facts,
    ...globalContext.preferences,
  ];
  const selectedGlobalSeeds = targetMetadata.globalContextItemIds.map(
    (globalItemId) => {
      const seed = globalSeeds.find((item) => item.id === globalItemId);

      if (!seed) {
        throw new Error(
          `Missing global context item for thought ${targetThoughtId}: ${globalItemId}`,
        );
      }

      return seed;
    },
  );

  const lineageIds = findRepresentativeConceptualLineage(
    targetThoughtId,
    edges,
  );
  const lineageThoughts = lineageIds.flatMap((thoughtId) => {
    const thought = thoughts.find((candidate) => candidate.id === thoughtId);
    return thought ? [thought] : [];
  });
  const lineageSuggestion = createLineageSuggestion(
    lineageThoughts,
    targetThought,
  );

  const inventory = [
    ...targetMetadata.context
      .filter((selection) => selection.section === "current_goal")
      .map((selection) => createSuggestion(selection, targetThought, edges)),
    ...selectedGlobalSeeds.map(createGlobalSuggestion),
    ...(lineageSuggestion ? [lineageSuggestion] : []),
    ...targetMetadata.context
      .filter((selection) => selection.section !== "current_goal")
      .map((selection) => createSuggestion(selection, targetThought, edges)),
  ];
  const items = applyContextDensity(inventory, density);

  return {
    targetThoughtId,
    items,
    compiledContext: compileContext({
      targetThought,
      items,
      continuationIntent: { type: "continue" },
    }),
  };
}
