type ContextMetricsProps = {
  originalTokens: number;
  suggestedTokens: number;
  finalTokens: number;
  percentRemoved: number;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function ContextMetrics({
  originalTokens,
  suggestedTokens,
  finalTokens,
  percentRemoved,
}: ContextMetricsProps) {
  const metrics = [
    { label: "Original conversation", value: originalTokens },
    { label: "Suggested context", value: suggestedTokens },
    { label: "Your final context", value: finalTokens },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 border border-ink/10 bg-surface sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="border-b border-r border-ink/10 px-4 py-3 last:border-r-0 sm:border-b-0"
          >
            <p className="text-[10px] leading-4 text-muted">{metric.label}</p>
            <p className="mt-1 font-mono text-sm font-medium text-ink">
              {numberFormatter.format(metric.value)} tokens
              <span className="ml-1 text-[9px] font-normal text-muted">est.</span>
            </p>
          </div>
        ))}
        <div className="px-4 py-3">
          <p className="text-[10px] leading-4 text-muted">Reduction</p>
          <p className="mt-1 font-mono text-sm font-medium text-accent">
            {percentRemoved}% removed
          </p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted">
        Estimates use approximately four characters per token.
      </p>
    </div>
  );
}
