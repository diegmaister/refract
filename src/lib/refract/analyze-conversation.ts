import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  getOpenAIClient,
  getOpenAIModel,
  OpenAIConfigurationError,
} from "@/lib/llm/openai";
import {
  countMessageContentCharacters,
  DIRECT_ANALYSIS_MAX_CHARS,
} from "@/lib/refract/analysis-limits";
import {
  chunkConversationMessages,
  type ConversationAnalysisChunk,
} from "@/lib/refract/chunk-conversation";
import { ANALYZE_CONVERSATION_CHUNK_PROMPT } from "@/lib/refract/prompts/analyze-conversation-chunk";
import { ANALYZE_CONVERSATION_PROMPT } from "@/lib/refract/prompts/analyze-conversation";
import { RECONCILE_CONVERSATION_PROMPT } from "@/lib/refract/prompts/reconcile-conversation";
import { reconstructTurns } from "@/lib/refract/reconstruct-turns";
import { reconstructTurnsWithModel } from "@/lib/refract/reconstruct-turns-with-model";
import {
  analysisModelOutputSchema,
  type AnalysisModelOutput,
} from "@/lib/refract/schemas/analysis";
import {
  chunkAnalysisSchema,
  type ChunkAnalysisOutput,
} from "@/lib/refract/schemas/chunk-analysis";
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

type ProviderErrorDetails = {
  httpStatus?: number;
  providerCode?: string;
  providerType?: string;
  requestId?: string;
  retryAfterMs?: number;
};

type RateLimitKind = "temporary" | "billing_or_quota";

const CHUNK_APPLICATION_RETRIES = 2;
const CHUNK_RETRY_BASE_DELAY_MS = 1_000;
const CHUNK_BACKOFF_MAX_DELAY_MS = 60_000;
const NON_RETRYABLE_RATE_LIMIT_MARKERS = [
  "billing",
  "credit",
  "insufficient_quota",
  "organization_spend_limit",
  "organization_usage_limit",
  "project_spend_limit",
  "quota",
  "spend_limit",
  "usage_limit",
] as const;

const TEMPORARY_RATE_LIMIT_MESSAGE =
  "OpenAI is temporarily rate-limiting this analysis. Please wait a moment and retry.";
const BILLING_RATE_LIMIT_MESSAGE =
  "Your configured OpenAI API account cannot process more requests right now. Check API billing and usage limits.";

function parseRetryDelay(headers: Headers | undefined): number | undefined {
  const retryAfterMillisecondsHeader = headers?.get("retry-after-ms");
  const retryAfterMilliseconds = Number(retryAfterMillisecondsHeader);
  if (
    retryAfterMillisecondsHeader !== null &&
    retryAfterMillisecondsHeader !== undefined &&
    Number.isFinite(retryAfterMilliseconds) &&
    retryAfterMilliseconds >= 0
  ) {
    return retryAfterMilliseconds;
  }

  const retryAfter = headers?.get("retry-after");
  if (!retryAfter) return undefined;

  const seconds = Number(retryAfter);
  const delay = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(retryAfter) - Date.now();

  return Number.isFinite(delay) && delay >= 0 ? delay : undefined;
}

function getProviderErrorDetails(error: unknown): ProviderErrorDetails {
  if (!(error instanceof OpenAI.APIError)) return {};

  return {
    httpStatus: error.status,
    providerCode: error.code ?? undefined,
    providerType: error.type,
    requestId: error.requestID ?? undefined,
    retryAfterMs: parseRetryDelay(error.headers),
  };
}

function classifyRateLimit(
  details: ProviderErrorDetails,
): RateLimitKind | undefined {
  if (details.httpStatus !== 429) return undefined;

  const providerClassification = `${details.providerCode ?? ""} ${
    details.providerType ?? ""
  }`.toLowerCase();
  const isBillingOrQuota = NON_RETRYABLE_RATE_LIMIT_MARKERS.some((marker) =>
    providerClassification.includes(marker),
  );

  return isBillingOrQuota ? "billing_or_quota" : "temporary";
}

function getProviderFailureMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  const rateLimitKind = classifyRateLimit(getProviderErrorDetails(error));
  if (rateLimitKind === "temporary") return TEMPORARY_RATE_LIMIT_MESSAGE;
  if (rateLimitKind === "billing_or_quota") return BILLING_RATE_LIMIT_MESSAGE;
  return fallbackMessage;
}

