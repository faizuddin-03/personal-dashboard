import { NextRequest, NextResponse } from "next/server";
import type { ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { killTree, runInProgressResponse, spawnPlaywrightCli } from "@/lib/server/playwrightRun";
import { jsonAndSave } from "@/lib/server/savedResults";

/** Last result saved on the server (lib/savedRunKeys.ts, 2026-10-21). */
const SAVE_KEY = "eauto/bdp-creator";

export const maxDuration = 120;

// One run at a time — a second POST gets a 409; DELETE (Stop) kills the
// Playwright process tree. Same pattern as app/api/eauto-12107/run/route.ts.
let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: (() => void) | null = null;

interface RunRequest {
  deviceQty: number;
  extraInstalls: number;
  skipInstall: boolean;
  headless: boolean;
  baseUrl: string;
  ucdUser: string;
  ucdPass: string;
}

interface CreateBdpResult {
  reference: string | null;
  txnId: string;
  deviceQty: number;
  extraInstalls: number;
  skipInstall: boolean;
  companyName: string;
  createdAt: string;
  appointmentBooked: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RunRequest = await req.json();
    const { deviceQty, extraInstalls, skipInstall, headless, baseUrl, ucdUser, ucdPass } = body;

    if (currentChild) return runInProgressResponse();

    if (!ucdUser || !ucdPass) {
      return NextResponse.json({ error: "UCD username/password required." }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const testDir = path.join(projectRoot, "tests", "service-hub");
    const configPath = path.join(testDir, "playwright.config.ts");

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: "Test config not found." }, { status: 500 });
    }

    const resultPath = path.join(os.tmpdir(), `create-bdp-result-${Date.now()}.json`);

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      EAUTO_BASE_URL: baseUrl,
      EAUTO_UCD_USER: ucdUser,
      EAUTO_UCD_PASS: ucdPass,
      PW_HEADED: headless ? "0" : "1",
      EAUTO_CREATE_BDP_QTY: String(deviceQty || 1),
      EAUTO_CREATE_BDP_EXTRA_INSTALLS: String(extraInstalls || 0),
      EAUTO_CREATE_BDP_SKIP_INSTALL: skipInstall ? "1" : "0",
      PW_RESULT_PATH: resultPath,
    };

    // Argument array, no shell.
    const args = ["test", "--config", configPath, "--grep", "create-bdp"];
    stopRequested = false;

    return new Promise<NextResponse>((resolve) => {
      const proc = spawnPlaywrightCli(projectRoot, args, { env });
      currentChild = proc;

      let stdout = "";
      let stderr = "";
      let settled = false;
      proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

      // Stop pressed but the process never closed within 5s — answer anyway.
      forceResolveRun = () => {
        if (settled) return;
        settled = true;
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        resolve(jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { stopped: true, stderr: stderr.slice(-3000), stdout: stdout.slice(-3000) }));
      };

      proc.on("error", (err) => {
        if (settled) return;
        settled = true;
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });

      proc.on("close", (code) => {
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        if (settled) return;
        settled = true;
        let result: CreateBdpResult | null = null;
        try {
          if (fs.existsSync(resultPath)) {
            result = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
            fs.unlinkSync(resultPath);
          }
        } catch { /* fall through to error below */ }

        if (stopRequested) {
          return resolve(jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { stopped: true, result, stderr: stderr.slice(-3000), stdout: stdout.slice(-3000) }));
        }

        if (!result) {
          return resolve(jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, {
            error: "Run finished but produced no result — the purchase may have failed before reaching the listing.",
            exitCode: code,
            stderr: stderr.slice(-3000),
            stdout: stdout.slice(-3000),
          }, { status: 500 }));
        }

        resolve(jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { result }));
      });
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Run failed" },
      { status: 500 },
    );
  }
}

/** Stop button — kills the Playwright process tree. Returns 200 either way. */
export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killTree(currentChild);
    const savedResolve = forceResolveRun;
    setTimeout(() => { savedResolve?.(); }, 5000);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
