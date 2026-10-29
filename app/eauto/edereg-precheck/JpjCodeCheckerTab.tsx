"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Loader2, ChevronDown, ChevronRight, Copy, Check, AlertTriangle, Download, ImageOff } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";

// ── JPJ Code Checker — EAINT-9306 ────────────────────────────────────
// Added 2026-09-04, per Faizuddin. NOT a test case: a data-gathering sweep
// that answers "which JPJ response codes produce which Note on the eDereg
// Pre-Checking Enquiry result popup?". Two note shapes are known from live
// captures — a BLACK "The system is currently unavailable…" and a RED
// "Unable to proceed for eDereg" — and the mapping across ~100 codes is the
// open question.
//
// Per code the sweep steers eSIM, types the NEXT running vehicle number at
// Deregistration Step 2, pays for the inline pre-check, scrapes the whole
// result dialog, and closes it. The Deregistration is never completed.
//
// Uses the SHARED background-run store (useApp/startRun), not a page-owned
// fetch like CustomRunTab does — a sweep of ~100 codes runs for hours, so it
// has to survive navigating away from this page. Its own RUN_KEY keeps it
// fully independent of the "9306 TS" tab's run.
//
// Server side reuses the existing /api/eauto-edereg-precheck/run route with
// `testCase: "jpj-codes"` (one more PROJECTS entry + two DPC_JPJ_* env vars),
// so live-log, Stop and run bookkeeping all work unchanged.

const fieldCls = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";
const FORM_KEY = "edereg_precheck_jpj_codes_form";
const RUN_KEY = "eauto/edereg-precheck-jpj-codes";
/** Rough wall-clock per code: one eSIM Playwright spawn + a full payment
 *  round trip. Used only for the estimate shown next to the Run button. */
const SECONDS_PER_CODE = 90;

interface JpjCodeRow {
  code: string;
  vehicleRegNo: string;
  outcome: "read" | "reshow" | "gate-open" | "no-dialog" | "error";
  jpjStatus: string;
  jpjPrecheckStatus: string;
  enquiryResponse: string;
  vehicleRecord: string;
  note: string;
  noteColor: string;
  attributes: Record<string, string>;
  hasAttributeRows: boolean;
  validAsAt: string;
  resultVehicleNo: string;
  gateSatisfied: boolean;
  rawTableText: string;
  screenshotFile: string;
  error?: string;
}
interface RunResponse {
  result?: { status?: string; stoppedReason?: string; codesRead?: number; codesTotal?: number; checkedThisRun?: number; resultsFile?: string; screenshotDir?: string };
  jpjCodeRows?: JpjCodeRow[];
  error?: string;
  stopped?: boolean;
  log?: string;
}

type FormState = {
  envSegment: string; vehicleStart: string; jpjReceiptEmail: string;
  username: string; password: string;
  mykadNric: string; mykadName: string;
  codesRaw: string; startFresh: boolean;
};
const DEFAULT_FORM: FormState = {
  envSegment: "uat1", vehicleStart: "HXZ0001", jpjReceiptEmail: "faizuddin@modefair.com",
  username: "faizuddinAATF", password: "password",
  mykadNric: "030217141005", mykadName: "MUHAMMAD FAIZUDDIN BIN BIDI",
  codesRaw: "", startFresh: false,
};

function loadForm(): FormState {
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (raw) return { ...DEFAULT_FORM, ...(JSON.parse(raw) as Partial<FormState>) };
  } catch { /* ignore */ }
  return DEFAULT_FORM;
}

/**
 * Parse whatever got pasted out of Excel. Deliberately lenient: one code per
 * line, and anything after the code on that line (a tab-separated description
 * column, or a " - MEANING" suffix in the same cell) is dropped. Lines with no
 * digit in the first token are treated as headers and skipped, so pasting a
 * selection that includes its "Response Code" header row just works.
 */
