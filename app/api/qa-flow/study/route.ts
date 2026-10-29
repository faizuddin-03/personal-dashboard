import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { AiProvider, FilePart, callAiJson, isAnthropicAuthError } from "@/lib/server/aiProviders";

// Studying a big ticket with PDF attachments can take a few minutes.
export const maxDuration = 300;

interface StudyRequestBody {
  baseUrl: string;
  email: string;
  apiToken: string;
  issueKey: string;
  ai?: { provider: AiProvider; key: string; model?: string };
  extraNotes?: string;
  answers?: { question: string; answer: string }[];
  /** Extra documents the user uploaded in the UI, base64-encoded. */
  userDocs?: { name: string; mediaType: string; data: string }[];
  /** Pre-formatted team knowledge-base block (verified facts from past tickets). */
  knowledge?: string;
}

interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  content: string;
  created: string;
}

// ── Latest-revision document selection ─────────────────────
// Teams keep every SRD revision on the ticket (v0.1 → v0.2 → v1.0), and the
// current revision is often uploaded as an identical docx + pdf pair. Only
// the newest revision of each document family should reach the AI — older
// revisions contain superseded requirements and poison the study.
//
// Grouping heuristic: filenames of the same document differ only in
// version/date digits (e.g. "EAINT-9618_FI ... 15.01.26.docx" vs
// "... 16.01.26.pdf"), so stripping digits + extension yields a family key.
// Distinct documents (SRD vs API spec vs test scenarios) keep different keys
// and are all retained.
const SAME_REVISION_WINDOW_MS = 15 * 60 * 1000;

function docFamilyKey(filename: string): string {
  const key = filename
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "") // extension
    .replace(/[0-9]+/g, "")       // version numbers, dates
    .replace(/[^a-z]+/g, " ")
    .trim();
  // All-digit names produce an empty key — don't group those at all.
  return key || `__ungrouped__${filename}`;
}

function selectLatestRevisions(docs: JiraAttachment[]): {
  keepIds: Set<string>;
  skipped: { name: string; reason: string }[];
} {
  const groups = new Map<string, JiraAttachment[]>();
  for (const d of docs) {
    const key = docFamilyKey(d.filename);
    const list = groups.get(key) ?? [];
    list.push(d);
    groups.set(key, list);
  }

  const keepIds = new Set<string>();
  const skipped: { name: string; reason: string }[] = [];

  for (const files of groups.values()) {
    if (files.length === 1) { keepIds.add(files[0].id); continue; }

    const newestTs = Math.max(...files.map(fl => Date.parse(fl.created) || 0));
    const latestBatch = files.filter(fl => newestTs - (Date.parse(fl.created) || 0) <= SAME_REVISION_WINDOW_MS);
    const older = files.filter(fl => !latestBatch.includes(fl));

    // Same revision uploaded as pdf + docx → identical content; keep the pdf.
    let keep = latestBatch;
    const pdf = latestBatch.find(fl => fl.filename.toLowerCase().endsWith(".pdf"));
    if (pdf && latestBatch.length > 1) {
      keep = [pdf];
      for (const dup of latestBatch) {
        if (dup !== pdf) skipped.push({ name: dup.filename, reason: `same revision as ${pdf.filename} — duplicate format` });
      }
    }

    for (const k of keep) keepIds.add(k.id);
    const keptName = keep[0]?.filename ?? "latest revision";
    for (const o of older) skipped.push({ name: o.filename, reason: `older revision — superseded by ${keptName}` });
  }

  return { keepIds, skipped };
}

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // per file
const MAX_TOTAL_BYTES = 28 * 1024 * 1024; // across all files

