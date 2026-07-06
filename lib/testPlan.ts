// ── Drafted test plan state (Phase 2) ─────────────────────
// Per-ticket AI-drafted test plan: full scenario content (steps, expected
// results) editable before approval. On approval, scenarios can be synced
// into the existing TS Tracker as numbered cases for execution tracking.
// Persisted in localStorage "qa_flow_test_plans".

export interface DraftStep {
  action: string;
  expected: string;
}

export type ScenarioPriority = "high" | "medium" | "low";

export interface DraftScenario {
  id: string;
  title: string;
  priority: ScenarioPriority;
  preconditions?: string;
  steps: DraftStep[];
  notes?: string;
  /** Set once synced to the TS Tracker (e.g. "TC-01"); links this scenario to its tracker case. */
  tsNumber?: string;
}

export interface DraftTestPlan {
  planTitle: string;
  preconditions: string[];
  scenarios: DraftScenario[];
  testDataNotes?: string;
}

export interface AuditEntry { ts: string; event: string; }

export interface TestPlanTicketState {
  issueKey: string;
  draft?: DraftTestPlan;
  draftedAt?: string;
  model?: string;
  approved: boolean;
  approvedAt?: string;
  syncedToTracker?: boolean;
  syncedAt?: string;
  audit: AuditEntry[];
}

export type TestPlanState = Record<string, TestPlanTicketState>;

const KEY = "qa_flow_test_plans";

export function getTestPlanState(): TestPlanState {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

export function saveTestPlanState(state: TestPlanState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function emptyPlanState(issueKey: string): TestPlanTicketState {
  return { issueKey, approved: false, audit: [] };
}

export function addPlanAudit(t: TestPlanTicketState, event: string): TestPlanTicketState {
  return { ...t, audit: [...t.audit, { ts: new Date().toISOString(), event }] };
}

export function newScenario(): DraftScenario {
  return { id: crypto.randomUUID(), title: "New scenario", priority: "medium", steps: [{ action: "", expected: "" }] };
}

// ── Sync into the existing TS Tracker ─────────────────────
// Reuses the TS Tracker's own storage format so execution tracking, the
// dashboard TS Tracker widget, and kanban card progress bars all pick up
// the synced cases with zero changes to that page.

import type { CREntry } from "@/app/tests/page";

const TRACKER_KEY = "test_tracker_crs";

function loadTracker(): CREntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) ?? "[]"); } catch { return []; }
}
function saveTracker(data: CREntry[]) { localStorage.setItem(TRACKER_KEY, JSON.stringify(data)); }

/** Adds a new suite (one case per scenario) to the ticket's TS Tracker entry, creating the entry if needed. */
export function syncPlanToTracker(issueKey: string, summary: string, plan: DraftTestPlan): { suiteTitle: string; tsNumbers: string[] } {
  const data = loadTracker();
  let entry = data.find(e => e.crKey === issueKey);
  if (!entry) {
    entry = { id: crypto.randomUUID(), crKey: issueKey, crSummary: summary, suites: [] };
    data.push(entry);
  }
  const suiteTitle = plan.planTitle || `AI Draft — ${new Date().toLocaleDateString()}`;
  const tsNumbers: string[] = [];
  const cases = plan.scenarios.map((_, i) => {
    const tsNumber = `AI-${i + 1}`;
    tsNumbers.push(tsNumber);
    return { id: crypto.randomUUID(), tsNumber, status: null as null, dateTested: null as string | null };
  });
  entry.suites.push({ id: crypto.randomUUID(), title: suiteTitle, cases });
  saveTracker(data);
  return { suiteTitle, tsNumbers };
}
