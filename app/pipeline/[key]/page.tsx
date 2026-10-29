"use client";
// Pipeline workspace for one ticket (Faizuddin, 2026-10-27): the study, Elf's
// scenarios and chat, the green light, Dwarf's automation, official-sheet
// status sync and findings → QA-Issue — all in one page instead of the CLI.
// Data: /api/pipeline/tickets/[key], polled every 3 s while a job runs, else
// every 10 s. Design: scripts/pipeline/README.md §4.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Loader2, AlertTriangle, Sparkles, CheckCircle2, Hammer, Bot,
  BookOpen, History, ListChecks, Bug, FileSpreadsheet, Trash2, ScrollText,
  HelpCircle, PauseCircle, Copy, Ban, RotateCcw, PlayCircle, FolderOpen, Share2,
} from "lucide-react";
import clsx from "clsx";
import Panel from "@/components/pipeline/Panel";
import SectionedDoc, { Inline, PriorityChip, priorityCounts } from "@/components/pipeline/SectionedDoc";
import TicketBrief, { type TicketBriefData } from "@/components/pipeline/TicketBrief";
import StageStepper from "@/components/pipeline/StageStepper";
import ChatThread, { JobLine } from "@/components/pipeline/ChatThread";
import PipChat, { usePipChat, PopOutButton, PoppedNote, type PipCharacter } from "@/components/pipeline/PipChat";
import FindingCard from "@/components/pipeline/FindingCard";
import CharacterSprite, { CHARACTER_INFO } from "@/components/pipeline/CharacterSprite";
import AutomationPanel from "@/components/pipeline/AutomationPanel";
import { RUNNERS } from "@/lib/pipeline/runnerRegistry";
import { ACTIVE_JOB, api, startPolling, when, type TicketDetail } from "@/components/pipeline/api";
import type { Character, CharacterState, JobAction } from "@/lib/pipeline/types";

interface SyncEntry {
  at?: string;
  ts?: string | string[];
  status?: string;
  ok?: boolean;
  error?: string;
  message?: string;
  file?: string;
  missing?: string[];
  test?: boolean;
  dryRun?: boolean;
}

/** Extra fields GET /api/pipeline/tickets/[key] returns (night of 2026-10-27; api.ts is not ours to change). */
interface NextStep {
  who?: string;
  waitingOn?: "faizuddin" | "work" | "none";
  action?: string;
  also?: string[];
  stage?: string | null;
  /** Set when a normally automatic step stopped and nothing is running (stalled). */
  character?: Character;
}
interface OpenQuestion { character: Character; question: string; askedAt?: string; jobId?: string; for?: string }
interface ParkedQuestion { askedBy: Character; question: string; deferredAt?: string; reply?: string; to?: string[] }
type Detail = TicketDetail & {
  brief?: TicketBriefData | null;
  briefProblems?: string[];
  next?: NextStep;
  openQuestions?: OpenQuestion[];
  parkedQuestions?: ParkedQuestion[];
};
interface RunSummary {
  runId: string;
  runLabel?: string;
  runKey?: string;
  startedAt?: string;
  finishedAt?: string;
  savedAt?: string;
  total?: number;
  failed?: number;
  error?: string;
  voided?: { reason?: string; voidedBy?: string; voidedOn?: string } | null;
}

const charName = (c?: string) => (c && c in CHARACTER_INFO ? CHARACTER_INFO[c as Character].name : c ?? "");