const STUDY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string", description: "Plain-language summary of what this CR is about and why, 2-4 paragraphs, written for a manual QA tester picking it up cold." },
    changes: { type: "array", items: { type: "string" }, description: "Each distinct change/feature introduced by this CR, one bullet each." },
    affectedAreas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          portal: { type: "string", description: "Which portal/system, e.g. eAuto web, Secarang, admin portal, mobile web." },
          pages: { type: "array", items: { type: "string" }, description: "Specific pages/screens/flows affected." },
          whatChanges: { type: "string", description: "What changes there and what to look at." },
        },
        required: ["portal", "pages", "whatChanges"],
      },
    },
    testFocus: { type: "array", items: { type: "string" }, description: "The most important things to test, in priority order, including edge cases implied by the requirement." },
    risks: { type: "array", items: { type: "string" }, description: "Risky areas: regression risk to existing flows, integration points, data migrations." },
    outOfScope: { type: "array", items: { type: "string" }, description: "Things explicitly out of scope or handled by another ticket." },
    openQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          why: { type: "string", description: "Why this matters for testing / what is ambiguous or missing." },
          blocking: { type: "boolean", description: "true if testing cannot safely start before this is answered." },
        },
        required: ["question", "why", "blocking"],
      },
      description: "Every gap, contradiction, missing detail or weird thing found in the requirement. Never assume - ask.",
    },
    readyToProceed: { type: "boolean", description: "true only if there are no blocking open questions." },
    confidenceNote: { type: "string", description: "One short paragraph: how complete the source material was and what was missing (e.g. attachments that could not be read)." },
  },
  required: ["overview", "changes", "affectedAreas", "testFocus", "risks", "outOfScope", "openQuestions", "readyToProceed", "confidenceNote"],
};

const SYSTEM_PROMPT = `You are a senior QA analyst assistant embedded in a QA team's dashboard. Your job: study a Jira change-request (CR) ticket end-to-end - its description, comments, and attached requirement documents (SRDs, API specs, screenshots) - and produce a complete study that lets a manual QA tester understand the whole picture before drafting a test plan.

Domain context: the team tests web portals for vehicle/insurance workflows (portals named "eAuto" and "Secarang" among others). CR tickets are Jira Tasks under an Epic; QA raises child "QA-Issue" bug tickets under the CR.

Hard rules:
- NO ASSUMPTIONS. If the requirement is ambiguous, contradictory, incomplete, or something looks weird, raise it in openQuestions instead of guessing. Mark it blocking if testing cannot safely start without the answer.
- Ground every statement in the provided material. If you cite a behavior, it must come from the ticket or its documents.
- If user-provided answers to earlier questions are included, treat them as authoritative and incorporate them; do not re-ask what they already answered.
- The attached documents are already filtered to the CURRENT revision of each document; the ticket description may reference older superseded versions - ignore those references.
- A TEAM KNOWLEDGE BASE block may be included: verified facts about the systems under test, accumulated from previously completed tickets. Treat them as reliable background - use them to sharpen affected areas and test focus, and do not raise openQuestions for things the knowledge base already answers. If this ticket's material CONTRADICTS a knowledge-base fact, call that out in openQuestions instead of silently picking one.
- Write for a manual QA tester: concrete pages, flows, roles, and data - not abstract summaries.`;

/** Minimal Atlassian Document Format -> plain text extractor. */
function adfToText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(adfToText).join("");
  if (typeof node === "object") {
    const n = node as { type?: string; text?: string; content?: unknown; attrs?: { text?: string } };
    if (n.type === "text") return n.text ?? "";
    if (n.type === "hardBreak") return "\n";
    if (n.type === "mention" || n.type === "emoji") return n.attrs?.text ?? "";
    const inner = adfToText(n.content);
    const blockTypes = ["paragraph", "heading", "listItem", "tableRow", "blockquote", "codeBlock"];
    if (n.type && blockTypes.includes(n.type)) return inner + "\n";
    if (n.type === "tableCell" || n.type === "tableHeader") return inner + " | ";
    return inner;
  }
  return "";
}

