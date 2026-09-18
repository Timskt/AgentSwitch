/**
 * Prompt Sanitizer Utility
 * Strips internal envelope tags (<USER_REQUEST>, <ADDITIONAL_METADATA>, etc.)
 * Separates user genuine intent from runtime environment envelopes.
 */

export interface SanitizedPrompt {
  cleanText: string;
  metadata?: string;
  contextSummary?: string;
  systemMessage?: string;
  hasEnvelopes: boolean;
}

export function sanitizePrompt(raw: string): SanitizedPrompt {
  if (!raw || typeof raw !== "string") {
    return { cleanText: "", hasEnvelopes: false };
  }

  let text = raw.trim();
  let metadata: string | undefined;
  let contextSummary: string | undefined;
  let systemMessage: string | undefined;
  let hasEnvelopes = false;

  // 1. Extract <CONTEXT_SUMMARY>...</CONTEXT_SUMMARY>
  const contextSummaryMatch = text.match(/<CONTEXT_SUMMARY>([\s\S]*?)<\/CONTEXT_SUMMARY>/i);
  if (contextSummaryMatch) {
    contextSummary = contextSummaryMatch[1].trim();
    text = text.replace(/<CONTEXT_SUMMARY>[\s\S]*?<\/CONTEXT_SUMMARY>/gi, "").trim();
    hasEnvelopes = true;
  }

  // 2. Extract <ADDITIONAL_METADATA>...</ADDITIONAL_METADATA>
  const metaMatch = text.match(/<ADDITIONAL_METADATA>([\s\S]*?)<\/ADDITIONAL_METADATA>/i);
  if (metaMatch) {
    metadata = metaMatch[1].trim();
    text = text.replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/gi, "").trim();
    hasEnvelopes = true;
  }

  // 3. Extract <SYSTEM_MESSAGE>...</SYSTEM_MESSAGE>
  const systemMatch = text.match(/<SYSTEM_MESSAGE>([\s\S]*?)<\/SYSTEM_MESSAGE>/i);
  if (systemMatch) {
    systemMessage = systemMatch[1].trim();
    text = text.replace(/<SYSTEM_MESSAGE>[\s\S]*?<\/SYSTEM_MESSAGE>/gi, "").trim();
    hasEnvelopes = true;
  }

  // 4. Extract <USER_REQUEST>...</USER_REQUEST>
  const userRequestRegex = /<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/gi;
  const userMatches = [...text.matchAll(userRequestRegex)];

  if (userMatches.length > 0) {
    hasEnvelopes = true;
    text = userMatches.map(m => m[1].trim()).filter(Boolean).join("\n\n");
  } else {
    // Check if open <USER_REQUEST> without closing tag
    const openUserMatch = text.match(/<USER_REQUEST>([\s\S]*)$/i);
    if (openUserMatch) {
      hasEnvelopes = true;
      text = openUserMatch[1].trim();
    }
  }

  // 5. Clean any dangling closing tags or common wrappers
  text = text
    .replace(/^<\/?(?:USER_REQUEST|user_request|user|prompt)>\s*/gi, "")
    .replace(/<\/(?:USER_REQUEST|user_request|user|prompt)>\s*$/gi, "")
    .trim();

  return {
    cleanText: text || raw,
    metadata,
    contextSummary,
    systemMessage,
    hasEnvelopes
  };
}
