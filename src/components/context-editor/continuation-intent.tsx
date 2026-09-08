import { continuationIntentOptions } from "@/lib/refract/continuation-intent";
import type {
  ContinuationIntent,
  ContinuationIntentSelection,
} from "@/types/refract";

type ContinuationIntentStepProps = {
  thoughtTitle: string;
  intent: ContinuationIntentSelection;
  itemCount: number;
  carryCount: number;
  reconsiderCount: number;
  dropCount: number;
  tokenEstimate: number;
  onIntentChange: (intent: ContinuationIntent) => void;
  onCustomInstructionChange: (instruction: string) => void;
  onBack: () => void;
  onGenerate: () => void;
};

export function ContinuationIntentStep({
  thoughtTitle,
  intent,
  itemCount,
  carryCount,
  reconsiderCount,
  dropCount,
  tokenEstimate,
  onIntentChange,
  onCustomInstructionChange,
  onBack,
  onGenerate,
}: ContinuationIntentStepProps) {
  const customIntentIsEmpty =
    intent.type === "custom" && !intent.customInstruction?.trim();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-medium text-muted underline decoration-ink/15 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        Back to context
      </button>

      <div className="mt-9 max-w-xl">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-accent">
          Continue: {thoughtTitle}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          How should the next AI continue?
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Choose how the next conversation should use the context you just
          prepared.
        </p>
      </div>

      <div className="mt-7 border-y border-ink/10 py-3 text-[11px] leading-5 text-muted">
        <span className="font-medium text-ink">{itemCount} context objects</span>
        <span aria-hidden="true" className="mx-2 text-ink/20">
          ·
        </span>
        {carryCount} carry
        <span aria-hidden="true" className="mx-1.5 text-ink/20">
          ·
        </span>
        {reconsiderCount} reconsider
        <span aria-hidden="true" className="mx-1.5 text-ink/20">
          ·
        </span>
        {dropCount} dropped
        <span aria-hidden="true" className="mx-2 text-ink/20">
          ·
        </span>
        {tokenEstimate} tokens est.
      </div>

      <fieldset className="mt-8">
        <legend className="sr-only">Continuation intent</legend>
        <div className="border-b border-ink/10">
          {continuationIntentOptions.map((option) => {
            const selected = intent.type === option.type;

            return (
              <div key={option.type} className="border-t border-ink/10">
                <label className="group grid cursor-pointer grid-cols-[1rem_1fr] gap-3 px-3 py-4 hover:bg-accent-soft/35 sm:px-4">
                  <input
                    type="radio"
                    name="continuation-intent"
                    value={option.type}
                    checked={selected}
                    onChange={() => onIntentChange(option.type)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-3.5 place-items-center rounded-full border border-ink/30 peer-checked:border-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent"
                  >
                    {selected && <span className="size-1.5 rounded-full bg-accent" />}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">
                      {option.title}
                      {selected && (
                        <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.1em] text-accent">
                          Selected
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block max-w-xl text-xs leading-5 text-muted">
                      {option.description}
                    </span>
                  </span>
                </label>

                {option.type === "custom" && selected && (
                  <div className="px-3 pb-4 pl-10 sm:px-4 sm:pl-11">
                    <label
                      htmlFor="custom-intent"
                      className="sr-only"
                    >
                      Custom continuation instruction
                    </label>
                    <textarea
                      id="custom-intent"
                      value={intent.customInstruction ?? ""}
                      onChange={(event) =>
                        onCustomInstructionChange(event.target.value)
                      }
                      placeholder="e.g. Focus only on the interaction model and ignore implementation details for now."
                      rows={3}
                      className="w-full resize-y border border-ink/15 bg-surface px-3 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-muted/55 focus:border-accent/70 focus:shadow-[0_0_0_3px_rgba(40,102,87,0.10)]"
                    />
                    {customIntentIsEmpty && (
                      <p className="mt-1.5 text-[11px] text-muted">
                        Add an instruction to generate the final context.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={customIntentIsEmpty}
          className="inline-flex h-11 w-full items-center justify-between bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:bg-ink/25 sm:w-64"
        >
          Generate final context
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3 8h9.5m-3-3 3 3-3 3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </main>
  );
}
