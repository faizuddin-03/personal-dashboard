// ── AI provider settings ──────────────────────────────────
// Which AI provider (and key) the dashboard's AI features use.
// Stored in localStorage "ai_settings". The Gemini key also stays in the
// legacy "gemini_api_key" slot so Daily Update / Calendar keep working.

export type AiProvider = "gemini" | "anthropic" | "openrouter";

export interface AiSettings {
  provider: AiProvider;
  keys: Partial<Record<AiProvider, string>>;
  /** Preferred model per provider; falls back to DEFAULT_MODELS. */
  models: Partial<Record<AiProvider, string>>;
}

const KEY = "ai_settings";
const LEGACY_GEMINI_KEY = "gemini_api_key";

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: "gemini-2.5-flash",
  anthropic: "claude-opus-4-8",
  openrouter: "openrouter/free",
};

/** Curated choices for the static providers (OpenRouter's list is fetched live). */
export const MODEL_OPTIONS: Record<AiProvider, { value: string; label: string }[]> = {
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash — fast, free tier (recommended)" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro — deepest analysis, lower free quota" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite — fastest, lightest" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash — older" },
  ],
  anthropic: [
    { value: "claude-opus-4-8", label: "Claude Opus 4.8 — most capable (recommended)" },
    { value: "claude-sonnet-5", label: "Claude Sonnet 5 — fast + smart" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 — cheapest" },
  ],
  openrouter: [
    { value: "openrouter/free", label: "openrouter/free — random free model per request" },
  ],
};

export const AI_PROVIDER_META: Record<AiProvider, { label: string; keyHint: string; getKeyUrl: string; note: string }> = {
  gemini: {
    label: "Google Gemini",
    keyHint: "AIza…",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    note: "Free tier, no credit card. Good default.",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    keyHint: "sk-ant-…",
    getKeyUrl: "https://platform.claude.com/",
    note: "Best quality for document-heavy analysis. Pay per use.",
  },
  openrouter: {
    label: "OpenRouter",
    keyHint: "sk-or-v1-…",
    getKeyUrl: "https://openrouter.ai/keys",
    note: "Free models via openrouter/free. Quality varies per request.",
  },
};

export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") return { provider: "gemini", keys: {}, models: {} };
  let settings: AiSettings = { provider: "gemini", keys: {}, models: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) settings = { provider: "gemini", keys: {}, models: {}, ...JSON.parse(raw) };
  } catch { /* fall through to defaults */ }
  // Backfill from the legacy Gemini slot
  if (!settings.keys.gemini) {
    try {
      const legacy = localStorage.getItem(LEGACY_GEMINI_KEY);
      if (legacy) settings.keys = { ...settings.keys, gemini: legacy };
    } catch { /* ignore */ }
  }
  return settings;
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  // Keep the legacy slot in sync so existing Gemini features keep working
  try {
    if (settings.keys.gemini) localStorage.setItem(LEGACY_GEMINI_KEY, settings.keys.gemini);
  } catch { /* ignore */ }
}

/** The provider + key + model to use for AI calls right now, or null if not configured. */
export function getActiveAi(): { provider: AiProvider; key: string; model: string } | null {
  const s = getAiSettings();
  const key = (s.keys[s.provider] ?? "").trim();
  if (!key) return null;
  const model = (s.models[s.provider] ?? "").trim() || DEFAULT_MODELS[s.provider];
  return { provider: s.provider, key, model };
}
