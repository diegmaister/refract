import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";

import type { Thought } from "@/types/refract";

export type ThoughtNodeData = { thought: Thought } & Record<string, unknown>;
export type ThoughtFlowNode = Node<ThoughtNodeData, "thought">;

const typeLabels: Record<Thought["type"], string> = {
  idea: "Idea",
  question: "Question",
  decision: "Decision",
  constraint: "Constraint",
  fact: "Insight",
  hypothesis: "Hypothesis",
  research: "Research",
  open_question: "Open question",
};

export function ThoughtNode({ data, selected }: NodeProps<ThoughtFlowNode>) {
  const { thought } = data;

  return (
    <div
      className={`thought-node w-52 border bg-surface px-4 py-3.5 transition-[border-color,box-shadow,transform] ${
        selected
          ? "border-accent shadow-[0_0_0_2px_rgba(40,102,87,0.12)]"
          : "border-ink/15 shadow-[0_5px_16px_rgba(23,32,29,0.04)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border !border-surface !bg-ink/35"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border !border-surface !bg-ink/35"
      />

      <div className="flex min-h-4 items-center justify-between gap-3">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted">
          {typeLabels[thought.type]}
        </span>
        {selected && (
          <span className="flex items-center gap-1.5 font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-accent">
            <span aria-hidden="true" className="size-1 bg-accent" />
            Selected
          </span>
        )}
      </div>

      <p className="mt-2 text-[15px] font-semibold leading-5 tracking-[-0.02em] text-ink">
        {thought.title}
      </p>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] capitalize text-muted">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${
            thought.status === "active" ? "bg-accent" : "bg-ink/25"
          }`}
        />
        {thought.status}
      </div>
    </div>
  );
}
