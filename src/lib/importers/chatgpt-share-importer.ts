import "server-only";

import {
  CHATGPT_SHARE_HEADERS,
  isChatGptShareUrl,
  parseChatGptShareHtml,
} from "chatgpt-share-parser";
import { z } from "zod";

import {
  type ConversationImporter,
  type ImportedConversation,
  importedConversationSchema,
  messagesToRawTranscript,
} from "@/lib/importers/conversation-importer";
import { normalizeChatGptShareUrl } from "@/lib/importers/chatgpt-share-url";

const MAX_REDIRECTS = 3;
const MAX_SHARE_HTML_CHARACTERS = 10_000_000;
const MAX_TRANSCRIPT_CHARACTERS = 200_000;

const parsedShareSchema = z.object({
  title: z.string().max(500),
  replies: z.array(
    z.object({
      type: z.enum(["user", "assistant", "tool"]),
      statement: z.string(),
    }),
  ),
});

export type ChatGptShareImportErrorCode =
  | "invalid_url"
  | "fetch_failed"
  | "parse_failed"
  | "empty_conversation"
  | "conversation_too_large";

export class ChatGptShareImportError extends Error {
  constructor(public readonly code: ChatGptShareImportErrorCode) {
    super("The ChatGPT shared conversation could not be imported.");
    this.name = "ChatGptShareImportError";
  }
}

function isRedirectStatus(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

async function fetchAllowedShareHtml(initialUrl: URL): Promise<string> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    let response: Response;

    try {
      response = await fetch(currentUrl, {
        headers: CHATGPT_SHARE_HEADERS,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new ChatGptShareImportError("fetch_failed");
    }

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new ChatGptShareImportError("fetch_failed");
      }

      const redirectUrl = normalizeChatGptShareUrl(
        new URL(location, currentUrl).toString(),
      );
      if (!redirectUrl || !isChatGptShareUrl(redirectUrl)) {
        throw new ChatGptShareImportError("fetch_failed");
      }

      currentUrl = redirectUrl;
      continue;
    }

    if (!response.ok) {
      throw new ChatGptShareImportError("fetch_failed");
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_SHARE_HTML_CHARACTERS
    ) {
      throw new ChatGptShareImportError("conversation_too_large");
    }

    const html = await response.text();
    if (html.length > MAX_SHARE_HTML_CHARACTERS) {
      throw new ChatGptShareImportError("conversation_too_large");
    }

    return html;
  }

  throw new ChatGptShareImportError("fetch_failed");
}

function normalizeReplies(
  replies: z.infer<typeof parsedShareSchema>["replies"],
): ImportedConversation["messages"] {
  return replies
    .filter(
      (reply): reply is typeof reply & { type: "user" | "assistant" } =>
        reply.type === "user" || reply.type === "assistant",
    )
    .flatMap((reply) => {
      const content = reply.statement.trim();
      if (!content) return [];

      return [
        {
          id: "",
          index: 0,
          role: reply.type,
          roleConfidence: 1 as const,
          roleSource: "explicit" as const,
          content,
        },
      ];
    })
    .map((message, index) => ({
      ...message,
      id: `message-${index + 1}`,
      index,
    }));
}

export class ChatGPTShareImporter implements ConversationImporter {
  canHandle(input: string): boolean {
    const url = normalizeChatGptShareUrl(input);
    return Boolean(url && isChatGptShareUrl(url));
  }

  async import(input: string): Promise<ImportedConversation> {
    const url = normalizeChatGptShareUrl(input);
    if (!url || !isChatGptShareUrl(url)) {
      throw new ChatGptShareImportError("invalid_url");
    }

    // The package fetch helper follows redirects automatically. Parsing HTML
    // after a controlled fetch lets this adapter validate every network hop.
    const html = await fetchAllowedShareHtml(url);

    let parsedShare: z.infer<typeof parsedShareSchema>;
    try {
      parsedShare = parsedShareSchema.parse(parseChatGptShareHtml(html));
    } catch {
      throw new ChatGptShareImportError("parse_failed");
    }

    const messages = normalizeReplies(parsedShare.replies);
    if (messages.length === 0) {
      throw new ChatGptShareImportError("empty_conversation");
    }

    const rawTranscript = messagesToRawTranscript(messages);
    if (rawTranscript.length > MAX_TRANSCRIPT_CHARACTERS) {
      throw new ChatGptShareImportError("conversation_too_large");
    }

    const importedConversation = importedConversationSchema.safeParse({
      ...(parsedShare.title.trim() ? { title: parsedShare.title.trim() } : {}),
      messages,
      rawTranscript,
    });

    if (!importedConversation.success) {
      throw new ChatGptShareImportError("conversation_too_large");
    }

    return importedConversation.data;
  }
}

export const chatGPTShareImporter = new ChatGPTShareImporter();
