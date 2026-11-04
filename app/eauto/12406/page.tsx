"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ShieldCheck, Play, Square, Loader2, Copy, Check, ChevronDown, ChevronRight, FolderOpen, BookOpen, AlertTriangle } from "lucide-react";
import { DeploySoonHeader } from "@/lib/useDeployReminder";
import { TS_12406, SHEETS_12406, CLAUDE_12406, latest12406, type AzfarResult } from "@/lib/eauto12406";

// EAINT-12406 — [Secarang-Allianz] To Allow and Display Allianz in Secarang
// Including Logo and Wording. Release S35.5, 6 Nov 2026.
//
// Runs AZFAR'S automation, unchanged (Faizuddin, 2026-11-03): scripts/eauto-12406
// is a copy of github.com/modefair/eauto-qa-azfar (automation/ + cr/EAINT-12406/).
// The route calls his automation/scripts/cr-run.mjs; his per-TS gate judges each
// TS (VALID / DEFECT / SCRIPT / ENV / EVIDENCE …) and files the evidence in
// cr/EAINT-12406/05-evidence/. The run lives on the server, so leaving this page
// does not lose it — the page reads it back on open.
//
// Inputs are kept in this browser only (localStorage); they reach the run as a
// git-ignored env file. A blank field takes the details already on the dashboard
// (Faizuddin, 2026-11-03: "use the existing details from the dashboard"): the
// 12107 page's saved values first, else its defaults (DASHBOARD_DEFAULTS below).

const CREDS_KEY = "eauto_12406_creds_v1";
const UI_KEY = "eauto_12406_ui_v1";
/** The 12107 + 12327 Secarang page's own saved details (app/eauto/12107/page.tsx CREDS_KEY). */
const SECARANG_12107_KEY = "eauto_12107_creds";

/**
 * The same values as app/eauto/12107/page.tsx DEFAULT_CREDS (given by Faizuddin
 * 2026-10-19), in this page's field names. Fiuu bank RHB = the bank Azfar's
 * E2E_TS1 pays with.
 */
const DASHBOARD_DEFAULTS: Partial<Creds> = {
  sitePassword: "eAuTo<2025#",
  ciboUsername: "testadmin", ciboPassword: "eAuTo<2025#",
  testEmail: "faizuddin@modefair.com", testPhone: "0189812839",
  quoteIc: "030217141005",
  fiuuBank: "RHB", fiuuUsername: "Gaara", fiuuPassword: "Letmepaywithsand",
};

/** Details already on the dashboard: the 12107 page's saved values over its defaults. */
function dashboardDetails(): Partial<Creds> {
  const out: Partial<Creds> = { ...DASHBOARD_DEFAULTS };
  try {
    const raw = localStorage.getItem(SECARANG_12107_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Record<string, string>;
      const map: [keyof Creds, string][] = [
        ["sitePassword", "sitePassword"], ["ciboUsername", "ciboLoginId"], ["ciboPassword", "ciboPassword"],
        ["testEmail", "ownerEmail"], ["testPhone", "ownerPhone"], ["quoteIc", "icNumber"],
        ["fiuuBank", "bankName"], ["fiuuUsername", "bankUsername"], ["fiuuPassword", "bankPassword"],
      ];
      for (const [mine, theirs] of map) if (typeof c[theirs] === "string" && c[theirs].trim()) out[mine] = c[theirs].trim();
    }
  } catch { /* ignore */ }
  return out;
}

/**
 * Fills every blank field from the dashboard details. Also repairs values the
 * browser's password autofill put in the wrong box (2026-11-03: the site
 * password landed in "Your email"): an email without "@" or a phone with
 * letters is replaced.
 */
function withDashboardDetails(c: Creds): Creds {
  const d = dashboardDetails();
  const out = { ...c };
  if (out.testEmail && !out.testEmail.includes("@")) out.testEmail = "";
  if (out.testPhone && /[^\d\s+-]/.test(out.testPhone)) out.testPhone = "";
  if (out.quoteIc && /[^\d-]/.test(out.quoteIc)) out.quoteIc = "";
  for (const k of Object.keys(d) as (keyof Creds)[]) if (!out[k]?.trim()) out[k] = d[k] ?? "";
  return out;
}

