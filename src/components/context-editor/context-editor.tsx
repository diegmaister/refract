"use client";

import { useMemo, useState } from "react";

import { buildContextPackage } from "@/lib/refract/build-context-package";
import { compileContext } from "@/lib/refract/compile-context";
import {
  applyContextDensity,
  getDensitySuggestedState,
} from "@/lib/refract/context-density";
import { getContinuationIntentLabel } from "@/lib/refract/continuation-intent";
import {
  calculateTokenReduction,
  estimateTokens,
} from "@/lib/refract/estimate-tokens";
import type {
  ContextDensity,
  ContextItemSection,
  ContextItemState,
  ContextSuggestion,
  ContinuationIntent,
  ContinuationIntentSelection,
  GlobalContext,
  Thought,
  ThoughtContextMetadata,
  ThoughtEdge,
} from "@/types/refract";

import {
  ContextDensitySelector,
  type DensityPreview,
} from "./context-density-selector";
import { ContextItem } from "./context-item";
import { ContextMetrics } from "./context-metrics";
import { ContextExport, ContextInspection } from "./context-preview";
import { ContinuationIntentStep } from "./continuation-intent";

type ContextEditorProps = {
  thought: Thought;
  conversation: string;
  thoughts: Thought[];
  edges: ThoughtEdge[];
  globalContext: GlobalContext;
  metadata: ThoughtContextMetadata[];
};

type ContextStage = "edit" | "intent" | "export";

const sectionOrder: ContextItemSection[] = [
  "current_goal",
  "global_constraints",
  "background_lineage",
  "core_insights",
  "related_ideas",
  "previous_hypotheses",
  "open_questions",
  "excluded",
];

const sectionLabels: Record<ContextItemSection, string> = {
  current_goal: "Current goal",
  global_constraints: "Global context",
  background_lineage: "Background & lineage",
  core_insights: "Core insights",
  related_ideas: "Related ideas",
  previous_hypotheses: "Unsettled",
  open_questions: "Open questions",
  excluded: "Excluded by suggestion",
};

function createContextInventory(
  thought: Thought,
  thoughts: Thought[],
  edges: ThoughtEdge[],
  globalContext: GlobalContext,
  metadata: ThoughtContextMetadata[],
) {
  return buildContextPackage({
    targetThoughtId: thought.id,
    thoughts,
    edges,
    globalContext,
    metadata,
  }).items;
}

function createDensityPreview(
  thought: Thought,
  inventory: ContextSuggestion[],
  density: ContextDensity,
): DensityPreview {
  const densityItems = applyContextDensity(inventory, density);
  const includedItems = densityItems.filter((item) => item.state !== "drop");
  const compiledContext = compileContext({
    targetThought: thought,
    items: densityItems,
    continuationIntent: { type: "continue" },
  });
  const sectionCounts = includedItems.reduce<
    Partial<Record<ContextItemSection, number>>
  >((counts, item) => {
    counts[item.section] = (counts[item.section] ?? 0) + 1;
    return counts;
  }, {});

  return {
    objectCount: includedItems.length,
    tokenEstimate: estimateTokens(compiledContext),
    sectionCounts,
  };
}

