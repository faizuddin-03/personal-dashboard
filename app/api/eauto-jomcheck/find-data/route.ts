import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// "Find data" for the TS27 / TS31 rows on app/eauto/jomcheck — runs ONE
// finder test from scripts/eauto-jomcheck/tests/find-pre-push-data.spec.ts
// headless, without video or demo pauses, and returns the `FOUND:{json}`
// record plus the DETAIL lines. Separate from /run so it never touches the
// main run's process/stop state. Faizuddin, 2026-10-05: "a button in their
// row, where it will check for available data headless and fast in the
// background. after finishing, it will display the data to be used".

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCRIPT_DIR = process.env.EAUTO_JOMCHECK_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-jomcheck");
const TIMEOUT_MS = 20 * 60 * 1000;

const FINDERS: Record<string, string> = {
  ts27: "12339_FIND_TS27",
  ts31x: "12339_FIND_TS31",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string | undefined>;
  const str = (k: string) => (typeof body[k] === "string" ? body[k] as string : "");
  const finder = FINDERS[str("scenario")];
  if (!finder) return NextResponse.json({ error: `Unknown finder "${str("scenario")}".` }, { status: 400 });
  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: "Playwright not installed. Run:\n\n  cd scripts/eauto-jomcheck && npm install && npx playwright install chromium" }, { status: 500 });
  }

  // Own output folder PER FINDER so two finders running at the same time
  // (TS27 and TS31 clicked together) never clobber each other or the main run.
  // Outside test-results/: Playwright EMPTIES its outputDir (test-results/)
  // when a main run starts, which would delete a running finder's folder.
  const outDir = path.join(SCRIPT_DIR, "test-results-find", str("scenario"));
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const grepArg = process.platform === "win32" ? `"${finder}"` : finder;
  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    const child = spawn("npx", ["playwright", "test", "--grep", grepArg], {
      cwd: SCRIPT_DIR,
      shell: process.platform === "win32",
      env: {
        ...process.env,
        PW_HEADED: "0",
        PW_VIDEO: "0",
        PW_DETAILED: "0",
        PW_OUTPUT_DIR: outDir,
        PW_JSON_REPORT: path.join(outDir, "report.json"),
        PW_STEP_REPORT: path.join(outDir, "steps.json"),
        PW_EVIDENCE_DIR: path.join(outDir, "evidence"),
        ...(str("baseUrl") && { EAUTO_BASE_URL: str("baseUrl") }),
        ...(str("username") && { EAUTO_USERNAME: str("username") }),
        ...(str("password") && { EAUTO_PASSWORD: str("password") }),
        ...(str("ucdCompany") && { EAUTO_UCD_COMPANY: str("ucdCompany") }),
      },
    });
    let output = "";
    const timer = setTimeout(() => { try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ } resolve({ code: 1, output: output + "\nTimed out after 20 minutes." }); }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); resolve({ code: 1, output: err.message }); });
  });

  const details = result.output.split(/\r?\n/).flatMap(l => {
    const m = l.match(/^DETAIL:(\{.*\})\s*$/);
    if (!m) return [];
    try { return [JSON.parse(m[1]) as { label: string; value: string }]; } catch { return []; }
  });
  const foundLine = result.output.split(/\r?\n/).map(l => l.match(/^FOUND:(\{.*\})\s*$/)).find(Boolean);
  let found: Record<string, unknown> | null = null;
  if (foundLine) { try { found = JSON.parse(foundLine[1]); } catch { found = null; } }

  // The finder's own thrown message is the useful error (e.g. "No pre-push
  // 1-claim transaction ... Vehicles checked: ...").
  const errLine = result.output.split(/\r?\n/).find(l => /^\s*Error: /.test(l))?.trim() ?? "";
  return NextResponse.json({ ok: !!found, found, details, error: found ? undefined : (errLine || `Finder exited with code ${result.code}`), log: result.output });
}
