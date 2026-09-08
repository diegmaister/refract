export const ESTIMATED_CHARACTERS_PER_TOKEN = 4;

export function estimateTokens(content: string): number {
  const characterCount = content.trim().length;

  if (characterCount === 0) return 0;

  return Math.ceil(characterCount / ESTIMATED_CHARACTERS_PER_TOKEN);
}

export function calculatePercentRemoved(
  baselineTokens: number,
  resultTokens: number,
): number {
  if (baselineTokens <= 0) return 0;

  const reduction = Math.round(
    ((baselineTokens - resultTokens) / baselineTokens) * 100,
  );

  return Math.max(0, reduction);
}

export type TokenReduction = {
  removedTokens: number;
  percentRemoved: number;
  hasReduction: boolean;
};

export function calculateTokenReduction(
  baselineTokens: number,
  resultTokens: number,
): TokenReduction {
  const hasReduction = baselineTokens > 0 && resultTokens < baselineTokens;

  return {
    removedTokens: hasReduction ? baselineTokens - resultTokens : 0,
    percentRemoved: hasReduction
      ? calculatePercentRemoved(baselineTokens, resultTokens)
      : 0,
    hasReduction,
  };
}
