// QA pipeline (Faizuddin, 2026-10-27): one flow in the dashboard instead of
// the CLI. Characters (all Claude Code agents, using the repo skills):
//   Scout  — studies new Jira tickets (scripts/agents/run-agent.mjs), later
//            raises confirmed QA-Issues
//   Scribe — studies past SharePoint TS related to the ticket
//   Elf    — drafts the TS; Faizuddin chats changes and approves (green light);
//            keeps the official TS status (In Progress / Pass / Fail)
//   Dwarf  — builds the automation after the green light; mirrors Elf's changes
//   Sage   — knowledge keeper: after pipeline events it adds what was learned
//            to knowledge/, queues contradictions for Faizuddin's OK, notes
//            pipeline improvements, and remembers his answers (2026-10-27)
// Contract shared by the job runner (scripts/pipeline/run-character.mjs), the
// server helpers (lib/server/pipeline/*), the API (app/api/pipeline/*) and the
// UI (app/pipeline/*). Full design: scripts/pipeline/README.md.
//
// Storage (gitignored, data/pipeline/):
//   tickets/<KEY>.json            PipelineTicket
//   chats/<KEY>/<character>.jsonl one ChatEntry per line
//   jobs/<jobId>.json             PipelineJob (live status of one agent job)
//   findings/<KEY>/<findingId>/   finding.json (Finding) + images
//   backups/                      official TS copies taken before each write
//   locks/<KEY>-<character>.lock  one job per ticket+character at a time
//   ts-sync.jsonl                 log of every official-sheet status write
//   sage-inbox/<KEY>.jsonl        SageEvent per line, waiting for sage:learn
//   knowledge-review.json         KnowledgeReview[] (changes waiting for his OK)
//   improvements.json             PipelineImprovement[]
//   learnings.jsonl               LearningRecord per line
//   answers.json                  SavedAnswer[] (his answers, asked once only)

export type Character = "scout" | "scribe" | "elf" | "dwarf" | "sage";

export type PipelineStage =
  | "studied"     // Scout study exists
  | "related"     // Scribe related-history study exists
  | "scenarios"   // Elf drafted a scenario list, waiting for review
  | "approved"    // green light given; workbook built
  | "automation"  // Dwarf building / built the automation
  | "testing"     // runs happening
  | "findings"    // at least one open finding
  | "raised"      // at least one QA-Issue raised from a finding
  | "done";

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: "studied", label: "Studied" },
  { id: "related", label: "Related" },
  { id: "scenarios", label: "Scenarios" },
  { id: "approved", label: "Approved" },
  { id: "automation", label: "Automation" },
  { id: "testing", label: "Testing" },
  { id: "findings", label: "Findings" },
  { id: "raised", label: "Raised" },
  { id: "done", label: "Done" },
];

/** A job a character can be asked to do. */
export type JobAction =
  | "scribe:related"   // study past SharePoint TS related to this ticket
  | "elf:plan"         // first scenario list from the study + related history
  | "elf:chat"         // Faizuddin's message to Elf (revise scenarios, answer questions); input.requirementChange = automatic re-check after Scout/Scribe changed the requirements
  | "elf:build"        // after approval: build the workbook + scenarios.json; input.rebuild = rebuild after an approved-scenario change
  | "dwarf:build"      // after approval: build the automation suite + runner page
  | "dwarf:chat"       // Faizuddin's message to Dwarf
  | "dwarf:sync"       // apply Elf's post-approval scenario changes to the automation
  | "elf:findings"     // analyse a failed run into Finding(s)
  | "scout:issue"      // draft the QA-Issue text for a confirmed finding (no Jira write)
  | "scout:chat"       // Faizuddin's reply to Scout (updates the study)
  | "scribe:chat"      // Faizuddin's reply (or another character's answer) to Scribe
  // Ask-each-other (2026-10-27): answer another character's question
  // (scripts/pipeline/ask.mjs); input { from, question, askJobId, depth, answers? }.
  | "scout:help"
  | "scribe:help"
  | "elf:help"
  | "dwarf:help"
  // Sage (2026-10-27): knowledge keeper. scripts/pipeline/README.md §8.
  | "sage:learn"         // fold the ticket's pending events into knowledge/ (debounced, one per ticket)
  | "sage:apply"         // apply knowledge changes Faizuddin approved; input { reviewIds, reviewKeys } (a batch, store.queueApply; older jobs { reviewId })
  | "sage:chat"          // Faizuddin's message to the Sage
  | "sage:help";

