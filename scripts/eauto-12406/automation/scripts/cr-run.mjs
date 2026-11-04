#!/usr/bin/env node
/**
 * Run a batch of a CR's TS the one way every run goes (cr-runner calls this).
 *
 *   node scripts/cr-run.mjs --ticket EAINT-12345 --instance preprod1 --lane 1 --ts IC_LST_TS2,IC_LST_TS3
 *   node scripts/cr-run.mjs --ticket EAINT-12345 --instance preprod1 --lane 1 --spec 03-spec/sheet-09-listing.spec.ts
 *   node scripts/cr-run.mjs --ticket EAINT-12345 --instance uat1 --lane auto --ts UTU_TS1     broker picks the lanes
 *   options: --run <RUN_ID> (default <ticket>-<yyyymmdd-hhmm>-L<lanes>)  --phase pre-push|post-push  --no-vpn  --no-retry
 *   lanes (21.10.2026): --lane 3 | --lane 1,2 (all of them) | --lane auto [--need single|ucd2ucd|main+sub] [--pool 3,4,5]
 *     auto: the need comes from --need, else from the TS' `needs` in 01-intake/ts.json (default single); the broker
 *     (lib/lane-broker.mjs) takes free lanes from env/lanes.json and waits when none is free.
 *
 * Run from automation/. What it does, in order:
 *  1. refuses a lane that env/lanes.json does not mark ready, or that another run holds (lock file);
 *  2. VPN: reconnects once if down, then keeps scripts/vpn-watchdog.ps1 running ONLY while a run
 *     is in progress (shared between lanes; the last run out stops it) — Azfar 13.10.2026: never
 *     leave the watcher on when nothing is running. The watchdog clicks the FortiClient tray icon,
 *     so the screen must stay unlocked;
 *  3. runs the TS on the `cr` project (video always on) with CR_TICKET / RUN_ID / INSTANCE / LANE set,
 *     so every TS goes through the per-TS gate in src/fixtures/ts-run.ts the moment it ends;
 *  4. re-runs, once, every TS the gate called ENV (VPN / network / wrong instance);
 *  5. prints one line per TS from 04-runs/<RUN_ID>/gate.jsonl and exits 0 only if every TS is VALID.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { sharedArtifacts } from "./lib/main-checkout.mjs";
import { acquireLanes, loadRoster } from "./lib/lane-broker.mjs";

const AUTO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(AUTO, "..");
// Lane locks + VPN state are one per machine: a run from a ticket worktree uses the main checkout's .artifacts.
const ART = sharedArtifacts(AUTO);
fs.mkdirSync(ART, { recursive: true });

// ------------------------------------------------------------------ args
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);
const ticket = opt("ticket");
const inst = opt("instance");
const laneArg = opt("lane", "1");
const tsList = (opt("ts", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const spec = opt("spec");
const phase = opt("phase", "");
if (!ticket || !inst || (!tsList.length && !spec)) {
  console.error("usage: node scripts/cr-run.mjs --ticket EAINT-x --instance preprod1 --lane 1 (--ts A,B | --spec <path under cr/<ticket>/>)");
  process.exit(2);
}
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const crDir = path.join(REPO, "cr", ticket);
if (!fs.existsSync(path.join(crDir, "01-intake", "ts.json")))
  console.warn(`WARNING: cr/${ticket}/01-intake/ts.json is missing — every TS will be refused (no expected points). Run scripts/cr-ts-snapshot.py first.`);

// ------------------------------------------------------------------ lane
const roster = loadRoster(AUTO);
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const stampOf = (ls) => `${ticket}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}-L${ls.join("")}`;
let held; // { lanes: [lane numbers], release() }
if (laneArg === "auto") {
  const order = { single: 0, "main+sub": 1, ucd2ucd: 2 };
  let need = opt("need");
  if (!need) {
    let cases = {};
    try { cases = JSON.parse(fs.readFileSync(path.join(crDir, "01-intake", "ts.json"), "utf8")).cases ?? {}; } catch { /* warned above */ }
    const needs = [...new Set(tsList.map((t) => cases[t]?.needs).filter(Boolean))];
    if (needs.includes("ucd2ucd") && needs.includes("main+sub")) { console.error(`these TS need both ucd2ucd and main+sub (${tsList.join(",")}): run them in two batches`); process.exit(2); }
    need = needs.sort((x, y) => (order[y] ?? 0) - (order[x] ?? 0))[0] ?? "single";
  }
  const pool = opt("pool") ? opt("pool").split(",").map((x) => x.trim()) : undefined;
  const got = await acquireLanes({ auto: AUTO, need, pool, runId: `${ticket} (${need}, starting)` });
  held = { lanes: got.lanes.map((l) => l.lane), release: got.release };
  console.log(`broker: ${need} -> lanes ${got.lanes.map((l) => `${l.lane} (${l.persona}, ${l.company}, ${l.role})`).join(" + ")}`);
} else {
  const want = laneArg.split(",").map((x) => x.trim()).filter(Boolean);
  const taken = [];
  for (const l of want) {
    const info = roster.find((r) => r.lane === l);
    if (!info || !info.ready) { for (const t of taken) fs.rmSync(t, { force: true }); console.error(`lane ${l} is not marked ready in env/lanes.json`); process.exit(2); }
    const f = path.join(ART, `lane-${l}.lock`);
    if (fs.existsSync(f)) {
      const h = JSON.parse(fs.readFileSync(f, "utf8"));
      if (alive(h.pid)) { for (const t of taken) fs.rmSync(t, { force: true }); console.error(`lane ${l} is busy: run ${h.run} (pid ${h.pid}) since ${h.since}`); process.exit(3); }
    }
    fs.writeFileSync(f, JSON.stringify({ pid: process.pid, run: "starting", since: now.toISOString() }));
    taken.push(f);
  }
  held = { lanes: want, release: () => { for (const t of taken) fs.rmSync(t, { force: true }); } };
}
const lane = held.lanes[0];
const runId = opt("run", stampOf(held.lanes));
for (const l of held.lanes) fs.writeFileSync(path.join(ART, `lane-${l}.lock`), JSON.stringify({ pid: process.pid, run: runId, since: now.toISOString() }));
// what this run set out to do, so the Studio can say "12 of 27 scenarios done" while it runs (gate.jsonl gains a line per TS)
fs.mkdirSync(path.join(crDir, "04-runs", runId), { recursive: true });
fs.writeFileSync(path.join(crDir, "04-runs", runId, "plan.json"), JSON.stringify({ ticket, instance: inst, lanes: held.lanes, ts: tsList, spec: spec || "", started: now.toISOString() }, null, 1));

