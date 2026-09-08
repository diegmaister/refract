import { z } from "zod";

import { OpenAIConfigurationError } from "@/lib/llm/openai";
import {
  analyzeConversation,
  ConversationAnalysisError,
} from "@/lib/refract/analyze-conversation";

const MAX_TRANSCRIPT_CHARACTERS = 200_000;
const MAX_MESSAGES = 500;

const normalizedMessageSchema = z
  .object({
    id: z.string().min(1).max(100),
    index: z.number().int().nonnegative(),
    role: z.enum(["user", "assistant", "unknown"]),
    roleConfidence: z.number().min(0).max(1),
    roleSource: z.enum(["explicit", "inferred", "unknown"]),
    content: z.string().min(1).max(MAX_TRANSCRIPT_CHARACTERS),
  })
  .strict();

const analyzeRequestSchema = z.union([
  z
    .object({
      transcript: z
        .string()
        .trim()
        .min(1)
        .max(MAX_TRANSCRIPT_CHARACTERS),
    })
    .strict(),
  z
    .object({
      messages: z.array(normalizedMessageSchema).min(1).max(MAX_MESSAGES),
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

      if (contentLength > MAX_TRANSCRIPT_CHARACTERS) {
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
    return errorResponse(
      "INVALID_TRANSCRIPT",
      `Enter a non-empty transcript or normalized message list under ${MAX_TRANSCRIPT_CHARACTERS.toLocaleString("en-US")} characters.`,
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