function logProviderFailure(
  error: unknown,
  stage: string,
  retryDelayMs?: number,
) {
  if (process.env.NODE_ENV !== "development") return;

  const details = getProviderErrorDetails(error);
  console.error("OpenAI analysis request failed.", {
    stage,
    errorType: error instanceof Error ? error.name : "UnknownError",
    ...details,
    retryDelayMs,
  });
}

function getChunkRetryDelay(
  details: ProviderErrorDetails,
  retryNumber: number,
): number | undefined {
  if (classifyRateLimit(details) !== "temporary") return undefined;

  if (details.retryAfterMs !== undefined) {
    return details.retryAfterMs;
  }

  const exponentialDelay =
    CHUNK_RETRY_BASE_DELAY_MS * 2 ** (retryNumber - 1);
  const jitter = Math.random() * CHUNK_RETRY_BASE_DELAY_MS * 0.25;
  return Math.min(exponentialDelay + jitter, CHUNK_BACKOFF_MAX_DELAY_MS);
}

function waitForRetry(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function requestFinalAnalysis(
  systemPrompt: string,
  userContent: string,
  schemaName: string,
  stage: string,
): Promise<AnalysisModelOutput> {
  let output: unknown;

  try {
    const response = await getOpenAIClient().responses.parse({
      model: getOpenAIModel(),
      store: false,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      text: {
        format: zodTextFormat(analysisModelOutputSchema, schemaName),
      },
      max_output_tokens: 16_000,
    });

    output = response.output_parsed;
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) throw error;

    logProviderFailure(error, stage);
    throw new ConversationAnalysisError(
      "provider_failure",
      getProviderFailureMessage(
        error,
        "OpenAI could not analyze this conversation. Please try again.",
      ),
    );
  }

  const parsedOutput = analysisModelOutputSchema.safeParse(output);
  if (!parsedOutput.success) {
    throw new ConversationAnalysisError(
      "structured_output_failure",
      "OpenAI returned an incomplete analysis. Please try again.",
    );
  }

  return parsedOutput.data;
}

function validateChunkProvenance(
  output: ChunkAnalysisOutput,
  chunk: ConversationAnalysisChunk,
  chunkNumber: number,
) {
  const validMessageIds = new Set(
    chunk.messages.map((message) => message.id),
  );
  const candidateThoughtIds = new Set(
    output.candidateThoughts.map((thought) => thought.candidateId),
  );
  const hasDuplicateThoughtIds =
    candidateThoughtIds.size !== output.candidateThoughts.length;
  const provenanceGroups = [
    ...output.candidateThoughts,
    ...output.globalContextCandidates,
    ...output.contextCandidates,
  ];
  const hasInvalidProvenance = provenanceGroups.some((candidate) =>
    candidate.sourceMessageIds.some(
      (messageId) => !validMessageIds.has(messageId),
    ),
  );
  const hasInvalidThoughtReference = output.contextCandidates.some(
    (candidate) =>
      candidate.sourceCandidateThoughtIds.some(
        (thoughtId) => !candidateThoughtIds.has(thoughtId),
      ),
  );

  if (
    hasDuplicateThoughtIds ||
    hasInvalidProvenance ||
    hasInvalidThoughtReference
  ) {
    throw new ConversationAnalysisError(
      "integrity_failure",
      `Part ${chunkNumber} of the large conversation could not be connected safely to its source messages. Please try again.`,
    );
  }
}

