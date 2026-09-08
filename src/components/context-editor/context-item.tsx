import type {
  ContextItemState,
  ContextSuggestion,
} from "@/types/refract";

type ContextItemProps = {
  item: ContextSuggestion;
  onStateChange: (state: ContextItemState) => void;
};

const categoryLabels: Record<ContextSuggestion["category"], string> = {
  goal: "Goal",
  constraint: "Constraint",
  fact: "Fact",
  insight: "Insight",
  decision: "Decision",
  hypothesis: "Hypothesis",
  open_question: "Open question",
};

const states: ContextItemState[] = ["carry", "drop", "reconsider"];

export function ContextItem({ item, onStateChange }: ContextItemProps) {
  const provenanceLabel =
    item.sourceMessageIds.length > 0
      ? `${item.sourceMessageIds.length} ${
          item.sourceMessageIds.length === 1 ? "source" : "sources"
        }`
      : "Global context";

  return (
    <article
      className={`border-t border-ink/10 px-4 py-5 transition-colors last:border-b sm:px-5 ${
        item.state === "drop"
          ? "bg-ink/[0.025]"
          : item.state === "reconsider"
            ? "border-l-2 border-l-accent bg-accent-soft/35"
            : "bg-surface"
      }`}
    >
      <div className={item.state === "drop" ? "opacity-60" : undefined}>
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-accent">
            {categoryLabels[item.category]}
          </p>
          <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            {provenanceLabel}
          </p>
        </div>
        <h3 className="mt-2.5 text-sm font-semibold tracking-[-0.01em] text-ink">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink/80">{item.content}</p>
        <p className="mt-3 text-xs leading-5 text-muted">
          <span className="font-medium text-ink/65">Why included: </span>
          {item.inclusionReason}
        </p>
      </div>

      <div
        role="group"
        aria-label={`Inheritance state for ${item.title}`}
        className="mt-4 grid grid-cols-3 border border-ink/10"
      >
        {states.map((state) => {
          const isActive = item.state === state;

          return (
            <button
              key={state}
              type="button"
              aria-pressed={isActive}
              onClick={() => onStateChange(state)}
              className={`flex min-h-9 items-center justify-center gap-1.5 border-r border-ink/10 px-2 text-[11px] font-medium capitalize transition-colors last:border-r-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                isActive
                  ? "bg-ink text-white"
                  : "bg-background text-muted hover:bg-accent-soft hover:text-ink"
              }`}
            >
              <span aria-hidden="true" className="w-2 text-[9px]">
                {isActive ? "✓" : ""}
              </span>
              {state}
            </button>
          );
        })}
      </div>
    </article>
  );
}
