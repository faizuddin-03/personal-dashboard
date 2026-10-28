// Shared parts of Dwarf's jobs (dwarf:build, dwarf:chat, dwarf:sync), 2026-10-27.

import fs from "node:fs";
import path from "node:path";
import { digitsOf } from "../prompts-common.mjs";
import { ROOT } from "../store.mjs";
import { scenariosJsonRel } from "./_elf-common.mjs";

/** Where this ticket's automation lives (scaffold skill naming). */
export function suitePaths(key) {
  const d = digitsOf(key);
  return {
    digits: d,
    suiteDir: `scripts/eauto-${d}`,
    apiDir: `app/api/eauto-${d}`,
    pageDir: `app/eauto/${d}`,
    pageFile: `app/eauto/${d}/page.tsx`,
    // Runner contract (2026-10-28): the runner UI is a reusable client component.
    runnerFile: `app/eauto/${d}/Runner.tsx`,
    runnerPage: `/eauto/${d}`,
    runKey: `eauto/${d}`,
    // 12166-style nesting also counts as "already exists".
    altApiDir: `app/api/eauto/${d}`,
  };
}

/** Dirs of this ticket's automation that already exist on disk. */
export function existingSuiteDirs(p) {
  return [p.suiteDir, p.apiDir, p.pageDir, p.altApiDir].filter(rel => fs.existsSync(path.join(ROOT, rel)));
}

// ── build marker (2026-10-27) ───────────────────────────────────────
// dwarf:build writes <suiteDir>/.pipeline-build.json when it creates the
// suite folder: { status: "building" | "complete", ticket, startedAt, jobId,
// completedAt? }. It tells a half-finished pipeline build (continue it) apart
// from real automation made outside the pipeline (no marker: never touched).
export const markerRel = p => `${p.suiteDir}/.pipeline-build.json`;

export function readBuildMarker(p) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, markerRel(p)), "utf8"));
    return m && typeof m === "object" && typeof m.status === "string" ? m : null;
  } catch { return null; }
}

export function writeBuildMarker(p, marker) {
  fs.mkdirSync(path.join(ROOT, p.suiteDir), { recursive: true });
  fs.writeFileSync(path.join(ROOT, markerRel(p)), JSON.stringify(marker, null, 2) + "\n");
  return marker;
}

/**
 * What dwarf:build should do with this ticket's suite folder:
 *   new      — no suite folder and no other part of the automation: build it
 *   continue — folder + marker "building" for this ticket: finish the stopped build
 *   complete — folder + marker "complete" for this ticket: already built by the pipeline
 *   foreign  — anything else that exists (no marker, another ticket's marker, or
 *              api/page dirs without the suite): made outside the pipeline, never rebuilt
 */
export function buildState(key) {
  const p = suitePaths(key);
  const found = existingSuiteDirs(p);
  if (!fs.existsSync(path.join(ROOT, p.suiteDir))) return { state: found.length ? "foreign" : "new", found, marker: null, p };
  const marker = readBuildMarker(p);
  if (!marker || marker.ticket !== key) return { state: "foreign", found, marker, p };
  if (marker.status === "building") return { state: "continue", found, marker, p };
  if (marker.status === "complete") return { state: "complete", found, marker, p };
  return { state: "foreign", found, marker, p };
}

/** Dirs Dwarf may edit for this ticket: only the ones the pipeline's Dwarf built. */
export function ownDirs(ticket) {
  if (!ticket.files?.suiteDir) return [];
  const p = suitePaths(ticket.key);
  return [p.suiteDir, p.apiDir, p.pageDir];
}

/** The Playwright titles Dwarf must use: "<id>: <title>", automated TS only. */
export function scenarioTitles(store, key) {
  try {
    const list = JSON.parse(fs.readFileSync(store.repoPath(scenariosJsonRel(key)), "utf8"));
    return list.map(s => ({ id: s.id, title: `${s.id}: ${s.title}`, manual: !!s.manual }));
  } catch { return []; }
}

/** _reference/html capture folders, for the prompt. */
export function htmlCaptures() {
  const base = path.join(ROOT, "_reference", "html");
  try {
    return fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => `_reference/html/${d.name}/`);
  } catch { return []; }
}

// ── Runner contract (2026-10-28, ticket-automation-panel) ────────────
// Faizuddin, 2026-10-27: "once the automation is created, the dwarf should
// also build a page for it in the ticket page, for me to track the
// automation, and to run it". The runner UI is app/eauto/<digits>/Runner.tsx
// (default export, props { embedded?, pick? }), page.tsx only renders it, and
// lib/pipeline/runnerRegistry.ts holds one line per pipeline-built suite, so
// /pipeline/<KEY> can embed it. Design: scripts/pipeline/README.md §10.
export const REGISTRY_REL = "lib/pipeline/runnerRegistry.ts";

