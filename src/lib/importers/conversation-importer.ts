import { z } from "zod";

const importedMessageSchema = z
  .object({
    id: z.string().min(1),
    index: z.number().int().nonnegative(),
    role: z.enum(["user", "assistant"]),
    roleConfidence: z.literal(1),
    roleSource: z.literal("explicit"),
    content: z.string().min(1).max(200_000),
  })
  .strict();

export const importedConversationSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    messages: z.array(importedMessageSchema).min(1).max(500),
    rawTranscript: z.string().min(1).max(200_000),
  })
  .strict();

export type ImportedConversation = z.infer<typeof importedConversationSchema>;

export interface ConversationImporter {
  canHandle(input: string): boolean;
  import(input: string): Promise<ImportedConversation>;
}

export function messagesToRawTranscript(
  messages: ImportedConversation["messages"],
): string {
  return messages
    .map((message) => {
      const label = message.role === "assistant" ? "Assistant" : "User";
      return `${label}:\n${message.content}`;
    })
    .join("\n\n");
}
