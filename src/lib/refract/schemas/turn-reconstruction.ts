import { z } from "zod";

export const turnReconstructionSchema = z
  .object({
    turns: z
      .array(
        z
          .object({
            startBlock: z.number().int().nonnegative(),
            endBlock: z.number().int().nonnegative(),
            role: z.enum(["user", "assistant", "unknown"]),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();

export type TurnReconstructionOutput = z.infer<
  typeof turnReconstructionSchema
>;
