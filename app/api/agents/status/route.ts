// GET /api/agents/status — what the scheduled study agents are doing.
// Reads the files the runner (scripts/agents/run-agent.mjs) writes under
// data/agents/. Never returns the Jira API token.
import * as fs from "node:fs";
import * as path from "node:path";
import {
  AGENT_IDS, AGENT_META,
  type AgentId, type AgentRunRecord, type AgentStatus,
} from "@/lib/agentStatus";

export const dynamic = "force-dynamic";

const AGENTS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "agents");

function readJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; }
  catch { return null; }
}

function readSetup() {
  const jira = readJson<{ apiToken?: unknown }>(path.join(AGENTS_DIR, "jira.json"));
  const sp = readJson<{ sharepointDir?: unknown; checkedAt?: unknown }>(path.join(AGENTS_DIR, "setup.json"));
  return {
    jira: !!jira && typeof jira.apiToken === "string" && jira.apiToken.trim() !== "",
    sharepointDir: typeof sp?.sharepointDir === "string" ? sp.sharepointDir : null,
    checkedAt: typeof sp?.checkedAt === "string" ? sp.checkedAt : null,
  };
}

function defaultStatus(id: AgentId, needsSetup: boolean): AgentStatus {
  const meta = AGENT_META[id];
  return {
    id,
    name: meta.name,
    schedule: meta.schedule,
    state: needsSetup ? "needs-setup" : "sleeping",
    activity: "Waiting for its first run",
    item: null,
    progress: null,
    queue: 0,
    startedAt: null,
    finishedAt: null,
    nextRunAt: null,
    lastResult: null,
    recent: [],
    updatedAt: new Date().toISOString(),
  };
}

function readRuns(limit: number): AgentRunRecord[] {
  let raw = "";
  try { raw = fs.readFileSync(path.join(AGENTS_DIR, "runs.jsonl"), "utf8"); }
  catch { return []; }
  const out: AgentRunRecord[] = [];
  const lines = raw.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    try { out.push(JSON.parse(line) as AgentRunRecord); } catch { /* skip bad line */ }
  }
  return out.sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
}

export async function GET() {
  const setup = readSetup();
  const agents = AGENT_IDS.map(id => {
    const s = readJson<AgentStatus>(path.join(AGENTS_DIR, "status", `${id}.json`));
    if (s && typeof s === "object" && s.state) return { ...defaultStatus(id, false), ...s, id };
    const needsSetup = id === "jira-study" ? !setup.jira : !setup.sharepointDir;
    return defaultStatus(id, needsSetup);
  });
  return Response.json(
    { agents, runs: readRuns(30), setup },
    { headers: { "Cache-Control": "no-store" } },
  );
}
