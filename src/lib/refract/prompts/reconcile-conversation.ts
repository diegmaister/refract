import { ANALYZE_CONVERSATION_PROMPT } from "@/lib/refract/prompts/analyze-conversation";

export const RECONCILE_CONVERSATION_PROMPT = `${ANALYZE_CONVERSATION_PROMPT}

Large-conversation reconciliation mode:
- You receive compact candidate outputs from ordered chunks, not the original full transcript.
- Candidate sourceMessageIds are the allowed original provenance set for this pass. Use only those exact IDs.
- Reconcile semantic identity globally. Candidate IDs, titles, or chunk boundaries do not prove that thoughts are different.
- When the same underlying idea appears in multiple chunks, produce one final thought and aggregate every supporting sourceMessageId from all matching candidates.
- Resolve final titles, summaries, types, and statuses from the combined evidence.
- Create final conceptual edges only after identities have been reconciled.
- Create final global context and target-specific ThoughtContextMetadata from the combined candidates.
- Preserve meaningful decisions, hypotheses, open questions, and historical nuance without inflating context with irrelevant candidates.
- Do not encode chunk numbers or candidate IDs in user-visible output.
- Return one coherent analysis of the full conversation.`;
