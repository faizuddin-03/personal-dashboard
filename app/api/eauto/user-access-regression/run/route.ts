import { NextRequest, NextResponse } from "next/server";
import type { ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { organizeTestEvidence } from "@/lib/testEvidence";
import { killTree, runInProgressResponse, spawnPlaywrightCli, runFolderStamp } from "@/lib/server/playwrightRun";

// One run at a time — a second POST gets a 409; DELETE (Stop) kills the
// Playwright process tree. Same pattern as app/api/eauto-12107/run/route.ts.
let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: (() => void) | null = null;

// 3600s — an open-ended batch of accounts, each needing a login + several
// page views, and detailed mode (default on, see knowledge/automation-testing.md's
// "detailed mode" standing rule) adds real time per step. Only enforced on
// platforms that respect this Next.js route-segment config (e.g. Vercel) —
// irrelevant locally, which is how this must run anyway.
export const maxDuration = 3600;

// Evidence publishing follows the exact same pattern as
// app/api/eauto/12166/run/route.ts's publishEvidence() — copy every
// video/screenshot/trace under recordDir into public/qa-artifacts/, so the
// browser can play/download them as real static URLs. Per Faizuddin,
// 2026-09-24: "i want recording to download also" — this suite previously
// had no video recording at all.
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-user-access-regression");
// Requirement C (Faizuddin, 2026-10-21): keep every run's evidence so TS Tracker links never break; default no prune.
const KEEP_RUN_FOLDERS = Number(process.env.EAUTO_UAR_KEEP_RUN_FOLDERS) || Infinity;

function pruneOldRunFolders() {
  if (!fs.existsSync(PUBLIC_ART)) return;
  const entries = fs.readdirSync(PUBLIC_ART, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const full = path.join(PUBLIC_ART, e.name);
      return { full, t: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => a.t - b.t);
  const excess = entries.length - KEEP_RUN_FOLDERS;
  if (excess <= 0) return;
  for (const e of entries.slice(0, excess)) {
    try { fs.rmSync(e.full, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

interface EvidenceItem {
  label: string;
  url: string;
  kind: "video" | "image" | "trace";
}

function publishEvidence(runId: string, recordDir: string, results: AccountResult[] | null): EvidenceItem[] {
  pruneOldRunFolders();
  const runDir = path.join(PUBLIC_ART, runId);
  const webBase = `/qa-artifacts/eauto-user-access-regression/${runId}`;
  // meta.json lets app/api/eauto/user-access-regression/history list this
  // run under Past runs. One "result" per BO account checked.
  try {
    const accounts = (results ?? []).map((r) => r.username);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, "meta.json"), JSON.stringify({
      runId,
      runLabel: !accounts.length ? "UAR"
        : accounts.length <= 3 ? `UAR_${accounts.join("_")}` : `UAR_${accounts.length}_accounts`,
      timestamp: Date.now(),
      scenarios: accounts.map((u) => `Account: ${u}`),
      results: (results ?? []).map((r) => ({ title: `Account: ${r.username}`, status: r.pass ? "passed" : "failed" })),
    }));
  } catch { /* best-effort — Past runs falls back to folder mtime */ }
  if (!fs.existsSync(recordDir)) return [];

  const kindFor: Record<string, EvidenceItem["kind"]> = { ".webm": "video", ".png": "image", ".zip": "trace" };
  const out: EvidenceItem[] = [];

  const walk = (dir: string, rel: string) => {
    for (const f of fs.readdirSync(dir)) {
      if (rel === "" && f === "_run") continue; // run metadata (report.json), not evidence
      const full = path.join(dir, f);
      const relPath = rel ? `${rel}/${f}` : f;
      if (fs.statSync(full).isDirectory()) { walk(full, relPath); continue; }
      const ext = path.extname(f).toLowerCase();
      const kind = kindFor[ext];
      if (!kind) continue;
      const dest = path.join(runDir, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        fs.copyFileSync(full, dest);
        out.push({ label: relPath, url: `${webBase}/${relPath}`, kind });
      } catch { /* skip this one, keep publishing the rest */ }
    }
  };
  walk(recordDir, "");
  return out;
}

interface Account {
  username: string;
  password: string;
}

interface RunRequest {
  accounts: Account[];
  headless: boolean;
  baseUrl: string;
  detailed?: boolean;
}

interface RowCheck {
  rowNumber: number;
  reference: string;
  updateButtonPresent: boolean;
}
interface AccountResult {
  username: string;
  loginOk: boolean;
  rowsFound: number;
  checked: RowCheck[];
  pass: boolean;
  noListingAccess?: boolean;
  error?: string;
}
interface UarResult {
  results: AccountResult[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RunRequest = await req.json();
    const { accounts, headless, baseUrl, detailed } = body;

    if (currentChild) return runInProgressResponse();

    if (!accounts?.length) {
      return NextResponse.json({ error: "At least one BO account (username + password) is required." }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const testDir = path.join(projectRoot, "tests", "service-hub");
    const configPath = path.join(testDir, "playwright.config.ts");

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: "Test config not found." }, { status: 500 });
    }

    // Seconds included so two runs in the same minute never share a folder.
    const ts = runFolderStamp();
    const recordDir = path.join(projectRoot, "test-evidence", `uar-${ts}`);
    const runMetaDir = path.join(recordDir, "_run");
    fs.mkdirSync(runMetaDir, { recursive: true });

    const jsonReportPath = path.join(runMetaDir, "report.json");
    // A DIRECTORY, not a single file — each account's test() writes its own
    // result file into it independently. CORRECTED 2026-09-24: a single
    // shared file written once via test.afterAll() silently lost every
    // account except the last, because Playwright ran each test in its own
    // fresh worker here (confirmed via workerIndex in the JSON report),
    // discarding shared in-memory state between tests. See the spec's own
    // header comment for the full story.
    const resultsDir = path.join(runMetaDir, "results");
    fs.mkdirSync(resultsDir, { recursive: true });

    const env: Record<string, string> = {
      ...(process.env as Record<string, string>),
      EAUTO_BASE_URL: baseUrl,
      PW_HEADED: headless ? "0" : "1",
      // Slowed-down, highlighted playback — default ON, per the standing
      // rule in knowledge/automation-testing.md ("every new automation gets
      // detailed mode"). This is a tester (a permissions regression check),
      // not a checker, so it doesn't qualify for that rule's one exception.
      PW_DETAILED: detailed === false ? "0" : "1",
      PW_VIDEO: "1",
      PW_OUTPUT_DIR: recordDir,
      PW_JSON_REPORT: jsonReportPath,
      PW_UAR_ACCOUNTS: JSON.stringify(accounts),
      PW_RESULT_PATH: resultsDir,
    };

    // Target the spec FILE, not a --grep title match. This runs every
    // account's test() defined in the file (one per account, restructured
    // 2026-09-24 so each gets its own video — see the spec's own header
    // comment) — a title-based --grep here would be fragile against
    // per-account test names that change with the account list.
    // Argument array, no shell.
    const args = ["test", "--config", configPath, "user-access-regression.spec.ts"];
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
        resolve(NextResponse.json({ stopped: true, evidence: [], timestamp: ts, stderr: stderr.slice(-3000), stdout: stdout.slice(-3000) }));
      };

      proc.on("error", (err) => {
        if (settled) return;
        settled = true;
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });

      proc.on("close", () => {
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        if (settled) return;
        settled = true;
        // Aggregate every account's own result file — order isn't
        // guaranteed (each ran in its own worker, see the comment above),
        // so sort by filename's trailing timestamp to roughly match
        // execution order for a stable, readable display.
        let result: UarResult | null = null;
        try {
          const files = fs.existsSync(resultsDir)
            ? fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json")).sort()
            : [];
          if (files.length > 0) {
            const accountResults: AccountResult[] = [];
            for (const f of files) {
              try {
                accountResults.push(JSON.parse(fs.readFileSync(path.join(resultsDir, f), "utf-8")));
              } catch { /* skip this one, keep aggregating the rest */ }
            }
            result = { results: accountResults };
          }
        } catch { /* fall through to error below */ }

        // Organize per-account video/screenshot/trace into named subfolders
        // using each test's own title (same mechanism TS01-TS08 use), then
        // publish everything to public/qa-artifacts for playback/download.
        try {
          if (fs.existsSync(jsonReportPath)) {
            const report = JSON.parse(fs.readFileSync(jsonReportPath, "utf-8"));
            type JsonSuite = { specs?: JsonSpec[]; suites?: JsonSuite[] };
            type JsonSpec = { title?: string; tests?: { results?: { attachments?: { name?: string; path?: string }[] }[] }[] };
            const walkSuites = (suites: JsonSuite[]) => {
              for (const s of suites) {
                for (const spec of s.specs ?? []) {
                  const attachments = spec.tests?.[0]?.results?.[0]?.attachments;
                  if (spec.title && attachments?.length) organizeTestEvidence(spec.title, attachments);
                }
                if (s.suites) walkSuites(s.suites);
              }
            };
            walkSuites(report.suites ?? []);
          }
        } catch { /* evidence organizing is best-effort — never block the response on it */ }

        const evidence = publishEvidence(ts, recordDir, result?.results ?? null);

        if (stopRequested) {
          return resolve(NextResponse.json({ stopped: true, result, evidence, timestamp: ts, stderr: stderr.slice(-3000), stdout: stdout.slice(-3000) }));
        }

        if (!result) {
          return resolve(NextResponse.json({
            error: "Run finished but produced no result — check the raw output below.",
            evidence,
            timestamp: ts,
            stderr: stderr.slice(-3000),
            stdout: stdout.slice(-3000),
          }, { status: 500 }));
        }

        resolve(NextResponse.json({ result, evidence, timestamp: ts, stderr: stderr.slice(-3000), stdout: stdout.slice(-3000) }));
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
