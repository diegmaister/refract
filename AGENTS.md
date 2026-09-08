<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Refract — Agent Instructions

## Product overview

Refract is a context-engineering layer for AI conversations.

It takes long, messy AI conversations, reconstructs the higher-level thought structure inside them, and helps the user intentionally decide what context should carry forward when continuing a specific idea.

Core positioning:

> Think naturally. Carry only what matters.

Core philosophy:

> Messages are evidence. Ideas are the interface.

Refract is NOT primarily:

* a mind-map application
* a branching chatbot
* a conversation summarizer
* a replacement for ChatGPT, Claude, Gemini, or other AI tools

The graph is a navigation mechanism that helps the user answer:

> Which thought do I want to continue?

The core product value is context curation and compilation.

---

# MVP goal

Optimize for this exact user journey:

```text
Paste a large messy conversation
        ↓
Analyze / Refract it
        ↓
See recognizable thought threads
        ↓
Choose one thought
        ↓
Inspect relevant context
        ↓
Carry / Drop / Reconsider context items
        ↓
Generate a much smaller clean context package
        ↓
Copy it into a new AI conversation
```

Do not add features that do not directly improve this flow unless explicitly requested.

---

# Current implementation strategy

Build the application progressively.

The preferred order is:

1. Static UI using deterministic mocked data
2. Core TypeScript domain models
3. Transcript import/parsing
4. LLM thought extraction
5. LLM relationship extraction
6. Context building
7. Provenance/source inspection
8. Context editing
9. Context compilation/export
10. Persistence only when needed

Do not introduce infrastructure early merely because it may be useful later.

---

# Tech stack

Use:

* Next.js
* App Router
* TypeScript
* React
* Tailwind CSS
* `@xyflow/react` for thought visualization
* Zod for runtime validation

Backend functionality should initially use:

* Next.js route handlers
* server-side utilities
* server actions where appropriate

Do not introduce a separate backend service unless explicitly requested.

Persistence may eventually use:

* Supabase
* PostgreSQL

Do not add Supabase until persistence is actually required.

---

# Next.js rules

This repository uses the locally installed version of Next.js.

Before implementing Next.js-specific APIs or conventions:

1. Read the relevant documentation under `node_modules/next/dist/docs/`.
2. Prefer the conventions documented by the installed version over assumptions from prior Next.js releases.
3. Do not suppress framework warnings without understanding them.
4. Do not introduce deprecated APIs.
5. Keep server/client boundaries explicit.

Use `"use client"` only where browser-side state, effects, event handlers, or client-only libraries require it.

Prefer Server Components by default.

---

# Project structure

Prefer a structure similar to:

```text
src/
├── app/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── import/
│   ├── thought-map/
│   ├── thought-detail/
│   ├── context-editor/
│   └── ui/
│
├── lib/
│   ├── refract/
│   ├── mock/
│   └── utils/
│
└── types/
```

Do not create folders until they are useful.

Avoid deep abstraction layers.

Keep product/domain logic separate from presentational components when practical.

---

# Core domain model

The application revolves around these concepts:

```ts
type Message = {
  id: string
  index: number
  role: "user" | "assistant"
  content: string
}

type ThoughtType =
  | "idea"
  | "question"
  | "decision"
  | "constraint"
  | "fact"
  | "hypothesis"
  | "research"
  | "open_question"

type ThoughtStatus =
  | "active"
  | "parked"
  | "discarded"
  | "resolved"

type Thought = {
  id: string
  title: string
  summary: string
  type: ThoughtType
  status: ThoughtStatus
  sourceMessageIds: string[]
}

type EdgeType =
  | "led_to"
  | "related_to"
  | "depends_on"
  | "contradicts"
  | "evolved_into"
  | "branch_of"

type ThoughtEdge = {
  source: string
  target: string
  relation: EdgeType
}

type ContextItemState =
  | "carry"
  | "drop"
  | "reconsider"

type ContextItem = {
  id: string
  content: string

  category:
    | "goal"
    | "constraint"
    | "fact"
    | "insight"
    | "decision"
    | "hypothesis"
    | "open_question"

  sourceMessageIds: string[]
  inclusionReason: string
  state: ContextItemState
}

type ContextPackage = {
  targetThoughtId: string
  items: ContextItem[]
  compiledContext: string
}
```

