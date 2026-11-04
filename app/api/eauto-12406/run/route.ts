import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { killTree, runInProgressResponse } from "@/lib/server/playwrightRun";

// EAINT-12406 runner — drives AZFAR'S automation, unchanged (Faizuddin,
// 2026-11-03: "for the runner page i want to use the automation from azfar").
// scripts/eauto-12406/ is a copy of github.com/modefair/eauto-qa-azfar
// (automation/ + cr/EAINT-12406/, commit in AZFAR-SOURCE-COMMIT.txt). Every run
// goes through his own entry point, automation/scripts/cr-run.mjs, exactly as
// his cr-runner calls it: lane lock, the per-TS gate (src/fixtures/ts-run.ts),
// gate.jsonl, evidence filed into cr/EAINT-12406/05-evidence/.
//
// What this route adds and nothing more:
// 1. the logins typed on the dashboard go into a git-ignored env file
//    (automation/.artifacts/dashboard.env) passed as ENV_FILE — his
//    load-env.ts reads it with override, so process env alone would be wiped;
// 2. the run is owned by the server, not the page: POST starts it, GET reads
//    it back, so leaving the page never loses the run;
// 3. GET ?file= serves evidence files under cr/EAINT-12406/ for the page.

export const maxDuration = 60;

const ROOT = path.join(process.cwd(), "scripts", "eauto-12406");
const AUTO = path.join(ROOT, "automation");
const CR = path.join(ROOT, "cr", "EAINT-12406");
const RUNS = path.join(CR, "04-runs");
const ENV_FILE = path.join(AUTO, ".artifacts", "dashboard.env");

const TS_ID = /^12406_(CP|QT|E2E|RC|RG)_TS\d{1,2}$/;

interface RunState {
  runId: string;
  ts: string[];
  instance: string;
  started: string;
  finished?: string;
  exitCode?: number | null;
  stopped?: boolean;
  log: string;
}

let current: { child: ChildProcess; state: RunState } | null = null;
let last: RunState | null = null;

const stripAnsi = (t: string) => t.replace(/\x1b\[[0-9;]*m/g, "");

/**
 * One env line, value QUOTED. dotenv reads an unquoted "#" as the start of a
 * comment, so the site password "…2025#" lost its "#" (2026-11-03). A quoted
 * value is kept whole; the quote picked is one the value does not contain
 * (single quotes are fully literal in dotenv). Newlines are dropped.
 */
function line(k: string, v: string | undefined): string {
  if (!v) return "";
  const val = String(v).replace(/[\r\n]/g, "");
  const q = ["'", '"', "`"].find((c) => !val.includes(c));
  if (!q) throw new Error(`${k} contains ' " and \` together; it cannot be written to the env file.`);
  return `${k}=${q}${val}${q}\n`;
}

const ENV_KEYS: Record<string, string> = {
  sitePassword: "SECARANG_SITE_PASSWORD",
  ciboUsername: "CIBO_USERNAME",
  ciboPassword: "CIBO_PASSWORD",
  fiuuBank: "FIUU_BANK",
  fiuuUsername: "FIUU_USERNAME",
  fiuuPassword: "FIUU_PASSWORD",
  testEmail: "SECARANG_TEST_EMAIL",
  testPhone: "SECARANG_TEST_PHONE",
  quoteIc: "SECARANG_QUOTE_IC",
  discountCode: "SECARANG_DISCOUNT_CODE",
  ffmpegPath: "FFMPEG_PATH",
};

function writeEnv(instance: string, inputs: Record<string, string>) {
  fs.mkdirSync(path.dirname(ENV_FILE), { recursive: true });
  let text = "# Written by the dashboard /eauto/12406 for one run. Git-ignored (.artifacts/). Never commit.\n";
  text += "TEST_ENV=staging\nNODE_TLS_REJECT_UNAUTHORIZED=0\n";
  text += line("SECARANG_BASE_URL", "https://staging.secarang.com");
  text += line("SECARANG_BASE_PATH", instance);
  for (const [field, key] of Object.entries(ENV_KEYS)) text += line(key, inputs[field]?.trim());
  fs.writeFileSync(ENV_FILE, text);
}

function gateOf(runId: string): Record<string, unknown>[] {
  const f = path.join(RUNS, runId, "gate.jsonl");
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).flatMap((l) => {
    try { return [JSON.parse(l)]; } catch { return []; }
  });
}