function toSyncLog(data: unknown): SyncEntry[] {
  if (Array.isArray(data)) return data as SyncEntry[];
  if (data && typeof data === "object") {
    for (const k of ["log", "entries", "items"]) {
      const v = (data as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as SyncEntry[];
    }
  }
  return [];
}

const STATE_TEXT: Record<CharacterState["state"], string> = {
  idle: "Resting",
  working: "Working",
  waiting: "Waiting for you",
  error: "Stopped with an error",
};
const STATE_TONE: Record<CharacterState["state"], string> = {
  idle: "text-slate-400",
  working: "text-blue-300",
  waiting: "text-amber-300",
  error: "text-red-300",
};

/**
 * Scrolls only the app's <main> to an element. scrollIntoView also scrolls
 * every ancestor, which moved the whole app shell (2026-10-27).
 */
function scrollInMain(id: string, block: "start" | "center") {
  const el = document.getElementById(id);
  const main = el?.closest("main");
  if (!el || !main) return;
  const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
  const offset = block === "center" ? (main.clientHeight - el.offsetHeight) / 2 : 16;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  main.scrollTo({ top: Math.max(0, top - offset), behavior: reduce ? "auto" : "smooth" });
}

function md(src?: string | null) {
  return (src ?? "").replace(/\r\n/g, "\n");
}

function CharacterHeader({ character, state, lastError }: { character: Character; state?: CharacterState; lastError?: string }) {
  const s = state?.state ?? "idle";
  return (
    <div className="flex items-center gap-3">
      <CharacterSprite character={character} size={40} busy={s === "working"} waiting={s === "waiting"} />
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{CHARACTER_INFO[character].role}</div>
        <div className={clsx("text-sm", STATE_TONE[s])}>{STATE_TEXT[s]}{state?.note ? ` — ${state.note}` : ""}</div>
        {s === "error" && lastError && <div className="text-[11px] text-red-300/80 break-words">{lastError}</div>}
      </div>
    </div>
  );
}

const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm disabled:opacity-40";
const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-500`;
const btnGreen = `${btn} bg-green-600 text-white hover:bg-green-500`;
const btnGhost = `${btn} border border-slate-700 text-slate-300 hover:bg-slate-800`;

/** "(for: the BA)" etc. is shown as the group, not repeated in each line. */
const cleanQuestion = (q: string) => q.replace(/\s*\(for:[^)]*\)/i, "").replace(/\s*_\(Asked another character[^)]*\)_\s*/i, " ").trim();

/** Open and parked questions, plus the "to forward" list for the BA / developer. */
function QuestionsPanel({ open, parked, onJump }: { open: OpenQuestion[]; parked: ParkedQuestion[]; onJump: (id: string) => void }) {
  const [copied, setCopied] = useState("");
  const mine = open.filter(q => !q.for || q.for === "faizuddin");
  const forward = open.filter(q => q.for && q.for !== "faizuddin");
  const groups = new Map<string, OpenQuestion[]>();
  for (const q of forward) groups.set(q.for!, [...(groups.get(q.for!) ?? []), q]);
  const chatId = (c: string) => (c === "elf" ? "elf-chat" : `${c}-chat`);
  const copy = async (who: string, list: OpenQuestion[]) => {
    const text = list.map((q, i) => `${i + 1}. ${cleanQuestion(q.question).replace(/\*\*/g, "")}`).join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(who); setTimeout(() => setCopied(""), 2000); } catch { setCopied(""); }
  };
  const row = (q: OpenQuestion, i: number, jump: boolean) => (
    <li key={i} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
      <p className="text-[13px] text-slate-200 leading-relaxed"><Inline text={cleanQuestion(q.question)} /></p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
        <span>Asked by {charName(q.character)}{q.askedAt ? ` · ${when(q.askedAt)}` : ""}</span>
        {jump && <button type="button" className="text-blue-400 hover:underline" onClick={() => onJump(chatId(q.character))}>Answer in the {charName(q.character)} chat</button>}
      </p>
    </li>
  );
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-amber-200 mb-1.5">For you ({mine.length})</h3>
        {mine.length ? <ol className="space-y-1.5">{mine.map((q, i) => row(q, i, true))}</ol> : <p className="text-xs text-slate-500">No open questions for you.</p>}
      </div>
      <div>
        <h3 className="text-xs font-semibold text-slate-200 mb-1.5">To forward ({forward.length})</h3>
        {forward.length === 0 && <p className="text-xs text-slate-500">Nothing to ask the BA or the developer.</p>}
        <div className="space-y-3">
          {[...groups.entries()].map(([who, list]) => (
            <div key={who}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] px-2 leading-5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-200 capitalize">{who.replace(/^the /, "")}</span>
                <span className="text-[11px] text-slate-500">{list.length} question{list.length === 1 ? "" : "s"}</span>
                <button type="button" onClick={() => { void copy(who, list); }} className="ml-auto inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline">
                  <Copy size={11} aria-hidden /> {copied === who ? "Copied" : "Copy list"}
                </button>
              </div>
              <ol className="space-y-1.5">{list.map((q, i) => row(q, i, false))}</ol>
            </div>
          ))}
        </div>
      </div>
      {parked.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1.5"><PauseCircle size={13} className="text-slate-400" aria-hidden /> Parked for later ({parked.length})</h3>
          <ol className="space-y-1.5">
            {parked.map((p, i) => (
              <li key={i} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <p className="text-[13px] text-slate-300 leading-relaxed"><Inline text={cleanQuestion(p.question)} /></p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Asked by {charName(p.askedBy)}{p.deferredAt ? ` · parked ${when(p.deferredAt)}` : ""}
                  {p.to?.length ? ` · ${p.to.map(charName).join(", ")} may ask again` : " · Elf or Dwarf may ask again"}
                </p>
                {p.reply && <p className="mt-0.5 text-[11px] text-slate-400 italic">You said: &ldquo;{p.reply}&rdquo;</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Saved runs with a Void / Restore control (PATCH /api/pipeline/runs). */
function RunList({ ticketKey, runs, error, onChanged }: { ticketKey: string; runs: RunSummary[] | null; error: string; onChanged: () => void }) {
  const [voiding, setVoiding] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const patch = async (runId: string, isVoid: boolean) => {
    setBusy(true); setErr("");
    const r = await api("/api/pipeline/runs", { method: "PATCH", json: { key: ticketKey, runId, void: isVoid, reason: reason.trim(), by: "Faizuddin (dashboard)" } });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setVoiding(null); setReason(""); onChanged();
  };
  if (error) return <p className="text-xs text-amber-300">{error}</p>;
  if (!runs) return <p className="text-xs text-slate-500">Loading runs…</p>;
  if (!runs.length) return <p className="text-xs text-slate-500">No saved runs yet. They appear here after a run on the runner page.</p>;
  return (
    <ol className="space-y-1.5">
      {runs.slice(0, 30).map(r => {
        const failed = r.failed ?? 0;
        const total = r.total ?? 0;
        return (
          <li key={r.runId} className={clsx("rounded-lg border px-3 py-2 text-xs", r.voided ? "border-slate-800 bg-slate-950/20 opacity-70" : "border-slate-800 bg-slate-950/40")}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <PlayCircle size={13} className="text-slate-500" aria-hidden />
              <span className={clsx("text-slate-200", r.voided && "line-through")}>{r.runLabel || r.runId}</span>
              <span className="text-slate-500">{when(r.finishedAt ?? r.savedAt ?? r.startedAt)}</span>
              <span className={clsx("px-1.5 leading-5 rounded-full border text-[11px]", failed ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-green-500/40 bg-green-500/10 text-green-300")}>
                {total - failed}/{total} passed
              </span>
              {r.voided && <span className="px-1.5 leading-5 rounded-full border border-slate-600 bg-slate-800 text-slate-300 text-[11px]">Voided</span>}
              <span className="ml-auto">
                {r.voided ? (
                  <button type="button" disabled={busy} onClick={() => { void patch(r.runId, false); }} className="inline-flex items-center gap-1 text-blue-400 hover:underline disabled:opacity-40">
                    <RotateCcw size={11} aria-hidden /> Restore
                  </button>
                ) : voiding !== r.runId && (
                  <button type="button" onClick={() => { setVoiding(r.runId); setReason(""); setErr(""); }} className="inline-flex items-center gap-1 text-slate-400 hover:text-red-300">
                    <Ban size={11} aria-hidden /> Void
                  </button>
                )}
              </span>
            </div>
            {r.voided?.reason && <p className="mt-1 text-[11px] text-slate-500">Voided by {r.voided.voidedBy}{r.voided.voidedOn ? ` · ${when(r.voided.voidedOn)}` : ""}: {r.voided.reason}</p>}
            {voiding === r.runId && (
              <div className="mt-2 space-y-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2">
                <p className="text-slate-300">Void this run? It then counts as proof of nothing (wrong build, environment or account). The run file is kept. Never void a run just to hide a failure.</p>
                <label className="block">
                  <span className="text-[11px] text-slate-400">Why (at least 15 characters)</span>
                  <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Ran on sit2 before the fix was deployed"
                    className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200" />
                </label>
                {err && <p className="text-red-300">{err}</p>}
                <div className="flex gap-2">
                  <button type="button" disabled={busy || reason.trim().length < 15} onClick={() => { void patch(r.runId, true); }} className="px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-40">Void run</button>
                  <button type="button" onClick={() => setVoiding(null)} className="px-2 py-1 rounded border border-slate-700 text-slate-300">Cancel</button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Quote-check and QA-Issue draft-check notes of a finding (FindingCard does not show them). */
function FindingNotes({ f }: { f: { quoteCheck?: { ts?: boolean; srd?: boolean }; draftWarnings?: string[] } }) {
  const notes: string[] = [];
  if (f.quoteCheck?.ts === false) notes.push("Elf's TS quote was not word for word, so the TS text was put in its place.");
  if (f.quoteCheck?.srd === false) notes.push("The SRD quote was not found word for word in the SRD copy. Check it before raising.");
  const draft = f.draftWarnings ?? [];
  if (!notes.length && !draft.length) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs space-y-1">
      {notes.map((n, i) => <p key={i} className="flex items-start gap-1.5 text-amber-200"><AlertTriangle size={12} className="shrink-0 mt-0.5" aria-hidden />{n}</p>)}
      {draft.length > 0 && (
        <div>
          <p className="text-amber-200">QA-Issue draft notes (they do not block the Raise):</p>
          <ol className="list-decimal ml-5 text-slate-300 space-y-0.5">{draft.map((d, i) => <li key={i}>{d}</li>)}</ol>
        </div>
      )}
    </div>
  );
}

export default function PipelineWorkspacePage() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(String(params?.key ?? "")).toUpperCase();
  const router = useRouter();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [runsError, setRunsError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [syncLog, setSyncLog] = useState<SyncEntry[] | null>(null);
  const [syncError, setSyncError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmQa, setConfirmQa] = useState(false);
  const activeRef = useRef(false);
  const pip = usePipChat(key);

  const load = useCallback(async () => {
    const [d, s, r] = await Promise.all([
      api<Detail>(`/api/pipeline/tickets/${encodeURIComponent(key)}`),
      api<unknown>(`/api/pipeline/ts-status?key=${encodeURIComponent(key)}`),
      api<{ runs?: RunSummary[] }>(`/api/pipeline/runs?key=${encodeURIComponent(key)}`),
    ]);
    if (r.ok) { setRuns(r.data?.runs ?? []); setRunsError(""); }
    else setRunsError(r.error);
    if (d.ok && d.data?.ticket) {
      setDetail(d.data);
      setLoadError("");
      activeRef.current = (d.data.jobs ?? []).some(ACTIVE_JOB);
    } else if (!d.ok) {
      setLoadError(d.status === 404 && !detail ? `${key} is not in the pipeline, or this part is not ready yet.` : d.error);
    }
    // Test writes (copies under data/pipeline/test/) and dry runs never touched the real sheet.
    if (s.ok) { setSyncLog(toSyncLog(s.data).filter(e => !e.test && !e.dryRun)); setSyncError(""); }
    else setSyncError(s.error);
  // `detail` only shapes the first error message; leaving it out keeps polling stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const first = setTimeout(() => { void load(); }, 0);
    const stop = startPolling(() => { void load(); }, () => (activeRef.current ? 3000 : 10000));
    return () => { clearTimeout(first); stop(); };
  }, [load]);

  async function act(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(label); setActionError("");
    const r = await fn();
    setBusy(null);
    if (!r.ok) setActionError(r.error ?? "Something went wrong.");
    void load();
    return r.ok;
  }

  const queue = (action: JobAction) => act(action, () => api("/api/pipeline/jobs", { method: "POST", json: { key, action } }));
  const stopJob = (id: string) => { void act("stop", () => api(`/api/pipeline/jobs?id=${encodeURIComponent(id)}`, { method: "DELETE" })); };
  // Opens a ticket folder in File Explorer on this PC (2026-10-29).
  const openFolder = (action: "open-mine" | "open-qa") => {
    void act(action, () => api("/api/pipeline/folders", { method: "POST", json: { key, action } }));
  };
  const sendChat = (character: "elf" | "dwarf" | "scout" | "scribe") => (text: string) =>
    act(`chat:${character}`, () => api("/api/pipeline/chat", { method: "POST", json: { key, character, text } }));

  if (!detail) {
    return (
      <div className="p-4 sm:p-6 space-y-3">
        <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft size={14} aria-hidden /> Pipeline</Link>
        {loadError
          ? <p role="alert" className="flex items-center gap-2 text-sm text-amber-300"><AlertTriangle size={14} aria-hidden /> {loadError}</p>
          : <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" aria-hidden /> Loading {key}…</p>}
      </div>
    );
  }

  const { ticket: t, chats, jobs = [], findings = [], files, next: apiNext, openQuestions = [], parkedQuestions = [] } = detail;
  const prio = priorityCounts(md(files?.scenariosMd));
  const prioTotal = prio.P1 + prio.P2 + prio.P3;
  const myQuestions = openQuestions.filter(q => !q.for || q.for === "faizuddin").length;
  const activeJob = (c: Character) => jobs.find(j => j.character === c && ACTIVE_JOB(j));
  const lastError = (c: Character) => jobs.filter(j => j.character === c && j.state === "error").sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))[0]?.error;
  const elfJob = activeJob("elf");
  const dwarfJob = activeJob("dwarf");
  const scoutJob = activeJob("scout");
  const scribeJob = activeJob("scribe");
  const hasScenarios = !!md(files?.scenariosMd).trim();
  const approved = !!t.approvedAt;
  const sortedFindings = [...findings].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const openFindings = findings.filter(f => f.state === "open").length;
  const elfWaiting = t.characters?.elf?.state === "waiting";
  // Scout and Scribe questions are answered in their notes panel (2026-10-27).
  const sideWaiting = (["scout", "scribe"] as const).filter(c => t.characters?.[c]?.state === "waiting");

  // One chat thread per character, shown either in its panel or in the
  // floating window (never both: one draft box per character).
  const CHAT_PLACEHOLDER: Record<PipCharacter, string> = {
    scout: "Reply to Scout or ask a question… (Ctrl+Enter to send)",
    scribe: "Reply to Scribe or ask a question… (Ctrl+Enter to send)",
    elf: "Tell Elf what to change or answer its question… (Ctrl+Enter to send)",
    dwarf: approved ? "Message Dwarf… (Ctrl+Enter to send)" : "Dwarf can chat after the green light",
  };
  const thread = (c: PipCharacter) => (
    <ChatThread
      character={c}
      entries={chats?.[c] ?? []}
      job={activeJob(c)}
      onStop={stopJob}
      onSend={sendChat(c)}
      disabled={c === "dwarf" && !approved}
      placeholder={CHAT_PLACEHOLDER[c]}
    />
  );
  const chatSlot = (c: PipCharacter) =>
    pip.popped === c ? <PoppedNote name={CHARACTER_INFO[c].name} onBack={() => pip.update(null)} /> : thread(c);
  const popOut = (c: PipCharacter) => <PopOutButton name={CHARACTER_INFO[c].name} onClick={() => pip.popOut(c)} />;

  // Opens the approve box in the Elf panel and brings it into view.
  const startApprove = () => {
    setConfirmApprove(true);
    setTimeout(() => scrollInMain("approve-box", "center"), 50);
  };
  const jump = (id: string) => scrollInMain(id, "start");

  // The one thing to do next (Faizuddin, 2026-10-27: the green light must be
  // obvious, not buried under the scenario list).
  const anyJob = scoutJob ?? scribeJob ?? elfJob ?? dwarfJob;
  let next: { text: string; actions?: ReactNode };
  if (openFindings > 0) {
    next = {
      text: `${openFindings} failed test${openFindings === 1 ? "" : "s"} to check. Confirm each one or mark it as not an issue.`,
      actions: <button type="button" className={btnPrimary} onClick={() => jump("findings")}><Bug size={14} aria-hidden /> Go to findings</button>,
    };
  } else if (anyJob) {
    next = { text: `${CHARACTER_INFO[anyJob.character].name} is working: ${anyJob.activity || "starting…"} You can wait or leave this page.` };
  } else if (!md(files?.studyMd).trim()) {
    next = { text: "There is no study yet. Ask Scout to study the ticket first." };
  } else if (!hasScenarios) {
    next = {
      text: "Read the study. When it looks right, ask Elf for the test scenarios.",
      actions: <button type="button" className={btnPrimary} disabled={busy === "elf:plan"} onClick={() => queue("elf:plan")}><Sparkles size={14} aria-hidden /> Ask Elf for scenarios</button>,
    };
  } else if (!approved) {
    next = {
      text: elfWaiting
        ? "Elf has questions. Answer them in the Elf chat, then give the green light when the scenarios look right."
        : "Check Elf's scenarios. Ask for changes in the Elf chat, or give the green light.",
      actions: (
        <>
          <button type="button" className={btnGreen} onClick={startApprove}><CheckCircle2 size={14} aria-hidden /> Approve scenarios (green light)</button>
          <button type="button" className={btnGhost} onClick={() => jump("elf-chat")}>Go to Elf chat</button>
        </>
      ),
    };
  } else if (!t.files?.runnerPage) {
    next = {
      text: "Scenarios are approved. Start Dwarf to build the automation.",
      actions: <button type="button" className={btnPrimary} disabled={busy === "dwarf:build"} onClick={() => queue("dwarf:build")}><Hammer size={14} aria-hidden /> Start Dwarf</button>,
    };
  } else if (RUNNERS[t.key]) {
    next = {
      text: "The automation is ready. Run the tests in the Automation panel below (P1 tests first). Failed tests come back here as findings.",
      actions: <button type="button" className={btnPrimary} onClick={() => jump("automation")}><Bot size={14} aria-hidden /> Go to Automation</button>,
    };
  } else {
    next = {
      text: "The automation is ready. Run the tests on the runner page. Failed tests come back here as findings.",
      actions: <Link href={t.files.runnerPage} className={btnPrimary}><ExternalLink size={14} aria-hidden /> Open runner page</Link>,
    };
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <header className="space-y-2">
        <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"><ArrowLeft size={12} aria-hidden /> Pipeline</Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/jira/${t.key}`} className="font-mono text-lg text-blue-300 hover:underline">{t.key}</Link>
          {t.jiraStatus && <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{t.jiraStatus}</span>}
          <span className="text-[11px] text-slate-500">Added by {t.addedBy === "scout" ? "Scout" : "you"} · {when(t.addedAt)}</span>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => openFolder("open-mine")} title="OneDrive › eAuto Documents › this ticket. The characters can read and save files here."
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
              <FolderOpen size={12} aria-hidden /> Open my folder
            </button>
            {!confirmRemove ? (
              <button type="button" onClick={() => setConfirmRemove(true)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-300">
                <Trash2 size={12} aria-hidden /> Remove from pipeline
              </button>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-300">Remove {t.key}? Files are kept.</span>
                <button type="button" className="px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-600" onClick={async () => {
                  const ok = await act("remove", () => api(`/api/pipeline/tickets/${encodeURIComponent(key)}`, { method: "DELETE" }));
                  if (ok) router.push("/pipeline");
                }}>Remove</button>
                <button type="button" className="px-2 py-1 rounded border border-slate-700 text-slate-300" onClick={() => setConfirmRemove(false)}>Cancel</button>
              </span>
            )}
          </div>
        </div>
        <h1 className="text-lg font-semibold text-slate-100">{t.title || "No title yet"}</h1>
        <StageStepper stage={t.stage} />
      </header>

      {/* Ticket brief: scope, man-days, modules / pages (first card, 2026-10-28). */}
      <TicketBrief brief={detail.brief} problems={detail.briefProblems} updatedLabel={when(detail.brief?.updatedAt)} />

      {/* Next step: the one next action from the API (next-step.mjs), with this page's buttons. */}
      <section aria-label="Next step" className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-3 sm:p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[14rem]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-blue-300 font-semibold">Next step</span>
            {apiNext?.waitingOn && (
              <span className={clsx("text-[11px] px-2 leading-5 rounded-full border",
                apiNext.waitingOn === "faizuddin" ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : apiNext.waitingOn === "work" ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                    : "border-slate-700 bg-slate-800 text-slate-400")}>
                {apiNext.waitingOn === "faizuddin" ? "Waiting on you" : apiNext.waitingOn === "work" ? `Working: ${charName(apiNext.who)}` : "Nothing waiting"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-100 mt-0.5">{apiNext?.action || next.text}</p>
          {apiNext?.character && (
            <p className="text-xs text-amber-300 mt-1 flex items-start gap-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" aria-hidden />
              Stalled: {charName(apiNext.character)}&apos;s step stopped and nothing is running. It needs you to start it again.
            </p>
          )}
          {(apiNext?.also?.length ?? 0) > 0 && (
            <ol className="mt-1.5 space-y-0.5">
              {apiNext!.also!.map((a, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-1.5"><span className="text-slate-500">Also:</span><span className="min-w-0 break-words">{a}</span></li>
              ))}
            </ol>
          )}
          {sideWaiting.map(c => (
            <p key={c} className="text-xs text-amber-300 mt-1">
              {CHARACTER_INFO[c].name} also has a question for you.{" "}
              <button type="button" className="underline hover:text-amber-200" onClick={() => jump(`${c}-chat`)}>Answer in the {CHARACTER_INFO[c].name} chat</button>
            </p>
          ))}
        </div>
        {next.actions && <div className="flex flex-wrap gap-2">{next.actions}</div>}
      </section>

      {actionError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-300"><AlertTriangle size={14} aria-hidden /> {actionError}</p>
      )}
      {loadError && (
        <p role="status" className="flex items-center gap-2 text-xs text-amber-300"><AlertTriangle size={12} aria-hidden /> Could not refresh: {loadError}</p>
      )}

      {/* One column, in pipeline order (Faizuddin, 2026-10-27: "instead of making 2 columns, can you make 1 column only"). */}
      <div className="space-y-4">
        {(openQuestions.length > 0 || parkedQuestions.length > 0) && (
          <div id="questions" className="scroll-mt-4">
            <Panel
              title={`Questions (${openQuestions.length} open${parkedQuestions.length ? `, ${parkedQuestions.length} parked` : ""})`}
              icon={<HelpCircle size={15} className="text-amber-300" aria-hidden />}
              right={myQuestions > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">{myQuestions} for you</span>}
              defaultOpen={myQuestions > 0}
            >
              <QuestionsPanel open={openQuestions} parked={parkedQuestions} onJump={id => scrollInMain(id, "start")} />
            </Panel>
          </div>
        )}

        {/* Reading material */}
        <div className="space-y-4 min-w-0">
          {/* Open only while the ticket is still at "Studied" (or has no study yet);
              after that it folds so Elf is easy to reach (approved 2026-10-27). */}
          <Panel title="Study" icon={<BookOpen size={15} className="text-blue-400" aria-hidden />} right={scoutJob && <CharacterSprite character="scout" size={22} busy />}
            defaultOpen={t.stage === "studied" || !md(files?.studyMd).trim()}>
            {md(files?.studyMd).trim()
              ? <SectionedDoc source={md(files?.studyMd)} kind="study" />
              : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">{scoutJob ? `Scout is studying this ticket… ${scoutJob.activity}` : "No study yet. Scout may still be working on it (see the Agents page)."}</p>
                  {!scoutJob && (
                    <button type="button" className={btnGhost} disabled={busy === "study"}
                      onClick={() => { void act("study", () => api("/api/pipeline/tickets", { method: "POST", json: { key } })); }}>
                      {busy === "study" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <BookOpen size={14} aria-hidden />}
                      Ask Scout to study it
                    </button>
                  )}
                </div>
              )}
          </Panel>

          <Panel title="Related history" icon={<ScrollText size={15} className="text-blue-400" aria-hidden />} defaultOpen={false}
            right={scribeJob && <CharacterSprite character="scribe" size={22} busy />}>
            {md(files?.relatedMd).trim()
              ? <SectionedDoc source={md(files?.relatedMd)} kind="related" estimate={detail.brief?.estimate}
                  skipSections={detail.brief ? /^ticket brief$/i : undefined} />
              : <p className="text-xs text-slate-500">{scribeJob ? `Scribe is reading past test scripts… ${scribeJob.activity}` : "Scribe has not written the related history yet."}</p>}
            {scribeJob && <div className="mt-3"><JobLine job={scribeJob} onStop={stopJob} /></div>}
          </Panel>

          {/* One chat panel per character (Faizuddin, 2026-10-27: "seperate scout and scribe chat"). */}
          {(["scout", "scribe"] as const).map(c => (
            <div key={c} id={`${c}-chat`} className="scroll-mt-4">
              <Panel title={`Chat with ${CHARACTER_INFO[c].name}`} icon={<CharacterSprite character={c} size={20} />}
                defaultOpen={t.characters?.[c]?.state === "waiting"} right={popOut(c)}>
                <div className="space-y-2">
                  <CharacterHeader character={c} state={t.characters?.[c]} lastError={lastError(c)} />
                  {chatSlot(c)}
                </div>
              </Panel>
            </div>
          ))}

        </div>

        {/* The characters' work */}
        <div className="space-y-4 min-w-0">
          {/* Elf */}
          <div id="elf" className="scroll-mt-4">
          <Panel title="Elf — test scenarios" icon={<CharacterSprite character="elf" size={20} />}>
            <div className="space-y-4">
              <CharacterHeader character="elf" state={t.characters?.elf} lastError={lastError("elf")} />

              {hasScenarios ? (
                <details open className="rounded-lg border border-slate-800 bg-slate-950/40">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm text-slate-200 flex items-center gap-2">
                    <ListChecks size={14} className="text-green-400" aria-hidden /> Scenario list
                    {approved && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">Approved {when(t.approvedAt)}</span>}
                    {prioTotal > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400" title="Test priority: P1 = money, ownership, who can see what; P2 = the main rule; P3 = wording and layout">
                        {(["P1", "P2", "P3"] as const).filter(p => prio[p] > 0).map(p => <span key={p} className="inline-flex items-center gap-0.5"><PriorityChip p={p} />{prio[p]}</span>)}
                      </span>
                    )}
                  </summary>
                  <div className="px-3 pb-3"><SectionedDoc source={md(files?.scenariosMd)} kind="scenarios" /></div>
                </details>
              ) : (
                <p className="text-xs text-slate-500">No scenarios yet. Ask Elf when the study looks right.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} disabled={!!elfJob || busy === "elf:plan"} onClick={() => queue("elf:plan")}>
                  {busy === "elf:plan" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} aria-hidden />}
                  {hasScenarios ? "Ask Elf for scenarios again" : "Ask Elf for scenarios"}
                </button>
                {hasScenarios && !approved && !confirmApprove && (
                  <button type="button" className={btnGreen} disabled={!!elfJob} onClick={() => setConfirmApprove(true)}>
                    <CheckCircle2 size={14} aria-hidden /> Approve scenarios (green light)
                  </button>
                )}
              </div>

              {confirmApprove && !approved && (
                <div id="approve-box" className="rounded-lg border border-green-500/40 bg-green-500/5 p-3 space-y-2 text-sm">
                  <p className="text-slate-200">Give the green light? Elf then builds the TS workbook and Dwarf starts building the automation. Later changes to the scenarios are passed to Dwarf.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnGreen} disabled={busy === "approve"} onClick={async () => {
                      const ok = await act("approve", () => api("/api/pipeline/approve", { method: "POST", json: { key } }));
                      if (ok) setConfirmApprove(false);
                    }}>
                      {busy === "approve" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <CheckCircle2 size={14} aria-hidden />}
                      Yes, approve
                    </button>
                    <button type="button" className={btnGhost} onClick={() => setConfirmApprove(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {t.files?.workbook && (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs text-slate-400 break-all">
                    <FileSpreadsheet size={13} className="text-green-400 shrink-0" aria-hidden />
                    Workbook: {t.files.myWorkbook ?? t.files.workbook}
                  </p>
                  {t.files.qaWorkbook && <p className="text-xs text-slate-500 break-all">In the QA Team folder: {t.files.qaWorkbook}</p>}
                  {/* QA Team folder only on his say-so (2026-10-29): it is shared with the team. */}
                  {!confirmQa ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btnGhost} onClick={() => openFolder("open-mine")}>
                        <FolderOpen size={14} aria-hidden /> Open my folder
                      </button>
                      <button type="button" className={btnGhost} onClick={() => setConfirmQa(true)}>
                        <Share2 size={14} aria-hidden /> {t.files.qaWorkbook ? "Put in QA Team folder again" : "Put in QA Team folder"}
                      </button>
                      {t.files.qaWorkbook && (
                        <button type="button" className={btnGhost} onClick={() => openFolder("open-qa")}>
                          <FolderOpen size={14} aria-hidden /> Open QA Team folder
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2 text-sm">
                      <p className="text-slate-200">Copy the TS workbook into the QA Team &quot;CR Test Scenarios&quot; folder? The whole team can see it. Files already there are kept; a taken name gets &quot;(v2)&quot;.</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={btnPrimary} disabled={busy === "copy-to-qa"} onClick={async () => {
                          const ok = await act("copy-to-qa", () => api("/api/pipeline/folders", { method: "POST", json: { key, action: "copy-to-qa" } }));
                          if (ok) setConfirmQa(false);
                        }}>
                          {busy === "copy-to-qa" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Share2 size={14} aria-hidden />}
                          Yes, put it there
                        </button>
                        <button type="button" className={btnGhost} onClick={() => setConfirmQa(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h3 id="elf-chat" className="scroll-mt-4 pt-1 border-t border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
                Chat with Elf {popOut("elf")}
              </h3>
              {chatSlot("elf")}
            </div>
          </Panel>
          </div>

          {/* Dwarf */}
          <Panel title="Dwarf — automation" icon={<CharacterSprite character="dwarf" size={20} />}>
            <div className="space-y-4">
              <CharacterHeader character="dwarf" state={t.characters?.dwarf} lastError={lastError("dwarf")} />

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={btnPrimary} disabled={!approved || !!dwarfJob || busy === "dwarf:build"} onClick={() => queue("dwarf:build")}>
                  {busy === "dwarf:build" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Hammer size={14} aria-hidden />}
                  Start Dwarf
                </button>
                {!approved && <span className="text-xs text-slate-500">Dwarf starts after you approve the scenarios.</span>}
                {t.files?.runnerPage && (
                  <Link href={t.files.runnerPage} className={btnGhost}>
                    <ExternalLink size={14} aria-hidden /> Open runner page
                  </Link>
                )}
              </div>
              {t.files?.suiteDir && <p className="text-xs text-slate-500 break-all">Suite: {t.files.suiteDir}</p>}

              {(t.pendingDwarfChanges?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs text-amber-300 mb-1">Scenario changes Dwarf still has to apply</p>
                  <ol className="list-decimal ml-5 text-xs text-slate-300 space-y-0.5">
                    {t.pendingDwarfChanges!.map((c, i) => <li key={i}>{c}</li>)}
                  </ol>
                </div>
              )}

              <h3 className="pt-1 border-t border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
                Chat with Dwarf {popOut("dwarf")}
              </h3>
              {chatSlot("dwarf")}
            </div>
          </Panel>

          {/* Automation: track and run the TS here (ticket-automation-panel, 2026-10-28). */}
          <div id="automation" className="scroll-mt-4">
            <Panel title="Automation" icon={<Bot size={15} className="text-green-400" aria-hidden />}
              right={openFindings > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">{openFindings} finding{openFindings === 1 ? "" : "s"} open</span>}>
              <AutomationPanel ticketKey={t.key} runnerPage={t.files?.runnerPage} runKey={t.runKey} runs={runs} openFindings={openFindings} approved={approved} />
            </Panel>
          </div>

          {/* Runs + official sheet */}
          <Panel title="Runs and official TS status" icon={<FileSpreadsheet size={15} className="text-blue-400" aria-hidden />}>
            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-blue-600"
                  checked={!!t.statusSync}
                  disabled={busy === "sync"}
                  onChange={e => { const v = e.target.checked; void act("sync", () => api(`/api/pipeline/tickets/${encodeURIComponent(key)}`, { method: "PATCH", json: { statusSync: v } })); }}
                />
                <span>
                  <span className="text-slate-200">Write run results to the official TS sheet</span>
                  <span className="block text-xs text-slate-500">Only the status column: In Progress, Pass or Fail. A backup is taken before each write.</span>
                </span>
              </label>
              <p className="text-xs text-slate-400 break-all">
                Official TS: {t.files?.officialTs ?? <span className="text-slate-500">not found yet</span>}
              </p>
              {t.runKey && <p className="text-xs text-slate-500">Runner key: {t.runKey}</p>}

              <div>
                <p className="text-xs text-slate-500 mb-1">Saved runs</p>
                <RunList ticketKey={t.key} runs={runs} error={runsError} onChanged={() => { void load(); }} />
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Sheet updates</p>
                {syncError && <p className="text-xs text-amber-300">{syncError}</p>}
                {!syncError && (syncLog?.length ?? 0) === 0 && <p className="text-xs text-slate-500">No updates yet.</p>}
                {syncLog && syncLog.length > 0 && (
                  <ol className="max-h-56 overflow-y-auto space-y-1 text-xs">
                    {/* The route already sends the log newest first. */}
                    {syncLog.slice(0, 100).map((e, i) => {
                      const failed = e.ok === false || !!e.error;
                      return (
                        <li key={i} className="flex flex-wrap gap-x-2">
                          <span className="text-slate-500 w-28 shrink-0">{when(e.at)}</span>
                          <span className="text-slate-300">{Array.isArray(e.ts) ? e.ts.join(", ") : e.ts}</span>
                          {e.status && <span className={clsx(e.status === "Pass" ? "text-green-300" : e.status === "Fail" ? "text-red-300" : "text-blue-300")}>{e.status}</span>}
                          {failed && <span className="text-red-300">— {e.error ?? e.message ?? "not written"}</span>}
                          {!failed && e.message && <span className="text-slate-500">— {e.message}</span>}
                          {!failed && (e.missing?.length ?? 0) > 0 && <span className="text-amber-300">— not found in the sheet: {e.missing!.join(", ")}</span>}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          </Panel>

          {/* Findings */}
          <div id="findings" className="scroll-mt-4">
          <Panel
            title={`Findings${findings.length ? ` (${findings.length})` : ""}`}
            icon={<Bug size={15} className="text-red-400" aria-hidden />}
            right={openFindings > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">{openFindings} to check</span>}
          >
            {elfJob && t.stage === "testing" && <p className="text-xs text-slate-400 mb-3">Elf is looking at the failed run… {elfJob.activity}</p>}
            {sortedFindings.length === 0
              ? <p className="text-xs text-slate-500">No findings. When a run fails, Elf explains each failed TS here.</p>
              : (
                <div className="space-y-4">
                  {sortedFindings.map(f => (
                    <div key={f.id} className="space-y-1.5">
                      <FindingNotes f={f} />
                      <FindingCard
                        finding={f}
                        ticketKey={t.key}
                        issueUrl={t.issues?.find(i => i.findingId === f.id)?.url}
                        scoutJob={scoutJob}
                        onChanged={() => { void load(); }}
                      />
                    </div>
                  ))}
                </div>
              )}
          </Panel>
          </div>

          <Panel title="Events" icon={<History size={15} className="text-blue-400" aria-hidden />} defaultOpen={false}>
            {t.events?.length
              ? <ol className="space-y-1 text-xs">
                  {t.events.map((e, i) => (
                    <li key={i} className="flex gap-2"><span className="text-slate-500 shrink-0 w-28">{when(e.at)}</span><span className="text-slate-300">{e.text}</span></li>
                  ))}
                </ol>
              : <p className="text-xs text-slate-500">Nothing yet.</p>}
          </Panel>
        </div>
      </div>

      {/* Floating chat: part of this page only, so it hides on /pipeline and comes back with the ticket. */}
      <PipChat pip={pip} render={thread}
        waiting={Object.fromEntries((["scout", "scribe", "elf", "dwarf"] as const).map(c => [c, t.characters?.[c]?.state === "waiting"]))} />
    </div>
  );
}

