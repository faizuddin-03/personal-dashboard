// /api/agents/miro-login — the Miro sign-in the pipeline characters use to read
// boards (scripts/pipeline/tools/miro.mjs, own profile data/agents/miro-profile/).
// GET: status from data/agents/miro-status.json (no cookies, no tokens).
// POST: opens the VISIBLE Miro sign-in window (Faizuddin types his own login).
// POST ?dry=1: returns the command without starting it (for checks).
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";

export const dynamic = "force-dynamic";

const AGENTS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "agents");
const STATUS_FILE = path.join(AGENTS_DIR, "miro-status.json");
const LOCK_FILE = path.join(AGENTS_DIR, "miro-login.lock");
const SCRIPT = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "pipeline", "tools", "miro.mjs");

interface MiroStatus {
  signedIn?: boolean; signedInAt?: string; lastOkAt?: string; lastCheckAt?: string;
  lastBoard?: string; lastError?: string | null;
}

function readJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; }
  catch { return null; }
}

function loginOpen(): boolean {
  const lock = readJson<{ pid?: number }>(LOCK_FILE);
  if (!lock?.pid) return false;
  try { process.kill(lock.pid, 0); return true; } catch { return false; }
}

function status() {
  const s = readJson<MiroStatus>(STATUS_FILE) ?? {};
  return {
    signedIn: s.signedIn === true,
    signedInAt: s.signedInAt ?? null,
    lastOkAt: s.lastOkAt ?? null,
    lastCheckAt: s.lastCheckAt ?? null,
    lastError: s.lastError ?? null,
    loginOpen: loginOpen(),
  };
}

export async function GET() {
  return Response.json(status(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const command = `node scripts/pipeline/tools/miro.mjs login`;
  if (!fs.existsSync(SCRIPT)) {
    return Response.json({ error: "The Miro reader (scripts/pipeline/tools/miro.mjs) is missing." }, { status: 409 });
  }
  if (loginOpen()) return Response.json({ started: false, alreadyOpen: true, ...status() });
  if (dry) return Response.json({ dry: true, command, ...status() });

  try {
    const child = spawn(process.execPath, [SCRIPT, "login"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      windowsHide: false, // the Miro window must show for Faizuddin
    });
    child.on("error", () => { /* reported through miro-status.json */ });
    child.unref();
  } catch (e) {
    return Response.json({ error: `Could not open the Miro window: ${(e as Error).message}` }, { status: 500 });
  }
  return Response.json({ started: true, command });
}
