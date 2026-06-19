import { NextRequest, NextResponse } from 'next/server';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const SCRIPT_DIR  = process.env.WA_BLASTER_SCRIPT_DIR
  ?? path.join(process.cwd(), 'scripts', 'WA-Blaster');
const REPORT_FILE = path.join(SCRIPT_DIR, 'results', 'report.json');
const TIMEOUT_MS  = 60 * 60 * 1000; // 1 hour

let currentChild: ChildProcess | null = null;

interface RunState {
  running:   boolean;
  log:       string;
  exitCode:  number | null;
  report:    unknown;
  startedAt: string;
}

let runState: RunState = {
  running: false, log: '', exitCode: null, report: null, startedAt: '',
};

function killProcessTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    try { spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); }
    catch { try { child.kill('SIGKILL'); } catch { /* ignore */ } }
  }
}

// ── GET — poll status ─────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    running:   runState.running,
    log:       runState.log,
    exitCode:  runState.exitCode,
    report:    runState.report,
    startedAt: runState.startedAt,
  });
}

// ── POST — start a run ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (runState.running) {
    return NextResponse.json({ error: 'A run is already in progress.' }, { status: 409 });
  }

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({ error: `Script directory not found: ${SCRIPT_DIR}` }, { status: 500 });
  }

  if (!fs.existsSync(path.join(SCRIPT_DIR, 'node_modules'))) {
    return NextResponse.json({
      error: 'Playwright is not installed.\n\nRun: cd scripts/WA-Blaster && npm install',
    }, { status: 500 });
  }

  const body = await req.json() as {
    specFiles:    string[];
    grepPattern?: string;
    env?:         Record<string, string>;
  };

  const { specFiles, grepPattern, env = {} } = body;

  if (!specFiles?.length) {
    return NextResponse.json({ error: 'No spec files specified.' }, { status: 400 });
  }

  // Clean up previous report
  fs.mkdirSync(path.join(SCRIPT_DIR, 'results'), { recursive: true });
  if (fs.existsSync(REPORT_FILE)) fs.unlinkSync(REPORT_FILE);

  runState = { running: true, log: '', exitCode: null, report: null, startedAt: new Date().toISOString() };

  const args = ['playwright', 'test', ...specFiles];
  if (grepPattern) args.push('--grep', grepPattern);

  const child = spawn('npx', args, {
    cwd: SCRIPT_DIR,
    shell: true,
    detached: process.platform !== 'win32',
    env: { ...process.env, ...env },
  });
  currentChild = child;

  const timer = setTimeout(() => {
    killProcessTree(child);
    runState = {
      ...runState, running: false, exitCode: 1,
      log: runState.log + '\n[Timed out after 1 hour]',
    };
  }, TIMEOUT_MS);

  child.stdout.on('data', (d: Buffer) => {
    runState = { ...runState, log: runState.log + d.toString() };
  });
  child.stderr.on('data', (d: Buffer) => {
    runState = { ...runState, log: runState.log + d.toString() };
  });

  child.on('close', (code) => {
    clearTimeout(timer);
    currentChild = null;
    let report: unknown = null;
    if (fs.existsSync(REPORT_FILE)) {
      try { report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8')); } catch { /* ignore */ }
    }
    runState = { ...runState, running: false, exitCode: code ?? 1, report };
  });

  child.on('error', (err) => {
    clearTimeout(timer);
    currentChild = null;
    runState = { ...runState, running: false, exitCode: 1, log: runState.log + '\n' + err.message };
  });

  return NextResponse.json({ started: true });
}

// ── DELETE — stop the run ─────────────────────────────────────────────────────
export async function DELETE() {
  if (currentChild) {
    killProcessTree(currentChild);
    runState = { ...runState, running: false, log: runState.log + '\n[Stopped by user]' };
    currentChild = null;
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: 'No run in progress.' });
}
