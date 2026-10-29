import fs from "node:fs";
import path from "node:path";

/**
 * Lists past runs' published evidence under public/qa-artifacts/<project>/ —
 * one folder per run, files possibly nested one level in per-test folders
 * (12166, User Access Regression). Same response shape as
 * app/api/eauto-12107/history/route.ts.
 *
 * Runs published before meta.json existed are still listed: label = their
 * per-test folder names, time = folder mtime, status = "unknown".
 */

export type HistoryRunStatus = "passed" | "failed" | "skipped" | "unknown";
export interface HistoryEvidenceItem { label: string; url: string; kind: "video" | "image" | "trace" | "file"; }
export interface HistoryRun {
  runId: string;
  runLabel: string;
  timestamp: number;
  scenarios: string[];
  evidence: HistoryEvidenceItem[];
  status: HistoryRunStatus;
}

function classify(filename: string): HistoryEvidenceItem["kind"] {
  if (/\.(png|jpe?g|gif|webp)$/i.test(filename)) return "image";
  if (/\.(webm|mp4|mov)$/i.test(filename)) return "video";
  if (/\.zip$/i.test(filename)) return "trace";
  return "file";
}

export function listRunHistory(project: string): HistoryRun[] {
  const root = path.join(process.cwd(), "public", "qa-artifacts", project);
  if (!fs.existsSync(root)) return [];

  const runs: HistoryRun[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const runId = entry.name;
    const runDir = path.join(root, runId);

    let runLabel = "";
    let timestamp = 0;
    let scenarios: string[] = [];
    let status: HistoryRunStatus = "unknown";
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(runDir, "meta.json"), "utf-8"));
      if (typeof meta.runLabel === "string") runLabel = meta.runLabel;
      if (typeof meta.timestamp === "number") timestamp = meta.timestamp;
      if (Array.isArray(meta.scenarios)) scenarios = meta.scenarios.filter((s: unknown): s is string => typeof s === "string");
      if (Array.isArray(meta.results) && meta.results.length) {
        const statuses: string[] = meta.results.map((r: { status?: string }) => r?.status ?? "");
        status = statuses.some((s) => s !== "passed" && s !== "skipped") ? "failed"
          : statuses.some((s) => s === "passed") ? "passed" : "skipped";
      }
    } catch { /* no meta.json — older run, fall back below */ }
    if (!timestamp) {
      try { timestamp = fs.statSync(runDir).mtimeMs; } catch { /* ignore */ }
    }

    const evidence: HistoryEvidenceItem[] = [];
    const topFolders: string[] = [];
    const walk = (dir: string, rel: string, depth: number) => {
      let items: fs.Dirent[] = [];
      try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const it of items) {
        if (depth === 0 && it.name === "meta.json") continue;
        const relPath = rel ? `${rel}/${it.name}` : it.name;
        if (it.isDirectory()) {
          if (depth === 0) topFolders.push(it.name);
          if (depth < 3) walk(path.join(dir, it.name), relPath, depth + 1);
          continue;
        }
        evidence.push({
          label: relPath,
          url: `/qa-artifacts/${project}/${runId}/${relPath.split("/").map(encodeURIComponent).join("/")}`,
          kind: classify(it.name),
        });
      }
    };
    walk(runDir, "", 0);
    evidence.sort((a, b) => a.label.localeCompare(b.label));

    // No meta.json: name the run after its per-test folders, or count them
    // when there are too many to read in one row.
    const folderLabel = topFolders.length <= 3 ? topFolders.join("_") : `${topFolders.length} tests`;
    runs.push({ runId, runLabel: runLabel || folderLabel || runId, timestamp, scenarios, evidence, status });
  }

  runs.sort((a, b) => b.timestamp - a.timestamp);
  return runs;
}