export type JobState = "queued" | "running" | "done" | "error" | "stopped";

export interface PipelineJob {
  id: string;
  key: string;               // ticket key
  character: Character;
  action: JobAction;
  state: JobState;
  activity: string;          // plain words: what it is doing now
  startedAt: string;
  finishedAt?: string;
  sessionId?: string;        // Claude Code session used
  error?: string;
  pid?: number;
  /** Which of the (up to 2) copies of this character runs it, e.g. Elf 2. */
  slot?: number;
  /** Night round 33: the CharacterState field holding this job's conversation when it is not "sessionId" (e.g. "triageSessionId"). */
  sessionSlot?: string;
  /**
   * System job with no pipeline ticket (key "KNOWLEDGE-0"), e.g. sage:apply for
   * a knowledge change keyed to a studying-only ticket or the knowledge audit.
   * Hidden from GET /api/pipeline/jobs; never adds a ticket to the board.
   */
  system?: boolean;
}

export interface ChatEntry {
  at: string;
  from: "faizuddin" | Character | "system";
  text: string;              // markdown
  jobId?: string;
  /** Tool activity lines shown collapsed under the message. */
  activity?: string[];
  /** System note about another character (ask-each-other): "Asked Scout: ...", "Scout answered ...". */
  via?: Character;
}

/** One TS as Elf hands it to Dwarf and the status writer. */
export interface PipelineScenario {
  id: string;                // e.g. "12345_TS01" (two digits, ticket digits prefix)
  section: string;           // section banner, e.g. "A. Happy path"
  title: string;             // one line; Dwarf's test() title is `${id}: ${title}`
  objective: string;
  steps: string[];
  expected: string[];
  manual?: boolean;          // e.g. Wholesale: never automated
  notes?: string;
  /** Where the expected results come from (SRD section / REQ, Jira, official TS row, his answer). Optional: older lists lack it (night round 2, 2026-10-27). */
  basis?: string;
  /** Risk priority (night round 24, Charmain's ledger P1-P3): P1 = money, ownership, visibility across roles/companies, approval bypass, unrecallable submission. Optional. */
  priority?: "P1" | "P2" | "P3";
}

/**
 * Ticket brief (Faizuddin, 2026-10-27): the three items every ticket must
 * give — high-level scope, estimated testing time (man-days) and the
 * modules/pages to cover. Scribe writes it with the related history:
 * data/pipeline/work/<KEY>/brief.json. Checked by scripts/pipeline/lib/brief.mjs.
 */
export interface TicketBriefModule {
  module: string;
  portal: string;
  pages: string[];
  why: string;
}

/** One line of the Miro-style testing scope; `text` is inline markdown ("**Firefox**: should show the popup"). */
export interface TestingScopeLine {
  text: string;
  numbered?: boolean;          // children shown as i, ii, iii
  children?: TestingScopeLine[];
}

export interface TicketBrief {
  key: string;
  updatedAt: string;
  scope: string[];             // 3-8 short lines, plain words
  /** Miro-style testing scope (2026-10-28); older briefs have none. */
  testingScope?: { mode?: string; outline: TestingScopeLine[] };
  estimate: {
    mandays: number;           // > 0, = base + buffer when both are given
    base?: number;             // Base Testing Time (days)
    buffer?: number;           // Buffer (Req Change + Bug Fix + Retest Bug)
    qaCount?: number;
    range: [number, number];   // [min, max]
    confidence: "high" | "medium" | "low";
    basis: string;
    /** Official figures quoted verbatim from the Scout study (Miro / Jira), when present. */
    official?: { miro?: string; jira?: string };
  };
  modules: TicketBriefModule[];
  sources: string[];
}

export interface CharacterState {
  sessionId?: string;        // Claude Code session for this ticket+character
  /** Night round 33: Elf's separate conversation for judging red runs (elf:findings and its follow-ups). */
  triageSessionId?: string;
  lastJobId?: string;
  state: "idle" | "working" | "waiting" | "error";
  note?: string;             // e.g. "Needs HTML of Step 4 captured"
}

