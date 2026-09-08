import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import {
  getOpenAIClient,
  getOpenAIModel,
  OpenAIConfigurationError,
} from "@/lib/llm/openai";
import { ANALYZE_CONVERSATION_PROMPT } from "@/lib/refract/prompts/analyze-conversation";
import { reconstructTurns } from "@/lib/refract/reconstruct-turns";
import { reconstructTurnsWithModel } from "@/lib/refract/reconstruct-turns-with-model";
import { analysisModelOutputSchema } from "@/lib/refract/schemas/analysis";
import {
  AnalysisIntegrityError,
  validateAndSanitizeAnalysis,
} from "@/lib/refract/validate-analysis";
import type { Message, RefractAnalysis } from "@/types/refract";

export type ConversationAnalysisErrorCode =
  | "provider_failure"
  | "structured_output_failure"
  | "integrity_failure";

export class ConversationAnalysisError extends Error {
  constructor(
    public readonly code: ConversationAnalysisErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ConversationAnalysisError";
  }
}

export async function analyzeConversation(
  conversation: string | Message[],
): Promise<RefractAnalysis> {
  const messages =
    typeof conversation === "string"
      ? await reconstructTurnsWithModel(
          conversation,
          reconstructTurns(conversation),
        )
      : conversation;

  let output: unknown;

  try {
    const response = await getOpenAIClient().responses.parse({
      model: getOpenAIModel(),
      store: false,
      input: [
        { role: "system", content: ANALYZE_CONVERSATION_PROMPT },
        {
          role: "user",
          content: `Analyze these normalized messages:\n\n${JSON.stringify(
            messages,
            null,
            2,
          )}`,
        },
      ],
      text: {
        format: zodTextFormat(
          analysisModelOutputSchema,
          "refract_conversation_analysis",
        ),
      },
      max_output_tokens: 16_000,
    });

    output = response.output_parsed;
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) throw error;
    if (error instanceof AnalysisIntegrityError) throw error;

    console.error("OpenAI analysis request failed.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      status:
        error && typeof error === "object" && "status" in error
          ? error.status
          : undefined,
    });

    throw new ConversationAnalysisError(
      "provider_failure",
      "OpenAI could not analyze this conversation. Please try again.",
    );
  }

  if (!output) {
    throw new ConversationAnalysisError(
      "structured_output_failure",
      "OpenAI returned an incomplete analysis. Please try again.",
    );
  }

  try {
    const parsedOutput = analysisModelOutputSchema.parse(output);
    return validateAndSanitizeAnalysis(parsedOutput, messages);
  } catch (error) {
    if (error instanceof AnalysisIntegrityError) {
      throw new ConversationAnalysisError(
        "integrity_failure",
        "The analysis could not be connected safely to the source messages. Please try again.",
      );
    }

    throw new ConversationAnalysisError(
      "structured_output_failure",
      "OpenAI returned an invalid analysis. Please try again.",
    );
  }
}
