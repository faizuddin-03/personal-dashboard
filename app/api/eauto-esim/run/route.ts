import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// Runs the eSIM editor (scripts/eauto-esim): find a simulator record by vehicle
// prefix and apply the fields the user filled in. eSIM is VPN-only; the page
// makes the user confirm the VPN before this is ever called.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_ESIM_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-esim");
const TIMEOUT_MS = 8 * 60 * 1000;

interface RunRequest {
  entity: string;
  /** "read" reports the record and changes nothing; "write" applies changes. */
  mode?: "read" | "write";
  prefix: string;
  /** Field label → new value. Blank values are dropped before spawning. */
  changes: Record<string, string>;
  headless?: boolean;
  username?: string;
  password?: string;
}

interface AppliedChange { label: string; from: string; to: string }
interface RunResult {
  status?: string;
  mode?: "read" | "write";
  entity?: string;
  prefix?: string;
  applied?: AppliedChange[];
  /** Read mode: every field on the form, in form order. */
  fields?: { label: string; value: string }[];
}

let currentChild: ChildProcess | null = null;
let stopRequested = false;

function killTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

/** Last RESULT: line the spec printed. */
function parseResult(output: string): RunResult | null {
  let result: RunResult | null = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("RESULT:")) {
      try { result = JSON.parse(line.slice(7)) as RunResult; } catch { /* ignore */ }
    }
  }
  return result;
}

/** The [step] lines, so the UI can show what the run actually did. */
function parseSteps(output: string): string[] {
  return output.split("\n")
    .filter(l => l.includes("[step]"))
    .map(l => l.slice(l.indexOf("[step]") + 7).trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<RunRequest>;

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({
      error: `Playwright not installed. Run:\n\n  cd scripts/eauto-esim && npm install && npx playwright install chromium`,
    }, { status: 500 });
  }
  const prefix = body.prefix?.trim() ?? "";
  if (!prefix) {
    return NextResponse.json({ error: "A vehicle prefix is required." }, { status: 400 });
  }

  // Blank means "leave this field alone" — never "clear it" — so blanks are
  // dropped here as well as in the spec.
  const changes = Object.fromEntries(
    Object.entries(body.changes ?? {}).filter(([, v]) => typeof v === "string" && v.trim() !== ""),
  );
  // Reading needs no changes; only a write does.
  const mode = body.mode === "read" ? "read" : "write";
  if (mode === "write" && !Object.keys(changes).length) {
    return NextResponse.json({ error: "Every field was left blank, so there is nothing to change." }, { status: 400 });
  }

  stopRequested = false;

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    const child = spawn("npx", ["playwright", "test", "--project=esim"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ESIM_ENTITY: body.entity ?? "estm-enquiry",
        ESIM_PREFIX: prefix,
        ESIM_MODE: mode,
        ESIM_CHANGES: JSON.stringify(changes),
        ESIM_HEADLESS: body.headless ? "1" : "",
        ...(body.username && { ESIM_USER: body.username }),
        ...(body.password && { ESIM_PASS: body.password }),
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => {
      killTree(child);
      resolve({ code: 1, output: output + "\nTimed out after 8 minutes. Is the VPN still connected?" });
    }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); currentChild = null; resolve({ code: 1, output: err.message }); });
  });

  const parsed = parseResult(result.output);
  const steps = parseSteps(result.output);

  if (stopRequested) {
    return NextResponse.json({ stopped: true, steps, log: result.output });
  }

  // A network-level failure to a VPN-only host is almost always the VPN, and
  // saying so beats making the user read a Playwright stack trace.
  const looksLikeVpn = /ERR_CONNECTION|ERR_ADDRESS_UNREACHABLE|ERR_TIMED_OUT|net::ERR|ECONNREFUSED|ETIMEDOUT/i
    .test(result.output);

  return NextResponse.json({
    result: parsed,
    steps,
    hint: !parsed && looksLikeVpn
      ? "Could not reach 172.30.202.114 — the VPN looks disconnected. Reconnect and run again."
      : undefined,
    log: result.output,
  }, { status: parsed || result.code === 0 ? 200 : 500 });
}

export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killTree(currentChild);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
