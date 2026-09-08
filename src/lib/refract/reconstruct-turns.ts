import type { Message, MessageRole } from "@/types/refract";

const explicitRolePattern = /^\s*(user|assistant|human|ai)\s*:\s*(.*)$/i;

const explicitRoles: Record<string, Exclude<MessageRole, "unknown">> = {
  user: "user",
  human: "user",
  assistant: "assistant",
  ai: "assistant",
};

type PendingTurn = {
  role: MessageRole;
  lines: string[];
};

function createMessage(turn: PendingTurn, index: number): Message {
  const isExplicit = turn.role !== "unknown";

  return {
    id: `message-${index + 1}`,
    index,
    role: turn.role,
    roleConfidence: isExplicit ? 1 : 0,
    roleSource: isExplicit ? "explicit" : "unknown",
    content: turn.lines.join("\n").trim(),
  };
}

/**
 * Reconstructs transcript turns only when speaker labels provide direct
 * evidence. Unlabelled text remains unknown instead of being forced into an
 * alternating user/assistant pattern.
 */
export function reconstructTurns(transcript: string): Message[] {
  const normalizedTranscript = transcript
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

  if (!normalizedTranscript.trim()) return [];

  const messages: Message[] = [];
  let pendingTurn: PendingTurn | undefined;

  function flushPendingTurn() {
    if (!pendingTurn || !pendingTurn.lines.join("\n").trim()) return;

    messages.push(createMessage(pendingTurn, messages.length));
  }

  for (const line of normalizedTranscript.split("\n")) {
    const explicitRoleMatch = line.match(explicitRolePattern);

    if (explicitRoleMatch) {
      flushPendingTurn();

      pendingTurn = {
        role: explicitRoles[explicitRoleMatch[1].toLowerCase()],
        lines: [explicitRoleMatch[2]],
      };
      continue;
    }

    if (!pendingTurn) {
      pendingTurn = { role: "unknown", lines: [] };
    }

    pendingTurn.lines.push(line);
  }

  flushPendingTurn();

  return messages;
}