/** Make sure every expected field exists even if a weaker model omitted some. */
function normalizeStudy(raw: Record<string, unknown>) {
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    overview: str(raw.overview),
    changes: arr(raw.changes).map(String),
    affectedAreas: arr(raw.affectedAreas).map((a) => {
      const o = (a ?? {}) as Record<string, unknown>;
      return { portal: str(o.portal) || "Unspecified", pages: arr(o.pages).map(String), whatChanges: str(o.whatChanges) };
    }),
    testFocus: arr(raw.testFocus).map(String),
    risks: arr(raw.risks).map(String),
    outOfScope: arr(raw.outOfScope).map(String),
    openQuestions: arr(raw.openQuestions).map((q) => {
      const o = (q ?? {}) as Record<string, unknown>;
      return { question: str(o.question), why: str(o.why), blocking: o.blocking === true };
    }).filter(q => q.question),
    readyToProceed: raw.readyToProceed === true,
    confidenceNote: str(raw.confidenceNote),
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as StudyRequestBody;
  const { baseUrl, email, apiToken, issueKey } = body;
  if (!baseUrl || !email || !apiToken || !issueKey) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const provider: AiProvider = body.ai?.provider ?? "anthropic";
  if (provider !== "anthropic" && !body.ai?.key) {
    return NextResponse.json({ error: "No AI API key configured. Add one under Settings → AI Settings." }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");

  // 1. Fetch the ticket
  const issueRes = await fetch(
    `${baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${issueKey}?fields=summary,description,comment,attachment,status,issuetype,priority,parent,project,labels`,
    { headers: { Authorization: `Basic ${token}`, Accept: "application/json" } }
  );
  if (!issueRes.ok) {
    return NextResponse.json({ error: `Jira returned ${issueRes.status} for ${issueKey}` }, { status: issueRes.status });
  }
  const issue = await issueRes.json();
  const f = issue.fields ?? {};

  // 2. Download and classify attachments
  const attachmentsUsed: string[] = [];
  const attachmentsSkipped: string[] = [];
  const files: FilePart[] = [];
  const docTexts: string[] = [];
  let totalBytes = 0;

  const attachments: JiraAttachment[] = f.attachment ?? [];

  // Keep only the latest revision of each versioned document (SRDs etc.).
  // Images and other non-document files are never filtered by this.
  const versionedDocs = attachments.filter(a =>
    /\.(pdf|docx)$/i.test(a.filename ?? "") || (a.mimeType ?? "").toLowerCase() === "application/pdf"
  );
  const { keepIds: latestDocIds, skipped: supersededDocs } = selectLatestRevisions(versionedDocs);
  for (const s of supersededDocs) attachmentsSkipped.push(`${s.name} (${s.reason})`);

  for (const att of attachments) {
    const name = att.filename ?? "unnamed";
    const mime = (att.mimeType ?? "").toLowerCase();
    const isPdf = mime === "application/pdf" || name.toLowerCase().endsWith(".pdf");
    const isDocx = name.toLowerCase().endsWith(".docx");
    const isImage = ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(mime);
    const isText = mime.startsWith("text/") || /\.(txt|md|csv)$/i.test(name);

    if ((isPdf || isDocx) && !latestDocIds.has(att.id)) continue; // superseded revision (already reported)
    if (!isPdf && !isDocx && !isImage && !isText) { attachmentsSkipped.push(`${name} (unsupported type)`); continue; }
    if (att.size > MAX_ATTACHMENT_BYTES) { attachmentsSkipped.push(`${name} (too large)`); continue; }
    if (totalBytes + att.size > MAX_TOTAL_BYTES) { attachmentsSkipped.push(`${name} (total size budget reached)`); continue; }

    try {
      const res = await fetch(att.content, { headers: { Authorization: `Basic ${token}` } });
      if (!res.ok) { attachmentsSkipped.push(`${name} (download failed: ${res.status})`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      totalBytes += buf.length;

      if (isPdf) {
        files.push({ kind: "pdf", mime: "application/pdf", data: buf.toString("base64"), name });
        attachmentsUsed.push(name);
      } else if (isDocx) {
        const { value } = await mammoth.extractRawText({ buffer: buf });
        docTexts.push(`--- Attachment "${name}" (docx, extracted text) ---\n${value.slice(0, 200_000)}`);
        attachmentsUsed.push(name);
      } else if (isImage) {
        files.push({ kind: "image", mime, data: buf.toString("base64"), name });
        attachmentsUsed.push(name);
      } else {
        docTexts.push(`--- Attachment "${name}" (text) ---\n${buf.toString("utf-8").slice(0, 100_000)}`);
        attachmentsUsed.push(name);
      }
    } catch {
      attachmentsSkipped.push(`${name} (error reading)`);
    }
  }

  // 3. User-uploaded documents
  for (const doc of body.userDocs ?? []) {
    try {
      const buf = Buffer.from(doc.data, "base64");
      if (totalBytes + buf.length > MAX_TOTAL_BYTES) { attachmentsSkipped.push(`${doc.name} (size budget)`); continue; }
      totalBytes += buf.length;
      if (doc.mediaType === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf")) {
        files.push({ kind: "pdf", mime: "application/pdf", data: doc.data, name: doc.name });
      } else if (doc.name.toLowerCase().endsWith(".docx")) {
        const { value } = await mammoth.extractRawText({ buffer: buf });
        docTexts.push(`--- User-uploaded "${doc.name}" (docx, extracted text) ---\n${value.slice(0, 200_000)}`);
      } else {
        docTexts.push(`--- User-uploaded "${doc.name}" ---\n${buf.toString("utf-8").slice(0, 100_000)}`);
      }
      attachmentsUsed.push(`${doc.name} (user upload)`);
    } catch {
      attachmentsSkipped.push(`${doc.name} (error reading upload)`);
    }
  }

  // 4. Assemble the text parts
  const comments = (f.comment?.comments ?? []) as { author?: { displayName?: string }; created?: string; body?: unknown }[];
  const commentText = comments.slice(-15).map(c =>
    `[${c.created ?? ""}] ${c.author?.displayName ?? "unknown"}: ${adfToText(c.body).trim()}`
  ).join("\n\n");

  const ticketText = [
    `TICKET ${issue.key}: ${f.summary ?? ""}`,
    `Type: ${f.issuetype?.name ?? "?"} | Status: ${f.status?.name ?? "?"} | Priority: ${f.priority?.name ?? "?"}`,
    `Project: ${f.project?.name ?? "?"} | Parent: ${f.parent?.key ?? "-"} (${f.parent?.fields?.summary ?? ""})`,
    f.labels?.length ? `Labels: ${f.labels.join(", ")}` : "",
    ``,
    `=== DESCRIPTION ===`,
    adfToText(f.description).trim() || "(empty)",
    ``,
    comments.length ? `=== COMMENTS (latest ${Math.min(15, comments.length)}) ===\n${commentText}` : "",
  ].filter(Boolean).join("\n");

  const texts: string[] = [ticketText, ...docTexts];
  if (body.knowledge?.trim()) {
    texts.push(`=== TEAM KNOWLEDGE BASE (verified facts from past tickets) ===\n${body.knowledge.trim()}`);
  }
  if (body.answers?.length) {
    texts.push(`=== ANSWERS FROM THE QA (authoritative — incorporate, do not re-ask) ===\n` +
      body.answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n"));
  }
  if (body.extraNotes?.trim()) {
    texts.push(`=== ADDITIONAL NOTES FROM THE QA ===\n${body.extraNotes.trim()}`);
  }
  texts.push("Study everything above and produce the full analysis.");

  // 5. Call the selected provider
  try {
    const result = await callAiJson({
      provider, key: body.ai?.key, model: body.ai?.model,
      system: SYSTEM_PROMPT, texts, files, schema: STUDY_SCHEMA,
    });

    return NextResponse.json({
      study: normalizeStudy(result.raw),
      meta: {
        issueKey: issue.key,
        summary: f.summary ?? "",
        attachmentsUsed,
        attachmentsSkipped,
        model: result.model,
      },
    });
  } catch (e) {
    if (isAnthropicAuthError(e)) {
      return NextResponse.json({ error: "Anthropic API key missing or invalid. Set it under Settings → AI Settings." }, { status: 401 });
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "The model returned malformed JSON. Try again (free-tier models are occasionally flaky)." }, { status: 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Study failed" }, { status: 500 });
  }
}
