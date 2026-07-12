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

    const grepPattern = scenarios.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

    const args = [
      "playwright", "test",
      "--config", configPath,
      "--grep", grepPattern,
      "--reporter", "json",
      "--video", "on",
      "--output", recordDir,
    ];

    if (!headless) {
      args.push("--headed");
    }

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      EAUTO_BASE_URL: baseUrl,
      EAUTO_UCD_USER: ucdUser,
      EAUTO_UCD_PASS: ucdPass,
      EAUTO_BO_USER: boUser,
      EAUTO_BO_PASS: boPass,
      PLAYWRIGHT_BROWSERS_PATH: "/opt/pw-browsers",
    };

    return new Promise<NextResponse>((resolve) => {
      const proc = spawn("npx", args, { cwd: projectRoot, env, shell: true });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

      proc.on("close", (code) => {
        let results: { title: string; status: string; duration: number }[] = [];
        try {
          const parsed = JSON.parse(stdout);
          const extractSpecs = (suites: { title?: string; specs?: { title?: string; tests?: { results?: { status?: string; duration?: number }[] }[] }[]; suites?: unknown[] }[]): { title: string; status: string; duration: number }[] => {
            const out: { title: string; status: string; duration: number }[] = [];
            for (const s of suites) {
              for (const spec of s.specs ?? []) {
                out.push({
                  title: spec.title ?? "",
                  status: spec.tests?.[0]?.results?.[0]?.status ?? "unknown",
                  duration: spec.tests?.[0]?.results?.[0]?.duration ?? 0,
                });
              }
              if (s.suites) out.push(...extractSpecs(s.suites as typeof suites));
            }
            return out;
          };
          results = extractSpecs(parsed.suites ?? []);
        } catch {
          // JSON parse failed
        }

        const recordings: string[] = [];
        if (fs.existsSync(recordDir)) {
          const walk = (dir: string) => {
            for (const f of fs.readdirSync(dir)) {
              const full = path.join(dir, f);
              if (fs.statSync(full).isDirectory()) walk(full);
              else if (f.endsWith(".webm") || f.endsWith(".zip")) recordings.push(path.relative(projectRoot, full));
            }
          };
          walk(recordDir);
        }

        resolve(NextResponse.json({
          exitCode: code,
          results,
          recordDir: path.relative(projectRoot, recordDir),
          recordings,
          stderr: stderr.slice(-2000),
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
