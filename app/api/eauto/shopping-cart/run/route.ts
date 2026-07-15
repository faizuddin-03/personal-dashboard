import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const maxDuration = 300;

interface RunRequest {
  scenarios: string[];
  headless: boolean;
  baseUrl: string;
  ucdUser: string;
  ucdPass: string;
  boUser: string;
  boPass: string;
  detailed?: boolean;
  publicHoliday?: string; // YYYY-MM-DD keyed in by the user (Public-Holiday tests)
  referenceNo?: string;   // existing SR reference (biometric free-install validity)
}

interface UiStep {
  title: string;
  status: "passed" | "failed";
  category: string;
  durationMs: number;
  depth: number;
  error: string;
  friendlyError: string;
}

interface TestResultItem {
  title: string;
  status: string;
  duration: number;
  error: string;
  friendlyError: string;
  steps: UiStep[];
}

// Raw step shape as serialized by the custom step-reporter.
interface RawStep {
  title: string;
  category: string;
  duration: number;
  error?: string;
  steps?: RawStep[];
}
interface RawStepTest {
  title: string;
  titlePath: string[];
  status: string;
  duration: number;
  error?: string;
  steps: RawStep[];
}

/**
 * Flatten the reporter's step tree into an ordered, indented list of the
 * MEANINGFUL steps for the UI checklist: the named `test.step(...)` entries
 * and any `expect` assertions. Low-level `pw:api`/`hook`/`fixture` noise is
 * dropped. A step is "failed" when it carries an error.
 */
function flattenSteps(steps: RawStep[] | undefined, depth: number, out: UiStep[]) {
  for (const s of steps ?? []) {
    const keep = s.category === "test.step" || s.category === "expect";
    let childDepth = depth;
    if (keep) {
      const error = s.error ? stripAnsi(s.error) : "";
      out.push({
        title: s.title,
        status: error ? "failed" : "passed",
        category: s.category,
        durationMs: s.duration ?? 0,
        depth,
        error,
        friendlyError: error ? toPlainEnglish(error) : "",
      });
      childDepth = depth + 1;
    }
    if (s.steps?.length) flattenSteps(s.steps, childDepth, out);
  }
}

/** Strip ANSI color/escape codes so raw terminal output reads cleanly as plain text. */
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Turn a test title into a filesystem-safe name (letters/digits/spaces/dashes only). */
function sanitizeForFilename(title: string): string {
  return title.replace(/[^a-z0-9 \-]+/gi, "").replace(/\s+/g, " ").trim().slice(0, 100);
}

/**
 * Rename a test's own Playwright-generated evidence (video.webm,
 * test-failed-N.png, trace.zip) to match the test's title, in place, so every
 * file reads clearly instead of Playwright's generic/hashed defaults. Videos
 * recorded by openTrackedContext()/closeTrackedContext() for a test's extra
 * (cross-portal) browser contexts are already named this way at record time,
 * so this only needs to handle the attachments Playwright itself produces for
 * the test's main fixture-managed context.
 */
function renameEvidenceFiles(title: string, attachments: { name?: string; path?: string }[]): void {
  const base = sanitizeForFilename(title);
  if (!base) return;
  const extFor: Record<string, string> = { video: ".webm", screenshot: ".png", trace: ".zip" };
  const seen: Record<string, number> = {};
  for (const a of attachments) {
    const ext = a.name ? extFor[a.name] : undefined;
    if (!ext || !a.path || !fs.existsSync(a.path)) continue;
    const n = (seen[a.name!] = (seen[a.name!] ?? 0) + 1);
    const suffix = a.name === "screenshot" ? " - failure" : a.name === "trace" ? " - trace" : "";
    const numbered = n > 1 ? ` (${n})` : "";
    const dest = path.join(path.dirname(a.path), `${base}${suffix}${numbered}${ext}`);
    try {
      if (path.resolve(dest) !== path.resolve(a.path)) fs.renameSync(a.path, dest);
    } catch {
      // best-effort — a rename failure shouldn't break the run's results
    }
  }
}

/**
 * Turn a raw Playwright error message into a one-line, plain-English
 * summary. Falls back to the first meaningful line of the original
 * message if none of the known shapes match.
 */
