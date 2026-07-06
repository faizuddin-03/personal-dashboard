// ── Shared multi-provider AI call helper (server-only) ────
// Used by every QA Flow route that needs a structured-JSON response from
// whichever provider the user picked in Settings → AI Settings.
import Anthropic from "@anthropic-ai/sdk";

export type AiProvider = "gemini" | "anthropic" | "openrouter";

export interface FilePart { kind: "pdf" | "image"; mime: string; data: string; name: string; }

export const DEFAULT_MODEL: Record<AiProvider, string> = {
  gemini: "gemini-2.5-flash",
  anthropic: "claude-opus-4-8",
  openrouter: "openrouter/free",
};

/** Pull the first JSON object out of a model response that may have fences or prose around it. */
export function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Model did not return JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export interface AiCallInput {
  provider: AiProvider;
  key?: string;
  model?: string;
  system: string;
  /** First entry is the "primary" text block; the rest are appended after any files. */
  texts: string[];
  files: FilePart[];
  schema: Record<string, unknown>;
}

export interface AiCallResult { raw: Record<string, unknown>; model: string; }

async function callAnthropic({ key, model, system, texts, files, schema }: AiCallInput): Promise<AiCallResult> {
  const anthropic = new Anthropic(key ? { apiKey: key } : {});
  const content: Anthropic.ContentBlockParam[] = [{ type: "text", text: texts[0] }];
  for (const f of files) {
    if (f.kind === "pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
    else content.push({ type: "image", source: { type: "base64", media_type: f.mime as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: f.data } });
  }
  for (const t of texts.slice(1)) content.push({ type: "text", text: t });

  const stream = anthropic.messages.stream({
    model: model || DEFAULT_MODEL.anthropic,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("The model declined to analyze this content.");
  if (msg.stop_reason === "max_tokens") throw new Error("Response was cut off (too long). Try again, reduce attachments, or use fewer templates.");
  const text = msg.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
  return { raw: extractJson(text), model: msg.model };
}

async function callGemini({ key, model, system, texts, files, schema }: AiCallInput): Promise<AiCallResult> {
  if (!key) throw new Error("Gemini API key missing.");
  const resolvedModel = model || DEFAULT_MODEL.gemini;
  const parts: Record<string, unknown>[] = [{ text: texts[0] }];
  for (const f of files) parts.push({ inlineData: { mimeType: f.kind === "pdf" ? "application/pdf" : f.mime, data: f.data } });
  for (const t of texts.slice(1)) parts.push({ text: t });
  parts.push({ text: `Respond with ONLY a single JSON object matching this JSON schema (no markdown fences, no commentary):\n${JSON.stringify(schema)}` });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 16000 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini error: ${data?.error?.message ?? res.status}`);
  if (data.promptFeedback?.blockReason) throw new Error(`Blocked by Gemini safety filter: ${data.promptFeedback.blockReason}`);
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error(`Gemini returned no text (finishReason: ${data.candidates?.[0]?.finishReason ?? "unknown"}).`);
  return { raw: extractJson(text), model: resolvedModel };
}

async function callOpenRouter({ key, model, system, texts, files, schema }: AiCallInput): Promise<AiCallResult> {
  if (!key) throw new Error("OpenRouter API key missing.");
  const resolvedModel = model || DEFAULT_MODEL.openrouter;
  const content: Record<string, unknown>[] = [{ type: "text", text: texts[0] }];
  let hasPdf = false;
  for (const f of files) {
    if (f.kind === "pdf") {
      hasPdf = true;
      content.push({ type: "file", file: { filename: f.name, file_data: `data:application/pdf;base64,${f.data}` } });
    } else {
      content.push({ type: "image_url", image_url: { url: `data:${f.mime};base64,${f.data}` } });
    }
  }
  for (const t of texts.slice(1)) content.push({ type: "text", text: t });
  content.push({ type: "text", text: `Respond with ONLY a single JSON object matching this JSON schema (no markdown fences, no commentary):\n${JSON.stringify(schema)}` });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: resolvedModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
      ...(hasPdf ? { plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }] } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenRouter error: ${data?.error?.message ?? res.status}`);
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("OpenRouter returned an empty response. The selected model may not handle this content — try again or pick another model.");
  return { raw: extractJson(text), model: data.model ?? resolvedModel };
}

export async function callAiJson(input: AiCallInput): Promise<AiCallResult> {
  if (input.provider === "gemini") return callGemini(input);
  if (input.provider === "openrouter") return callOpenRouter(input);
  return callAnthropic(input);
}

export function isAnthropicAuthError(e: unknown): boolean {
  return e instanceof Anthropic.AuthenticationError;
}