// ------------------------------------------------------------------ VPN (only while running)
const vpnFile = path.join(ART, "vpn-watch.json");
const ps = (args) => ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(AUTO, "scripts", "vpn-watchdog.ps1"), ...args];
function vpnJoin() {
  if (flag("no-vpn") || process.platform !== "win32") return;
  spawnSync("powershell", ps(["-Once"]), { stdio: "inherit" });
  const st = fs.existsSync(vpnFile) ? JSON.parse(fs.readFileSync(vpnFile, "utf8")) : { pid: 0, holders: [] };
  st.holders = st.holders.filter(alive).concat(process.pid);
  if (!st.pid || !alive(st.pid)) {
    const w = spawn("powershell", ps([]), { detached: true, stdio: "ignore", windowsHide: true });
    w.unref();
    st.pid = w.pid;
    console.log(`VPN watchdog started (pid ${w.pid}) for this run`);
  }
  fs.writeFileSync(vpnFile, JSON.stringify(st));
}
function vpnLeave() {
  if (flag("no-vpn") || !fs.existsSync(vpnFile)) return;
  const st = JSON.parse(fs.readFileSync(vpnFile, "utf8"));
  st.holders = st.holders.filter((p) => p !== process.pid && alive(p));
  if (!st.holders.length) {
    if (st.pid && alive(st.pid)) spawnSync("taskkill", ["/PID", String(st.pid), "/T", "/F"], { stdio: "ignore" });
    fs.rmSync(vpnFile, { force: true });
    console.log("VPN watchdog stopped (no run in progress)");
  } else fs.writeFileSync(vpnFile, JSON.stringify(st));
}

// ------------------------------------------------------------------ run
const env = { ...process.env, CR_TICKET: ticket, RUN_ID: runId, INSTANCE: inst, TEST_ENV: inst, LANE: lane, LANES: held.lanes.join(","), ...(phase ? { CR_PHASE: phase } : {}) };
// Forward slashes: Playwright reads file filters as regular expressions, and a Windows backslash would escape them.
const target = spec ? path.posix.join("..", "cr", ticket, spec.split(path.sep).join("/")) : path.posix.join("..", "cr", ticket, "03-spec");
const grepOf = (ids) => (ids.length ? ["--grep", `\\b(?:${ids.join("|")})\\b`] : []);
function playwright(ids) {
  const args = ["test", target, "--project=cr", "--workers=1", `--output=.artifacts/test-results-lane${lane}`, ...grepOf(ids)];
  console.log(`\n> playwright ${args.join(" ")}   [run ${runId}, /${inst}, lane ${lane}]`);
  // Playwright's own CLI through node, no shell: a shell would read the "|" in the TS filter as a pipe.
  return spawnSync(process.execPath, [path.join(AUTO, "node_modules", "@playwright", "test", "cli.js"), ...args], { cwd: AUTO, env, stdio: "inherit" }).status;
}
const gateFile = path.join(crDir, "04-runs", runId, "gate.jsonl");
const latest = () => {
  const m = new Map();
  if (fs.existsSync(gateFile)) for (const l of fs.readFileSync(gateFile, "utf8").split(/\r?\n/).filter(Boolean)) { const g = JSON.parse(l); m.set(g.ts, g); }
  return m;
};

let exit = 1;
try {
  vpnJoin();
  playwright(tsList);
  const env1 = [...latest().values()].filter((g) => g.verdict === "ENV").map((g) => g.ts);
  if (env1.length && !flag("no-retry")) {
    console.log(`\nRe-running once (environment): ${env1.join(", ")}`);
    spawnSync("powershell", ps(["-Once"]), { stdio: "inherit" });
    playwright(env1);
  }
  const all = [...latest().values()];
  const missing = tsList.filter((t) => !all.some((g) => g.ts === t));
  console.log(`\n=== ${runId}: ${all.length} TS judged ===`);
  for (const g of all) console.log(`${g.verdict.padEnd(8)} ${g.ts.padEnd(18)} ${g.folder}${g.reasons.length ? `  — ${g.reasons.join("; ")}` : ""}`);
  for (const g of all) for (const w of g.warnings ?? []) console.log(`WARNING  ${g.ts.padEnd(18)} ${w}`);
  for (const t of missing) console.log(`NOT RUN  ${t.padEnd(18)} (no test title starts with it, or the run stopped before it)`);
  exit = all.length && all.every((g) => g.verdict === "VALID") && !missing.length ? 0 : 1;
} finally {
  vpnLeave();
  held.release();
}
process.exit(exit);
