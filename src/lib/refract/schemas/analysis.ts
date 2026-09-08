import { z } from "zod";

const semanticIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .describe("Machine-safe internal identifier in lowercase kebab-case.");

const sourceMessageIdsSchema = z.array(z.string().min(1)).min(1).max(100);

const contextSeedSchema = z
  .object({
    id: semanticIdSchema,
    title: z
      .string()
      .min(1)
      .max(120)
      .describe(
        "Concise, natural-language headline that is understandable without reading the content; never an ID or taxonomy label.",
      ),
    content: z.string().min(1).max(1200),
    category: z.enum([
      "goal",
      "constraint",
      "fact",
      "insight",
      "decision",
      "hypothesis",
      "open_question",
    ]),
    sourceMessageIds: sourceMessageIdsSchema,
    sourceThoughtId: semanticIdSchema.nullable(),
    priority: z.enum(["essential", "recommended", "supporting"]),
  })
  .strict();

const contextSelectionSchema = z
  .object({
    seed: contextSeedSchema,
    section: z.enum([
      "current_goal",
      "global_constraints",
      "background_lineage",
      "core_insights",
      "related_ideas",
      "previous_hypotheses",
      "open_questions",
      "excluded",
    ]),
    state: z.enum(["carry", "drop", "reconsider"]),
    inclusionReason: z.string().min(1).max(500),
  })
  .strict();

export const analysisModelOutputSchema = z
  .object({
    conversationTitle: z
      .string()
      .min(1)
      .max(100)
      .describe(
        "Natural, human-readable title describing the conversation's central subject.",
      ),
    thoughts: z
      .array(
        z
          .object({
            id: semanticIdSchema,
            title: z
              .string()
              .min(1)
              .max(100)
              .describe(
                "Natural 2–7 word concept name with spaces; never a machine ID.",
              ),
            summary: z.string().min(1).max(800),
            type: z.enum([
              "idea",
              "question",
              "decision",
              "constraint",
              "fact",
              "hypothesis",
              "research",
              "open_question",
            ]),
            status: z.enum(["active", "parked", "discarded", "resolved"]),
            sourceMessageIds: sourceMessageIdsSchema,
          })
          .strict(),
      )
      .min(1)
      .max(20),
    edges: z
      .array(
        z
          .object({
            source: semanticIdSchema,
            target: semanticIdSchema,
            relation: z.enum([
              "led_to",
              "related_to",
              "depends_on",
              "contradicts",
              "evolved_into",
              "branch_of",
            ]),
          })
          .strict(),
      )
      .max(60),
    globalContext: z
      .object({
        goals: z.array(contextSeedSchema).max(20),
        constraints: z.array(contextSeedSchema).max(20),
        facts: z.array(contextSeedSchema).max(20),
        preferences: z.array(contextSeedSchema).max(20),
      })
      .strict(),
    thoughtContextMetadata: z
      .array(
        z
          .object({
            thoughtId: semanticIdSchema,
            globalContextItemIds: z.array(semanticIdSchema).max(80),
            context: z.array(contextSelectionSchema).max(40),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

export type AnalysisModelOutput = z.infer<typeof analysisModelOutputSchema>;
