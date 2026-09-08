const CHATGPT_SHARE_HOSTNAMES = new Set(["chatgpt.com", "chat.openai.com"]);
const CHATGPT_SHARE_PATH = /^\/share\/(?:e\/)?[A-Za-z0-9_-]+\/?$/;

export function normalizeChatGptShareUrl(input: string): URL | undefined {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    return undefined;
  }

  if (
    url.protocol !== "https:" ||
    !CHATGPT_SHARE_HOSTNAMES.has(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    !CHATGPT_SHARE_PATH.test(url.pathname)
  ) {
    return undefined;
  }

  return url;
}

export function isSupportedChatGptShareUrl(input: string): boolean {
  return Boolean(normalizeChatGptShareUrl(input));
}
