import type { ContextDensity } from "@/types/refract";

type ContextMetricsProps = {
  fullConversationTokens: number;
  suggestedContextTokens: number;
  currentContextTokens: number;
  removedTokens: number;
  percentRemoved: number;
  hasReduction: boolean;
  carryCount: number;
  reconsiderCount: number;
  dropCount: number;
  density: ContextDensity;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function ContextMetrics({
  fullConversationTokens,
  suggestedContextTokens,
  currentContextTokens,
  removedTokens,
  percentRemoved,
  hasReduction,
  carryCount,
  reconsiderCount,
  dropCount,
  density,
}: ContextMetricsProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Context size estimates"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono tracking-[-0.02em]">
        <p className="text-[13px] font-medium text-ink sm:text-sm">
          <span className="mr-1.5 text-[9px] font-normal uppercase tracking-[0.08em] text-muted">
            Full chat
          </span>
          {numberFormatter.format(fullConversationTokens)}
          <span aria-hidden="true" className="mx-2 text-muted">
            →
          </span>
          <span className="mr-1.5 text-[9px] font-normal uppercase tracking-[0.08em] text-muted">
            Your context
          </span>
          {numberFormatter.format(currentContextTokens)} tokens est.
        </p>
        {hasReduction ? (
          <p className="text-[11px] font-medium text-accent sm:text-xs">
            ↓ {numberFormatter.format(removedTokens)} tokens · {percentRemoved}%
            removed
          </p>
        ) : (
          <p className="text-[11px] font-normal text-muted">
            Your context is {numberFormatter.format(currentContextTokens)} tokens
            est.
          </p>
        )}
      </div>
      <p className="mt-1 text-[10px] text-muted sm:text-[11px]">
        <span className="capitalize">{density}</span> suggested context{" "}
        {numberFormatter.format(suggestedContextTokens)} tokens est.
        <span aria-hidden="true" className="mx-2 text-ink/20">
          ·
        </span>
        Your selection: {carryCount} carry
        <span aria-hidden="true" className="mx-1.5 text-ink/20">
          ·
        </span>
        {reconsiderCount} reconsider
        <span aria-hidden="true" className="mx-1.5 text-ink/20">
          ·
        </span>
        {dropCount} dropped
      </p>
    </div>
  );
}
