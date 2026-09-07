# Refract

**Think naturally. Carry only what matters.**

Refract is a context-engineering layer for AI conversations.

It takes long, messy AI chats, reconstructs the ideas and relationships inside them, and helps you decide exactly what context should carry forward when you continue a specific line of thought.

> **Messages are evidence. Ideas are the interface.**

---

## The problem

Human thought branches.

Chat interfaces do not.

A single conversation with an AI can contain:

* multiple ideas
* discarded directions
* side research
* decisions
* constraints
* open questions
* useful tangents
* irrelevant tangents

But all of that gets stored as one linear transcript.

When you want to continue a specific idea, you are usually left with three options:

1. Keep using the giant, increasingly polluted conversation.
2. Start a new conversation and manually explain everything again.
3. Ask the model for a summary and lose important structure or context.

Refract is an experiment in a different approach.

---

## How Refract works

```text
messy conversation
        ↓
recover thought structure
        ↓
select one thread
        ↓
build relevant context
        ↓
review what should carry forward
        ↓
export a clean continuation package
```

Rather than treating every chat message as an object, Refract extracts higher-level thoughts such as:

* ideas
* questions
* decisions
* constraints
* facts
* hypotheses
* research threads
* open questions

Each extracted thought retains provenance back to the messages it came from.

---

## The core interaction

### 1. Import a conversation

Paste an existing AI conversation or load a demo transcript.

### 2. Refract it

Refract analyzes the transcript and reconstructs the major thought threads and relationships between them.

### 3. Explore the thought map

The resulting map represents ideas rather than individual messages.

Select a thought to inspect:

* its summary
* current status
* established conclusions
* open questions
* source excerpts

### 4. Build context

Choose the idea you want to continue.

Refract proposes the context that matters specifically for that thought, including things such as:

* global constraints
* relevant facts
* previous decisions
* thought lineage
* dependencies
* related insights
* unresolved questions

Unrelated branches are excluded.

### 5. Control what gets inherited

Every proposed context item can be reviewed by the user.

Items can be marked as:

**Carry**
Include this information normally.

**Drop**
Do not include this information.

**Reconsider**
Preserve the historical context, but do not inherit the previous conclusion as established truth.

This is the central idea behind Refract:

> **AI proposes what context matters. The user controls what gets inherited.**

### 6. Continue cleanly

Refract compiles the selected information into a smaller, purpose-specific context package that can be copied into a new AI conversation.

---

## Example

A long brainstorming conversation might contain threads about:

```text
                   Rabbit Hole
                        │
                        ↓
Interview ───── Nonlinear Thinking
    │                   │
    │                   ↓
    │            Context Pollution
    │                   │
    │                   ↓
    ├─ Overkill ──── Refract
    │
    └─ AUX
```

If the user chooses to continue **Refract**, the next conversation should inherit the information necessary for Refract — not every detail about AUX, unrelated API research, or abandoned product ideas.

At the same time, global constraints such as a project deadline may still matter even if they are not semantically similar to the selected idea.

---

## Context reduction

Refract makes the effect of context curation visible.

For example:

```text
Original conversation
31,420 tokens

AI suggested context
7,180 tokens

Final context
5,940 tokens

81% removed
```

The goal is not simply to make prompts shorter.

The goal is to make inherited context **intentional**.

---

## MVP

The current version is focused on one end-to-end experience:

```text
Paste a large messy chat
        ↓
Click Refract
        ↓
Recognize the ideas in the generated map
        ↓
Choose one
        ↓
Inspect the context Refract believes matters
        ↓
Carry / Drop / Reconsider items
        ↓
Generate a smaller continuation package
        ↓
Copy it into a new AI conversation
```

Everything in the MVP is optimized around making that flow work well.

---

## Tech stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* React Flow

### Backend

* Next.js API routes / server actions
* LLM-powered structured extraction
* Zod validation

### Persistence

* Supabase
* Postgres

Authentication is not required for the initial demo.

---

## High-level architecture

Refract processes a transcript in two primary analysis stages.

### Pass 1 — Extract

Identify semantic objects such as thoughts, decisions, constraints, and global context.

```ts
type Thought = {
  id: string
  title: string
  summary: string
  type: ThoughtType
  status: ThoughtStatus
  sourceMessageIds: string[]
}
```

### Pass 2 — Structure

Identify relationships between thoughts.

```ts
type ThoughtEdge = {
  source: string
  target: string
  relation:
    | "led_to"
    | "related_to"
    | "depends_on"
    | "contradicts"
    | "evolved_into"
    | "branch_of"
}
```

Every important extracted item should remain traceable to its source messages.

---

## Core data model

The MVP revolves around five primary concepts:

```text
Message
Thought
ThoughtEdge
ContextItem
ContextPackage
```

A context item can contain information such as a:

```text
goal
constraint
fact
insight
decision
hypothesis
open question
```

and has one of three inheritance states:

```text
carry
drop
reconsider
```

---

## Product principles

### Messages are evidence. Ideas are the interface.

Raw messages provide provenance, but they should not dominate the interaction model.

### Do not make users manage the graph.

Refract should recover structure automatically. Users can correct it, but maintaining a graph should not become another organizational task.

### Provenance everywhere.

Important conclusions should be traceable back to the transcript excerpts that support them.

### Context editing matters more than graph visualization.

The graph helps the user decide which thought they want to continue.

The context editor is where the core value of the product lives.

### No lock-in.

The final context package should remain useful outside Refract and work with whichever AI system the user prefers.

---

## Not in the MVP

The initial version intentionally avoids:

* browser extensions
* automatic ChatGPT imports
* automatic Claude imports
* provider OAuth
* realtime synchronization
* a full chatbot
* collaboration
* multi-user workflows
* manual graph editing
* perfect graph layout
* vector databases unless necessary
* complex authentication
* native provider integrations

These can be explored later if the core interaction proves useful.

---

## Development

Clone the repository:

```bash
git clone <repository-url>
cd refract
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Environment variables and provider-specific setup will be documented as the implementation is added.

---

## Current status

**Early MVP / demo build.**

The immediate priority is to build the complete product flow with mocked or deterministic data first, then progressively replace those pieces with real transcript analysis and context generation.

---

## Why Refract?

Refract is not primarily:

* an AI mind map
* branching ChatGPT
* a conversation summarizer

The graph is a means to an end.

Its purpose is to answer:

> **Which thought do I want to continue?**

The product itself is about controlling what happens next.

**Refract reconstructs the thought structure inside messy AI conversations and lets you intentionally decide what the next conversation should inherit.**

