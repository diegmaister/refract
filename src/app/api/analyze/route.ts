import { z } from "zod";

import {
  MAX_IMPORTED_CONVERSATION_CHARS,
  MAX_IMPORTED_CONVERSATION_MESSAGES,
} from "@/lib/importers/conversation-importer";
import { OpenAIConfigurationError } from "@/lib/llm/openai";
import {
  analyzeConversation,
  ConversationAnalysisError,
} from "@/lib/refract/analyze-conversation";

export const maxDuration = 600;

const HARD_ANALYSIS_MAX_CHARS = MAX_IMPORTED_CONVERSATION_CHARS;
const HARD_ANALYSIS_MAX_MESSAGES = MAX_IMPORTED_CONVERSATION_MESSAGES;

const normalizedMessageSchema = z
  .object({
    id: z.string().min(1).max(100),
    index: z.number().int().nonnegative(),
    role: z.enum(["user", "assistant", "unknown"]),
    roleConfidence: z.number().min(0).max(1),
    roleSource: z.enum(["explicit", "inferred", "unknown"]),
    content: z.string().min(1).max(HARD_ANALYSIS_MAX_CHARS),
  })
  .strict();

const analyzeRequestSchema = z.union([
  z
    .object({
      transcript: z
        .string()
        .trim()
        .min(1)
        .max(HARD_ANALYSIS_MAX_CHARS),
    })
    .strict(),
  z
    .object({
      messages: z
        .array(normalizedMessageSchema)
        .min(1)
        .max(HARD_ANALYSIS_MAX_MESSAGES),
    })
    .strict()
    .superRefine(({ messages }, context) => {
      const ids = new Set(messages.map((message) => message.id));
      const contentLength = messages.reduce(
        (total, message) => total + message.content.length,
        0,
      );

      if (ids.size !== messages.length) {
        context.addIssue({
          code: "custom",
          message: "Message IDs must be unique.",
        });
      }

      if (messages.some((message, index) => message.index !== index)) {
        context.addIssue({
          code: "custom",
          message: "Message indexes must be sequential.",
        });
      }

      if (contentLength > HARD_ANALYSIS_MAX_CHARS) {
        context.addIssue({
          code: "custom",
          message: "Normalized messages are too large.",
        });
      }
    }),
]);

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

function exceedsAnalysisSafetyLimit(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;

  if (
    "transcript" in input &&
    typeof input.transcript === "string" &&
    input.transcript.length > HARD_ANALYSIS_MAX_CHARS
  ) {
    return true;
  }

  if (!("messages" in input) || !Array.isArray(input.messages)) return false;
  if (input.messages.length > HARD_ANALYSIS_MAX_MESSAGES) return true;

  let contentLength = 0;
  for (const message of input.messages) {
    if (!message || typeof message !== "object" || !("content" in message)) {
      continue;
    }
    if (typeof message.content !== "string") continue;

    contentLength += message.content.length;
    if (contentLength > HARD_ANALYSIS_MAX_CHARS) return true;
  }

  return false;
}

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return errorResponse(
      "INVALID_REQUEST",
      "Send a JSON body containing a transcript or normalized messages.",
      400,
    );
  }

  const parsedRequest = analyzeRequestSchema.safeParse(requestBody);

  if (!parsedRequest.success) {
    if (exceedsAnalysisSafetyLimit(requestBody)) {
      return errorResponse(
        "CONVERSATION_TOO_LARGE",
        "This conversation is unusually large and exceeds Refract's analysis safety limit. Try trimming it or exporting a smaller section.",
        413,
      );
    }

    return errorResponse(
      "INVALID_TRANSCRIPT",
      `Enter a non-empty transcript or normalized message list under ${HARD_ANALYSIS_MAX_CHARS.toLocaleString("en-US")} characters.`,
      400,
    );
  }

  try {
    const analysis = await analyzeConversation(
      "transcript" in parsedRequest.data
        ? parsedRequest.data.transcript
        : parsedRequest.data.messages,
    );
    return Response.json({ analysis });
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      return errorResponse("OPENAI_NOT_CONFIGURED", error.message, 503);
    }

    if (error instanceof ConversationAnalysisError) {
      console.error("Conversation analysis failed.", {
        errorType: error.name,
        code: error.code,
      });
      return errorResponse("ANALYSIS_FAILED", error.message, 502);
    }

    console.error("Unexpected conversation analysis failure.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(
      "ANALYSIS_FAILED",
      "Refract could not analyze this conversation. Please try again.",
      500,
    );
  }
}
