export const ESTIMATED_CHARACTERS_PER_TOKEN = 4;

export function estimateTokens(content: string): number {
  const characterCount = content.trim().length;

  if (characterCount === 0) return 0;

  return Math.ceil(characterCount / ESTIMATED_CHARACTERS_PER_TOKEN);
}

export function calculatePercentRemoved(
  originalTokens: number,
  finalTokens: number,
): number {
  if (originalTokens <= 0) return 0;

  const reduction = Math.round(
    ((originalTokens - finalTokens) / originalTokens) * 100,
  );

  return Math.max(0, reduction);
}
