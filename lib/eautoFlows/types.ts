// Types for the "eAuto Flows and Modules" page (/eauto/flows).
// Faizuddin, 2026-10-23: module → flow → trigger point → steps, with what each
// flow affects, its cronjobs, who can access it and where the transaction goes.
// One file per module under lib/eautoFlows/modules/, collected in index.ts.

/** Where a fact came from. `ref` is a path, ticket key, board id or workbook row. */
export type SourceKind = "azfar" | "mine" | "jira" | "miro" | "ts" | "askeauto" | "teams";

export interface Source {
  kind: SourceKind;
  ref: string;
  /** yyyy-mm-dd when known — newer beats older for requirements. */
  date?: string;
}

/**
 * One statement shown on the page.
 * `alt` keeps the other version when sources disagree: the shown text follows
 * the precedence rules (Azfar on top for areas Faizuddin worked little on),
 * the alternative stays visible so it can be restored.
 */
export interface Fact {
  text: string;
  sources: Source[];
  unconfirmed?: boolean;
  alt?: { text: string; sources: Source[]; note?: string }[];
}

export interface Step {
  title: string;
  /** Page, menu path or button, e.g. "Service Portal › Insurance › Get Quote". */
  where?: string;
  detail?: string;
  /** Modules / pages touched at this step. */
  affects?: string[];
  sources: Source[];
  /** Branches out of this step: "if X → ...". */
  branches?: { when: string; then: string }[];
}

export interface Trigger {
  id: string;
  name: string;
  /** How the user arrives: page + control. */
  entry: string;
  summary?: string;
  steps: Step[];
  /** Extra impact specific to this trigger point. */
  affects?: Fact[];
  sources: Source[];
}

export interface Cronjob {
  name: string;
  schedule: string;
  does: string;
  sources: Source[];
  unconfirmed?: boolean;
}

export interface TicketRef {
  key: string;
  /** yyyy-mm */
  date?: string;
  what: string;
  /** legacy = superseded by a newer ticket for the same behaviour. */
  state?: "latest" | "legacy";
  supersededBy?: string;
}

export interface Flow {
  id: string;
  name: string;
  summary: string;
  portals: string[];
  triggers: Trigger[];
  /** Downstream modules / pages / listings / emails / JPJ affected by this flow. */
  affects: Fact[];
  cronjobs: Cronjob[];
  roles: Fact[];
  /** Where the transaction goes once the user finishes. */
  afterCompletion: Fact[];
  rules: Fact[];
  /** QA checklist: what to test when a ticket touches this flow. */
  scopeToCheck: Fact[];
  tickets: TicketRef[];
  openQuestions?: string[];
}

export interface Module {
  id: string;
  name: string;
  /** Short label for chips. */
  short?: string;
  portals: string[];
  summary: string;
  flows: Flow[];
  /** Other module ids this one feeds or depends on. */
  related?: string[];
  glossary?: { term: string; meaning: string; sources: Source[] }[];
}
