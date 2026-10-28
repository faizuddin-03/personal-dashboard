// elf:findings — turn a failed dashboard run into Finding(s) (Faizuddin, 2026-10-27).
//
// input: { runKey?, runId?, result } — result is the runner page's response
// body ({ result: { checks }, runId, ... }) as useBackgroundRuns stored it.
// The saved run file data/pipeline/runs/<KEY>/<runId>.json (written by
// /api/pipeline/runs from PipelineRunWatcher) wins when it exists; older runs
// fall back to input.result, then the run folder's meta.json (title/status
// only), and the prompt tells Elf the context is thinner.
//
// Node does the collecting (failed checks, their red-box screenshots, the TS
// text, the SRD file) so Elf only has to judge: which SRD rule governs the
// failure, which page to render, and whether it is a system, automation or
// data problem (run-findings-page skill). Node then writes the findings page
// under _reference/tickets/<KEY>/ from the finding.json files.

import fs from "node:fs";
import path from "node:path";
import {
  PIPE_DIR, repoPath, relPath, nowIso, readFinding, writeFinding, updateTicket, readTicket, findRun,
} from "../store.mjs";
import { header, joinPrompt, STYLE_RULES, ASK_RULES, hasQuestions } from "../prompts-common.mjs";
import { findSrd } from "../lib/srd-render.mjs";
import { canonTs } from "../lib/official-ts.mjs";
import { writeFindingsPage, localDate } from "../lib/findings-page.mjs";
import { elfTools } from "./_tools.mjs";
import { hintsFor, hintsText, TRIAGE_RULES, TRIAGE_VERDICTS } from "../lib/triage-hints.mjs";
import { voidedFor } from "../lib/voided-runs.mjs";
import { quoteIn, srdText } from "../lib/quote-check.mjs";

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;
const CLASSES = new Set(["system", "automation", "data"]);
const ART_DIR = repoPath("public/qa-artifacts");

const readJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fb; } };
const clip = (s, n) => (s == null ? undefined : String(s).replace(/\x1b\[[0-9;]*m/g, "").slice(0, n));
const safeId = s => String(s).replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
// Official sheets write "12153_TS7", runs and scenarios "12153_TS07": compare
// canonical ids (official-ts.mjs canonTs), never the raw text (2026-10-27).
const wantedTs = (ts, key) => String(ts).split("/").map(t => canonTs(t, key)).filter(Boolean);
const isWanted = (id, want, key) => { const c = canonTs(id, key); return !!c && want.includes(c); };

/** The runner's checks, whichever shape the run result came in. */
function checksOf(result) {
  const r = result ?? {};
  return r.result?.checks ?? r.checks ?? [];
}
const isFailed = c => c && c.status !== "passed" && c.status !== "skipped";

/** "12153_TS03: ..." → "12153_TS03"; "12339_TS19/TS20: ..." → "12339_TS19/TS20". */
function tsOf(check) {
  const head = String(check.title ?? "").split(":")[0].trim();
  if (/TS\d/i.test(head) && head.length <= 40) return head;
  return check.tsLabel || head || "TS";
}

/** First failed step title in the step tree (depth first, deepest wins). */
function failedStep(steps) {
  for (const s of steps ?? []) {
    if (!s.error) continue;
    return failedStep(s.steps) ?? s.title;
  }
  return undefined;
}

// ── run folder + evidence ───────────────────────────────────────────
function suiteDirs(runKey, key) {
  const names = new Set();
  if (runKey) {
    names.add(String(runKey).replace(/^\/+/, "").replace(/\//g, "-"));
    names.add(String(runKey).split("/").pop());
  }
  const digits = String(key).replace(/^[A-Z][A-Z0-9]*-/, "");
  names.add(`eauto-${digits}`);
  return [...names].map(n => path.join(ART_DIR, n)).filter(d => fs.existsSync(d));
}

/**
 * The run's folder: the runId folder when it exists, else the folder whose
 * meta.json lists these checks, closest in time to the client runId (the
 * client's id is taken before the server's Date.now()).
 */
function findRunFolder(dirs, runId, titles) {
  for (const d of dirs) {
    if (runId && fs.existsSync(path.join(d, String(runId), "meta.json"))) return path.join(d, String(runId));
  }
  const cands = [];
  for (const d of dirs) {
    for (const name of fs.readdirSync(d)) {
      const meta = readJson(path.join(d, name, "meta.json"), null);
      if (!meta) continue;
      const listed = new Set([...(meta.scenarios ?? []), ...(meta.results ?? []).map(r => r.title)]);
      const score = titles.filter(t => listed.has(t)).length;
      if (score) cands.push({ dir: path.join(d, name), score, t: Number(meta.timestamp ?? meta.runId ?? name) || 0 });
    }
  }
  if (!cands.length) return null;
  const n = Number(runId);
  cands.sort((a, b) => b.score - a.score || (Number.isFinite(n) && n > 0 ? Math.abs(a.t - n) - Math.abs(b.t - n) : b.t - a.t));
  return cands[0].dir;
}

/** Red-box *-ISSUE images first; only when there are none, the *-failed shot. */
function pickEvidence(check, runFolder, ts) {
  const files = new Map(); // abs → label
  for (const e of check.evidence ?? []) {
    if (!e?.url || !IMAGE_RE.test(e.url) || !String(e.url).startsWith("/qa-artifacts/")) continue;
    const abs = repoPath(`public${decodeURI(e.url)}`);
    if (fs.existsSync(abs)) files.set(abs, e.label ?? path.basename(abs));
  }
  if (runFolder) {
    const meta = readJson(path.join(runFolder, "meta.json"), {});
    const single = (meta.scenarios ?? []).length <= 1;
    const tsBits = [check.tsLabel, ...String(ts).split("/")].filter(Boolean).map(s => s.replace(/^\d+_/, ""));
    for (const f of fs.readdirSync(runFolder)) {
      if (!IMAGE_RE.test(f)) continue;
      const mine = tsBits.some(b => new RegExp(`(^|_)${b}(?!\\d)`, "i").test(f));
      const noTs = !/TS\d/i.test(f);
      if (mine || (single && noTs && /-ISSUE\./i.test(f))) files.set(path.join(runFolder, f), f.replace(/\.[^.]+$/, ""));
    }
  }
  const all = [...files.entries()].map(([abs, label]) => ({ abs, label }));
  const issue = all.filter(f => /-ISSUE\.[a-z]+$/i.test(f.abs));
  if (issue.length) return issue;
  return all.filter(f => /-failed\.[a-z]+$/i.test(f.abs));
}

// ── TS text ─────────────────────────────────────────────────────────
function tsFromScenarios(ticket, ts) {
  const rel = ticket.files?.scenariosJson ?? `data/pipeline/work/${ticket.key}/scenarios.json`;
  const list = readJson(repoPath(rel), null);
  if (!Array.isArray(list)) return null;
  const want = wantedTs(ts, ticket.key);
  const hit = list.find(s => isWanted(s.id, want, ticket.key));
  if (!hit) return null;
  const n = arr => (arr ?? []).map((x, i) => `${i + 1}. ${x}`).join("\n");
  return {
    text: `${hit.id}: ${hit.title}\nObjective: ${hit.objective ?? ""}\nSteps:\n${n(hit.steps)}\nExpected:\n${n(hit.expected)}`,
    source: `${rel} · ${hit.id}`,
  };
}

function cellText(v) {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v.richText) return v.richText.map(r => r.text).join("");
  if ("result" in v) return v.result == null || typeof v.result === "object" ? "" : String(v.result);
  if (v.text) return String(v.text);
  return "";
}

/** TS rows from a team workbook: rows whose first cell is the TS id, plus their blank-first-cell continuation rows. */
async function tsFromWorkbook(file, ts, key) {
  if (!file || !fs.existsSync(file)) return null;
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.readFile(file); } catch { return null; }
  const want = wantedTs(ts, key);
  for (const ws of wb.worksheets) {
    const cols = Math.max(ws.columnCount, 1);
    const cells = row => Array.from({ length: cols }, (_, i) => cellText(row.getCell(i + 1).value).trim());
    let head = null;
    const out = [];
    let inTs = false;
    ws.eachRow((row, n) => {
      const c = cells(row);
      if (/^TS\s*No\.?$/i.test(c[0] ?? "")) { head = c; inTs = false; return; }
      if (!head) return;
      const id = String(c[0] ?? "").trim();
      const match = !!id && isWanted(id, want, key);
      if (match) inTs = true;
      else if (id) inTs = false;
      if (!inTs || !c.some(Boolean)) return;
      // Status / QA columns are bookkeeping, not TS wording.
      const parts = c.map((v, i) => (v && i > 0 && !/^(status|test result|qa|tester|remarks?)\b/i.test(head[i] ?? "") ? `${head[i] || `Column ${i + 1}`}: ${v}` : null)).filter(Boolean);
      out.push(`Row ${n}${match ? ` (${c[0]})` : ""}\n${parts.join("\n")}`);
    });
    if (out.length) return { text: out.join("\n\n"), source: `${path.basename(file)} · sheet "${ws.name}" · ${ts}` };
  }
  return null;
}

async function tsText(ticket, ts) {
  const books = [ticket.files?.officialTs, ticket.files?.workbook && repoPath(ticket.files.workbook)].filter(Boolean);
  for (const b of books) {
    const hit = await tsFromWorkbook(b, ts, ticket.key).catch(() => null);
    if (hit) return hit;
  }
  return tsFromScenarios(ticket, ts) ?? { text: "", source: "TS text not found (no workbook or scenarios.json row for this TS)" };
}

/** Elf's triage block, cleaned (night round 3); null when missing or an unknown verdict. */
function triageOf(t) {
  if (!t || typeof t !== "object" || !TRIAGE_VERDICTS.has(t.verdict)) return null;
  const s = (v, n) => String(v ?? "").trim().slice(0, n);
  return {
    verdict: t.verdict,
    cause: s(t.cause, 400),
    ...(Array.isArray(t.ruledOut) && t.ruledOut.length ? { ruledOut: t.ruledOut.map(x => s(x, 200)).filter(Boolean).slice(0, 8) } : {}),
    ...(t.knownAs ? { knownAs: s(t.knownAs, 80) } : {}),
    ...(t.confidence === "confirmed" || t.confidence === "plausible" ? { confidence: t.confidence } : {}),
  };
}

// ── plan file (prepare → finish) ────────────────────────────────────
const planPath = (key, jobId) => path.join(PIPE_DIR, "work", key, `findings-plan-${safeId(jobId)}.json`);

const action = {
  // File tools + the SRD renderer only; the findings page under _reference/ is
  // written by finish(), so Elf may not edit _reference/ itself.
  tools: () => {
    const base = elfTools();
    return {
      allowed: [...base.allowed.filter(t => t !== "Skill"), "Bash(node scripts/pipeline/lib/srd-render.mjs *)"],
      disallowed: [...base.disallowed.filter(t => t !== "Bash"), "Bash(git *)", "Edit(./_reference/**)"],
    };
  },

  async prepare(ctx) {
    const { job, ticket } = ctx;
    const input = ctx.input ?? job.input ?? {};
    const key = ticket.key;
    const runId = String(input.runId ?? input.result?.runId ?? "") || undefined;
    // Prefer the full result PipelineRunWatcher saved for this run
    // (data/pipeline/runs/<KEY>/<runId>.json): error text, steps, evidence.
    const saved = runId ? findRun(key, runId) : null;
    const runKey = saved?.runKey ?? input.runKey ?? ticket.runKey;
    let checks = saved?.checks?.length ? saved.checks : checksOf(input.result);
    let source = saved?.checks?.length ? "saved" : checks.length ? "input" : "none";
    const dirs = suiteDirs(runKey, key);
    const serverRunId = saved?.serverRunId ?? (input.result?.runId != null ? String(input.result.runId) : undefined);
    const runFolder = (serverRunId && findRunFolder(dirs, serverRunId, [])) || findRunFolder(dirs, runId, checks.map(c => c.title));
    // An older run with nothing saved: the run folder's meta.json has title/status only.
    if (source === "none" && runFolder) {
      checks = (readJson(path.join(runFolder, "meta.json"), {}).results ?? []).filter(r => r?.title);
      if (checks.length) source = "meta";
    }
    // Night round 12: a voided run (or voided TS of it) is evidence of nothing
    // [charmain-repo: test-scenarios/voided-runs.yaml:1-7].
    const whole = voidedFor(key, saved?.runId ?? runId);
    if (whole && !whole.ts) return { skip: `Run ${saved?.runLabel ?? runId} is voided by ${whole.voidedBy}: ${whole.reason}` };
    const failed = checks.filter(isFailed).filter(c => !voidedFor(key, saved?.runId ?? runId, tsOf(c)));
    if (!failed.length) return { skip: "No failed checks in this run (voided TS excluded)" };
    const runLog = clip(saved?.log ?? input.result?.log, 1_000_000);
    const srd = findSrd(key);
    ctx.activity?.("Collecting the failed checks");

    const runTag = safeId(runId ?? new Date().toISOString().replace(/\D/g, "").slice(0, 14));
    const items = [];
    const usedIds = new Set();
    for (const check of failed) {
      const ts = tsOf(check);
      let id = safeId(`${ts}-${runTag}`);
      for (let n = 2; usedIds.has(id); n++) id = safeId(`${ts}-${runTag}-${n}`);
      usedIds.add(id);
      const prev = readFinding(key, id);
      if (prev && prev.state !== "open") { ctx.log?.(`${id} is already ${prev.state}; left as it is`); continue; }

      const dir = path.join(PIPE_DIR, "findings", key, id);
      fs.mkdirSync(dir, { recursive: true });
      const evidence = pickEvidence(check, runFolder, ts).map((e, i) => {
        const name = `evidence-${String(i + 1).padStart(2, "0")}-${path.basename(e.abs).replace(/[^A-Za-z0-9._-]+/g, "_")}`;
        fs.copyFileSync(e.abs, path.join(dir, name));
        return { label: e.label, image: relPath(path.join(dir, name)) };
      });
      const tsInfo = await tsText(ticket, ts);
      const failure = {
        title: check.title,
        friendlyError: clip(check.friendlyError, 1500),
        error: clip(check.error, 3000),
        step: failedStep(check.steps),
      };
      // The tail of the run's raw output, where the failure is printed.
      let logFile = null;
      if (runLog) {
        logFile = relPath(path.join(dir, "run-log-tail.txt"));
        fs.writeFileSync(repoPath(logFile), runLog.slice(-40_000));
      }
      // Triage hints (night round 3): error kind, slow steps, earlier findings, shared errors.
      const hints = hintsFor(check, { key, ts, failed, excludeIds: [id] });
      const context = {
        id, key, ts, runId, runFolder: runFolder ? relPath(runFolder) : null, hints,
        resultSource: source, runLog: logFile, ...(saved?.error ? { runError: clip(saved.error, 1500) } : {}),
        tsQuote: tsInfo.text, tsSource: tsInfo.source, failure,
        details: (check.details ?? []).slice(0, 40), evidence, srd,
      };
      fs.writeFileSync(path.join(dir, "context.json"), JSON.stringify(context, null, 2));
      items.push(context);
    }
    if (!items.length) return { skip: "Every failed check already has a finding Faizuddin has acted on" };

    const passed = checks.filter(c => c.status === "passed").map(c => c.title);
    fs.mkdirSync(path.dirname(planPath(key, job.id)), { recursive: true });
    // A dry run never reaches finish(), so it would leave the plan behind.
    if (!ctx.dry) fs.writeFileSync(planPath(key, job.id), JSON.stringify({ runId, runKey, srd, items, passed, date: localDate() }, null, 2));

    const findingSchema = `{
  "id": "<as given>", "key": "${key}", "ts": "<as given>", "runId": "<as given>",
  "state": "open",
  "classification": "system" | "automation" | "data",
  "summary": "<one line: the symptom in plain words>",
  "tsQuote": "<the TS cell text, verbatim, from context.json tsQuote (trim to the lines that matter, never reword)>",
  "srd": { "file": "<SRD path>", "page": <number>, "section": "<e.g. §2.2.9 REQ-014>", "quote": "<verbatim rule text>", "image": "data/pipeline/findings/${key}/<id>/srd-p<page>.png" },
  "evidence": <copy context.json evidence as is>,
  "actual": "<what happened, a few words>",
  "expected": "<correct result + short SRD reference, e.g. 'Shows Success page (SRD v1.2 §2.2.5)'>",
  "questionForDev": "<only when the SRD and TS do not settle it>",
  "triage": { "verdict": "defect" | "script" | "environment" | "data" | "known" | "unresolved", "cause": "<one line: the specific thing, with its evidence (image, error line, step)>", "ruledOut": ["<what you checked and it was not>"], "knownAs": "<earlier finding id or QA-Issue key, only for known>", "confidence": "confirmed" | "plausible" }
}`;

    const list = items.map((it, i) => `${i + 1}. **${it.ts}** — finding id \`${it.id}\`
   1. Folder: data/pipeline/findings/${key}/${it.id}/ (read context.json there first: TS text, error, failed step, details, evidence images)
   2. Check: "${it.failure.title}"
   3. Error in plain words: ${it.failure.friendlyError ? `"${it.failure.friendlyError.replace(/\s+/g, " ").slice(0, 300)}"` : "(none)"}
   4. Failed step: ${it.failure.step ? `"${it.failure.step}"` : "(not recorded)"}
   5. Evidence images: ${it.evidence.length ? it.evidence.map(e => e.image).join(", ") : "none saved"}${it.runLog ? `\n   6. Run output (tail): ${it.runLog}` : ""}${hintsText(it.hints ?? {}).map((h, j) => `\n   ${(it.runLog ? 7 : 6) + j}. Hint: ${h}`).join("")}`).join("\n");

    const steps = [
      'Read context.json and LOOK at every evidence image (Read the png). Check the screenshot before blaming the system: the script may have read the wrong thing (stale list, wrong ref, timing). That is "automation". Old data, a dev patch, or an expectation the SRD does not back is "data".',
      ...(srd ? [
        'Read the SRD (Read the PDF with the pages parameter: contents page first, then the section). Quote only a rule whose words describe the failing behaviour. A section near the topic that does not cover it does not count. If nothing covers it, set srd.quote to "Nothing on this" and say where the expectation comes from (the TS).',
        `When a rule governs it, render that page: node scripts/pipeline/lib/srd-render.mjs "${srd}" <page> "data/pipeline/findings/${key}/<id>/srd-p<page>.png" — then Read the png to confirm it is the right page.`,
      ] : []),
      `Write data/pipeline/findings/${key}/<id>/finding.json exactly in this shape (JSON, no comments):\n${findingSchema}`,
      `Do not edit context.json, the evidence images, any other folder, Jira or the workbook. The findings page under _reference/tickets/${key}/ is built by the dashboard from your finding.json files; do not write it yourself.`,
    ];

    const contextNote = source === "saved"
      ? `Run record: the full result saved when the run finished (data/pipeline/runs/${key}/${saved.runId}.json). The error text, failed step and evidence below come from it.\n`
      : `NOTE: thinner context. This run has no saved full result (it ran before results were saved, or the save failed), so ${source === "meta"
        ? "only the check titles and pass/fail from the run folder meta.json are known: there is no error text or failed step"
        : "the error text below is only what the job was given"}. Rely on the evidence images${runLog ? " and the run output tail" : ""}${runFolder ? ` and the run folder ${relPath(runFolder)}` : ""}, and say in the finding when the cause cannot be seen from them.\n`;

    // Round 40: the run by priority (scenarios.json "priority"), "Results split by P1 / P2 / P3,
    // cases named" [charmain-repo: docs/replying.md:58].
    let byPriority = "";
    try {
      const scen = readJson(repoPath(ticket.files?.scenariosJson ?? `data/pipeline/work/${key}/scenarios.json`), []);
      const pri = new Map((Array.isArray(scen) ? scen : []).map(s => [String(s.id).replace(/^\d+_/, "").replace(/TS0*(\d+)/, "TS$1"), s.priority]));
      const rows = {};
      for (const c of checks) {
        const id = (String(c.title ?? "").match(/TS0*(\d+)/i) ?? [])[1];
        const p = (id && pri.get(`TS${id}`)) || "no priority";
        const r = (rows[p] ??= { total: 0, failed: [] });
        r.total++;
        if (isFailed(c)) r.failed.push(tsOf(c));
      }
      const order = ["P1", "P2", "P3", "no priority"].filter(p => rows[p]);
      if (order.some(p => p !== "no priority")) {
        byPriority = `Run by priority: ${order.map(p => `${p} ${rows[p].total - rows[p].failed.length}/${rows[p].total} passed${rows[p].failed.length ? ` (failed: ${rows[p].failed.slice(0, 6).join(", ")})` : ""}`).join("; ")}. Start your reply with this line.\n`;
      }
    } catch { /* advisory */ }

    const task = `A dashboard run of ${key}${runId ? ` (run ${runId})` : ""} failed. Analyse each failed check into one finding, following .claude/skills/run-findings-page/SKILL.md sections 1 and 3 (classification, and "Check the source really governs the finding").

${contextNote}${byPriority}
Failed checks:
${list}

SRD: ${srd ? `"${srd}" (newest version found)` : "no SRD PDF found for this ticket. Write srd.quote \"Nothing on this\" (no SRD in the repo) and leave out srd.page and srd.image."}

For each finding:
${steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}

Hints are computed by the dashboard from the run (error kind, slow steps, earlier findings, failures sharing one error): use them as leads to check, never as the verdict. Follow the triage method below, and fill "triage" in every finding.json.

Final message (chat reply): one numbered line per finding: TS, system / automation / data, the triage verdict, the symptom, and the SRD reference or "Nothing on this"; then "Next:" with the ONE concrete next step and who does it (Faizuddin confirms or dismisses it; Dwarf fixes the script; the developer looks at it; re-run first). Never a list of options, never "TBD" (night round 21, [charmain-repo: docs/replying.md:36-45]: issue · cause · action needed · action from who). Add "## Questions for Faizuddin" only if you truly cannot judge one.`;

    return { prompt: joinPrompt(header("elf", ticket, task), STYLE_RULES, TRIAGE_RULES, ASK_RULES) };
  },

  async finish(ctx, { ok, text }) {
    const { job, ticket } = ctx;
    const key = ticket.key;
    const plan = readJson(planPath(key, job.id), null);
    if (!plan) return;
    const ids = [];
    const byTs = new Map();
    let fallback = 0;
    for (const it of plan.items) {
      const dir = path.join(PIPE_DIR, "findings", key, it.id);
      // prepare() already skipped findings Faizuddin had acted on.
      const raw = readJson(path.join(dir, "finding.json"), null);
      const okRaw = raw && typeof raw === "object" && !Array.isArray(raw);
      if (!okRaw) fallback++;
      const f = okRaw ? raw : {};
      const srdImage = f.srd?.image && fs.existsSync(repoPath(f.srd.image)) ? f.srd.image : undefined;
      const finding = {
        id: it.id,
        key,
        ts: it.ts,
        ...(it.runId ? { runId: it.runId } : {}),
        createdAt: f.createdAt ?? nowIso(),
        state: "open",
        classification: CLASSES.has(f.classification) ? f.classification : "system",
        summary: String(f.summary || (okRaw ? "" : "Elf could not finish this one: ") + (it.failure.friendlyError || it.failure.title)).slice(0, 300),
        tsQuote: String(f.tsQuote || it.tsQuote || ""),
        ...(f.srd || it.srd ? {
          srd: {
            file: f.srd?.file || it.srd,
            ...(Number.isFinite(Number(f.srd?.page)) && f.srd?.page ? { page: Number(f.srd.page) } : {}),
            ...(f.srd?.section ? { section: String(f.srd.section) } : {}),
            quote: String(f.srd?.quote || "Nothing on this"),
            ...(srdImage ? { image: srdImage } : {}),
          },
        } : {}),
        evidence: Array.isArray(f.evidence) && f.evidence.every(e => e?.image) ? f.evidence : it.evidence,
        actual: String(f.actual || it.failure.friendlyError || "See the run error").slice(0, 500),
        expected: String(f.expected || "").slice(0, 500),
        ...(f.questionForDev ? { questionForDev: String(f.questionForDev) } : {}),
        ...(triageOf(f.triage) ? { triage: triageOf(f.triage) } : {}),
        failure: it.failure,
      };
      // Night round 29: quotes must be verbatim. A TS quote that is not in the TS
      // text falls back to the TS text itself; an SRD quote not found in the SRD
      // text copy is flagged (never silently kept as if checked).
      try {
        const qc = {};
        if (it.tsQuote && finding.tsQuote !== it.tsQuote) {
          const r = quoteIn(finding.tsQuote, it.tsQuote);
          qc.ts = r.ok;
          if (!r.ok) finding.tsQuote = String(it.tsQuote);
        }
        if (finding.srd?.quote && !/^nothing on this/i.test(finding.srd.quote)) {
          const text = srdText(repoPath(finding.srd.file || ""));
          if (text) qc.srd = quoteIn(finding.srd.quote, text).ok;
        }
        if (Object.keys(qc).length) finding.quoteCheck = qc;
      } catch { /* advisory */ }
      writeFinding(finding);
      ids.push(finding.id);
      if (!byTs.has(it.ts)) byTs.set(it.ts, []);
      byTs.get(it.ts).push(finding);
    }

    // One findings page per TS (run-findings-page skill layout).
    for (const [ts, list] of byTs) {
      try {
        const page = writeFindingsPage(list, {
          key, ts, runId: plan.runId, date: plan.date,
          title: list[0].failure?.title?.split(":").slice(1).join(":").trim() || "findings",
          passed: plan.passed,
        });
        for (const f of list) writeFinding({ ...readFinding(key, f.id), page });
      } catch (e) {
        ctx.log?.(`Findings page for ${ts} not written: ${e.message}`);
      }
    }

    const counts = ids.map(id => readFinding(key, id)?.classification).reduce((m, c) => (m[c] = (m[c] ?? 0) + 1, m), {});
    const summary = Object.entries(counts).map(([c, n]) => `${n} ${c}`).join(", ");
    updateTicket(key, t => {
      t.findings = [...ids, ...(t.findings ?? []).filter(x => !ids.includes(x))];
      if (ids.length && t.stage !== "done") t.stage = "findings";
      t.events = [{
        at: nowIso(),
        text: ids.length
          ? `Elf wrote ${ids.length} finding${ids.length > 1 ? "s" : ""} from run ${plan.runId ?? ""} (${summary})${fallback ? `; ${fallback} without Elf's analysis` : ""}`
          : `Elf found nothing to record from run ${plan.runId ?? ""}`,
      }, ...(t.events ?? [])].slice(0, 100);
      t.characters = t.characters ?? {};
      t.characters.elf = {
        ...(t.characters.elf ?? {}),
        state: !ok ? "error" : "waiting",
        note: !ok
          ? "Findings job did not finish; check the findings it saved"
          : hasQuestions(text) ? "Has a question about the findings" : `${ids.length} finding${ids.length === 1 ? "" : "s"} to check`,
      };
      return t;
    });
    try { fs.unlinkSync(planPath(key, job.id)); } catch { /* already gone */ }
    return { findings: ids, ticket: readTicket(key) };
  },
};

export default action;