async function analyzeChunk(
  chunk: ConversationAnalysisChunk,
  chunkCount: number,
): Promise<ChunkAnalysisOutput> {
  const chunkNumber = chunk.index + 1;
  let output: unknown;

  for (let attempt = 0; attempt <= CHUNK_APPLICATION_RETRIES; attempt += 1) {
    try {
      const response = await getOpenAIClient().responses.parse(
        {
          model: getOpenAIModel(),
          store: false,
          input: [
            { role: "system", content: ANALYZE_CONVERSATION_CHUNK_PROMPT },
            {
              role: "user",
              content: `Analyze part ${chunkNumber} of ${chunkCount}. Preserve the supplied original message IDs and order.\n\n${JSON.stringify(
                chunk.messages,
              )}`,
            },
          ],
          text: {
            format: zodTextFormat(
              chunkAnalysisSchema,
              "refract_conversation_chunk_candidates",
            ),
          },
          max_output_tokens: 8_000,
        },
        // Chunk retries are managed here so the SDK's default retries do not
        // multiply the bounded application-level attempts.
        { maxRetries: 0 },
      );

      output = response.output_parsed;
      break;
    } catch (error) {
      if (error instanceof OpenAIConfigurationError) throw error;

      const retryNumber = attempt + 1;
      const retryDelayMs =
        retryNumber <= CHUNK_APPLICATION_RETRIES
          ? getChunkRetryDelay(getProviderErrorDetails(error), retryNumber)
          : undefined;

      logProviderFailure(
        error,
        `chunk ${chunkNumber} of ${chunkCount}`,
        retryDelayMs,
      );

      if (retryDelayMs !== undefined) {
        await waitForRetry(retryDelayMs);
        continue;
      }

      throw new ConversationAnalysisError(
        "provider_failure",
        getProviderFailureMessage(
          error,
          `OpenAI could not analyze part ${chunkNumber} of this large conversation. No partial analysis was used. Please try again.`,
        ),
      );
    }
  }

  const parsedOutput = chunkAnalysisSchema.safeParse(output);
  if (!parsedOutput.success) {
    throw new ConversationAnalysisError(
      "structured_output_failure",
      `OpenAI returned incomplete information for part ${chunkNumber} of this large conversation. No partial analysis was used. Please try again.`,
    );
  }

  validateChunkProvenance(parsedOutput.data, chunk, chunkNumber);
  return parsedOutput.data;
}

async function analyzeLargeConversation(
  messages: Message[],
): Promise<AnalysisModelOutput> {
  const chunks = chunkConversationMessages(messages);

  if (process.env.NODE_ENV === "development") {
    console.info("[Refract] Large conversation analysis", {
      messages: messages.length,
      characters: countMessageContentCharacters(messages),
      semanticChunks: chunks.length,
    });
  }

  const chunkOutputs: ChunkAnalysisOutput[] = [];
  for (const chunk of chunks) {
    chunkOutputs.push(await analyzeChunk(chunk, chunks.length));
  }

  const output = await requestFinalAnalysis(
    RECONCILE_CONVERSATION_PROMPT,
    `Reconcile these ${chunkOutputs.length} ordered candidate sets into one final Refract analysis.\n\n${JSON.stringify(
      chunkOutputs.map((candidates, index) => ({
        chunk: index + 1,
        candidates,
      })),
    )}`,
    "refract_large_conversation_analysis",
    "large-conversation reconciliation",
  );

  const allowedMessageIds = new Set(
    chunkOutputs.flatMap((chunkOutput) =>
      [
        ...chunkOutput.candidateThoughts,
        ...chunkOutput.globalContextCandidates,
        ...chunkOutput.contextCandidates,
      ].flatMap((candidate) => candidate.sourceMessageIds),
    ),
  );
  const finalProvenanceGroups = [
    ...output.thoughts,
    ...output.globalContext.goals,
    ...output.globalContext.constraints,
    ...output.globalContext.facts,
    ...output.globalContext.preferences,
    ...output.thoughtContextMetadata.flatMap((metadata) =>
      metadata.context.map((selection) => selection.seed),
    ),
  ];
  const usesUnknownCandidateProvenance = finalProvenanceGroups.some(
    (item) =>
      item.sourceMessageIds.some(
        (messageId) => !allowedMessageIds.has(messageId),
      ),
  );

  if (usesUnknownCandidateProvenance) {
    throw new ConversationAnalysisError(
      "integrity_failure",
      "The reconciled analysis could not be connected safely to the extracted source evidence. Please try again.",
    );
  }

  return output;
}

async function normalizeConversation(
  conversation: string | Message[],
): Promise<Message[]> {
  if (typeof conversation !== "string") return conversation;

  const deterministicMessages = reconstructTurns(conversation);
  if (
    countMessageContentCharacters(deterministicMessages) >
    DIRECT_ANALYSIS_MAX_CHARS
  ) {
    return deterministicMessages;
  }

  return reconstructTurnsWithModel(conversation, deterministicMessages);
}

export async function analyzeConversation(
  conversation: string | Message[],
): Promise<RefractAnalysis> {
  const messages = await normalizeConversation(conversation);
  const useLargeConversationAnalysis =
    countMessageContentCharacters(messages) > DIRECT_ANALYSIS_MAX_CHARS;
  const output = useLargeConversationAnalysis
    ? await analyzeLargeConversation(messages)
    : await requestFinalAnalysis(
        ANALYZE_CONVERSATION_PROMPT,
        `Analyze these normalized messages:\n\n${JSON.stringify(messages)}`,
        "refract_conversation_analysis",
        "direct analysis",
      );

  try {
    return validateAndSanitizeAnalysis(output, messages);
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
