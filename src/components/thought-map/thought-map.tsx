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

function getThoughtPosition(index: number, thoughtCount: number) {
  const columnCount = Math.max(1, Math.ceil(Math.sqrt(thoughtCount * 1.5)));

  return {
    x: (index % columnCount) * 300,
    y: Math.floor(index / columnCount) * 190,
  };
}

export function ThoughtMap({
  thoughts,
  relationships,
  selectedThoughtId,
  onSelectThought,
}: ThoughtMapProps) {
  const nodes = useMemo<ThoughtFlowNode[]>(
    () =>
      thoughts.map((thought, index) => ({
        id: thought.id,
        type: "thought",
        position: getThoughtPosition(index, thoughts.length),
        data: { thought },
        selected: thought.id === selectedThoughtId,
        draggable: false,
        connectable: false,
        ariaLabel: `${thought.title}, ${thought.type}, ${thought.status}`,
      })),
    [selectedThoughtId, thoughts],
  );

  const edges = useMemo<Edge[]>(
    () =>
      relationships.map((relationship, index) => ({
        id: `${relationship.source}-${relationship.target}-${index}`,
        source: relationship.source,
        target: relationship.target,
        type: "smoothstep",
        label: relationLabels[relationship.relation],
        selectable: false,
        focusable: false,
        animated: false,
        style: { stroke: "#93a09b", strokeWidth: 1.15 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#93a09b",
          width: 12,
          height: 12,
        },
        labelStyle: {
          fill: "#66706c",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.02em",
        },
        labelBgStyle: { fill: "#f7f7f3", fillOpacity: 0.94 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 0,
      })),
    [relationships],
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
      fitViewOptions={{ padding: 0.14, minZoom: 0.35, maxZoom: 0.85 }}
      minZoom={0.3}
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
        fitViewOptions={{ padding: 0.14, maxZoom: 0.85 }}
        aria-label="Thought map controls"
      />
    </ReactFlow>
  );
}
