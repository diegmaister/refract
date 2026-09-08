import { compileContext } from "@/lib/refract/compile-context";
import type {
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
};

const lineageRelations = new Set<ThoughtEdge["relation"]>([
  "branch_of",
  "led_to",
  "evolved_into",
]);

function findLongestLineage(
  targetThoughtId: string,
  edges: ThoughtEdge[],
): string[] {
  function visit(thoughtId: string, visited: Set<string>): string[] {
    if (visited.has(thoughtId)) return [thoughtId];

    const nextVisited = new Set(visited).add(thoughtId);
    const parents = edges
      .filter(
        (edge) =>
          edge.target === thoughtId && lineageRelations.has(edge.relation),
      )
      .map((edge) => edge.source);

    if (parents.length === 0) return [thoughtId];

    const parentPaths = parents.map((parentId) =>
      visit(parentId, nextVisited),
    );
    const longestParentPath = parentPaths.reduce((longest, path) =>
      path.length > longest.length ? path : longest,
    );

    return [...longestParentPath, thoughtId];
  }

  return visit(targetThoughtId, new Set());
}

function findReachableThoughts(
  startThoughtId: string,
  edges: ThoughtEdge[],
  direction: "ancestors" | "descendants",
): Set<string> {
  const reachable = new Set<string>();
  const queue = [startThoughtId];

  while (queue.length > 0) {
    const currentThoughtId = queue.shift();
    if (!currentThoughtId) continue;

    for (const edge of edges) {
      if (!lineageRelations.has(edge.relation)) continue;

      const nextThoughtId =
        direction === "ancestors" && edge.target === currentThoughtId
          ? edge.source
          : direction === "descendants" && edge.source === currentThoughtId
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

  const ancestors = findReachableThoughts(targetThought.id, edges, "ancestors");
  if (ancestors.has(seed.sourceThoughtId)) {
    return "Included because this earlier thought contributed to the selected thought's lineage.";
  }

  const descendants = findReachableThoughts(
    targetThought.id,
    edges,
    "descendants",
  );
  if (descendants.has(seed.sourceThoughtId)) {
    return "Included because this later thought developed a useful consequence of the selected idea.";
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
    title: "Thought lineage",
    content: `${targetThought.title} developed through this line of thinking: ${lineage
      .map((thought) => thought.title)
      .join(" → ")}.`,
    category: "fact",
    section: "background_lineage",
    sourceMessageIds: [
      ...new Set(lineage.flatMap((thought) => thought.sourceMessageIds)),
    ],
    inclusionReason:
      "Included because these ancestor relationships establish how the selected thought emerged.",
    state: "carry",
  };
}

export function buildContextPackage({
  targetThoughtId,
  thoughts,
  edges,
  globalContext,
  metadata,
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

  const lineageIds = findLongestLineage(targetThoughtId, edges);
  const lineageThoughts = lineageIds.flatMap((thoughtId) => {
    const thought = thoughts.find((candidate) => candidate.id === thoughtId);
    return thought ? [thought] : [];
  });
  const lineageSuggestion = createLineageSuggestion(
    lineageThoughts,
    targetThought,
  );

  const items = [
    ...targetMetadata.context
      .filter((selection) => selection.section === "current_goal")
      .map((selection) => createSuggestion(selection, targetThought, edges)),
    ...selectedGlobalSeeds.map(createGlobalSuggestion),
    ...(lineageSuggestion ? [lineageSuggestion] : []),
    ...targetMetadata.context
      .filter((selection) => selection.section !== "current_goal")
      .map((selection) => createSuggestion(selection, targetThought, edges)),
  ];

  return {
    targetThoughtId,
    items,
    compiledContext: compileContext(targetThought, items),
  };
}
