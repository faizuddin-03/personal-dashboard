// `npm run dev`: starts `next dev`, then opens the main pages once so their
// first visit does not wait for a build (Faizuddin, 2026-10-28: pages were slow
// on first open — /eauto/12257 took ~26 s to build). Pages are warmed one at a
// time to keep memory flat. `npm run dev:plain` starts next dev without this.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;

// Most used first. Dynamic routes ([key]) and WA Blaster are left out.
const PAGES = [
  "/", "/pipeline", "/pipeline/learnings", "/agents", "/jira", "/calendar", "/todo",
  "/daily-update", "/notes", "/knowledge", "/tickets", "/kanban", "/settings",
  "/eauto", "/eauto/12257", "/eauto/12153", "/eauto/preapp", "/eauto/esim",
  "/eauto/estm", "/eauto/flows", "/eauto/insurance", "/eauto/jomcheck",
  "/jira/studies", "/jira/mentions", "/tests", "/qa-flow",
];
const APIS = ["/api/pipeline/tickets", "/api/pipeline/jobs", "/api/agents/status", "/api/knowledge"];

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], { stdio: "inherit" });
const stop = sig => { if (!child.killed) child.kill(sig); };
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
child.on("exit", code => process.exit(code ?? 0));

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function up() {
  for (let i = 0; i < 120; i++) {
    try { await fetch(`${BASE}/api/agents/status`, { signal: AbortSignal.timeout(5_000) }); return true; } catch { await sleep(1_000); }
  }
  return false;
}

async function warm() {
  if (!(await up())) { console.log("[warm-up] server did not answer within 2 minutes; skipped"); return; }
  const t0 = Date.now();
  let failed = 0;
  for (const p of [...PAGES, ...APIS]) {
    try {
      const r = await fetch(BASE + p, { signal: AbortSignal.timeout(120_000) });
      await r.arrayBuffer();
      if (r.status >= 500) failed++;
    } catch { failed++; }
  }
  console.log(`[warm-up] ${PAGES.length} pages + ${APIS.length} data routes ready in ${Math.round((Date.now() - t0) / 1000)} s${failed ? ` (${failed} failed)` : ""}`);
}

warm();
