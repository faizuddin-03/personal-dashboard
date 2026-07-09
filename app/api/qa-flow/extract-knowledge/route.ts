import { NextRequest, NextResponse } from "next/server";
import { AiProvider, callAiJson, isAnthropicAuthError } from "@/lib/server/aiProviders";
import { StudyResult } from "@/lib/qaFlow";

// Distils durable system knowledge out of an APPROVED study so future
// tickets start smarter. Returns suggestions only — the user picks which
// entries actually enter the knowledge base.

export const maxDuration = 120;

interface ExtractRequestBody {
  issueKey: string;
  summary: string;
  study: StudyResult;
  answers?: { question: string; answer: string }[];
  /** Existing knowledge, so the AI doesn't suggest duplicates. */
  existingKnowledge?: string;
  ai: { provider: AiProvider; key: string; model?: string };
}

const KNOWLEDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string", description: "Portal/module the fact belongs to, e.g. \"eAuto Insurance\", \"Secarang\", \"eAuto eSTM\". Short and reusable across tickets." },
          fact: { type: "string", description: "One durable, self-contained fact about how the system works. Must still be true and useful for FUTURE tickets." },
        },
        required: ["area", "fact"],
      },
      description: "0-8 entries. Quality over quantity — an empty list is a valid answer.",
    },
  },
  required: ["entries"],
};

const SYSTEM_PROMPT = `You extract durable system knowledge from a completed QA ticket study, to be reused on future tickets for the same products.

Include ONLY facts that are:
- About the SYSTEM (portals, pages, modules, business rules, integrations, roles, environment quirks) — not about this ticket's specific scope, dates, or deliverables.
- Likely to still be true months from now.
- Self-contained: understandable without reading this ticket.
- Grounded in the study or the QA's own answers (the answers are the most reliable source — they are human-verified).

EXCLUDE: ticket-specific test focus, temporary states ("currently being deployed"), anything speculative, and anything already covered by the existing knowledge base provided.

Maximum 8 entries. Fewer, sharper entries beat many vague ones. Returning zero entries is correct when the ticket taught nothing durable.`;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExtractRequestBody;
  const { issueKey, study, ai } = body;
  if (!issueKey || !study || !ai?.provider) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (ai.provider !== "anthropic" && !ai.key) {
    return NextResponse.json({ error: "No AI API key configured. Add one under Settings → AI Settings." }, { status: 400 });
  }

  const studyText = [
    `=== APPROVED STUDY FOR ${issueKey}: ${body.summary ?? ""} ===`,
    `Overview:\n${study.overview}`,
    `Changes:\n${study.changes.map(c => `- ${c}`).join("\n")}`,
    `Affected areas:\n${study.affectedAreas.map(a => `- [${a.portal}] ${a.pages.join(", ")}: ${a.whatChanges}`).join("\n")}`,
    study.risks.length ? `Risks:\n${study.risks.map(r => `- ${r}`).join("\n")}` : "",
    study.outOfScope.length ? `Out of scope:\n${study.outOfScope.map(o => `- ${o}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");

  const texts: string[] = [studyText];
  if (body.answers?.length) {
    texts.push(`=== QA'S VERIFIED ANSWERS (most reliable source) ===\n` +
      body.answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n"));
  }
  if (body.existingKnowledge?.trim()) {
    texts.push(`=== EXISTING KNOWLEDGE BASE (do not repeat these) ===\n${body.existingKnowledge.trim()}`);
  }
  texts.push("Extract the durable knowledge entries now.");

  try {
    const result = await callAiJson({
      provider: ai.provider, key: ai.key, model: ai.model,
      system: SYSTEM_PROMPT, texts, files: [], schema: KNOWLEDGE_SCHEMA,
    });
    const raw = result.raw as { entries?: unknown };
    const entries = (Array.isArray(raw.entries) ? raw.entries : [])
      .map((e) => {
        const o = (e ?? {}) as Record<string, unknown>;
        return {
          area: typeof o.area === "string" ? o.area : "General",
          fact: typeof o.fact === "string" ? o.fact : "",
        };
      })
      .filter(e => e.fact)
      .slice(0, 8);
    return NextResponse.json({ entries, model: result.model });
  } catch (e) {
    if (isAnthropicAuthError(e)) {
      return NextResponse.json({ error: "Anthropic API key missing or invalid. Set it under Settings → AI Settings." }, { status: 401 });
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "The model returned malformed JSON. Try again." }, { status: 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Extraction failed" }, { status: 500 });
  }
}