function toPlainEnglish(rawMessage: string): string {
  const text = stripAnsi(rawMessage);

  // "waiting for locator('...')" — pull out what it was looking for
  const locatorMatch = text.match(/waiting for locator\('([^']+)'\)/);
  const locatorDesc = locatorMatch ? locatorMatch[1] : null;

  if (/strict mode violation[\s\S]*resolved to (\d+) elements/.test(text)) {
    const count = text.match(/resolved to (\d+) elements/)?.[1] ?? "multiple";
    return `The test found ${count} matching elements on the page instead of 1, and couldn't tell which one to use${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }

  if (/toBeVisible\(\)/.test(text) && /Expected: visible/.test(text)) {
    return `Expected an element to appear on the page, but it never showed up in time${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }

  if (/toBeHidden\(\)/.test(text)) {
    return `Expected an element to disappear from the page, but it was still showing${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }

  if (/TimeoutError[\s\S]*locator\.click/.test(text)) {
    return `The test tried to click something, but the click never went through in time (likely blocked or the page didn't respond)${locatorDesc ? ` — target: ${locatorDesc}` : ""}.`;
  }

  if (/TimeoutError[\s\S]*locator\.(fill|type)/.test(text)) {
    return `The test tried to type into a field, but it never became ready in time${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }

  if (/TimeoutError[\s\S]*waitForURL/.test(text)) {
    return `The test expected the page to navigate to a new URL, but it never did within the time limit.`;
  }

  if (/^TimeoutError/m.test(text)) {
    return `The test waited too long for something to happen and gave up${locatorDesc ? ` (waiting on: ${locatorDesc})` : ""}.`;
  }

  // expect(received).toBe(expected) / toBeGreaterThan / etc, with Expected/Received values
  const expectMatch = text.match(/expect\(received\)\.(\w+)\(([^)]*)\)/);
  const expectedVal = text.match(/Expected:\s*(.+)/)?.[1]?.trim();
  const receivedVal = text.match(/Received:\s*(.+)/)?.[1]?.trim();
  if (expectMatch) {
    const matcher = expectMatch[1];
    if (matcher === "toBeNull" && text.includes(".not.")) {
      return `The test expected to find a value, but got nothing (null) instead.`;
    }
    if (matcher === "toBe" || matcher === "toEqual") {
      if (expectedVal !== undefined && receivedVal !== undefined) {
        return `The test expected the value to be "${expectedVal}", but it was actually "${receivedVal}".`;
      }
    }
    if (matcher === "toBeGreaterThan" && expectedVal !== undefined && receivedVal !== undefined) {
      return `The test expected a number greater than ${expectedVal}, but got ${receivedVal}.`;
    }
    if (matcher === "toBeLessThan" && expectedVal !== undefined && receivedVal !== undefined) {
      return `The test expected a number less than ${expectedVal}, but got ${receivedVal}.`;
    }
    if (expectedVal !== undefined && receivedVal !== undefined) {
      return `The test's "${matcher}" check failed — expected "${expectedVal}", got "${receivedVal}".`;
    }
    return `A test assertion ("${matcher}") failed.`;
  }

  // Fall back: first non-empty line, cleaned up
  const firstLine = text.split("\n").map(l => l.trim()).find(l => l.length > 0);
  return firstLine ? firstLine.slice(0, 200) : "The test failed for an unknown reason — see technical details below.";
}

export async function POST(req: NextRequest) {
  try {
    const body: RunRequest = await req.json();
    const { scenarios, headless, baseUrl, ucdUser, ucdPass, boUser, boPass, detailed, publicHoliday, referenceNo } = body;

    if (!scenarios.length) {
      return NextResponse.json({ error: "No scenarios selected." }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const testDir = path.join(projectRoot, "tests", "service-hub");
    const configPath = path.join(testDir, "playwright.config.ts");

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: "Test config not found." }, { status: 500 });
    }

    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const recordDir = path.join(projectRoot, "test-recordings", ts);
    fs.mkdirSync(recordDir, { recursive: true });

    const jsonReportPath = path.join(recordDir, "report.json");
    const stepReportPath = path.join(recordDir, "steps.json");

    const grepPattern = scenarios.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      EAUTO_BASE_URL: baseUrl,
      EAUTO_UCD_USER: ucdUser,
      EAUTO_UCD_PASS: ucdPass,
      EAUTO_BO_USER: boUser,
      EAUTO_BO_PASS: boPass,
      PW_HEADED: headless ? "0" : "1",
      PW_VIDEO: "1",
      PW_OUTPUT_DIR: recordDir,
      PW_JSON_REPORT: jsonReportPath,
      PW_STEP_REPORT: stepReportPath,
      // Detailed mode: slow, highlighted playback so the recording is easy
      // to review step by step (default on unless explicitly disabled).
      PW_DETAILED: detailed === false ? "0" : "1",
      // Per-run parameters keyed in via the runner UI.
      EAUTO_PUBLIC_HOLIDAY: publicHoliday ?? "",
      EAUTO_REF_NO: referenceNo ?? "",
    };

    const fullCmd = `npx playwright test --config "${configPath}" --grep "${grepPattern}"`;

    const logs: string[] = [];
    logs.push(`[CMD] ${fullCmd}`);
    logs.push(`[CWD] ${projectRoot}`);
    logs.push(`[CONFIG EXISTS] ${fs.existsSync(configPath)}`);
    logs.push(`[GREP] ${grepPattern}`);
    logs.push(`[HEADLESS] ${headless}`);
    logs.push(`[PW_HEADED] ${env.PW_HEADED}`);
    logs.push(`[RECORD DIR] ${recordDir}`);
    logs.push(`[JSON REPORT] ${jsonReportPath}`);

    return new Promise<NextResponse>((resolve) => {
      const proc = spawn(fullCmd, {
        cwd: projectRoot,
        env,
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

      proc.on("error", (err) => {
        logs.push(`[SPAWN ERROR] ${err.message}`);
        resolve(NextResponse.json({
          exitCode: -1,
          results: [],
          summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
          recordDir: path.relative(projectRoot, recordDir),
          recordings: [],
          stderr: err.message,
          stdout: "",
          logs,
          timestamp: ts,
        }));
      });

      proc.on("close", (code) => {
        logs.push(`[EXIT CODE] ${code}`);
        logs.push(`[STDOUT LENGTH] ${stdout.length}`);
        logs.push(`[STDERR LENGTH] ${stderr.length}`);
        logs.push(`[REPORT EXISTS] ${fs.existsSync(jsonReportPath)}`);

        let results: TestResultItem[] = [];

        try {
          const reportRaw = fs.readFileSync(jsonReportPath, "utf-8");
          logs.push(`[REPORT SIZE] ${reportRaw.length} bytes`);
          const report = JSON.parse(reportRaw);
          logs.push(`[SUITES] ${(report.suites ?? []).length}`);

          type JsonSuite = {
            title?: string;
            specs?: JsonSpec[];
            suites?: JsonSuite[];
          };
          type JsonSpec = {
            title?: string;
            tests?: {
              results?: {
                status?: string;
                duration?: number;
                error?: { message?: string; snippet?: string };
                errors?: { message?: string; snippet?: string }[];
                attachments?: { name?: string; path?: string }[];
              }[];
            }[];
          };

          const extractSpecs = (suites: JsonSuite[], parentTitle: string = ""): TestResultItem[] => {
            const out: TestResultItem[] = [];
            for (const s of suites) {
              const groupTitle = [parentTitle, s.title].filter(Boolean).join(" > ");
              for (const spec of s.specs ?? []) {
                const testResult = spec.tests?.[0]?.results?.[0];
                const status = testResult?.status ?? "unknown";

                let errorMsg = "";
                if (status === "failed" || status === "timedOut") {
                  const err = testResult?.error;
                  const errs = testResult?.errors;
                  if (err?.message) {
                    errorMsg = err.message;
                  } else if (errs?.length) {
                    errorMsg = errs.map(e => e.message).filter(Boolean).join("\n");
                  }
                  if (err?.snippet && !errorMsg.includes(err.snippet)) {
                    errorMsg += "\n" + err.snippet;
                  }
                }

                const cleanedError = stripAnsi(errorMsg).slice(0, 2000);
                if (spec.title && testResult?.attachments?.length) {
                  renameEvidenceFiles(spec.title, testResult.attachments);
                }
                out.push({
                  title: spec.title ?? "",
                  status: status === "timedOut" ? "failed" : status,
                  duration: testResult?.duration ?? 0,
                  error: cleanedError,
                  friendlyError: errorMsg ? toPlainEnglish(errorMsg) : "",
                  steps: [],
                });
              }
              if (s.suites) out.push(...extractSpecs(s.suites, groupTitle));
            }
            return out;
          };

          results = extractSpecs(report.suites ?? []);
          logs.push(`[RESULTS PARSED] ${results.length} tests`);
        } catch (e) {
          logs.push(`[REPORT ERROR] ${e instanceof Error ? e.message : String(e)}`);
        }

        // Merge the per-test step tree (from the custom step-reporter) into
        // each result, matched by leaf title, and flatten to the UI checklist.
        try {
          if (fs.existsSync(stepReportPath)) {
            const stepData = JSON.parse(fs.readFileSync(stepReportPath, "utf-8")) as { tests?: RawStepTest[] };
            const byTitle = new Map<string, RawStepTest>();
            for (const t of stepData.tests ?? []) byTitle.set(t.title, t);
            for (const r of results) {
              const match = byTitle.get(r.title);
              if (match) {
                const flat: UiStep[] = [];
                flattenSteps(match.steps, 0, flat);
                r.steps = flat;
              }
            }
            logs.push(`[STEPS MERGED] ${stepData.tests?.length ?? 0} step-tests`);
          } else {
            logs.push(`[STEPS] no step report at ${stepReportPath}`);
          }
        } catch (e) {
          logs.push(`[STEPS ERROR] ${e instanceof Error ? e.message : String(e)}`);
        }

        const recordings: string[] = [];
        if (fs.existsSync(recordDir)) {
          const walk = (dir: string) => {
            for (const f of fs.readdirSync(dir)) {
              const full = path.join(dir, f);
              if (fs.statSync(full).isDirectory()) walk(full);
              else if (f.endsWith(".webm") || f.endsWith(".zip") || f.endsWith(".png")) {
                recordings.push(path.relative(projectRoot, full));
              }
            }
          };
          walk(recordDir);
        }

        const passed = results.filter(r => r.status === "passed").length;
        const failed = results.filter(r => r.status === "failed").length;
        const skipped = results.filter(r => r.status === "skipped").length;

        resolve(NextResponse.json({
          exitCode: code,
          results,
          summary: { total: results.length, passed, failed, skipped },
          recordDir: path.relative(projectRoot, recordDir),
          recordings,
          stderr: stderr.slice(-5000),
          stdout: stdout.slice(-5000),
          logs,
          timestamp: ts,
        }));
      });
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Run failed" },
      { status: 500 }
    );
  }
}
