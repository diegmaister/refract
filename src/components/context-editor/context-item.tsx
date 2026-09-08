import type {
  ContextItemState,
  ContextSuggestion,
} from "@/types/refract";

type ContextItemProps = {
  item: ContextSuggestion;
  expanded: boolean;
  onToggle: () => void;
  onStateChange: (state: ContextItemState) => void;
};

const states: ContextItemState[] = ["carry", "drop", "reconsider"];

export function ContextItem({
  item,
  expanded,
  onToggle,
  onStateChange,
}: ContextItemProps) {
  const detailsId = `${item.id}-details`;
  const provenanceLabel =
    item.section === "global_constraints"
      ? `Global context · ${item.sourceMessageIds.length} ${
          item.sourceMessageIds.length === 1 ? "source" : "sources"
        }`
      : item.sourceMessageIds.length > 0
        ? `${item.sourceMessageIds.length} ${
            item.sourceMessageIds.length === 1 ? "source" : "sources"
          }`
        : "No message sources";

  return (
    <article
      className={`border-t border-ink/10 transition-colors last:border-b ${
        item.state === "drop"
          ? "bg-ink/[0.025]"
          : item.state === "reconsider"
            ? "border-l-2 border-l-accent bg-accent-soft/25"
            : "bg-surface"
      }`}
    >
      <div className="grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left hover:bg-accent-soft/40 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:px-4"
        >
          <span
            className={`min-w-0 ${item.state === "drop" ? "opacity-55" : ""}`}
          >
            <span className="block truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
              {item.title}
            </span>
            <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted">
              {item.content}
            </span>
          </span>
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`text-muted transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path
              d="m3.5 5.25 3.5 3.5 3.5-3.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          role="group"
          aria-label={`Inheritance state for ${item.title}`}
          className="mx-3 mb-3 grid min-w-0 grid-cols-[minmax(4.5rem,1fr)_minmax(4.5rem,1fr)_minmax(6.5rem,1.35fr)] overflow-hidden rounded-sm border border-ink/15 bg-background sm:mx-0 sm:mb-0 sm:mr-3 sm:w-[17rem]"
        >
          {states.map((state) => {
            const isActive = item.state === state;

            return (
              <button
                key={state}
                type="button"
                aria-pressed={isActive}
                onClick={() => onStateChange(state)}
                className={`flex min-h-8 min-w-0 items-center justify-center gap-1.5 border-r border-ink/10 px-2 text-[9px] font-medium capitalize transition-colors last:border-r-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  isActive
                    ? "bg-accent-soft text-accent shadow-[inset_0_0_0_1px_rgba(40,102,87,0.22)]"
                    : "text-muted hover:bg-accent-soft/50 hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-2 text-[8px] ${isActive ? "opacity-100" : "opacity-0"}`}
                >
                  ✓
                </span>
                {state}
              </button>
            );
          })}
        </div>
      </div>

      {expanded && (
        <div id={detailsId} className="border-t border-ink/10 px-3 pb-4 pt-3 sm:px-4">
          <p className="text-sm leading-6 text-ink/80">{item.content}</p>

          <div className="mt-4 grid gap-3 border-l border-ink/10 pl-3 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-6">
            <div>
              <p className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-muted">
                Why Refract surfaced this
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted">
                {item.inclusionReason}
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                {item.priority} context
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                {provenanceLabel}
              </p>
            </div>
          </div>

          {item.state === "reconsider" && (
            <p className="mt-3 flex items-center gap-2 text-[11px] text-accent">
              <span aria-hidden="true">↻</span>
              Inherited as an unsettled hypothesis.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