export function ContextEditor({
  thought,
  conversation,
  thoughts,
  edges,
  globalContext,
  metadata,
}: ContextEditorProps) {
  const initialInventory = useMemo(
    () =>
      createContextInventory(
        thought,
        thoughts,
        edges,
        globalContext,
        metadata,
      ),
    [edges, globalContext, metadata, thought, thoughts],
  );
  const [density, setDensity] = useState<ContextDensity>("balanced");
  const [items, setItems] = useState(() =>
    applyContextDensity(initialInventory, "balanced"),
  );
  const [manualOverrideIds, setManualOverrideIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingDensity, setPendingDensity] = useState<ContextDensity | null>(
    null,
  );
  const [manualControl, setManualControl] = useState(false);
  const [stage, setStage] = useState<ContextStage>("edit");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [continuationIntent, setContinuationIntent] =
    useState<ContinuationIntentSelection>({ type: "continue" });

  const densityPreviews = useMemo(
    () => ({
      light: createDensityPreview(thought, initialInventory, "light"),
      balanced: createDensityPreview(thought, initialInventory, "balanced"),
      rich: createDensityPreview(thought, initialInventory, "rich"),
    }),
    [initialInventory, thought],
  );
  const customIntentIsValid =
    continuationIntent.type !== "custom" ||
    Boolean(continuationIntent.customInstruction?.trim());
  const currentContext = useMemo(
    () =>
      compileContext({
        targetThought: thought,
        items,
        continuationIntent: { type: "continue" },
      }),
    [items, thought],
  );
  const finalHandoff = useMemo(() => {
    const compilableIntent: ContinuationIntentSelection = customIntentIsValid
      ? continuationIntent
      : { type: "continue" };

    return compileContext({
      targetThought: thought,
      items,
      continuationIntent: compilableIntent,
    });
  }, [continuationIntent, customIntentIsValid, items, thought]);

  const fullConversationTokens = estimateTokens(conversation);
  const suggestedContextTokens = densityPreviews[density].tokenEstimate;
  const currentContextTokens = estimateTokens(currentContext);
  const finalHandoffTokens = estimateTokens(finalHandoff);
  const currentReduction = calculateTokenReduction(
    fullConversationTokens,
    currentContextTokens,
  );
  const finalReduction = calculateTokenReduction(
    fullConversationTokens,
    finalHandoffTokens,
  );
  const carryCount = items.filter((item) => item.state === "carry").length;
  const reconsiderCount = items.filter(
    (item) => item.state === "reconsider",
  ).length;
  const dropCount = items.filter((item) => item.state === "drop").length;
  const includedCount = carryCount + reconsiderCount;
  const visibleItems = manualControl
    ? items
    : items.filter((item) => item.state !== "drop");
  const intentLabel = getContinuationIntentLabel(continuationIntent);

  function updateItemState(itemId: string, state: ContextItemState) {
    const sourceItem = initialInventory.find((item) => item.id === itemId);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, state } : item,
      ),
    );
    setManualOverrideIds((currentIds) => {
      const nextIds = new Set(currentIds);
      const suggestedState = sourceItem
        ? getDensitySuggestedState(sourceItem, density)
        : undefined;

      if (state === suggestedState) nextIds.delete(itemId);
      else nextIds.add(itemId);

      return nextIds;
    });
    setPendingDensity(null);
  }

  function applyDensity(densityToApply: ContextDensity) {
    setDensity(densityToApply);
    setItems(applyContextDensity(initialInventory, densityToApply));
    setManualOverrideIds(new Set());
    setPendingDensity(null);
    setExpandedItemId(null);
  }

  function requestDensity(densityToApply: ContextDensity) {
    if (densityToApply === density) {
      setPendingDensity(null);
      return;
    }

    if (manualOverrideIds.size > 0) {
      setPendingDensity(densityToApply);
      return;
    }

    applyDensity(densityToApply);
  }

  function resetSuggestions() {
    setItems(applyContextDensity(initialInventory, density));
    setManualOverrideIds(new Set());
    setPendingDensity(null);
    setExpandedItemId(null);
  }

  function updateIntent(type: ContinuationIntent) {
    setContinuationIntent((currentIntent) => ({
      type,
      customInstruction: currentIntent.customInstruction,
    }));
  }

  if (stage === "intent") {
    return (
      <ContinuationIntentStep
        thoughtTitle={thought.title}
        intent={continuationIntent}
        itemCount={includedCount}
        carryCount={carryCount}
        reconsiderCount={reconsiderCount}
        dropCount={dropCount}
        tokenEstimate={finalHandoffTokens}
        onIntentChange={updateIntent}
        onCustomInstructionChange={(customInstruction) =>
          setContinuationIntent({ type: "custom", customInstruction })
        }
        onBack={() => setStage("edit")}
        onGenerate={() => {
          if (customIntentIsValid) setStage("export");
        }}
      />
    );
  }

  if (stage === "export") {
    return (
      <ContextExport
        compiledContext={finalHandoff}
        thoughtTitle={thought.title}
        intentLabel={intentLabel}
        tokenEstimate={finalHandoffTokens}
        fullConversationTokens={fullConversationTokens}
        removedTokens={finalReduction.removedTokens}
        percentRemoved={finalReduction.percentRemoved}
        hasReduction={finalReduction.hasReduction}
        onEdit={() => setStage("edit")}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-6 sm:px-8 sm:pb-24 sm:pt-8">
      <section aria-labelledby="context-editor-heading">
        <div className="sticky top-0 z-30 -mx-5 border-b border-ink/10 bg-background px-5 py-3 sm:-mx-8 sm:px-8">
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-accent">
                Context ledger
              </p>
              <h1
                id="context-editor-heading"
                className="mt-0.5 truncate text-lg font-semibold tracking-[-0.03em] text-ink sm:text-xl"
              >
                Continue: {thought.title}
              </h1>
            </div>
            <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
              {density}
            </span>
          </div>
          <div className="mt-2">
            <ContextMetrics
              fullConversationTokens={fullConversationTokens}
              suggestedContextTokens={suggestedContextTokens}
              currentContextTokens={currentContextTokens}
              removedTokens={currentReduction.removedTokens}
              percentRemoved={currentReduction.percentRemoved}
              hasReduction={currentReduction.hasReduction}
              carryCount={carryCount}
              reconsiderCount={reconsiderCount}
              dropCount={dropCount}
              density={density}
            />
          </div>
        </div>

        <div className="mt-7">
          <ContextDensitySelector
            density={density}
            previews={densityPreviews}
            pendingDensity={pendingDensity}
            onSelect={requestDensity}
            onConfirmSwitch={() => {
              if (pendingDensity) applyDensity(pendingDensity);
            }}
            onCancelSwitch={() => setPendingDensity(null)}
          />
        </div>

        <div className="mt-7 flex flex-col gap-3 border-y border-ink/10 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-muted">
            {manualControl
              ? "Manual control shows every known context object, including Refract's exclusions."
              : `Refract selected ${includedCount} objects for this continuation. Refine any inheritance state inline.`}
          </p>
          <button
            type="button"
            onClick={() => {
              setManualControl((current) => !current);
              setExpandedItemId(null);
            }}
            className="shrink-0 self-start text-xs font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:self-auto"
          >
            {manualControl ? "Return to suggested view" : "Manual control"}
          </button>
        </div>

        <div className="mt-8 space-y-7">
          {sectionOrder.map((section) => {
            const sectionItems = visibleItems.filter(
              (item) => item.section === section,
            );

            if (sectionItems.length === 0) return null;

            return (
              <section key={section} aria-labelledby={`${section}-heading`}>
                <div className="mb-1.5 flex items-center justify-between gap-4 px-1">
                  <h2
                    id={`${section}-heading`}
                    className="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-ink"
                  >
                    {sectionLabels[section]}
                  </h2>
                  <span className="font-mono text-[9px] text-muted">
                    {sectionItems.length}
                  </span>
                </div>
                <div>
                  {sectionItems.map((item) => (
                    <ContextItem
                      key={item.id}
                      item={item}
                      expanded={expandedItemId === item.id}
                      onToggle={() =>
                        setExpandedItemId((currentId) =>
                          currentId === item.id ? null : item.id,
                        )
                      }
                      onStateChange={(state) =>
                        updateItemState(item.id, state)
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {!manualControl && dropCount > 0 && (
          <div className="mt-7 flex flex-col gap-2 border border-dashed border-ink/15 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{dropCount} more context objects are not included.</p>
            <button
              type="button"
              onClick={() => setManualControl(true)}
              className="self-start font-medium text-ink underline decoration-ink/20 underline-offset-4 hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:self-auto"
            >
              Review excluded context
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-5 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={resetSuggestions}
              disabled={manualOverrideIds.size === 0}
              className="text-xs font-medium text-muted underline decoration-ink/15 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40"
            >
              Reset suggestions
            </button>
            <button
              type="button"
              onClick={() => setInspectionOpen(true)}
              className="text-xs font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              View full context
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStage("intent")}
            className="inline-flex h-11 w-full items-center justify-between bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:w-64"
          >
            Continue with this context
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      {inspectionOpen && (
        <ContextInspection
          compiledContext={finalHandoff}
          thoughtTitle={thought.title}
          intentLabel={intentLabel}
          tokenEstimate={finalHandoffTokens}
          onClose={() => setInspectionOpen(false)}
        />
      )}
    </main>
  );
}