interface Creds {
  sitePassword: string; ciboUsername: string; ciboPassword: string;
  fiuuBank: string; fiuuUsername: string; fiuuPassword: string;
  testEmail: string; testPhone: string; quoteIc: string; discountCode: string; ffmpegPath: string;
}
const EMPTY: Creds = {
  sitePassword: "", ciboUsername: "", ciboPassword: "", fiuuBank: "", fiuuUsername: "", fiuuPassword: "",
  testEmail: "", testPhone: "", quoteIc: "", discountCode: "", ffmpegPath: "",
};

interface Gate { ts: string; verdict: string; reasons: string[]; folder: string; run?: string; at?: string }
interface Status {
  running: boolean;
  run: { runId: string; ts: string[]; instance: string; started: string; finished?: string; exitCode?: number | null; stopped?: boolean; log: string } | null;
  gate: Gate[];
  latest: Record<string, Gate>;
  ready: { installed: boolean; envFile: boolean };
}

const AZFAR_CHIP: Record<AzfarResult, { label: string; cls: string }> = {
  pass: { label: "PASS", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800" },
  fail: { label: "FAIL", cls: "bg-red-950/60 text-red-300 border-red-800" },
  kiv: { label: "KIV", cls: "bg-violet-950/60 text-violet-300 border-violet-800" },
  blocked: { label: "BLOCKED", cls: "bg-orange-950/60 text-orange-300 border-orange-800" },
  rerun: { label: "RE-RUN", cls: "bg-amber-950/60 text-amber-300 border-amber-800" },
  none: { label: "Not run", cls: "bg-slate-800/60 text-slate-400 border-slate-700" },
  deprio: { label: "Deprio", cls: "bg-slate-900 text-slate-500 border-slate-800" },
};
const verdictCls = (v: string) =>
  v === "VALID" ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
  : v === "DEFECT" ? "bg-red-950/60 text-red-300 border-red-800"
  : v === "ENV" || v === "SCRIPT" ? "bg-amber-950/60 text-amber-300 border-amber-800"
  : "bg-slate-800/60 text-slate-300 border-slate-700";
const verdictLabel = (v: string) => (v === "VALID" ? "PASS" : v);

const label = "block text-[11px] font-medium text-slate-400 mb-1";
const field = "w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600";

const fileUrl = (rel: string) => `/api/eauto-12406/run?file=${encodeURIComponent(rel)}`;

function Evidence({ folder }: { folder: string }) {
  const [files, setFiles] = useState<string[] | null>(null);
  useEffect(() => {
    fetch(`/api/eauto-12406/run?folder=${encodeURIComponent(folder)}`).then(r => r.json()).then(j => setFiles(j.files ?? [])).catch(() => setFiles([]));
  }, [folder]);
  if (!files) return <p className="text-[11px] text-slate-500">Loading evidence…</p>;
  if (!files.length) return <p className="text-[11px] text-slate-500">No files in {folder}.</p>;
  const media = files.filter(f => /\.(png|jpe?g|webm|mp4)$/i.test(f));
  const other = files.filter(f => !media.includes(f));
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500 break-all">{folder}</p>
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {media.map(f => /\.(webm|mp4)$/i.test(f)
            ? <video key={f} src={fileUrl(f)} controls className="w-full rounded border border-slate-800 col-span-2" />
            : <a key={f} href={fileUrl(f)} target="_blank" rel="noreferrer" title={f}><img src={fileUrl(f)} alt={f} className="w-full rounded border border-slate-800" /></a>)}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {other.map(f => <a key={f} href={fileUrl(f)} target="_blank" rel="noreferrer" className="text-[11px] px-2 py-0.5 rounded border border-slate-700 text-slate-300 hover:border-slate-500">{f.split("/").pop()}</a>)}
      </div>
    </div>
  );
}

