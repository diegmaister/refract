import { z } from "zod";

export const MAX_IMPORTED_CONVERSATION_CHARS = 2_000_000;
export const MAX_IMPORTED_CONVERSATION_MESSAGES = 10_000;

const importedMessageSchema = z
  .object({
    id: z.string().min(1),
    index: z.number().int().nonnegative(),
    role: z.enum(["user", "assistant"]),
    roleConfidence: z.literal(1),
    roleSource: z.literal("explicit"),
    content: z.string().min(1).max(MAX_IMPORTED_CONVERSATION_CHARS),
  })
  .strict();

export const importedConversationSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    messages: z
      .array(importedMessageSchema)
      .min(1)
      .max(MAX_IMPORTED_CONVERSATION_MESSAGES),
    rawTranscript: z
      .string()
      .min(1)
      .max(MAX_IMPORTED_CONVERSATION_CHARS),
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
