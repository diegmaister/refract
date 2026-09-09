import {
  ANALYSIS_CHUNK_MAX_ESTIMATED_TOKENS,
  estimateNormalizedMessagesTokens,
} from "@/lib/refract/analysis-limits";
import { ESTIMATED_CHARACTERS_PER_TOKEN } from "@/lib/refract/estimate-tokens";
import type { Message } from "@/types/refract";

export type AnalysisChunkMessage = Message & {
  fragment?: {
    part: number;
    total: number;
  };
};

export type ConversationAnalysisChunk = {
  index: number;
  messages: AnalysisChunkMessage[];
};

const FRAGMENT_SERIALIZATION_HEADROOM_CHARS = 1_000;

function splitOversizedMessage(message: Message): AnalysisChunkMessage[] {
  const emptyFragmentOverhead = JSON.stringify({
    ...message,
    content: "",
    fragment: { part: 1, total: 1 },
  }).length;
  const maximumFragmentCharacters = Math.max(
    1,
    ANALYSIS_CHUNK_MAX_ESTIMATED_TOKENS *
      ESTIMATED_CHARACTERS_PER_TOKEN -
      emptyFragmentOverhead -
      FRAGMENT_SERIALIZATION_HEADROOM_CHARS,
  );
  const total = Math.ceil(message.content.length / maximumFragmentCharacters);

  return Array.from({ length: total }, (_, fragmentIndex) => ({
    ...message,
    content: message.content.slice(
      fragmentIndex * maximumFragmentCharacters,
      (fragmentIndex + 1) * maximumFragmentCharacters,
    ),
    fragment: { part: fragmentIndex + 1, total },
  }));
}

export function chunkConversationMessages(
  messages: Message[],
): ConversationAnalysisChunk[] {
  const chunks: ConversationAnalysisChunk[] = [];
  let currentMessages: AnalysisChunkMessage[] = [];

  function flushChunk() {
    if (currentMessages.length === 0) return;

    chunks.push({ index: chunks.length, messages: currentMessages });
    currentMessages = [];
  }

  for (const message of messages) {
    if (
      estimateNormalizedMessagesTokens([message]) >
      ANALYSIS_CHUNK_MAX_ESTIMATED_TOKENS
    ) {
      flushChunk();
      for (const fragment of splitOversizedMessage(message)) {
        chunks.push({ index: chunks.length, messages: [fragment] });
      }
      continue;
    }

    const candidateMessages = [...currentMessages, message];
    if (
      currentMessages.length > 0 &&
      estimateNormalizedMessagesTokens(candidateMessages) >
        ANALYSIS_CHUNK_MAX_ESTIMATED_TOKENS
    ) {
      flushChunk();
    }

    currentMessages.push(message);
  }

  flushChunk();
  return chunks;
}