export default function Page() {
  const [creds, setCreds] = useState<Creds>(EMPTY);
  const [instance, setInstance] = useState<"ia" | "preprod">("ia");
  const [headed, setHeaded] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mine: Creds = { ...EMPTY };
    try { const raw = localStorage.getItem(CREDS_KEY); if (raw) mine = { ...EMPTY, ...JSON.parse(raw) }; } catch { /* ignore */ }
    const filled = withDashboardDetails(mine);
    setCreds(filled);
    try { localStorage.setItem(CREDS_KEY, JSON.stringify(filled)); } catch { /* full */ }
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (raw) { const u = JSON.parse(raw); setSelected(new Set(u.selected ?? [])); if (u.instance) setInstance(u.instance); if (typeof u.headed === "boolean") setHeaded(u.headed); }
    } catch { /* ignore */ }
  }, []);
  const saveCreds = (c: Creds) => { setCreds(c); try { localStorage.setItem(CREDS_KEY, JSON.stringify(c)); } catch { /* full */ } };
  useEffect(() => {
    try { localStorage.setItem(UI_KEY, JSON.stringify({ selected: [...selected], instance, headed })); } catch { /* full */ }
  }, [selected, instance, headed]);

  const refresh = useCallback(async () => {
    try { const r = await fetch("/api/eauto-12406/run", { cache: "no-store" }); setStatus(await r.json()); } catch { /* offline */ }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!status?.running) return;
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [status?.running, refresh]);

  const set = (k: keyof Creds, v: string) => saveCreds({ ...creds, [k]: v });
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const grouped = useMemo(() => Object.keys(SHEETS_12406).map(sheet => ({ sheet, rows: TS_12406.filter(t => t.sheet === sheet) })), []);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TS_12406) c[t.azfar] = (c[t.azfar] ?? 0) + 1;
    return c;
  }, []);
  const latestCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TS_12406) { const r = latest12406(t); c[r] = (c[r] ?? 0) + 1; }
    return c;
  }, []);

  async function run() {
    setError("");
    const ts = TS_12406.filter(t => t.automated && selected.has(t.id)).map(t => t.id);
    if (!ts.length) { setError("Tick at least one automated TS."); return; }
    const r = await fetch("/api/eauto-12406/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ts, instance, headed, inputs: creds }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setError(j.error ?? `Run refused (${r.status}).`); return; }
    refresh();
  }
  async function stop() { await fetch("/api/eauto-12406/run", { method: "DELETE" }); refresh(); }
  async function copyLog() {
    if (!status?.run?.log) return;
    try { await navigator.clipboard.writeText(status.run.log); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* denied */ }
  }

  const running = !!status?.running;
  const currentGate = new Map((status?.gate ?? []).map(g => [g.ts, g]));

  const pw = (k: keyof Creds, lbl: string, note?: string) => (
    <div>
      <label className={label}>{lbl}{note && <span className="text-slate-600 font-normal"> · {note}</span>}</label>
      <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds[k]} onChange={e => set(k, e.target.value)} className={field} />
    </div>
  );
  const txt = (k: keyof Creds, lbl: string, note?: string) => (
    <div>
      <label className={label}>{lbl}{note && <span className="text-slate-600 font-normal"> · {note}</span>}</label>
      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds[k]} onChange={e => set(k, e.target.value)} className={field} />
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <ShieldCheck size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">12406</h1>
        <DeploySoonHeader keys={["EAINT-12406"]} />
        <span className="text-xs text-slate-600 hidden md:block truncate">[Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording — release S35.5, 6 Nov</span>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-1.5">
          <p><span className="text-slate-200 font-medium">Handed over by Azfar, 2026-11-03.</span> This page runs his automation as is (scripts/eauto-12406, copy of github.com/modefair/eauto-qa-azfar). His gate decides each TS; evidence goes to cr/EAINT-12406/05-evidence.</p>
          <p>His result at hand-over (30.10): {(["pass", "fail", "kiv", "blocked", "rerun", "none", "deprio"] as AzfarResult[]).map(r => `${AZFAR_CHIP[r].label} ${counts[r] ?? 0}`).join(" · ")}.</p>
          <p><span className="text-slate-200 font-medium">Claude-driven run, 04.11 (real Allianz UAT API):</span> {Object.keys(CLAUDE_12406).length} TS run. Latest per TS: {(["pass", "fail", "kiv", "blocked", "rerun", "none", "deprio"] as AzfarResult[]).map(r => `${AZFAR_CHIP[r].label} ${latestCounts[r] ?? 0}`).join(" · ")}. <span className="text-emerald-300 font-medium">Overall {latestCounts.pass ?? 0}/{TS_12406.length} ({+(((latestCounts.pass ?? 0) / TS_12406.length) * 100).toFixed(2)}%) pass only.</span></p>
          <p>Raised 04.11: <a href="https://mfservices.atlassian.net/browse/EAINT-12764" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">EAINT-12764</a> D1 company number line (Low) · <a href="https://mfservices.atlassian.net/browse/EAINT-12765" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">EAINT-12765</a> D2 Premium after NCD (High) · <a href="https://mfservices.atlassian.net/browse/EAINT-12766" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">EAINT-12766</a> &quot;Invalid fullName&quot; (High). Waiting on Dev: Q44 Allianz cover note, Q46 sandbox over RM2,000. Results: _reference/tickets/EAINT-12406/claude-run-2026-11-04/RESULTS.md.</p>
          <p className="flex flex-wrap gap-3">
            <Link href="/jira/studies" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"><BookOpen size={12} /> Ticket study</Link>
            <a href="https://claude.ai/artifact/7xguCHVWNb2oXDKgpDyZWT" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">Azfar&apos;s TS board</a>
            <a href="https://mfservices.atlassian.net/browse/EAINT-12406" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">Jira</a>
          </p>
          <p className="flex items-start gap-1.5 text-amber-300/90"><AlertTriangle size={12} className="mt-0.5 shrink-0" />RC and RG TS read purchases made by earlier E2E runs (handoff.json). Azfar&apos;s runs are on his laptop only, so run the E2E TS here first. Without ffmpeg, the payment window is left out of the video and his gate marks the TS EVIDENCE.</p>
          {status && !status.ready.installed && <p className="text-red-300">Dependencies missing: run npm install in scripts/eauto-12406/automation.</p>}
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-300">Run configuration</div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={label}>Environment</label>
              <select value={instance} onChange={e => setInstance(e.target.value as "ia" | "preprod")} className={field}>
                <option value="ia">Secarang staging /ia/ (12406)</option>
                <option value="preprod">Secarang staging /preprod/ (owner&apos;s OK only)</option>
              </select>
            </div>
            {pw("sitePassword", "Secarang site password", "required")}
            {txt("ciboUsername", "CIBO username", "RC / RG / E2E")}
            {pw("ciboPassword", "CIBO password")}
            {txt("testEmail", "Your email", "receipts go here")}
            {txt("testPhone", "Your phone", "without leading 0")}
            {txt("quoteIc", "Owner IC", "simulator: any")}
            {txt("discountCode", "Discount code", "E2E_TS2")}
            {txt("fiuuBank", "Fiuu bank", "FPX simulator")}
            {txt("fiuuUsername", "Fiuu bank username")}
            {pw("fiuuPassword", "Fiuu bank password")}
            {txt("ffmpegPath", "ffmpeg path", "optional")}
          </div>
          <div className="px-4 pb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setHeaded(h => !h)}
              aria-pressed={!headed}
              className={clsx("text-xs px-2.5 py-1 rounded-lg border transition-colors",
                !headed ? "bg-indigo-950/60 border-indigo-700/70 text-indigo-200" : "border-slate-700 text-slate-400 hover:text-slate-200")}
            >
              Headless {headed ? "off" : "on"}
            </button>
            <button
              onClick={() => saveCreds(withDashboardDetails({ ...EMPTY, discountCode: creds.discountCode, ffmpegPath: creds.ffmpegPath }))}
              title="Put back the site password, CIBO and Fiuu logins, email, phone and IC saved on the dashboard"
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
            >
              Reset to dashboard details
            </button>
            <span className="text-[11px] text-slate-500">{selected.size} selected</span>
            {running ? (
              <button onClick={stop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium"><Square size={12} /> Stop</button>
            ) : (
              <button onClick={run} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"><Play size={12} /> Run selected</button>
            )}
            {running && <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300"><Loader2 size={12} className="animate-spin" /> {status?.run?.runId}</span>}
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
        </section>

        {grouped.map(({ sheet, rows }) => {
          const auto = rows.filter(r => r.automated).map(r => r.id);
          const allOn = auto.length > 0 && auto.every(id => selected.has(id));
          return (
            <section key={sheet} className="rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">{SHEETS_12406[sheet]}</span>
                <span className="text-[11px] text-slate-500">{rows.length} TS · {auto.length} automated</span>
                {auto.length > 0 && (
                  <button
                    onClick={() => setSelected(s => { const n = new Set(s); auto.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; })}
                    className="ml-auto text-[11px] px-2 py-0.5 rounded-md border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                  >
                    {allOn ? "Clear all" : "Select all"}
                  </button>
                )}
              </div>
              <ul className="divide-y divide-slate-800/70">
                {rows.map(t => {
                  const mine = currentGate.get(t.id) ?? status?.latest?.[t.id];
                  const isOpen = open === t.id;
                  return (
                    <li key={t.id} className="px-2 py-1">
                      <div
                        role={t.automated ? "button" : undefined}
                        tabIndex={t.automated ? 0 : undefined}
                        onClick={() => { if (t.automated) toggle(t.id); }}
                        onKeyDown={e => { if (t.automated && (e.key === " " || e.key === "Enter")) { e.preventDefault(); toggle(t.id); } }}
                        title={t.automated ? "Click the row to select or clear it" : "No automated test for this TS in Azfar's specs"}
                        aria-pressed={t.automated ? selected.has(t.id) : undefined}
                        className={clsx(
                          "flex items-start gap-3 rounded-lg px-2 py-1.5 border transition-colors",
                          !t.automated && "cursor-default border-transparent opacity-70",
                          t.automated && !selected.has(t.id) && "cursor-pointer border-transparent hover:bg-slate-800/50",
                          t.automated && selected.has(t.id) && "cursor-pointer bg-indigo-950/60 border-indigo-700/70 hover:bg-indigo-950/80",
                          "focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500",
                        )}
                      >
                        <span className={clsx("font-mono text-[11px] w-28 shrink-0", selected.has(t.id) ? "text-indigo-200" : "text-slate-300")}>{t.id.replace("12406_", "")}</span>
                        <span className="text-[11px] text-slate-500 w-6 shrink-0">{t.priority}</span>
                        <span className="text-xs text-slate-300 flex-1 min-w-0">{t.title}
                          {t.note && <span className="block text-[11px] text-slate-500 mt-0.5">{t.note}</span>}
                          {mine && mine.reasons?.length > 0 && <span className="block text-[11px] text-amber-300/80 mt-0.5">{mine.reasons.slice(0, 2).join(" · ")}</span>}
                        </span>
                        {!t.automated && <span className="text-[10px] text-slate-600 shrink-0">manual / on hold</span>}
                        <span title="Azfar's result at hand-over (30.10)" className={clsx("text-[10px] px-1.5 py-0.5 rounded border shrink-0", AZFAR_CHIP[t.azfar].cls)}>Azfar: {AZFAR_CHIP[t.azfar].label}</span>
                        {CLAUDE_12406[t.id] && <span title={`Claude-driven run 04.11, real API: ${CLAUDE_12406[t.id].note}`} className={clsx("text-[10px] px-1.5 py-0.5 rounded border shrink-0", AZFAR_CHIP[CLAUDE_12406[t.id].r].cls)}>Claude 04.11: {AZFAR_CHIP[CLAUDE_12406[t.id].r].label}</span>}
                        {mine && (
                          <button onClick={e => { e.stopPropagation(); setOpen(isOpen ? null : t.id); }} title={`Last run on this PC: ${mine.run ?? ""} ${mine.at ?? ""}`} className={clsx("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border shrink-0", verdictCls(mine.verdict))}>
                            <FolderOpen size={10} /> {verdictLabel(mine.verdict)}
                          </button>
                        )}
                      </div>
                      {isOpen && mine && <div className="mt-2 ml-2 mb-1"><Evidence folder={mine.folder} /></div>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {status?.run && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-3">
              <button onClick={() => setShowLog(v => !v)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300">{showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Run log</button>
              <span className="text-[11px] text-slate-500">{status.run.runId} · /{status.run.instance} · {status.run.ts.length} TS{status.run.finished ? ` · finished, exit ${status.run.exitCode}` : ""}{status.run.stopped ? " · stopped" : ""}</span>
              <button onClick={copyLog} className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200">{copied ? <Check size={12} /> : <Copy size={12} />} Copy</button>
            </div>
            {showLog && <pre className="p-4 text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap max-h-[480px] overflow-auto">{status.run.log}</pre>}
          </section>
        )}
      </div>
    </div>
  );
}