export interface PipelineTicket {
  key: string;
  title: string;
  jiraStatus?: string;
  addedAt: string;
  updatedAt: string;
  addedBy: "scout" | "faizuddin";
  stage: PipelineStage;
  /** Repo-relative paths. */
  files: {
    study?: string;              // _reference/tickets/Studying/<KEY>/<KEY>-study.md
    related?: string;            // _reference/tickets/Studying/<KEY>/<KEY>-related-history.md
    scenariosMd?: string;        // data/pipeline/work/<KEY>/scenarios.md (Elf's reviewable list)
    scenariosJson?: string;      // data/pipeline/work/<KEY>/scenarios.json (PipelineScenario[])
    workbook?: string;           // _reference/tickets/<KEY>/<KEY> - <summary>.xlsx
    officialTs?: string;         // absolute path of the official workbook in the synced QA Team folder
    myWorkbook?: string;         // absolute path of Elf's workbook copy in his OneDrive "eAuto Documents/<KEY>" folder (2026-10-29)
    qaWorkbook?: string;         // absolute path of the last copy put in the QA Team folder with the Elf button (2026-10-29)
    suiteDir?: string;           // scripts/eauto-<n>
    runnerPage?: string;         // /eauto/<n> (dashboard URL)
    brief?: string;              // data/pipeline/work/<KEY>/brief.json (TicketBrief), set once it is complete
    suiteCheck?: string;         // data/pipeline/work/<KEY>/suite-check.json (scripts/pipeline/lib/suite-check.mjs), after dwarf:build / dwarf:sync
    assertionPlan?: string;      // data/pipeline/work/<KEY>/assertion-plan.json (per TS: checks + wrong outcomes; night round 8)
  };
  approvedAt?: string;           // green light
  approvedScenarioHash?: string; // hash of scenarios.json at approval, to detect later changes
  pendingDwarfChanges?: string[];// Elf changes after approval not yet applied by Dwarf
  dwarfScenarioHash?: string;    // hash of the scenarios.json the automation last matched (build/sync)
  runKey?: string;               // useBackgroundRuns key of the runner page, e.g. "eauto/12345"
  statusSync: boolean;           // write In Progress / Pass / Fail to the official sheet
  characters: Record<Character, CharacterState>;
  findings: string[];            // finding ids, newest first
  issues: { key: string; findingId: string; url: string; at: string }[];
  events: { at: string; text: string }[]; // newest first, max 100
}

export type FindingClass = "system" | "automation" | "data";
export type FindingState = "open" | "confirmed" | "dismissed" | "raised";

export interface Finding {
  id: string;
  key: string;
  ts: string;                  // TS id
  runId?: string;
  createdAt: string;
  state: FindingState;
  classification: FindingClass;
  summary: string;             // one line: the symptom
  tsQuote: string;             // the TS cell text, verbatim
  srd?: { file: string; page?: number; section?: string; quote: string; image?: string };
  evidence: { label: string; image: string }[]; // red-box *-ISSUE.png etc. (URL or file served by /api/pipeline/file)
  actual: string;              // few words
  expected: string;            // correct result + short SRD reference
  questionForDev?: string;
  issueDraft?: QaIssueDraft;
  issueKey?: string;
  /** Answers from the Confirm form; Scout drafts with them, the Raise uses them. */
  raiseForm?: {
    priority?: QaIssueDraft["priority"];
    developerAccountId?: string;
    developerName?: string;
    environment?: string;
    module?: string;
  };
  /** Text of the checks that failed (friendly error + raw error + failed step), kept for Scout. */
  failure?: { title: string; friendlyError?: string; error?: string; step?: string };
  /** Repo-relative folder of the findings page (_reference/tickets/<KEY>/<KEY>-<TS>-findings-<date>/). */
  page?: string;
  /** Duplicates the last Raise found, shown so Faizuddin can decide. */
  duplicates?: { key: string; summary: string; status?: string }[];
  /** Elf's triage (night round 3, Charmain's qa-triage method): verdict, the specific cause, what was ruled out. */
  triage?: {
    verdict: "defect" | "script" | "environment" | "data" | "known" | "unresolved";
    cause: string;
    ruledOut?: string[];
    knownAs?: string;          // earlier finding id or QA-Issue key
    confidence?: "confirmed" | "plausible";
  };
  /** Night round 5 (Charmain: triage from the latest run): a newer saved run passed this TS. */
  passedSince?: { runId: string; runLabel?: string; at: string };
  /** Night round 29: were the quotes verbatim? ts false = Elf's TS quote was replaced by the TS text; srd false = SRD quote not found in the SRD text copy. */
  quoteCheck?: { ts?: boolean; srd?: boolean };
  /** Night round 28: advisory notes on Scout's QA-Issue draft (shown in Scout's chat; never block the Raise). */
  draftWarnings?: string[];
  /** The Raise refused once because of a newer pass; a second press within 15 minutes raises. */
  stalePassAck?: { runId: string; at: string };
}

