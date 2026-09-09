import { Graph, layout } from "@dagrejs/dagre";

import type { Thought, ThoughtEdge } from "@/types/refract";

export const THOUGHT_NODE_WIDTH = 264;
export const THOUGHT_NODE_HEIGHT = 128;

export type ThoughtGraphPosition = {
  x: number;
  y: number;
};

export function layoutThoughtGraph(
  thoughts: Thought[],
  relationships: ThoughtEdge[],
): Map<string, ThoughtGraphPosition> {
  const graph = new Graph({ multigraph: true })
    .setDefaultEdgeLabel(() => ({}))
    .setGraph({
      rankdir: "LR",
      ranksep: 58,
      nodesep: 32,
      marginx: 12,
      marginy: 12,
    });
  const thoughtIds = new Set(thoughts.map((thought) => thought.id));

  for (const thought of thoughts) {
    graph.setNode(thought.id, {
      width: THOUGHT_NODE_WIDTH,
      height: THOUGHT_NODE_HEIGHT,
    });
  }

  relationships.forEach((relationship, index) => {
    if (
      thoughtIds.has(relationship.source) &&
      thoughtIds.has(relationship.target)
    ) {
      graph.setEdge(
        relationship.source,
        relationship.target,
        {},
        `${relationship.relation}-${index}`,
      );
    }
  });

  layout(graph);

  return new Map(
    thoughts.map((thought) => {
      const position = graph.node(thought.id);

      return [
        thought.id,
        {
          x: position.x - THOUGHT_NODE_WIDTH / 2,
          y: position.y - THOUGHT_NODE_HEIGHT / 2,
        },
      ] as const;
    }),
  );
}