When runtime data comes from an LLM or external source, validate it with Zod.

Do not trust model-generated JSON without validation.

---

# Thought extraction philosophy

Do not model every transcript message as a graph node.

Messages are source evidence.

The primary objects shown to users should be semantic thought objects such as:

* Idea
* Question
* Decision
* Constraint
* Fact
* Hypothesis
* Research thread
* Open question

Every extracted thought should retain provenance through `sourceMessageIds`.

The user should eventually be able to inspect why Refract inferred something and see the original source messages.

---

# Thought graph

The thought graph should:

* show semantic thought objects
* remain visually readable
* communicate relationships between ideas
* support selecting a thought
* help users orient themselves

The thought graph should NOT:

* render every transcript message
* become a general-purpose graph editor
* require users to manually organize nodes
* prioritize perfect automatic layout over the core workflow

Do not spend excessive implementation effort on graph layout.

The context editor is more important than graph polish.

---

# Context building

The context builder is the hero feature.

When a target thought is selected, relevant context may include:

* global goals
* global constraints
* global facts
* the target thought
* ancestors / lineage
* dependencies
* relevant related thoughts
* previous decisions
* unresolved questions
* semantically relevant insights

Do not treat semantic similarity as the only relevance signal.

For example:

A deadline may be relevant because it constrains the entire project even if it is semantically dissimilar to the selected thought.

An unrelated technical research branch may share similar words but should still be excluded.

---

# Context states

Every proposed context item eventually supports three states:

## Carry

Include the information normally in the compiled context.

## Drop

Exclude the information entirely.

## Reconsider

Preserve the historical information but explicitly instruct the next model NOT to inherit the prior conclusion as established truth.

Example:

Original conclusion:

```text
A graph should be the main interaction model.
```

If marked `reconsider`, the compiled version should communicate something like:

```text
A previous discussion proposed using a graph as the primary interaction model.
Treat this as a hypothesis rather than an accepted conclusion and independently reconsider it.
```

`reconsider` is a core product concept.

Do not reduce it to a visual-only toggle.

---

# Context editor UX

The context editor should feel more important than the graph.

Each context item should eventually communicate:

* its content
* its category
* why it was included
* its current state
* its provenance

The user should be able to understand:

> Why does Refract think this matters?

Prefer clear information hierarchy over visual decoration.

---

# Provenance

Provenance is a first-class requirement.

Important extracted conclusions should be traceable to source messages.

Do not generate fake source excerpts or fake message IDs in production code.

Mock source data is acceptable while building the static MVP, but keep mock data clearly separated from application logic.

---

# Context metrics

The product should eventually communicate the reduction between:

* original conversation size
* AI suggested context
* final user-curated context

For the MVP, approximate token counts are acceptable.

Avoid introducing a complex tokenization dependency unless necessary.

The metric exists to make the value proposition visible, not to provide billing-grade token accounting.

---

# UI principles

Aim for a product that feels:

* focused
* calm
* structured
* technical without feeling like developer tooling
* information-dense without being cluttered

Prefer:

* whitespace
* restrained borders
* clear typography
* subtle hierarchy
* purposeful interaction states

Avoid:

* excessive gradients
* glassmorphism everywhere
* unnecessary animations
* dashboard clutter
* huge marketing-style headings inside the application
* excessive card nesting
* generic AI sparkle imagery
* chatbot-style bubbles as the primary interface

Do not make the UI look like a generic AI SaaS template.

---

# Responsive behavior

Desktop is the primary demo target.

Still avoid layouts that fundamentally break at narrower viewport widths.

Do not spend significant time on mobile polish unless explicitly requested.

---

# Accessibility

Use semantic HTML where practical.

Interactive elements must:

* be keyboard reachable
* have visible focus states
* use buttons for actions rather than clickable `div` elements
* include accessible labels when the visible text is insufficient

Do not sacrifice accessibility for visual styling.

---

# Mock data

Early implementation should use deterministic mock data.

Keep mock data under a dedicated location such as:

```text
src/lib/mock/
```

Mock data should represent the intended real domain objects.

Do not hardcode significant domain data directly inside React component render functions.

This makes it easier to replace mocks with LLM-generated data later.

---

# State management

