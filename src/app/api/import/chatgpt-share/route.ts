import { z } from "zod";

import {
  ChatGptShareImportError,
  chatGPTShareImporter,
} from "@/lib/importers/chatgpt-share-importer";

const importRequestSchema = z
  .object({
    url: z.string().trim().min(1).max(2_048),
  })
  .strict();

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
      "Send a JSON body containing a ChatGPT share URL.",
      400,
    );
  }

  const parsedRequest = importRequestSchema.safeParse(requestBody);
  if (
    !parsedRequest.success ||
    !chatGPTShareImporter.canHandle(parsedRequest.data.url)
  ) {
    return errorResponse(
      "INVALID_SHARE_URL",
      "Enter a public chatgpt.com/share link.",
      400,
    );
  }

  try {
    const conversation = await chatGPTShareImporter.import(
      parsedRequest.data.url,
    );
    return Response.json({ conversation });
  } catch (error) {
    if (error instanceof ChatGptShareImportError) {
      console.warn("ChatGPT share import failed.", {
        errorType: error.name,
        code: error.code,
      });

      const status =
        error.code === "invalid_url"
          ? 400
          : error.code === "conversation_too_large" ||
              error.code === "empty_conversation" ||
              error.code === "parse_failed"
            ? 422
            : 502;

      return errorResponse(
        "SHARE_IMPORT_FAILED",
        "We couldn't import this share link. You can still paste the conversation below.",
        status,
      );
    }

    console.error("Unexpected ChatGPT share import failure.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(
      "SHARE_IMPORT_FAILED",
      "We couldn't import this share link. You can still paste the conversation below.",
      500,
    );
  }
}
