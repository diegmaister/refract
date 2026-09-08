function hasMultipleHyphens(value: string): boolean {
  return value.split("-").length > 2;
}

export function sanitizeDisplayTitle(
  title: string,
  id?: string,
  fallback = "Untitled",
): string {
  const trimmedTitle = title.trim();
  const candidate = trimmedTitle || id || fallback;
  const appearsSlugLike =
    candidate.includes("_") ||
    hasMultipleHyphens(candidate) ||
    (!candidate.includes(" ") && candidate.includes("-")) ||
    Boolean(id && candidate === id);

  if (!appearsSlugLike) return candidate;

  const readableTitle = candidate
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!readableTitle) return fallback;

  return readableTitle[0].toLocaleUpperCase() + readableTitle.slice(1);
}
