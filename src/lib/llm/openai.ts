import "server-only";

import OpenAI from "openai";

export const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";

const API_KEY_PLACEHOLDER = "PASTE_YOUR_OPENAI_API_KEY_HERE";

export class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigurationError";
  }
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey || apiKey === API_KEY_PLACEHOLDER) {
    throw new OpenAIConfigurationError(
      "OpenAI is not configured. Add your API key to OPENAI_API_KEY in .env.local.",
    );
  }

  return new OpenAI({ apiKey });
}