/** The registry line Dwarf adds for this ticket. */
export function registryLine(key) {
  const p = suitePaths(key);
  return `"${key}": { runKey: "${p.runKey}", page: "${p.runnerPage}", load: () => import("@/app/eauto/${p.digits}/Runner") },`;
}

/** Prompt block: how Dwarf builds the runner so the ticket page can embed it. */
export function runnerContractRules(key) {
  const p = suitePaths(key);
  const tick = "`";
  return [
    `Runner contract (the ticket page /pipeline/${key} shows this runner inside its "Automation" panel):`,
    `1. Put the whole runner UI in ${p.runnerFile}: "use client", default export, props ${tick}{ embedded?: boolean; pick?: string[] }${tick} (type RunnerProps from "@/lib/pipeline/runnerRegistry"). Everything the skill puts in the runner page (SCENARIOS, RUN_KEY = "${p.runKey}", checklist, queue, startRun/stopRun via useApp(), demo/detailed mode, video, evidence, past runs) lives in this component.`,
    `2. embedded = true: hide the page header and the back link, no full-page padding or min-height, and fit the panel width (no fixed widths wider than the panel; wrap or scroll inside).`,
    `3. pick holds scenarios.json ids (e.g. ${p.digits}_TS01); match them to SCENARIOS by the title prefix "<id>: ". Each time the list changes, tick exactly the listed TS that SCENARIOS knows and untick the rest (a useEffect on pick?.join(",")); undefined leaves the selection alone. List SCENARIOS P1 first, then P2, then P3 (scenarios.json "priority"), keeping the ids, so the default order runs the P1 tests first.`,
    `4. ${p.pageFile} only renders the runner: ${tick}import Runner from "./Runner"; export default function Page() { return <Runner />; }${tick}. No other logic in page.tsx.`,
    `5. Add exactly one line to the RUNNERS object in ${REGISTRY_REL} (one line, change nothing else in that file):`,
    `   ${registryLine(key)}`,
    `6. Never change useBackgroundRuns, AppShell or the ticket page; the panel and the standalone page share the run through RUN_KEY.`,
  ].join("\n");
}

/** Problems with the runner contract of a pipeline-built suite ([] = fine). */
export function runnerContractProblems(key) {
  const p = suitePaths(key);
  const problems = [];
  const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return null; } };
  const runner = read(p.runnerFile);
  if (runner == null) problems.push(`${p.runnerFile} was not created`);
  else {
    if (!/export\s+default\s/.test(runner)) problems.push(`${p.runnerFile} has no default export`);
    if (!/\bembedded\b/.test(runner)) problems.push(`${p.runnerFile} does not use the "embedded" prop`);
    if (!runner.includes(`"${p.runKey}"`)) problems.push(`${p.runnerFile} does not use RUN_KEY "${p.runKey}"`);
  }
  const page = read(p.pageFile);
  if (page != null && !/from\s+["']\.\/Runner["']/.test(page)) problems.push(`${p.pageFile} does not render ./Runner`);
  const reg = read(REGISTRY_REL) ?? "";
  const entry = reg.split(/\r?\n/).find(l => l.trim().startsWith(`"${key}"`));
  if (!entry) problems.push(`no "${key}" line in ${REGISTRY_REL}`);
  else if (!entry.includes(`"@/app/eauto/${p.digits}/Runner"`) || !entry.includes(`"${p.runKey}"`)) problems.push(`the "${key}" line in ${REGISTRY_REL} does not match: ${registryLine(key)}`);
  return problems;
}

/**
 * finish() of dwarf:build / dwarf:sync: checks the runner contract, records
 * files.runner, and notes problems in Dwarf's chat. Advisory (never throws):
 * without it the ticket page links to the runner page instead of embedding it.
 */
export function runnerAfterDwarf(ctx) {
  const { store, job } = ctx;
  const key = job.key;
  const p = suitePaths(key);
  let problems;
  try { problems = runnerContractProblems(key); } catch { return null; }
  const runnerBuilt = fs.existsSync(path.join(ROOT, p.runnerFile));
  store.updateTicket(key, t => {
    if (runnerBuilt) t.files = { ...t.files, runner: p.runnerFile };
    t.events = [{ at: store.nowIso(), text: problems.length ? `Runner contract: ${problems.length} problem(s)` : "Runner contract: ok (shown in the ticket page)" }, ...(t.events ?? [])].slice(0, 100);
  });
  store.appendChat(key, "dwarf", {
    from: "system",
    text: problems.length
      ? `Runner contract has ${problems.length} problem(s), so the ticket page only links to the runner page:\n${problems.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\nAsk Dwarf in the chat to fix them.`
      : `Runner contract: ok. The runner is shown in the ticket page's Automation panel (${p.runnerFile}, registry line in ${REGISTRY_REL}).`,
    jobId: job.id,
  });
  return problems;
}
