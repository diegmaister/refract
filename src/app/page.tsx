import { ConversationImport } from "@/components/import/conversation-import";

const steps = [
  { number: "01", title: "Import", description: "Paste a messy conversation." },
  {
    number: "02",
    title: "Refract",
    description: "Recover the ideas and relationships inside it.",
  },
  {
    number: "03",
    title: "Continue",
    description: "Carry only the context that matters.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center border border-accent/30 bg-accent-soft"
            >
              <span className="size-1.5 bg-accent" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">
              Refract
            </span>
          </div>
          <p className="hidden text-xs tracking-[0.02em] text-muted sm:block">
            Context engineering for AI conversations
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <section aria-labelledby="import-heading">
          <div className="mb-8 max-w-2xl">
            <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
              New refraction
            </p>
            <h1
              id="import-heading"
              className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-ink"
            >
              Refract your conversation
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted sm:text-base">
              Paste a messy AI conversation and Refract will reconstruct the
              ideas inside it, so you can decide what should carry forward.
            </p>
          </div>

          <ConversationImport />
        </section>

        <section
          aria-labelledby="how-it-works-heading"
          className="mt-16 border-t border-ink/10 pt-7 sm:mt-20"
        >
          <h2
            id="how-it-works-heading"
            className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted"
          >
            How it works
          </h2>
          <ol className="mt-6 grid gap-7 sm:grid-cols-3 sm:gap-10">
            {steps.map((step) => (
              <li key={step.number} className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="pt-0.5 font-mono text-[10px] text-accent">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
