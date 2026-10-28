// Gathers everything the dashboard already knows about one ticket key, for the
// /jira/[key] hub page. Read-only: every source is existing data (static
// catalogues + localStorage). Storage reads are wrapped so a bad value never
// breaks the page.

import { TICKET_STUDIES, TicketStudy } from "@/lib/ticketStudies";
import { TICKET_AUTOMATIONS, TicketAutomation } from "@/lib/ticketAutomations";
import { getDeployments, Deployment } from "@/lib/deployments";
import { getKanbanState, KanbanCard, COLUMN_IDS } from "@/lib/kanban";

interface TrackerCase  { status: "pass" | "fail" | "in-progress" | null; disabled?: boolean; }
interface TrackerSuite { id: string; title: string; cases: TrackerCase[]; }
interface TrackerEntry { id: string; crKey: string; crSummary: string; suites: TrackerSuite[]; }

export interface TrackerProgress {
  crKey: string;
  crSummary: string;
  suites: number;
  total: number;
  pass: number;
  fail: number;
  wip: number;
  pending: number;
}

export interface TicketHubData {
  study: TicketStudy | null;
  automations: TicketAutomation[];
  tracker: TrackerProgress | null;
  deployments: Deployment[];
  kanbanCards: KanbanCard[];
}

function sameKey(a: string, b: string) {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

function loadTracker(): TrackerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("test_tracker_crs") ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function trackerProgressFor(key: string): TrackerProgress | null {
  const entry = loadTracker().find(e => typeof e?.crKey === "string" && sameKey(e.crKey, key));
  if (!entry) return null;
  const suites = Array.isArray(entry.suites) ? entry.suites : [];
  const cases = suites.flatMap(s => (Array.isArray(s.cases) ? s.cases : [])).filter(c => !c.disabled);
  const pass = cases.filter(c => c.status === "pass").length;
  const fail = cases.filter(c => c.status === "fail").length;
  const wip  = cases.filter(c => c.status === "in-progress").length;
  return {
    crKey: entry.crKey,
    crSummary: entry.crSummary ?? "",
    suites: suites.length,
    total: cases.length,
    pass, fail, wip,
    pending: cases.length - pass - fail - wip,
  };
}

export function getTicketHubData(key: string): TicketHubData {
  let deployments: Deployment[] = [];
  try {
    deployments = getDeployments()
      .filter(d => typeof d?.ticketKey === "string" && sameKey(d.ticketKey, key))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  } catch { deployments = []; }

  let kanbanCards: KanbanCard[] = [];
  try {
    const state = getKanbanState();
    kanbanCards = COLUMN_IDS.flatMap(col => state[col] ?? []).filter(c => c.jiraKey && sameKey(c.jiraKey, key));
  } catch { kanbanCards = []; }

  return {
    study: TICKET_STUDIES.find(s => sameKey(s.key, key)) ?? null,
    automations: TICKET_AUTOMATIONS.filter(a => a.keys.some(k => sameKey(k, key))),
    tracker: trackerProgressFor(key),
    deployments,
    kanbanCards,
  };
}
