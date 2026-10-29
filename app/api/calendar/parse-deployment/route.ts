import { NextRequest, NextResponse } from "next/server";
import { AiProvider, callAiJson, isAnthropicAuthError } from "@/lib/server/aiProviders";

export const maxDuration = 60;

interface ParseRequestBody {
  text: string;
  todayStr: string;
  existing: { id: string; date: string; type: string; summary: string }[];
  ai?: { provider: AiProvider; key: string; model?: string };
}

const PARSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    deployments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string", description: "YYYY-MM-DD format" },
          summary: { type: "string", description: "Short description of what's being deployed" },
          type: { type: "string", enum: ["day", "night"] },
          status: { type: "string", enum: ["planned", "completed", "cancelled"] },
          environment: { type: "string", enum: ["Production", "Staging", "UAT", "Development"] },
          notes: { type: "string", description: "Any URLs or extra context" },
        },
        required: ["date", "summary", "type", "status", "environment", "notes"],
      },
    },
  },
  required: ["deployments"],
};

const SYSTEM_PROMPT = `You are parsing a deployment schedule message from Microsoft Teams. Extract ALL deployment entries from the user's pasted text and return structured JSON.

Rules:
- Night session default time: 21:00. Day/Morning session default: 09:00
- If a message covers Morning AND Night on same date, create TWO items
- Strikethrough or "~~text~~" means cancelled/old — skip it
- Default environment is "Staging" unless specified otherwise
- "Completed" or "Done" means status "completed", "Postponed" or "Cancelled" means "cancelled", otherwise "planned"`;

export async function POST(req: NextRequest) {
  try {
    const body: ParseRequestBody = await req.json();
    const { text, todayStr, existing, ai } = body;

    if (!text?.trim()) return NextResponse.json({ error: "No text provided." }, { status: 400 });
    if (!ai?.provider || !ai?.key) return NextResponse.json({ error: "No AI provider configured." }, { status: 400 });

    const userPrompt = `Today: ${todayStr}
Existing deployments: ${JSON.stringify(existing)}

Use current year ${todayStr.slice(0, 4)} if year is not mentioned in dates.
If date+type matches an existing deployment, that means an update — otherwise it's a new addition.

Text to parse:
${text}`;

    const result = await callAiJson({
      provider: ai.provider,
      key: ai.key,
      model: ai.model,
      system: SYSTEM_PROMPT,
      texts: [userPrompt],
      files: [],
      schema: PARSE_SCHEMA,
    });

    return NextResponse.json({ deployments: (result.raw as { deployments: unknown[] }).deployments, model: result.model });
  } catch (e) {
    if (isAnthropicAuthError(e)) return NextResponse.json({ error: "Invalid Anthropic API key." }, { status: 401 });
    const msg = e instanceof Error ? e.message : "AI parse failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
