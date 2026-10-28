import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// Lists past runs' published evidence for the /eauto/12028 runner's "Past
// runs" section — copied from app/api/eauto-12153/history/route.ts; reads each
// run folder's meta.json written by app/api/eauto-12028/run/route.ts.

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12028");

interface HistoryEvidenceItem { label: string; url: string; kind: "video" | "image" | "file" }
type RunStatus = "passed" | "failed" | "skipped" | "unknown";
interface HistoryRun { runId: string; runLabel: string; timestamp: number; scenarios: string[]; evidence: HistoryEvidenceItem[]; status: RunStatus }

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
    } catch { /* missing meta.json — folder mtime below */ }
    if (!timestamp) {
      try { timestamp = fs.statSync(runDir).mtimeMs; } catch { /* ignore */ }
    }
    const evidence: HistoryEvidenceItem[] = [];
    try {
      for (const f of fs.readdirSync(runDir)) {
        if (f === "meta.json") continue;
        evidence.push({ label: f.replace(/\.[^.]+$/, ""), url: `/qa-artifacts/eauto-12028/${runId}/${f}`, kind: classifyEvidenceKind(f) });
      }
    } catch { /* ignore */ }
    evidence.sort((a, b) => a.label.localeCompare(b.label));
    runs.push({ runId, runLabel, timestamp, scenarios, evidence, status });
  }
  runs.sort((a, b) => b.timestamp - a.timestamp);
  return NextResponse.json({ runs });
}
