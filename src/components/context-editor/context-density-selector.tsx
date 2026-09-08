import { contextDensityOptions } from "@/lib/refract/context-density";
import type { ContextDensity, ContextItemSection } from "@/types/refract";

export type DensityPreview = {
  objectCount: number;
  tokenEstimate: number;
  sectionCounts: Partial<Record<ContextItemSection, number>>;
};

type ContextDensitySelectorProps = {
  density: ContextDensity;
  previews: Record<ContextDensity, DensityPreview>;
  pendingDensity: ContextDensity | null;
  onSelect: (density: ContextDensity) => void;
  onConfirmSwitch: () => void;
  onCancelSwitch: () => void;
};

const numberFormatter = new Intl.NumberFormat("en-US");

function packageSummary(preview: DensityPreview): string {
  const labels: Array<[ContextItemSection, string]> = [
    ["current_goal", "objective"],
    ["global_constraints", "constraints"],
    ["background_lineage", "lineage"],
    ["core_insights", "insights"],
    ["related_ideas", "related"],
    ["previous_hypotheses", "reconsidered"],
    ["open_questions", "questions"],
  ];

  return labels
    .flatMap(([section, label]) => {
      const count = preview.sectionCounts[section] ?? 0;
      return count > 0 ? [`${count} ${label}`] : [];
    })
    .join(" · ");
}

export function ContextDensitySelector({
  density,
  previews,
  pendingDensity,
  onSelect,
  onConfirmSwitch,
  onCancelSwitch,
}: ContextDensitySelectorProps) {
  const activePreview = previews[density];

  return (
    <section aria-labelledby="context-density-heading">
      <div className="flex items-end justify-between gap-5">
        <div>
          <h2
            id="context-density-heading"
            className="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-ink"
          >
            Context
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-muted">
            Refract recommends Balanced context for this continuation.
          </p>
        </div>
        <p className="hidden text-right text-[10px] leading-4 text-muted sm:block">
          AI proposes what matters.
          <br />
          You control what survives.
        </p>
      </div>

      <div className="mt-4 grid border border-ink/10 bg-surface sm:grid-cols-3">
        {contextDensityOptions.map((option) => {
          const selected = option.density === density;
          const preview = previews[option.density];

          return (
            <button
              key={option.density}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(option.density)}
              className={`min-w-0 border-b border-ink/10 px-3 py-3 text-left transition-colors last:border-b-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-4 ${
                selected
                  ? "bg-accent-soft/70"
                  : "hover:bg-accent-soft/30"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink">
                  {option.label}
                </span>
                {option.recommended && (
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-accent">
                    Recommended
                  </span>
                )}
              </span>
              <span className="mt-1 block text-[10px] leading-4 text-muted">
                {option.description}
              </span>
              <span className="mt-2 block font-mono text-[9px] text-ink/65">
                {preview.objectCount} objects ·{" "}
                {numberFormatter.format(preview.tokenEstimate)} tokens
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 min-h-4 text-[10px] leading-4 text-muted">
        {density[0].toUpperCase() + density.slice(1)} includes{" "}
        {packageSummary(activePreview)}.
      </p>

      {pendingDensity && (
        <div
          role="status"
          className="mt-3 flex flex-col gap-3 border-l-2 border-accent bg-accent-soft/45 px-3 py-2.5 text-xs text-ink sm:flex-row sm:items-center sm:justify-between"
        >
          <p>Switching context level will reset your manual changes.</p>
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={onCancelSwitch}
              className="font-medium text-muted underline decoration-ink/20 underline-offset-4 hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmSwitch}
              className="font-semibold text-accent underline decoration-accent/25 underline-offset-4 hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Switch
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
