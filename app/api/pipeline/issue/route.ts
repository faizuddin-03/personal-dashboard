// POST /api/pipeline/issue {key, findingId, dryRun?, allowDuplicate?}
// Raises the confirmed finding's QA-Issue in Jira (README flow 9): only after
// Faizuddin presses Raise. dryRun returns the payload and writes nothing.
// High/Highest go On Hold, assigned to Faizuddin (synced eauto-qa-issue-ticket
// skill, FORCED rule from the QA lead, 14-10-2026).
import { NextRequest, NextResponse } from "next/server";
import { KEY_RE, readFinding, writeFinding, readTicket, updateTicket, nowIso, noteForSage } from "@/scripts/pipeline/store.mjs";
import { createQaIssue, checkDraft, type QaIssueCreated } from "@/scripts/pipeline/lib/qa-issue.mjs";
import { newerResult, newerPassLine } from "@/scripts/pipeline/lib/latest-run.mjs";
import type { QaIssueDraft } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// One Raise per finding at a time: a double click must not make two issues.
const inFlight: Set<string> = ((globalThis as Record<string, unknown>).__pipelineIssueInFlight ??= new Set<string>()) as Set<string>;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body must be JSON" }, { status: 400 }); }
  const key = typeof body.key === "string" ? body.key : "";
  const findingId = typeof body.findingId === "string" ? body.findingId : "";
  const dryRun = body.dryRun === true;
  if (!KEY_RE.test(key) || !/^[A-Za-z0-9_.-]{1,120}$/.test(findingId)) {
    return NextResponse.json({ error: "Give key (e.g. EAINT-12345) and findingId" }, { status: 400 });
  }
  const finding = readFinding(key, findingId);
  if (!finding) return NextResponse.json({ error: `Finding ${findingId} not found under ${key}` }, { status: 404 });
  if (finding.issueKey) return NextResponse.json({ error: `Already raised as ${finding.issueKey}` }, { status: 409 });

  const form = finding.raiseForm ?? {};
  const draft: QaIssueDraft | null = finding.issueDraft
    ? {
      ...finding.issueDraft,
      parent: key,
      priority: finding.issueDraft.priority ?? form.priority,
      developerAccountId: finding.issueDraft.developerAccountId ?? form.developerAccountId,
      environment: finding.issueDraft.environment || form.environment || "",
      module: finding.issueDraft.module || form.module || "",
    }
    : null;

  const missing: string[] = [];
  if (finding.state !== "confirmed") missing.push(`the finding must be confirmed (it is "${finding.state}")`);
  if (!draft) missing.push("Scout's QA-Issue draft (wait for Scout, or confirm again to redraft)");
  else missing.push(...checkDraft(draft).filter(m => m !== "the QA-Issue draft"));
  if (missing.length) {
    return NextResponse.json({ error: `Cannot raise yet. Missing: ${missing.join("; ")}`, missing }, { status: 400 });
  }

  // Night round 5: triage from the latest run, never from one snapshot
  // [charmain-repo: test-scenarios/defects.yaml:14-19]. A newer run that passed
  // this TS means the screen may already work: refuse once, raise on a second
  // press within 15 minutes (the same button; no UI change needed).
  if (!dryRun) {
    const newer = newerResult(key, finding);
    if (newer?.status === "passed") {
      const ack = finding.stalePassAck;
      const fresh = ack && ack.runId === newer.runId && Date.now() - Date.parse(ack.at) < 15 * 60_000;
      if (!fresh) {
        writeFinding({ ...finding, stalePassAck: { runId: newer.runId, at: nowIso() } });
        return NextResponse.json({
          error: `${newerPassLine(finding, newer)}. The screen may already work (fixed since, or the first failure was flaky): run it again before raising. If it is still a real issue, press Raise again within 15 minutes.`,
          newerPass: newer,
        }, { status: 409 });
      }
    }
  }

  if (inFlight.has(findingId)) return NextResponse.json({ error: "This finding is already being raised" }, { status: 409 });
  inFlight.add(findingId);
  try {
    const ticket = readTicket(key);
    const out = await createQaIssue({ draft: draft!, finding, ticket, dryRun, allowDuplicate: body.allowDuplicate === true });
    if (dryRun) return NextResponse.json(out);

    const done = out as QaIssueCreated;
    const at = nowIso();
    writeFinding({ ...finding, state: "raised", issueKey: done.issueKey, duplicates: undefined });
    updateTicket(key, t => {
      t.issues = [{ key: done.issueKey, findingId, url: done.url, at }, ...(t.issues ?? []).filter(i => i.findingId !== findingId)];
      if (t.stage !== "done") t.stage = "raised";
      t.events = [{ at, text: `Raised ${done.issueKey} for ${finding.ts} (${draft!.priority})${done.warnings.length ? `; ${done.warnings.length} warning(s)` : ""}` }, ...(t.events ?? [])].slice(0, 100);
      t.characters.scout = { ...(t.characters.scout ?? {}), state: "idle", note: `Raised ${done.issueKey}` };
    });
    // Sage (2026-10-27): a raised QA-Issue is a confirmed system behaviour gap to learn from.
    noteForSage(key, { type: "issue", by: "faizuddin", findingId, ts: finding.ts, issueKey: done.issueKey, text: `Raised ${done.issueKey}: ${draft!.title}\nActual: ${draft!.actual}\nExpected: ${draft!.expected}` });
    return NextResponse.json({ issueKey: done.issueKey, url: done.url, warnings: done.warnings, attached: done.attached, status: done.status });
  } catch (e) {
    const err = e as Error & { status?: number; duplicates?: { key: string; summary: string; status?: string }[] };
    if (err.duplicates) writeFinding({ ...finding, duplicates: err.duplicates });
    return NextResponse.json(
      { error: err.message, ...(err.duplicates ? { duplicates: err.duplicates } : {}) },
      { status: err.status ?? 502 },
    );
  } finally {
    inFlight.delete(findingId);
  }
}
