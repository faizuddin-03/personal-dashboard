// Scheduled study agents (Faizuddin, 2026-10-27): status contract shared by
// the runner (scripts/agents/run-agent.mjs, started by Windows Task
// Scheduler) and the /agents viewer page. The runner writes one JSON file
// per agent; the page polls /api/agents/status, which reads them.
//
//   data/agents/status/<id>.json   AgentStatus, rewritten on every event
//   data/agents/runs.jsonl         one AgentRunRecord per finished run
//   data/agents/state/<id>.json    runner bookkeeping (what was studied)
//   data/agents/jira.json          Jira login saved from the dashboard
//
// data/agents/ is gitignored.

export type AgentId = "jira-study" | "sharepoint-study";

export type AgentState =
  | "sleeping"     // between runs, inside working hours
  | "off-hours"    // outside Mon–Fri 08:00–19:00
  | "waking"       // run started, loading state
  | "searching"    // querying Jira / scanning SharePoint for work
  | "reading"      // Claude reading source material
  | "writing"      // Claude writing the study
  | "done"         // run finished (briefly, then sleeping)
  | "needs-setup"  // missing Jira login or SharePoint sync
  | "error";

export interface AgentEvent { at: string; text: string }

export interface AgentStudyRef {
  key: string;      // ticket key, e.g. EAINT-12153
  title: string;
  path: string;     // repo-relative path of the study file
  kind: "new" | "update";
}

export interface AgentStatus {
  id: AgentId;
  name: string;               // "Jira scout", "SharePoint scribe"
  schedule: string;           // human text, e.g. "Every hour, Mon–Fri 8am–7pm"
  state: AgentState;
  activity: string;           // one-line, plain words: what it is doing now
  item: { key: string; title: string } | null;  // ticket being studied now
  progress: { done: number; total: number } | null;
  queue: number;              // items found but left for the next run
  startedAt: string | null;   // current/last run start (ISO)
  finishedAt: string | null;  // last run end (ISO)
  nextRunAt: string | null;   // next scheduled run (ISO)
  lastResult: {
    ok: boolean;
    studied: AgentStudyRef[];
    error?: string;
  } | null;
  recent: AgentEvent[];       // newest first, max 40
  updatedAt: string;
}

export interface AgentRunRecord {
  id: AgentId;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  found: number;
  studied: AgentStudyRef[];
  queue: number;
  error?: string;
}

export const AGENT_IDS: AgentId[] = ["jira-study", "sharepoint-study"];

export const AGENT_META: Record<AgentId, { name: string; schedule: string; role: string }> = {
  "jira-study": {
    name: "Jira Scout",
    schedule: "Every hour, Mon–Fri 8am–7pm",
    role: "Finds new or changed EAINT CR tickets and studies them into _reference/tickets/Studying/<KEY>/.",
  },
  "sharepoint-study": {
    name: "SharePoint Scribe",
    schedule: "Every 2 hours, Mon–Fri 8am–7pm",
    role: "Reads new or changed QA Team test scripts from the synced SharePoint library and studies them into _reference/tickets/<KEY>/.",
  },
};
