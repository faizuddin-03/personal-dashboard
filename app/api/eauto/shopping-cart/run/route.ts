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
}

interface TestResultItem {
  title: string;
  status: string;
  duration: number;
  error: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RunRequest = await req.json();
    const { scenarios, headless, baseUrl, ucdUser, ucdPass, boUser, boPass } = body;

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

                out.push({
                  title: spec.title ?? "",
                  status: status === "timedOut" ? "failed" : status,
                  duration: testResult?.duration ?? 0,
                  error: errorMsg.slice(0, 2000),
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