export interface QaIssueDraft {
  parent: string;              // the CR key (QA-Issue is a sub-task)
  title: string;               // "[eAuto - <Area>] <plain symptom>"
  environment: string;         // e.g. "staging/sit2"
  module: string;
  stagingIds: string[];        // IDs shown in orange
  steps: string[];             // 3–5 lines
  actual: string;
  expected: string;
  priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest"; // always asked
  developerAccountId?: string; // always asked
  attachments: string[];       // image paths to upload
}

// ── Sage (knowledge keeper, 2026-10-27; scripts/pipeline/README.md §8) ──

/** Something that happened in the pipeline, waiting in data/pipeline/sage-inbox/<KEY>.jsonl. */
export interface SageEvent {
  id: string;
  at: string;
  type: "job" | "chat" | "approve" | "finding" | "issue" | "study";
  character?: Character;
  action?: JobAction;
  jobId?: string;
  by?: "faizuddin" | Character;
  /** Short text: the job's reply, his message, the finding reason, ... */
  text?: string;
  /** Chat events: the questions the character had asked him just before (his message may answer them). */
  answering?: string[];
  findingId?: string;
  ts?: string;
  state?: string;
  issueKey?: string;
  file?: string;
}

/** A knowledge change that changes or contradicts an existing fact: waits for Faizuddin's OK. */
export interface KnowledgeReview {
  id: string;
  at: string;
  key: string;
  file: string;              // repo-relative, under knowledge/
  current: string;           // verbatim text in the file now
  proposed: string;
  why: string;
  sources: string[];
  state: "pending" | "approved" | "applied" | "rejected" | "error";
  jobId?: string;
  /** false when `current` was not found verbatim in the file when the Sage proposed it. */
  currentFound?: boolean;
  decidedAt?: string;
  note?: string;             // his note on approve / reject, or the apply error
  appliedAt?: string;
}

export type ImprovementArea = "scout" | "scribe" | "elf" | "dwarf" | "sage" | "toolbox" | "ui" | "process";

/** An idea to improve the pipeline itself (the Sage never edits code). */
export interface PipelineImprovement {
  id: string;
  at: string;
  key: string;
  area: ImprovementArea;
  observation: string;       // with evidence
  suggestion: string;
  state: "open" | "done" | "dismissed";
  jobId?: string;
  updatedAt?: string;
  /** Near-miss repeated-question ideas: the question, normalised (dedupe). */
  questionNorm?: string;
}

/** Faizuddin's answer to a character's question, so nobody asks it again. */
export interface SavedAnswer {
  id: string;
  question: string;          // original wording
  questionNorm: string;      // normalised, for matching
  answer: string;            // his exact words
  /** "global" | "ticket:<KEY>" | "module:<name>" — decided conservatively. */
  scope: string;
  askedBy: Character;
  ticket: string;
  date: string;              // YYYY-MM-DD he answered
  source: string;            // e.g. "data/pipeline/chats/EAINT-12019/elf.jsonl @ 2026-10-27T08:38:38Z"
  state: "active" | "wrong";
  addedAt: string;
  uses?: number;             // times it answered a question for him
  flaggedAt?: string;
}

/** One line of data/pipeline/learnings.jsonl. */
export interface LearningRecord {
  at: string;
  key: string;
  type: "learn" | "apply" | "chat" | "auto-answer";
  jobId?: string;
  summary?: string;
  /** knowledge/ files the job changed, with line counts. */
  files?: { path: string; change: "added" | "updated"; linesAdded: number; linesRemoved: number }[];
  review?: number;           // review items added
  improvements?: number;     // improvement items added
  answers?: number;          // registry entries added
  /** knowledge/ was changed but the change could not be counted (e.g. another job wrote at the same time). */
  warning?: string;
  // auto-answer records
  character?: Character;
  question?: string;
  answerId?: string;
  answer?: string;
  answeredOn?: string;
}