/** Newest gate verdict per TS over every run on this PC (04-runs/<run>/gate.jsonl). */
function latestPerTs() {
  const out: Record<string, { verdict: string; reasons: string[]; folder: string; run: string; at: string }> = {};
  if (!fs.existsSync(RUNS)) return out;
  const runs = fs.readdirSync(RUNS).filter((d) => fs.existsSync(path.join(RUNS, d, "gate.jsonl")))
    .map((d) => ({ d, t: fs.statSync(path.join(RUNS, d, "gate.jsonl")).mtimeMs }))
    .sort((a, b) => a.t - b.t);
  for (const { d } of runs) for (const g of gateOf(d)) {
    const ts = String(g.ts ?? "");
    if (ts) out[ts] = { verdict: String(g.verdict), reasons: (g.reasons as string[]) ?? [], folder: String(g.folder ?? ""), run: d, at: String(g.at ?? "") };
  }
  return out;
}

/** Files of one evidence folder (relative to cr/EAINT-12406). */
function listFolder(rel: string): string[] {
  const abs = safePath(rel);
  if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return [];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(path.relative(CR, p).split(path.sep).join("/"));
    }
  };
  walk(abs);
  return files.slice(0, 300);
}

/** A path under cr/EAINT-12406 only; gate folders are written as "cr/EAINT-12406/..." */
function safePath(rel: string): string | null {
  const clean = rel.replace(/\\/g, "/").replace(/^cr\/EAINT-12406\//, "");
  const abs = path.resolve(CR, clean);
  return abs.startsWith(CR + path.sep) || abs === CR ? abs : null;
}

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webm": "video/webm", ".mp4": "video/mp4",
  ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".md": "text/plain; charset=utf-8",
  ".csv": "text/csv", ".html": "text/plain; charset=utf-8",
};

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  if (file) {
    const abs = safePath(file);
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return NextResponse.json({ error: "not found" }, { status: 404 });
    const type = TYPES[path.extname(abs).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(fs.readFileSync(abs), { headers: { "Content-Type": type } });
  }
  const folder = req.nextUrl.searchParams.get("folder");
  if (folder) return NextResponse.json({ files: listFolder(folder) });

  const state = current?.state ?? last;
  return NextResponse.json({
    running: !!current,
    run: state ? { ...state, log: state.log.slice(-40000) } : null,
    gate: state ? gateOf(state.runId) : [],
    latest: latestPerTs(),
    ready: {
      installed: fs.existsSync(path.join(AUTO, "node_modules", "@playwright", "test")),
      envFile: fs.existsSync(ENV_FILE),
    },
  });
}

export async function POST(req: NextRequest) {
  if (current) return runInProgressResponse();
  const body = await req.json().catch(() => ({})) as {
    ts?: unknown; instance?: string; headed?: boolean; inputs?: Record<string, string>;
  };
  const ts = Array.isArray(body.ts) ? body.ts.filter((t): t is string => typeof t === "string" && TS_ID.test(t)) : [];
  if (!ts.length) return NextResponse.json({ error: "Pick at least one TS." }, { status: 400 });
  const instance = body.instance === "preprod" ? "preprod" : "ia";
  const inputs = body.inputs ?? {};
  if (!inputs.sitePassword?.trim()) return NextResponse.json({ error: "Type the Secarang site password first." }, { status: 400 });

  writeEnv(instance, inputs);
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const runId = `EAINT-12406-dash-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  // Azfar's runner, his flags: --no-vpn (Secarang staging is public), lane 1.
  const args = [path.join(AUTO, "scripts", "cr-run.mjs"), "--ticket", "EAINT-12406", "--instance", instance,
    "--lane", "1", "--ts", ts.join(","), "--run", runId, "--no-vpn"];
  const child = spawn(process.execPath, args, {
    cwd: AUTO,
    shell: false,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ENV_FILE, HEADED: body.headed === false ? "0" : "1", FORCE_COLOR: "0" },
  });
  const state: RunState = { runId, ts, instance, started: d.toISOString(), log: `> node scripts/cr-run.mjs ${args.slice(1).join(" ")}\n` };
  current = { child, state };
  const add = (b: Buffer) => { state.log += stripAnsi(b.toString()); if (state.log.length > 400000) state.log = state.log.slice(-300000); };
  child.stdout?.on("data", add);
  child.stderr?.on("data", add);
  const end = (code: number | null) => {
    state.finished = new Date().toISOString();
    state.exitCode = code;
    last = state;
    if (current?.state === state) current = null;
  };
  child.on("close", end);
  child.on("error", (e) => { state.log += `\n${e.message}\n`; end(1); });
  return NextResponse.json({ started: true, runId });
}

export async function DELETE() {
  if (!current) return NextResponse.json({ stopped: false, message: "No run in progress." });
  current.state.stopped = true;
  current.state.log += "\nStopped from the dashboard.\n";
  killTree(current.child);
  return NextResponse.json({ stopped: true });
}