Use local React state initially.

Do not add Redux, Zustand, XState, or another global state library unless application complexity clearly justifies it or the user explicitly requests it.

Prefer the simplest state model that works.

---

# Styling

Use Tailwind CSS.

Prefer utility classes over introducing a second styling system.

Small reusable UI primitives are welcome when repetition emerges.

Do not prematurely build a large design system.

Do not add a component library unless explicitly requested.

---

# Dependencies

Before adding a dependency, ask:

1. Is this necessary for the current feature?
2. Can the same result be achieved cleanly with the existing stack?
3. Does it materially reduce implementation complexity?

Avoid dependency accumulation.

Do not install:

* authentication libraries
* database ORMs
* vector databases
* state management libraries
* animation frameworks
* component libraries
* additional backend frameworks

unless the feature currently being implemented requires them.

---

# Error handling

Do not silently swallow errors.

For user-facing failures:

* present a useful message
* preserve user input when possible
* allow retry where appropriate

For development errors:

* log enough context to diagnose the issue
* avoid exposing secrets or complete sensitive transcripts unnecessarily

---

# Environment variables

Secrets belong in environment variables.

Never commit:

* API keys
* provider secrets
* Supabase service role keys
* authentication secrets

Use `.env.local` for local secrets.

When environment variables are introduced, document their names in `.env.example` without real values.

---

# LLM integration rules

When LLM integration is introduced:

* call the provider server-side
* request structured output
* validate results with Zod
* handle malformed responses
* keep provider-specific code behind a small abstraction
* preserve source-message provenance
* keep prompts versionable and easy to inspect

Do not call provider APIs directly from client components.

Do not expose API keys to the browser.

Do not introduce embeddings or a vector database unless there is a demonstrated need.

---

# Do NOT build yet

Unless explicitly requested, do not build:

* authentication
* user accounts
* browser extensions
* ChatGPT import integration
* Claude import integration
* Gemini import integration
* OAuth with AI providers
* realtime synchronization
* a general-purpose chatbot
* collaboration
* multi-user support
* manual graph editing
* elaborate automatic graph layout
* vector search
* a vector database
* native provider integrations
* MCP integration
* payment functionality
* analytics infrastructure

These are outside the current MVP.

---

# Coding standards

Use TypeScript.

Avoid `any` unless there is a specific documented reason.

Prefer:

* small components
* explicit prop types
* clear naming
* pure utility functions
* simple data flow

Avoid:

* giant page components
* unnecessary abstraction
* speculative architecture
* clever generic utilities
* duplicate types
* excessive comments explaining obvious code

Comments should explain why, not restate what the code already says.

---

# Changes and scope

When given a task:

1. Inspect the existing implementation first.
2. Read relevant local Next.js documentation when touching framework-specific behavior.
3. Make the smallest coherent change that fulfills the task.
4. Do not refactor unrelated files.
5. Do not add unrelated features.
6. Preserve working behavior unless the requested change explicitly replaces it.
7. Run relevant checks after implementation.

Before considering a task complete, run at minimum:

```bash
npm run lint
npm run build
```

Fix errors introduced by the change.

Do not hide errors by disabling lint rules or weakening TypeScript configuration unless there is a strong documented reason.

---

# Git behavior

Do not commit automatically unless explicitly asked.

Do not push automatically unless explicitly asked.

Do not rewrite Git history.

Do not modify `.gitignore` unnecessarily.

Avoid including generated temporary files in commits.

---

# First milestone

The first implementation milestone is a static, polished Refract demo using mocked data.

It should demonstrate:

1. an import / landing screen
2. a mocked conversation
3. a mocked thought map
4. selecting a thought
5. a thought detail view
6. a context editor
7. Carry / Drop / Reconsider controls
8. context reduction metrics
9. compiled continuation context
10. copy-to-clipboard

Do not implement LLM calls, Supabase, authentication, or external integrations during this milestone unless explicitly instructed.

The goal is to establish the complete interaction model before connecting real intelligence or persistence.

---

# Decision rule

When uncertain between:

* adding architecture for possible future requirements

and

* implementing the simplest clean version needed for the current MVP

choose the simplest clean version.

Refract should demonstrate a strong product idea through a convincing end-to-end experience, not through infrastructure complexity.