export function parseCodeList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const first = line.trim().split(/[\t,;]|\s+/).filter(Boolean)[0];
    if (!first) continue;
    const code = first.toUpperCase().replace(/[^A-Z0-9]+$/g, "");
    if (!code || !/\d/.test(code) || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

/** Preview the running vehicle numbers the sweep will use, so a bad start
 *  value (or one that would cross an eSIM prefix boundary) is visible before
 *  committing to a multi-hour run. */
function vehicleSeriesPreview(start: string, count: number): { first: string; last: string; prefixStable: boolean } | null {
  const m = start.trim().toUpperCase().match(/^(.*?)(\d+)$/);
  if (!m || count < 1) return null;
  const [, base, digits] = m;
  const at = (i: number) => `${base}${String(Number(digits) + i).padStart(digits.length, "0")}`;
  const first = at(0);
  const last = at(count - 1);
  return { first, last, prefixStable: first.slice(0, 2) === last.slice(0, 2) };
}

export default function JpjCodeCheckerTab() {
  const [form, setForm] = useState<FormState>(typeof window !== "undefined" ? loadForm() : DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [showLiveLog, setShowLiveLog] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copied2Col, setCopied2Col] = useState(false);
  const [liveLogCopied, setLiveLogCopied] = useState(false);
  const liveLogRef = useRef<HTMLPreElement | null>(null);

  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const res = bgRun?.result as RunResponse | undefined;
  const liveLog = bgRun?.liveLog ?? "";

  useEffect(() => {
    if (liveLogRef.current) liveLogRef.current.scrollTop = liveLogRef.current.scrollHeight;
  }, [liveLog]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));

  const codes = useMemo(() => parseCodeList(form.codesRaw), [form.codesRaw]);
  const series = useMemo(() => vehicleSeriesPreview(form.vehicleStart, codes.length), [form.vehicleStart, codes.length]);
  const estimateMins = Math.round((codes.length * SECONDS_PER_CODE) / 60);

  const rows = res?.jpjCodeRows ?? [];
  const readRows = rows.filter(r => r.outcome === "read");
  // The grouping IS the deliverable: which codes share a Note.
  const byNote = useMemo(() => {
    const m = new Map<string, { note: string; noteColor: string; codes: string[] }>();
    for (const r of readRows) {
      const key = r.note || "(no note shown)";
      const hit = m.get(key);
      if (hit) hit.codes.push(r.code);
      else m.set(key, { note: key, noteColor: r.noteColor, codes: [r.code] });
    }
    return [...m.values()].sort((a, b) => b.codes.length - a.codes.length);
  }, [readRows]);

  function copyToClipboard(text: string, onDone: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      onDone(true);
      setTimeout(() => onDone(false), 2000);
    }).catch(() => { /* ignore */ });
  }

  /** Tab-separated so it pastes straight back into Excel as columns. */
  function copyAsTsv() {
    const header = ["Code", "JPJ Status", "Enquiry Response", "Vehicle Record", "Note", "Note colour", "Attribute rows", "Vehicle No.", "Outcome", "Screenshot"];
    const body = rows.map(r => [
      r.code, r.jpjStatus, r.enquiryResponse, r.vehicleRecord,
      r.note, r.noteColor, r.hasAttributeRows ? "Yes" : "No",
      r.vehicleRegNo, r.outcome === "read" ? "read" : `${r.outcome}: ${r.error ?? ""}`,
      r.screenshotFile,
    ].map(c => (c ?? "").toString().replace(/[\t\r\n]+/g, " ")).join("\t"));
    copyToClipboard([header.join("\t"), ...body].join("\n"), setCopied);
  }

  /**
   * Just the two columns that matter for sharing: error code + note, sorted
   * by code. Added 2026-09-04 per Faizuddin — the full "Copy for Excel"
   * export above carries nine columns, which is more than a Teams message or
   * a quick lookup table needs. Only `read` rows appear: a reshow/error row
   * has no note to report, so including it would put a blank second column
   * in front of whoever it gets pasted to.
   */
  function copyTwoColumns() {
    const sorted = [...readRows].sort((a, b) => a.code.localeCompare(b.code));
    const lines = [
      "Error Code\tNote",
      ...sorted.map(r => `${r.code}\t${(r.note ?? "").replace(/[\t\r\n]+/g, " ")}`),
    ];
    copyToClipboard(lines.join("\n"), setCopied2Col);
  }

  const shotCount = rows.filter(r => r.screenshotFile).length;

  function run() {
    if (!codes.length) { setFormError("Paste the JPJ code list first — nothing was recognised as a code."); return; }
    if (!form.vehicleStart.trim()) { setFormError("A starting vehicle number is required."); return; }
    if (!series) { setFormError(`Vehicle number "${form.vehicleStart}" must end in digits so it can be incremented (e.g. HXZ0001).`); return; }
    if (!series.prefixStable) {
      setFormError(`This series would cross an eSIM prefix boundary (${series.first} → ${series.last}). eSIM keys its record by the first two characters, so pick a start value that keeps them fixed for all ${codes.length} codes.`);
      return;
    }
    if (!form.jpjReceiptEmail.trim()) { setFormError("JPJ receipt email is required."); return; }
    setFormError("");
    localStorage.setItem(FORM_KEY, JSON.stringify(form));
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-edereg-precheck/run",
      liveLogUrl: "/api/eauto-edereg-precheck/live-log",
      meta: { label: `JPJ Code Checker — ${codes.length} codes`, testCase: "jpj-codes", vehicleRegNo: series.first },
      body: {
        testCase: "jpj-codes",
        envSegment: form.envSegment,
        // The route requires a vehicleRegNo; for this sweep it is the START
        // of the running series, which the spec increments per code.
        vehicleRegNo: series.first,
        jpjReceiptEmail: form.jpjReceiptEmail,
        username: form.username,
        password: form.password,
        mykadNric: form.mykadNric,
        mykadName: form.mykadName,
        jpjCodes: JSON.stringify(codes),
        jpjFresh: form.startFresh ? "1" : "",
      },
    });
  }
  function stop() { stopRun(RUN_KEY); }

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          Sweeps a list of JPJ response codes and records the <span className="text-slate-200 font-medium">Note</span> each one
          shows on the eDereg Pre-Checking Enquiry result popup. Per code it steers eSIM, types the next
          running vehicle number at Deregistration Step 2, pays for the inline pre-check, reads the popup, and closes it.
          The Deregistration is never completed.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          A <span className="text-slate-300">fresh vehicle number per code is mandatory</span> — once a vehicle has a Failed
          pre-check on file the app only reshows that stale result and no new JPJ enquiry runs, so a reused number would
          report the first code&apos;s note for every code after it. Rows and screenshots are saved after every code, so
          Stop is safe: press Run again to carry on where it left off.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          <span className="text-slate-300">This never fails.</span> There is no expected result — an unfamiliar note, a
          brand-new note, a blank one, or a code that behaves unlike all the others is the answer, not an error. Every
          code is recorded and the sweep carries on. If the session breaks mid-run it rebuilds the Deregistration draft
          and keeps going; only the VPN dropping out ends it early, and even then every row already captured is kept.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Run setup</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Environment</label>
              <input value={form.envSegment} onChange={e => set("envSegment", e.target.value)} placeholder="uat1" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Starting vehicle number <span className="text-red-400">*</span></label>
              <input value={form.vehicleStart} onChange={e => set("vehicleStart", e.target.value.toUpperCase())} placeholder="HXZ0001" className={fieldCls} />
              {series && (
                <p className={clsx("mt-1.5 text-[11px]", series.prefixStable ? "text-slate-500" : "text-amber-400")}>
                  {codes.length ? <>{series.first} → {series.last} ({codes.length} numbers, eSIM prefix &quot;{series.first.slice(0, 2)}&quot;)</> : "Paste codes to preview the series"}
                  {!series.prefixStable && " — crosses an eSIM prefix boundary"}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>JPJ receipt email <span className="text-red-400">*</span></label>
              <input value={form.jpjReceiptEmail} onChange={e => set("jpjReceiptEmail", e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400">AATF login</p>
            <div className="space-y-2 pl-3 border-l border-slate-800">
              <div>
                <label className={labelCls}>Username</label>
                <input value={form.username} onChange={e => set("username", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} className={fieldCls} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400">MyKad identity</p>
            <div className="space-y-2 pl-3 border-l border-slate-800">
              <div>
                <label className={labelCls}>NRIC</label>
                <input value={form.mykadNric} onChange={e => set("mykadNric", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Name</label>
                <input value={form.mykadName} onChange={e => set("mykadName", e.target.value)} className={fieldCls} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">JPJ response codes</p>
          <p className="text-[11px] text-slate-500">
            {codes.length ? `${codes.length} code${codes.length === 1 ? "" : "s"} recognised · ~${estimateMins} min` : "none yet"}
          </p>
        </div>
        <textarea
          value={form.codesRaw}
          onChange={e => set("codesRaw", e.target.value)}
          rows={10}
          spellCheck={false}
          placeholder={"Paste straight from Excel — one code per line.\n\nVEL000100E\nVEL000045E\nGLB000000I\n\nExtra columns (a description beside the code) are ignored,\nas is a header row."}
          className={clsx(fieldCls, "font-mono text-xs leading-relaxed resize-y")}
        />
        {!!codes.length && (
          <p className="text-[11px] text-slate-500 font-mono break-all">
            {codes.slice(0, 12).join("  ")}{codes.length > 12 ? `  … +${codes.length - 12} more` : ""}
          </p>
        )}
        <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.startFresh} onChange={e => set("startFresh", e.target.checked)} className="accent-indigo-500" />
          <span className="text-xs text-slate-300">
            Start fresh — discard rows from the previous sweep instead of resuming past codes already captured
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        {!!codes.length && !running && (
          <p className="text-[11px] text-slate-500">
            ~{estimateMins} min for {codes.length} codes · results saved after each one
          </p>
        )}
        {running ? (
          <button onClick={stop} className="flex items-center gap-2 px-5 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <Square size={16} />Stop
          </button>
        ) : (
          <button onClick={run} className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Play size={16} />Run sweep
          </button>
        )}
      </div>

      {formError && <p className="text-sm text-red-400">{formError}</p>}
      {bgRun?.error && <p className="text-sm text-red-400">{bgRun.error}</p>}
      {running && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={15} className="animate-spin" />
          Sweeping {codes.length} codes against {form.envSegment}… safe to navigate away.
        </div>
      )}
      {res?.stopped && <p className="text-sm text-amber-400">Sweep stopped — rows and screenshots captured so far are kept below and on disk.</p>}
      {res?.result?.stoppedReason && (
        <p className="flex items-start gap-2 text-sm text-amber-400">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{res.result.stoppedReason}</span>
        </p>
      )}
      {res?.result?.status === "COMPLETE" && (
        <p className="text-sm text-emerald-400">
          Sweep complete — {res.result.codesRead ?? readRows.length} code{(res.result.codesRead ?? readRows.length) === 1 ? "" : "s"} read.
        </p>
      )}

      {running && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-800/60">
            <button type="button" onClick={() => setShowLiveLog(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Loader2 size={13} className="animate-spin text-indigo-400" />Live log
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => copyToClipboard(liveLog, setLiveLogCopied)} disabled={!liveLog}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40">
                {liveLogCopied ? <Check size={13} /> : <Copy size={13} />}{liveLogCopied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={() => setShowLiveLog(v => !v)}>
                {showLiveLog ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
              </button>
            </div>
          </div>
          {showLiveLog && (
            <pre ref={liveLogRef} className="px-4 py-3 text-xs text-slate-400 whitespace-pre-wrap max-h-80 overflow-y-auto font-mono border-t border-slate-800">
              {liveLog || "Waiting for output…"}
            </pre>
          )}
        </div>
      )}

      {!!byNote.length && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Codes grouped by note</p>
          {byNote.map(g => (
            <div key={g.note} className="rounded-lg border border-slate-800 p-3">
              <p className="flex items-start gap-2 text-sm">
                <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  g.noteColor === "red" ? "bg-red-500" : g.noteColor === "black" ? "bg-slate-300" : "bg-slate-600")} />
                <span className="text-slate-200">{g.note}</span>
              </p>
              <p className="mt-1.5 pl-4 text-[11px] text-slate-500">
                {g.codes.length} code{g.codes.length === 1 ? "" : "s"}
                {g.noteColor && <> · rendered {g.noteColor}</>}
              </p>
              <p className="mt-1 pl-4 text-[11px] font-mono text-slate-400 break-all">{g.codes.join("  ")}</p>
            </div>
          ))}
        </div>
      )}

      {!!rows.length && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-800/60">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Results — {readRows.length}/{rows.length} read
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={copyTwoColumns} disabled={!readRows.length}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:hover:text-indigo-400">
                {copied2Col ? <Check size={13} /> : <Copy size={13} />}{copied2Col ? "Copied" : "Copy 2 columns"}
              </button>
              <button type="button" onClick={copyAsTsv}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy all columns"}
              </button>
              {/* Plain link, not a fetch — lets the browser stream the zip
                  straight to disk rather than buffering it in memory. */}
              <a href="/api/eauto-edereg-precheck/jpj-codes/download"
                className={clsx("flex items-center gap-1 text-xs", shotCount ? "text-indigo-400 hover:text-indigo-300" : "text-slate-600 pointer-events-none")}>
                <Download size={13} />Download proof ({shotCount})
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Enquiry Response</th>
                  <th className="px-3 py-2 font-medium">Vehicle Record</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 font-medium">Attr rows</th>
                  <th className="px-3 py-2 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.code} className="border-b border-slate-800/60 align-top">
                    <td className="px-3 py-2 font-mono text-slate-300 whitespace-nowrap">{r.code}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={clsx(r.jpjStatus === "OK" ? "text-emerald-400" : r.jpjStatus ? "text-red-400" : "text-slate-600")}>
                        {r.jpjStatus || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{r.enquiryResponse || "—"}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.vehicleRecord || "—"}</td>
                    <td className="px-3 py-2">
                      {r.outcome === "read" ? (
                        <span className="flex items-start gap-1.5">
                          <span className={clsx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            r.noteColor === "red" ? "bg-red-500" : r.noteColor === "black" ? "bg-slate-300" : "bg-slate-600")} />
                          <span className="text-slate-300">{r.note || "(none)"}</span>
                        </span>
                      ) : (
                        <span className="flex items-start gap-1.5 text-amber-400">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                          <span>{r.outcome}{r.error ? ` — ${r.error}` : ""}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{r.outcome === "read" ? (r.hasAttributeRows ? "Yes" : "No") : "—"}</td>
                    <td className="px-3 py-2">
                      {r.screenshotFile ? (
                        <a href={`/api/eauto-edereg-precheck/jpj-codes/download?file=${encodeURIComponent(r.screenshotFile)}`}
                          target="_blank" rel="noreferrer" title="Open full size">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/eauto-edereg-precheck/jpj-codes/download?file=${encodeURIComponent(r.screenshotFile)}`}
                            alt={`${r.code} result popup`}
                            className="h-12 w-28 object-cover object-top rounded border border-slate-700 hover:border-indigo-500 transition-colors"
                          />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-600"><ImageOff size={12} />none</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
