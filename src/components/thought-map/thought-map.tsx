"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
} from "@xyflow/react";
import type { Edge, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { layoutThoughtGraph } from "@/lib/refract/layout-thought-graph";
import type { Thought, ThoughtEdge } from "@/types/refract";

import { ThoughtNode } from "./thought-node";
import type { ThoughtFlowNode } from "./thought-node";

type ThoughtMapProps = {
  thoughts: Thought[];
  relationships: ThoughtEdge[];
  selectedThoughtId: string;
  onSelectThought: (thoughtId: string) => void;
};

const nodeTypes = { thought: ThoughtNode } satisfies NodeTypes;

const relationLabels: Partial<Record<ThoughtEdge["relation"], string>> = {
  led_to: "led to",
  related_to: "related to",
  depends_on: "depends on",
  contradicts: "contradicts",
  evolved_into: "evolved into",
  branch_of: "branch of",
};

const directionalRelations = new Set<ThoughtEdge["relation"]>([
  "led_to",
  "depends_on",
  "evolved_into",
  "branch_of",
]);

const fitViewOptions = { padding: 0.1, maxZoom: 1.05 } as const;

export function ThoughtMap({
  thoughts,
  relationships,
  selectedThoughtId,
  onSelectThought,
}: ThoughtMapProps) {
  const positions = useMemo(
    () => layoutThoughtGraph(thoughts, relationships),
    [relationships, thoughts],
  );
  const connectedThoughtIds = useMemo(() => {
    const connectedIds = new Set<string>();

    for (const relationship of relationships) {
      if (relationship.source === selectedThoughtId) {
        connectedIds.add(relationship.target);
      }
      if (relationship.target === selectedThoughtId) {
        connectedIds.add(relationship.source);
      }
    }

    return connectedIds;
  }, [relationships, selectedThoughtId]);
  const nodes = useMemo<ThoughtFlowNode[]>(
    () =>
      thoughts.map((thought) => ({
        id: thought.id,
        type: "thought",
        position: positions.get(thought.id) ?? { x: 0, y: 0 },
        data: {
          thought,
          directlyConnected: connectedThoughtIds.has(thought.id),
          deEmphasized:
            thought.id !== selectedThoughtId &&
            !connectedThoughtIds.has(thought.id),
        },
        selected: thought.id === selectedThoughtId,
        draggable: false,
        connectable: false,
        ariaLabel: `${thought.title}, ${thought.type}, ${thought.status}`,
      })),
    [connectedThoughtIds, positions, selectedThoughtId, thoughts],
  );

  const edges = useMemo<Edge[]>(
    () =>
      relationships.map((relationship, index) => {
        const directlyConnected =
          relationship.source === selectedThoughtId ||
          relationship.target === selectedThoughtId;
        const isContradiction = relationship.relation === "contradicts";
        const color = directlyConnected
          ? isContradiction
            ? "#665f59"
            : "#286657"
          : isContradiction
            ? "#a09892"
            : "#a7b0ac";

        return {
          id: `${relationship.source}-${relationship.target}-${index}`,
          source: relationship.source,
          target: relationship.target,
          type: "default",
          label: directlyConnected
            ? relationLabels[relationship.relation]
            : undefined,
          selectable: false,
          focusable: false,
          animated: false,
          zIndex: directlyConnected ? 1 : 0,
          style: {
            stroke: color,
            strokeWidth: directlyConnected ? 2 : 1.1,
            strokeDasharray: isContradiction ? "5 4" : undefined,
            opacity: directlyConnected ? 0.96 : 0.5,
          },
          markerEnd: directionalRelations.has(relationship.relation)
            ? {
                type: MarkerType.ArrowClosed,
                color,
                width: directlyConnected ? 13 : 10,
                height: directlyConnected ? 13 : 10,
              }
            : undefined,
          labelStyle: {
            fill: "#49635b",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.02em",
          },
          labelBgStyle: { fill: "#f7f7f3", fillOpacity: 0.96 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 0,
        };
      }),
    [relationships, selectedThoughtId],
  );

  const handleNodeClick: NodeMouseHandler<ThoughtFlowNode> = (_, node) => {
    onSelectThought(node.id);
  };

  return (
    <ReactFlow<ThoughtFlowNode, Edge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={fitViewOptions}
      minZoom={0.22}
      maxZoom={1.35}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesReconnectable={false}
      elementsSelectable
      selectNodesOnDrag={false}
      panOnDrag
      zoomOnPinch
      zoomOnScroll
      zoomOnDoubleClick={false}
      deleteKeyCode={null}
      multiSelectionKeyCode={null}
      attributionPosition="bottom-right"
      className="refract-flow"
      aria-label="Map of thoughts found in the conversation"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="#cfd5d1"
      />
      <Controls
        showInteractive={false}
        position="bottom-left"
        fitViewOptions={fitViewOptions}
        aria-label="Thought map controls"
      />
    </ReactFlow>
  );
}
