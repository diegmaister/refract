import type {
  ContextDensity,
  ContextItemState,
  ContextPriority,
  ContextSuggestion,
} from "@/types/refract";

export type ContextDensityOption = {
  density: ContextDensity;
  label: string;
  description: string;
  recommended?: boolean;
};

export const contextDensityOptions: ContextDensityOption[] = [
  {
    density: "light",
    label: "Light",
    description: "Essential context only.",
  },
  {
    density: "balanced",
    label: "Balanced",
    description: "Enough context to continue confidently.",
    recommended: true,
  },
  {
    density: "rich",
    label: "Rich",
    description: "Broader history and connected thinking.",
  },
];

const densityRank: Record<ContextDensity, number> = {
  light: 0,
  balanced: 1,
  rich: 2,
};

const priorityRank: Record<ContextPriority, number> = {
  essential: 0,
  recommended: 1,
  supporting: 2,
};

export function getDensitySuggestedState(
  item: ContextSuggestion,
  density: ContextDensity,
): ContextItemState {
  if (item.suggestedState === "drop") return "drop";

  return priorityRank[item.priority] <= densityRank[density]
    ? item.suggestedState
    : "drop";
}

export function applyContextDensity(
  items: ContextSuggestion[],
  density: ContextDensity,
): ContextSuggestion[] {
  return items.map((item) => ({
    ...item,
    state: getDensitySuggestedState(item, density),
  }));
}
