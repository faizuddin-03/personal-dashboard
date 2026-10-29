import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// Lists past runs' published evidence — Faizuddin, 2026-10-03: the run
// route used to wipe every previous run's folder on each new run, so an
// earlier run's downloaded JomCheck report (a limited, precious resource)
// could be silently deleted by a LATER, unrelated run. The run route now
// keeps the last `HISTORY_LIMIT` runs instead of just the newest one — this
// route is how the dashboard lists and reaches those older runs, since
// `res.evidence` from a run's own response only ever covers that one run.

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12257");

interface HistoryEvidenceItem { label: string; url: string; kind: "video" | "image" | "file"; }
interface HistoryRun { runId: string; runLabel: string; timestamp: number; scenarios: string[]; evidence: HistoryEvidenceItem[]; status: RunStatus }
/** From meta.json `results`; runs published before 2026-10-21 have none -> "unknown". */
type RunStatus = "passed" | "failed" | "skipped" | "unknown";

function classifyEvidenceKind(filename: string): HistoryEvidenceItem["kind"] {
  if (/\.(png|jpe?g|gif|webp)$/i.test(filename)) return "image";
  if (/\.(webm|mp4|mov)$/i.test(filename)) return "video";
  return "file";
}

export async function GET() {
  if (!fs.existsSync(PUBLIC_ART)) return NextResponse.json({ runs: [] });

  const runs: HistoryRun[] = [];
  for (const entry of fs.readdirSync(PUBLIC_ART, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const runId = entry.name;
    const runDir = path.join(PUBLIC_ART, runId);

    let runLabel = runId;
    let timestamp = 0;
    let scenarios: string[] = [];
    let status: RunStatus = "unknown";
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(runDir, "meta.json"), "utf-8"));
      runLabel = typeof meta.runLabel === "string" ? meta.runLabel : runId;
      timestamp = typeof meta.timestamp === "number" ? meta.timestamp : 0;
      scenarios = Array.isArray(meta.scenarios) ? meta.scenarios : [];
      if (Array.isArray(meta.results) && meta.results.length) {
        const statuses: string[] = meta.results.map((r: { status?: string }) => r?.status ?? "");
        status = statuses.some(s => s !== "passed" && s !== "skipped") ? "failed" : statuses.some(s => s === "passed") ? "passed" : "skipped";
      }
    } catch { /* missing/malformed meta.json — fall back to folder mtime below */ }
    if (!timestamp) {
      try { timestamp = fs.statSync(runDir).mtimeMs; } catch { /* ignore */ }
    }

    const evidence: HistoryEvidenceItem[] = [];
    try {
      for (const f of fs.readdirSync(runDir)) {
        if (f === "meta.json") continue;
        evidence.push({
          label: f.replace(/\.[^.]+$/, ""),
          url: `/qa-artifacts/eauto-12257/${runId}/${f}`,
          kind: classifyEvidenceKind(f),
        });
      }
    } catch { /* ignore */ }
    evidence.sort((a, b) => a.label.localeCompare(b.label));

    runs.push({ runId, runLabel, timestamp, scenarios, evidence, status });
  }

  runs.sort((a, b) => b.timestamp - a.timestamp);
  return NextResponse.json({ runs });
}
