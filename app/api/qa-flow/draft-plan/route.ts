import { NextRequest, NextResponse } from "next/server";
import { AiProvider, callAiJson, isAnthropicAuthError } from "@/lib/server/aiProviders";
import { StudyResult } from "@/lib/qaFlow";

export const maxDuration = 300;

interface DraftPlanRequestBody {
  issueKey: string;
  summary: string;
  study: StudyResult;
  templates: { name: string; text: string }[];
  extraNotes?: string;
  /** Pre-formatted team knowledge-base block (verified facts from past tickets). */
  knowledge?: string;
  ai: { provider: AiProvider; key: string; model?: string };
}

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    planTitle: { type: "string" },
    preconditions: { type: "array", items: { type: "string" }, description: "Environment/setup/data preconditions for the whole plan (test accounts, roles, environment, prerequisite state)." },
    scenarios: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "Short scenario/test case title." },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          preconditions: { type: "string", description: "Scenario-specific precondition, if any beyond the plan-level ones." },
          steps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                action: { type: "string", description: "What the tester does, one concrete step." },
                expected: { type: "string", description: "What should happen after this step." },
              },
              required: ["action", "expected"],
            },
          },
          notes: { type: "string", description: "Anything else useful: edge case reasoning, data to use, link back to a risk from the study." },
        },
        required: ["title", "priority", "steps"],
      },
    },
    testDataNotes: { type: "string", description: "Test data or accounts needed across the plan." },
  },
  required: ["planTitle", "preconditions", "scenarios"],
};

function buildSystemPrompt(hasTemplates: boolean): string {
  return `You are a senior QA analyst assistant embedded in a QA team's dashboard. Your job: draft a complete, step-by-step test plan (scenarios + scripts) for a Jira change-request (CR), based on an already-approved study of that ticket.

Domain context: the team tests web portals for vehicle/insurance workflows (portals named "eAuto" and "Secarang" among others).

Hard rules:
- Base every scenario on the approved study's "testFocus", "affectedAreas", and "risks" — cover all of them, do not invent unrelated scenarios.
- Write concrete, executable steps a manual tester can follow with no extra context: exact actions, exact expected results. Avoid vague language like "verify it works correctly".
- Cover both happy-path and the edge cases implied by the study's risks and open questions that were answered.
${hasTemplates ? `- CRITICAL: One or more of this QA's own past test plan documents are provided as style references below. Match their structure, section naming, level of detail, wording style, and formatting conventions as closely as possible. Do not invent a different structure — mimic what they already do.` : `- No style template was provided; use a clean, standard structure: numbered scenarios, each with preconditions, numbered steps, and expected results.`}
- A TEAM KNOWLEDGE BASE block may be included: verified facts about these systems from previously completed tickets. Use them to make steps more concrete and accurate — real page names, known flows, roles, environment quirks, and known regression traps.
- Do not pad with filler scenarios just to hit a count. Quality and coverage over quantity.`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DraftPlanRequestBody;
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
    `Test focus (priority order):\n${study.testFocus.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    study.risks.length ? `Risks:\n${study.risks.map(r => `- ${r}`).join("\n")}` : "",
    study.outOfScope.length ? `Out of scope:\n${study.outOfScope.map(o => `- ${o}`).join("\n")}` : "",
    study.openQuestions.length ? `Resolved open questions:\n${study.openQuestions.map(q => `- ${q.question}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");

  const templateTexts = (body.templates ?? []).map(t => `=== STYLE TEMPLATE: "${t.name}" (mimic this format) ===\n${t.text}`);

  const texts: string[] = [studyText, ...templateTexts];
  if (body.knowledge?.trim()) {
    texts.push(`=== TEAM KNOWLEDGE BASE (verified facts from past tickets) ===\n${body.knowledge.trim()}`);
  }
  if (body.extraNotes?.trim()) texts.push(`=== ADDITIONAL INSTRUCTIONS FROM THE QA ===\n${body.extraNotes.trim()}`);
  texts.push("Draft the full test plan now.");

  try {
    const result = await callAiJson({
      provider: ai.provider, key: ai.key, model: ai.model,
      system: buildSystemPrompt(templateTexts.length > 0),
      texts, files: [], schema: PLAN_SCHEMA,
    });
    const raw = result.raw as Record<string, unknown>;
    const arr = (v: unknown) => (Array.isArray(v) ? v : []);
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const plan = {
      planTitle: str(raw.planTitle) || `Test Plan — ${issueKey}`,
      preconditions: arr(raw.preconditions).map(String),
      scenarios: arr(raw.scenarios).map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        const priority = ["high", "medium", "low"].includes(o.priority as string) ? (o.priority as "high" | "medium" | "low") : "medium";
        return {
          id: crypto.randomUUID(),
          title: str(o.title) || "Untitled scenario",
          priority,
          preconditions: str(o.preconditions) || undefined,
          steps: arr(o.steps).map((s2) => {
            const so = (s2 ?? {}) as Record<string, unknown>;
            return { action: str(so.action), expected: str(so.expected) };
          }).filter(s => s.action || s.expected),
          notes: str(o.notes) || undefined,
        };
      }).filter(s => s.steps.length > 0),
      testDataNotes: str(raw.testDataNotes) || undefined,
    };
    return NextResponse.json({ plan, model: result.model });
  } catch (e) {
    if (isAnthropicAuthError(e)) {
      return NextResponse.json({ error: "Anthropic API key missing or invalid. Set it under Settings → AI Settings." }, { status: 401 });
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "The model returned malformed JSON. Try again (free-tier models are occasionally flaky)." }, { status: 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Drafting failed" }, { status: 500 });
  }
}
