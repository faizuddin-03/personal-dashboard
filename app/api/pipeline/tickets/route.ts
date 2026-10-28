// GET /api/pipeline/tickets — every ticket in the pipeline.
// POST /api/pipeline/tickets { key } — Faizuddin adds a ticket by key. If no
// Scout study exists yet, the Scout studies that one key first (its handoff
// then queues Scribe); otherwise Scribe's related-history job starts now.
// Design: scripts/pipeline/README.md §1.1, §3.1.
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import {
  ROOT, KEY_RE, listTickets, readTicket, ensureTicket, updateTicket, jiraCreds, jiraFetch, repoPath, addEvent,
} from "@/scripts/pipeline/store.mjs";
import { nextStep } from "@/scripts/pipeline/lib/next-step.mjs";

/** "eaint12345", "EAINT 12345", "EAINT-12345" → "EAINT-12345". */
function normaliseKey(raw: unknown): string | null {
  const s = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^([A-Z][A-Z0-9]*?)-?(\d+)$/);
  const key = m ? `${m[1]}-${m[2]}` : "";
  return KEY_RE.test(key) ? key : null;
}

export async function GET() {
  // Each ticket carries next: its one next action (night round 7, next-step.mjs).
  return Response.json({ tickets: listTickets().map(t => ({ ...t, next: nextStep(t) })) });
}

export async function POST(request: Request) {
  let body: { key?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { key }" }, { status: 400 }); }
  const key = normaliseKey(body?.key);
  if (!key) return Response.json({ error: "Type a ticket key, e.g. EAINT-12345" }, { status: 400 });

  const existed = !!readTicket(key);
  let title: string | undefined, jiraStatus: string | undefined, jiraError: string | undefined;
  if (jiraCreds()) {
    try {
      const issue = await (await jiraFetch(`/rest/api/3/issue/${key}?fields=summary,status`)).json();
      title = issue?.fields?.summary;
      jiraStatus = issue?.fields?.status?.name;
    } catch (e) {
      jiraError = (e as Error).message;
      if (/Jira 404/.test(jiraError)) return Response.json({ error: `${key} was not found in Jira` }, { status: 404 });
    }
  }

  let ticket = ensureTicket({ key, title, addedBy: "faizuddin", jiraStatus });
  if (existed && (title || jiraStatus)) {
    ticket = updateTicket(key, t => { if (title) t.title = title; if (jiraStatus) t.jiraStatus = jiraStatus; }) ?? ticket;
  }
  const studyRel = `_reference/tickets/Studying/${key}/${key}-study.md`;
  const hasStudy = fs.existsSync(repoPath(studyRel));
  // The flow starts at once (Faizuddin, 2026-10-27: "when i add a ticket to the
  // pipeline, i want the flow to automatically start ... the scout will start
  // working immediately"): Scout studies (or refreshes) the ticket, and his
  // handoff in run-agent.mjs then queues Scribe. Skip only when he is already on it.
  if (ticket.characters?.scout?.state === "working") return Response.json({ ticket, added: !existed, started: null });

  let started: string | null = null;
  {
    ticket = updateTicket(key, t => {
      t.characters.scout = { ...(t.characters.scout ?? {}), state: "working", note: hasStudy ? "Updating the study" : "Studying the ticket" };
    }) ?? ticket;
    const runner = path.join(/*turbopackIgnore: true*/ ROOT, "scripts", "agents", "run-agent.mjs");
    try {
      const child = spawn(process.execPath, [runner, "jira-study", "--force", "--key", key], {
        cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true,
      });
      child.on("error", () => { /* shows on the Agents page */ });
      child.unref();
      started = "scout-study";
      addEvent(key, hasStudy ? "Scout is updating the study" : "Scout is studying the ticket");
    } catch (e) {
      addEvent(key, `Could not start the Scout study: ${(e as Error).message}`);
      updateTicket(key, t => { t.characters.scout = { ...(t.characters.scout ?? {}), state: "error", note: "Could not start the study" }; });
    }
  }
  return Response.json({ ticket: readTicket(key) ?? ticket, added: !existed, started, ...(jiraError ? { jiraError } : {}) });
}
