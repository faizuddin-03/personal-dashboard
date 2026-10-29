/**
 * EAINT-12257 — DuitNow QR happy flow runner.
 *
 * maxDuration / TIMEOUT_MS are deliberately large: the run stops twice for a
 * person (the reCAPTCHA tick, then the phone scan), and the script's own
 * budgets are QR_GATE_BUDGET_MS + QR_SCAN_BUDGET_MS. The ceiling here has to
 * outlive both of those plus the ~4 minutes of machine time around them, or the
 * route kills a run that was only ever waiting on the operator.
 */
import { NextRequest, NextResponse } from "next/server";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { runState } from "../runState";

export const maxDuration = 3600;

const SCRIPT_DIR = process.env.EAUTO_DUITNOW_QR_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-duitnow-qr");
const TIMEOUT_MS = 60 * 60 * 1000;

interface RunRequest {
  runId?: string;
  /** Full test title(s) to --grep. TS02 needs the BackOffice logins. */
  scenarios?: string[];
  baseUrl?: string;
  instance?: string;
  headless?: boolean;
  video?: boolean;
  approverUser?: string;
  approverPass?: string;
  assigneeUser?: string;
  assigneePass?: string;
  assigneeName?: string;
  ucdGroup?: string;
  fiuuUser?: string;
  fiuuPass?: string;
  businessType?: string;
  ownerTag?: string;
  emailPrefix?: string;
  emailDomain?: string;
  tinPrefix?: string;
  companyName?: string;
  licenceNo?: string;
  /** SSM types only — a real company's numbers, from the Checker tab. */
  oldBrn?: string;
  newBrn?: string;
  tin?: string;
  sst?: string;
  adminEmail?: string;
  expectedFee?: string;
  gateBudgetMin?: number;
  scanBudgetMin?: number;
}

function killTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch {
      try { child.kill("SIGKILL"); } catch { /* ignore */ }
    }
  }
}

function stripAnsi(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\[[0-9;]*m/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RunRequest;

    if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
      return NextResponse.json({
        error:
          "Playwright not installed. Run:\n\n" +
          "  cd scripts/eauto-duitnow-qr && npm install && npx playwright install chromium",
      }, { status: 500 });
    }

    // A headless run cannot complete — the QR has to be on screen to scan.
    if (body.headless) {
      return NextResponse.json({
        error: "This flow cannot run headless — the QR code has to be visible on screen to scan it.",
      }, { status: 400 });
    }

    const runId = body.runId || `qr-${Date.now()}`;
    const entry = { child: null as ChildProcess | null, stopRequested: false, outputBuffer: "" };
    runState.runs.set(runId, entry);

    const scenarios = body.scenarios?.length ? body.scenarios : ["12257_TS01"];

    // TS02 walks the full 11-phase chain, which means two BackOffice logins.
    // Catch that here rather than 4 minutes into a run that has already spent a
    // reCAPTCHA tick and minted a dealer.
    const needsBo = scenarios.some(s => /TS02/.test(s));
    if (needsBo) {
      const missing = ([
        ["approverUser", body.approverUser], ["approverPass", body.approverPass],
        ["assigneeUser", body.assigneeUser], ["assigneePass", body.assigneePass],
      ] as const).filter(([, v]) => !v).map(([k]) => k);
      if (missing.length) {
        return NextResponse.json({
          error: `TS02 drives the full chain through BackOffice and needs both logins. Missing: ${missing.join(", ")}.`,
        }, { status: 400 });
      }
    }

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      EAUTO_BASE: body.baseUrl || "https://staging.eauto.my",
      EAUTO_INSTANCE: body.instance || "uat4",
      QR_APPROVER_USER: body.approverUser || "",
      QR_APPROVER_PASS: body.approverPass || "",
      QR_ASSIGNEE_USER: body.assigneeUser || "",
      QR_ASSIGNEE_PASS: body.assigneePass || "",
      QR_ASSIGNEE_NAME: body.assigneeName || "",
      QR_UCD_GROUP: body.ucdGroup || "",
      QR_FIUU_USER: body.fiuuUser || "",
      QR_FIUU_PASS: body.fiuuPass || "",
      QR_HEADLESS: "0",
      QR_VIDEO: body.video === false ? "0" : "1",
      QR_GATE_BUDGET_MS: String(Math.round((body.gateBudgetMin ?? 5) * 60_000)),
      QR_SCAN_BUDGET_MS: String(Math.round((body.scanBudgetMin ?? 10) * 60_000)),
      QR_EXPECTED_FEE: body.expectedFee || "108.00",
      // Identity: blank means "generate a fresh unique one".
      QR_BUSINESS_TYPE: body.businessType || "TRADING_SARAWAK",
      QR_OWNER_TAG: body.ownerTag || "",
      QR_EMAIL_PREFIX: body.emailPrefix || "",
      QR_EMAIL_DOMAIN: body.emailDomain || "",
      QR_TIN_PREFIX: body.tinPrefix || "",
      QR_COMPANY_NAME: body.companyName || "",
      QR_LICENCE_NO: body.licenceNo || "",
      QR_OLD_BRN: body.oldBrn || "",
      QR_NEW_BRN: body.newBrn || "",
      QR_TIN: body.tin || "",
      QR_SST: body.sst || "",
      QR_ADMIN_EMAIL: body.adminEmail || "",
    };

    const result = await new Promise<{ code: number; output: string }>((resolve) => {
      // On Windows we spawn through cmd.exe (shell: true, to resolve npx.cmd) and
      // cmd re-parses the argv, so a "|" joining two titles reads as a PIPE
      // unless the whole value is quoted.
      const grep = scenarios.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const grepArg = process.platform === "win32" ? `"${grep.replace(/"/g, "")}"` : grep;

      const child: ChildProcess = spawn("npx", ["playwright", "test", "--grep", grepArg, "--reporter=list"], {
        cwd: SCRIPT_DIR,
        detached: process.platform !== "win32",
        shell: process.platform === "win32",
        env,
      });
      entry.child = child;

      const timer = setTimeout(() => {
        killTree(child);
        resolve({ code: 1, output: entry.outputBuffer + "\nTimed out after 60 minutes." });
      }, TIMEOUT_MS);

      const collect = (d: Buffer) => { entry.outputBuffer += stripAnsi(d.toString()); };
      child.stdout?.on("data", collect);
      child.stderr?.on("data", collect);

      child.on("close", (code) => {
        clearTimeout(timer);
        entry.child = null;
        resolve({ code: code ?? 1, output: entry.outputBuffer });
      });
      child.on("error", (err) => {
        clearTimeout(timer);
        entry.child = null;
        resolve({ code: 1, output: entry.outputBuffer + "\n" + err.message });
      });
    });

    // The identity and the minted reference are the run's real product — pull
    // them out of the log so the page can show them without the operator
    // scrolling raw Playwright output.
    const identity = result.output.match(/\[identity\]\s*(\{.*\})/)?.[1];
    const ref = result.output.match(/\[result\]\s*preApplicationRef=(\S+)/)?.[1];
    const stopped = runState.runs.get(runId)?.stopRequested ?? false;

    runState.runs.delete(runId);

    return NextResponse.json({
      exitCode: result.code,
      passed: result.code === 0,
      stopped,
      preApplicationRef: ref ?? null,
      identity: identity ? JSON.parse(identity) : null,
      output: result.output.slice(-40_000),
    }, { status: result.code === 0 || stopped ? 200 : 500 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Run failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get("runId") ?? "";
  const entry = runState.runs.get(runId);
  if (entry?.child) {
    entry.stopRequested = true;
    killTree(entry.child);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
