import { estimateTokens } from "@/lib/refract/estimate-tokens";
import type { Message } from "@/types/refract";

/**
 * Dispatch threshold only. The hard import safety limit is intentionally
 * separate and higher. This leaves substantial prompt and output headroom in
 * the configured model while keeping ordinary large conversations to one
 * semantic analysis call.
 */
export const DIRECT_ANALYSIS_MAX_CHARS = 600_000;
export const ANALYSIS_CHUNK_MAX_ESTIMATED_TOKENS = 32_000;

export function countMessageContentCharacters(messages: Message[]): number {
  return messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
}

export function estimateNormalizedMessagesTokens(messages: Message[]): number {
  return estimateTokens(JSON.stringify(messages));
}
