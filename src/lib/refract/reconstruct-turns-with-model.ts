import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import { getOpenAIClient, getOpenAIModel } from "@/lib/llm/openai";
import { TURN_RECONSTRUCTION_PROMPT } from "@/lib/refract/prompts/reconstruct-turns";
import {
  turnReconstructionSchema,
  type TurnReconstructionOutput,
} from "@/lib/refract/schemas/turn-reconstruction";
import type { Message } from "@/types/refract";

const MAX_RECONSTRUCTION_BLOCKS = 500;
const LARGE_UNKNOWN_MESSAGE_LENGTH = 1_200;

function createSourceBlocks(rawTranscript: string): string[] {
  const blocks = rawTranscript
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  while (blocks[0]?.trim() === "") blocks.shift();
  while (blocks.at(-1)?.trim() === "") blocks.pop();

  return blocks;
}

export function needsModelTurnReconstruction(
  rawTranscript: string,
  messages: Message[],
): boolean {
  if (messages.length === 0) return false;
  if (messages.some((message) => message.roleSource === "explicit")) {
    return false;
  }

  const nonEmptyLineCount = rawTranscript
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim()).length;

  return (
    nonEmptyLineCount > 1 ||
    messages.some(
      (message) =>
        message.role === "unknown" &&
        message.content.length >= LARGE_UNKNOWN_MESSAGE_LENGTH,
    )
  );
}

function hasValidCoverage(
  turns: TurnReconstructionOutput["turns"],
  blockCount: number,
): boolean {
  if (turns.length === 0 || turns[0].startBlock !== 0) return false;

  for (const [index, turn] of turns.entries()) {
    if (turn.startBlock > turn.endBlock || turn.endBlock >= blockCount) {
      return false;
    }

    if (index > 0 && turn.startBlock !== turns[index - 1].endBlock + 1) {
      return false;
    }
  }

  return turns.at(-1)?.endBlock === blockCount - 1;
}

function rebuildMessages(
  blocks: string[],
  reconstruction: TurnReconstructionOutput,
): Message[] | undefined {
  if (!hasValidCoverage(reconstruction.turns, blocks.length)) return undefined;

  const messages = reconstruction.turns.map((turn, index) => ({
    id: `message-${index + 1}`,
    index,
    role: turn.role,
    roleConfidence:
      turn.role === "unknown"
        ? Math.min(turn.confidence, 0.5)
        : Math.min(turn.confidence, 0.99),
    roleSource: "inferred" as const,
    content: blocks.slice(turn.startBlock, turn.endBlock + 1).join("\n").trim(),
  }));

  if (messages.some((message) => !message.content)) return undefined;

  const originalText = blocks.join("\n").replace(/\s/g, "");
  const rebuiltText = messages
    .map((message) => message.content)
    .join("\n")
    .replace(/\s/g, "");

  if (originalText !== rebuiltText) return undefined;

  return messages;
}

export async function reconstructTurnsWithModel(
  rawTranscript: string,
  deterministicMessages: Message[],
): Promise<Message[]> {
  if (!needsModelTurnReconstruction(rawTranscript, deterministicMessages)) {
    return deterministicMessages;
  }

  const blocks = createSourceBlocks(rawTranscript);
  if (blocks.length === 0 || blocks.length > MAX_RECONSTRUCTION_BLOCKS) {
    return deterministicMessages;
  }

  try {
    const response = await getOpenAIClient().responses.parse({
      model: getOpenAIModel(),
      store: false,
      input: [
        { role: "system", content: TURN_RECONSTRUCTION_PROMPT },
        {
          role: "user",
          content: blocks
            .map((block, index) => `[${index}] ${JSON.stringify(block)}`)
            .join("\n"),
        },
      ],
      text: {
        format: zodTextFormat(
          turnReconstructionSchema,
          "refract_turn_reconstruction",
        ),
      },
    });

    if (!response.output_parsed) return deterministicMessages;

    return (
      rebuildMessages(blocks, response.output_parsed) ?? deterministicMessages
    );
  } catch (error) {
    console.warn(
      "Model-assisted turn reconstruction failed; using deterministic turns.",
      { errorType: error instanceof Error ? error.name : "UnknownError" },
    );
    return deterministicMessages;
  }
}
