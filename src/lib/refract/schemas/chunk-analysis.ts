import { z } from "zod";

const candidateIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const sourceMessageIdsSchema = z.array(z.string().min(1)).min(1).max(10_000);

export const chunkAnalysisSchema = z
  .object({
    candidateThoughts: z
      .array(
        z
          .object({
            candidateId: candidateIdSchema,
            title: z.string().min(1).max(100),
            summary: z.string().min(1).max(320),
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
      .max(12),
    globalContextCandidates: z
      .array(
        z
          .object({
            candidateId: candidateIdSchema,
            title: z.string().min(1).max(120),
            content: z.string().min(1).max(400),
            kind: z.enum(["goal", "constraint", "fact", "preference"]),
            sourceMessageIds: sourceMessageIdsSchema,
          })
          .strict(),
      )
      .max(12),
    contextCandidates: z
      .array(
        z
          .object({
            candidateId: candidateIdSchema,
            title: z.string().min(1).max(120),
            content: z.string().min(1).max(400),
            kind: z.enum([
              "decision",
              "insight",
              "development",
              "hypothesis",
              "open_question",
              "meaningful_exclusion",
            ]),
            sourceCandidateThoughtIds: z.array(candidateIdSchema).max(8),
            sourceMessageIds: sourceMessageIdsSchema,
          })
          .strict(),
      )
      .max(24),
  })
  .strict();

export type ChunkAnalysisOutput = z.infer<typeof chunkAnalysisSchema>;
