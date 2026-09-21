"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, AlertTriangle, SearchCheck, Download,
  ChevronDown, ChevronRight, ShieldAlert, Wifi, Eraser,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";

/** Registry key for this page's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. Keeps the run (and its result) alive across
 *  navigating to another dashboard page and back. */
const RUN_KEY = "eauto/esim";

// eAuto Simulator (eSIM) — steer simulator responses by vehicle prefix.
//
// The URL is FIXED: eSIM is one internal instance, not a per-env deployment, so
// there is no environment picker here by design.
//
// Empty field = no change. Only what you type is written, which is what makes
// this safe to point at a shared simulator other testers also rely on.

const ESIM_URL = "https://172.30.202.114:9089/esim/login";

interface Field {
  /** MUST match the form's <label> text exactly — the spec resolves the input
   *  through `label[for]`, so a typo here fails loudly rather than silently. */
  label: string;
  type?: "text" | "number" | "datetime-local" | "textarea";
  placeholder?: string;
  /** Fields the simulator marks required. They already hold a value, so leaving
   *  them blank here is still "no change". */
  required?: boolean;
  /** Full row — only Remark earns it. */
  wide?: boolean;
  /** Two columns. Used where preset chips would otherwise wrap and leave the
   *  neighbouring cells short. */
  span2?: boolean;
  /** One-click values. The input stays free text — these are a shortcut for the
   *  codes we set most often, never a closed list. */
  presets?: { value: string; hint?: string }[];
}

interface Entity {
  key: string;
  label: string;
  /** Field list; `[unverified]` where the edit form HTML hasn't been captured. */
  fields: Field[];
  note?: string;
}

/** The response codes we steer most often. Hints from knowledge/esim.md. */
const RESPONSE_CODE_PRESETS = [
  { value: "GLB000000I", hint: "success / OK" },
  { value: "VEL000401E" },
  { value: "VEL000069E", hint: "no valid insurance — redirects eSTM into the insurance flow" },
  { value: "VEL000392E" },
];

// From the live edit form for /esim/estm-enquiry-resp/<id>/edit.
const ESTM_ENQUIRY_FIELDS: Field[] = [
  // Filling this RENAMES the record's prefix — it is not the search box. The
  // placeholder has to say so, or it reads like a duplicate of the sidebar field.
  { label: "Vn Start With", required: true, placeholder: "only to RENAME the prefix" },
  { label: "Loan" },
  { label: "Claim" },
  { label: "JSJ Status", required: true, placeholder: "0" },
  { label: "Sekat Status", required: true, placeholder: "0" },
  { label: "JPJ Enq Status", required: true, placeholder: "0" },
  { label: "Condition Code 1" },
  { label: "Condition Code 2" },
  { label: "Condition Code 3" },
  { label: "Response Code", required: true, placeholder: "or type any code", presets: RESPONSE_CODE_PRESETS, span2: true },
  { label: "Usage Code", required: true, placeholder: "AB" },
  { label: "Body Type", required: true, placeholder: "MKR" },
  { label: "JPJ Revenue Code", placeholder: "2361007" },
  { label: "Payment Amount", type: "number", required: true },
  { label: "FIS Revenue Code", placeholder: "2354071" },
  { label: "FIS Amount", type: "number", required: true },
  { label: "LKM Revenue Code" },
  { label: "LKM Amount", type: "number" },
  { label: "LKM Effective Date", type: "datetime-local" },
  { label: "LKM Expiry Date", type: "datetime-local" },
  { label: "Declaration Area", placeholder: "SEMENANJUNG" },
  { label: "Delay Milliseconds", type: "number", required: true, placeholder: "0" },
  { label: "EVOC Email" },
  { label: "New Owner Name" },
  { label: "Remark", type: "textarea", wide: true },
];

// Taken from the eSTM Submission LIST column headers — its edit form has not
// been captured, so these labels are inferred. On eSTM Enquiry the list headers
// matched the form labels exactly, which is why this is a fair inference, but
// the run fails with the form's real field list if any label is wrong.
const ESTM_SUBMISSION_FIELDS: Field[] = [
  { label: "Vn Start With", required: true, placeholder: "only to RENAME the prefix" },
  { label: "Response Code", required: true, placeholder: "or type any code", presets: RESPONSE_CODE_PRESETS, span2: true },
  { label: "Refund Amount", type: "number" },
  { label: "LKM Security Number", placeholder: "LSN000069" },
  { label: "Delay Milliseconds", type: "number", placeholder: "0" },
  { label: "Receipt Delay Milliseconds", type: "number" },
  { label: "Remark", type: "textarea", wide: true },
];

// From the live edit form for /esim/dereg-enquiry-resp/<id>/edit (EAINT-9306).
const DEREG_ENQUIRY_FIELDS: Field[] = [
  { label: "Vn Start With", required: true, placeholder: "only to RENAME the prefix" },
  { label: "Response Code", required: true, placeholder: "or type any code", presets: RESPONSE_CODE_PRESETS, span2: true },
  { label: "Delay Milliseconds", type: "number", required: true, placeholder: "0" },
  { label: "Remark", type: "textarea", wide: true },
];

// Taken from the Dereg Submission LIST column headers — its edit form has not
// been captured, same caveat as eSTM Submission below.
const DEREG_SUBMISSION_FIELDS: Field[] = [
  { label: "Vn Start With", required: true, placeholder: "only to RENAME the prefix" },
  { label: "Response Code", required: true, placeholder: "or type any code", presets: RESPONSE_CODE_PRESETS, span2: true },
  { label: "Delay Milliseconds", type: "number", required: true, placeholder: "0" },
  { label: "Remark", type: "textarea", wide: true },
];

/** Every Y/N/NA select shares this shortcut set. The input stays free text —
 *  the underlying form field is a real <select>, and EsimPages.applyChanges
 *  detects that and calls selectOption() instead of fill() for it. */
const YNA_PRESETS = [{ value: "Y" }, { value: "N" }, { value: "NA" }];

// From the live edit form for /esim/dereg-precheck-enquiry-resp/<id>/edit
// (EAINT-9306) — the entity that actually steers eDereg Pre-Checking's JPJ
// result, confirmed 2026-08-21. Its field set is the richest of any Dereg
// entity because it has to populate the full pre-checking result screen, not
// just a pass/fail code.
const DEREG_PRECHECK_ENQUIRY_FIELDS: Field[] = [
  { label: "Vn Start With", required: true, placeholder: "only to RENAME the prefix" },
  { label: "Response Code", required: true, placeholder: "or type any code (e.g. VEL000100E)", span2: true },
  { label: "Vehicle Record", required: true, presets: YNA_PRESETS },
  { label: "Vehicle Status", required: true, presets: YNA_PRESETS },
  { label: "Verified Status", required: true, presets: YNA_PRESETS },
  { label: "Usage Code", required: true, presets: YNA_PRESETS },
  { label: "JPJ Blacklist", required: true, presets: YNA_PRESETS },
  { label: "JSJ Blacklist", required: true, presets: YNA_PRESETS },
  { label: "Agency Blacklist", required: true, presets: YNA_PRESETS },
  { label: "Claim Ownership", required: true, presets: YNA_PRESETS },
  { label: "Vehicle In Investigation", required: true, presets: YNA_PRESETS },
  { label: "Vehicle Condition", required: true, presets: YNA_PRESETS },
  { label: "Delay Milliseconds", type: "number", required: true, placeholder: "0" },
  { label: "Receipt Delay Milliseconds", type: "number" },
  { label: "Remark", wide: true },
];

// From the live edit form for /esim/rhb-transfer-resp/<id>/edit (EAINT-9306).
const RHB_TRANSFER_FIELDS: Field[] = [
  { label: "Vn Start With", required: true, placeholder: "only to RENAME the prefix" },
  { label: "Response Code", required: true, placeholder: "OK / IF (insufficient funds) / RE (timeout retry)", span2: true },
  { label: "Description", required: true },
  { label: "Delay Milliseconds", type: "number", required: true, placeholder: "0" },
  { label: "Remark", type: "textarea", wide: true },
];

const ENTITIES: Entity[] = [
  { key: "estm-enquiry", label: "eSTM Enquiry", fields: ESTM_ENQUIRY_FIELDS },
  {
    key: "estm-submission", label: "eSTM Submission", fields: ESTM_SUBMISSION_FIELDS,
    note: "Field labels here are taken from the list columns — this form's HTML hasn't been captured yet. If a label is wrong the run stops and prints the form's real fields.",
  },
  { key: "dereg-enquiry", label: "Dereg Enquiry", fields: DEREG_ENQUIRY_FIELDS },
  {
    key: "dereg-submission", label: "Dereg Submission", fields: DEREG_SUBMISSION_FIELDS,
    note: "Field labels here are taken from the list columns — this form's HTML hasn't been captured yet. Governs JPJ Deregistration Final Submission (step 6), not Pre-Checking.",
  },
  {
    key: "dereg-precheck-enquiry", label: "Dereg Precheck", fields: DEREG_PRECHECK_ENQUIRY_FIELDS,
    note: "This is the entity that steers eDereg Pre-Checking's own JPJ enquiry result (EAINT-9306). Most fields are Y/N/NA selects — use the preset chips rather than typing free text.",
  },
  { key: "rhb-transfer", label: "RHB Transfer", fields: RHB_TRANSFER_FIELDS },
];

type Mode = "read" | "write";

interface AppliedChange { label: string; from: string; to: string; onPage?: boolean }
interface RunResponse {
  result?: {
    status?: string; mode?: Mode; entity?: string; prefix?: string;
    applied?: AppliedChange[];
    fields?: { label: string; value: string }[];
  };
  steps?: string[];
  error?: string;
  hint?: string;
  stopped?: boolean;
  log?: string;
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function EsimPage() {
  const [entityKey, setEntityKey] = useState(ENTITIES[0].key);
  const [prefix, setPrefix] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [headless, setHeadless] = useState(false);
  /** Which action the VPN prompt is gating, or null when it's closed. */
  const [vpnAsk, setVpnAsk] = useState<Mode | null>(null);

  // The run lives in AppShell (hooks/useBackgroundRuns.ts) so it survives
  // navigating away and back — eSIM has no live-log route, so this is just the
  // running flag, the result and the error, not a streaming log.
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = bgRun?.running ? (bgRun.meta?.mode as Mode) : null;
  const orphaned = !!bgRun?.orphaned;
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || "";
  const res = (bgRun?.result as RunResponse | null) ?? null;
  const [showLog, setShowLog] = useState(false);

  const entity = ENTITIES.find(e => e.key === entityKey)!;
  const filled = Object.entries(values).filter(([, v]) => v.trim() !== "");

  function setValue(k: string, v: string) {
    setValues(p => ({ ...p, [k]: v }));
  }

  /** Never runs anything — only opens the VPN check for the chosen action. */
  function askVpn(m: Mode) {
    if (!prefix.trim()) { setFormError("Enter the vehicle prefix first."); return; }
    // Only a write needs field values; a read just reports what's there.
    if (m === "write" && !filled.length) {
      setFormError("Fill at least one field — blank fields are left unchanged.");
      return;
    }
    setFormError("");
    setVpnAsk(m);
  }

  function run(m: Mode) {
    setVpnAsk(null);
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-esim/run",
      stopUrl: "/api/eauto-esim/run",
      meta: { mode: m, entity: entity.label, prefix },
      body: {
        entity: entityKey,
        mode: m,
        prefix: prefix.trim(),
        changes: m === "write" ? Object.fromEntries(filled) : {},
        headless,
      },
    });
  }

  function stop() { stopRun(RUN_KEY); }

  const applied = res?.result?.applied ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <SearchCheck size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">eSIM</h1>
        <span className="text-xs text-slate-600 hidden md:block">
          eAuto Simulator · edit response records by vehicle prefix · VPN required
        </span>
      </header>

      {/* 340px matches the other runner pages. Don't invent a new arbitrary
          width here — Tailwind only emits the arbitrary values it already sees
          in the source, and a one-off like [320px_1fr] silently collapses the
          grid to a single column. */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-slate-800 p-4 space-y-3">
          <div>
            <label className={label}>Simulator table</label>
            <select value={entityKey} onChange={e => { setEntityKey(e.target.value); setValues({}); }} className={field}>
              {ENTITIES.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>Vehicle prefix to find <span className="text-red-400">*</span></label>
            <input value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. HX" className={field} />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Matched exactly against <span className="font-mono">Vn Start With</span>. The run stops rather
              than guessing if the prefix is missing or duplicated.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[11px] leading-snug text-slate-400">
              <strong className="text-slate-300">Empty = no change.</strong> Only the fields you
              type into are written; everything else keeps its current value.
            </p>
            {filled.length > 0 && (
              <p className="mt-1.5 text-[11px] text-indigo-400">
                {filled.length} field{filled.length === 1 ? "" : "s"} will change
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)}
              className="accent-indigo-600" />
            Headless
          </label>

          <div className="flex gap-2 pt-1">
            {!running ? (
              <>
                {/* Fetch reads and reports; it never writes, so it needs no
                    field values — only the prefix. */}
                <button onClick={() => askVpn("read")}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-slate-600 transition-colors">
                  <Download size={14} />Fetch
                </button>
                <button onClick={() => askVpn("write")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Play size={14} />Run
                </button>
              </>
            ) : (
              <button onClick={stop} disabled={bgRun?.stopping}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
              </button>
            )}
            {filled.length > 0 && !running && (
              <button onClick={() => setValues({})} title="Clear all fields"
                className="px-3 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-slate-200 hover:border-slate-600">
                <Eraser size={14} />
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </aside>

        {/* Every value here is a short code — "AB", "MKR", "0", "2361007" — so
            the column is capped and centred rather than stretched edge to edge.
            Full-width inputs for 3-character values just look broken. */}
        <main className="p-4 sm:p-6 flex justify-center">
          <div className="w-full max-w-4xl space-y-5">
          {entity.note && (
            <p className="flex items-start gap-2 text-[11px] leading-snug text-amber-400/90 bg-amber-950/20 border border-amber-900/40 rounded-lg p-3">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />{entity.note}
            </p>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
              {entity.label} fields
            </p>
            {/* Three columns once there's room — 25 short fields stacked two-wide
                is a needlessly long page. Remark is the only one that earns a
                full row. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              {entity.fields.map(f => (
                <div key={f.label} className={clsx(f.wide && "sm:col-span-2 lg:col-span-3", f.span2 && "lg:col-span-2")}>
                  <label className={label}>
                    {f.label}
                    {f.required && <span className="ml-1 text-[10px] text-slate-600">(required on the form)</span>}
                  </label>
                  {/* Shortcuts, not a closed list — the input below stays free
                      text so any code can still be typed. Clicking the active
                      chip again clears the field back to "no change". */}
                  {f.presets && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {f.presets.map(p => {
                        const active = (values[f.label] ?? "") === p.value;
                        return (
                          <button key={p.value} type="button" title={p.hint}
                            onClick={() => setValue(f.label, active ? "" : p.value)}
                            className={clsx(
                              "px-2 py-1 rounded-md text-[11px] font-mono border transition-colors",
                              active
                                ? "bg-indigo-600/25 border-indigo-500 text-indigo-200"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600",
                            )}>
                            {p.value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {f.type === "textarea" ? (
                    <textarea value={values[f.label] ?? ""} onChange={e => setValue(f.label, e.target.value)}
                      rows={3} placeholder={f.placeholder ?? "leave blank for no change"} className={field} />
                  ) : (
                    <input type={f.type ?? "text"} value={values[f.label] ?? ""}
                      onChange={e => setValue(f.label, e.target.value)}
                      placeholder={f.placeholder ?? "leave blank for no change"} className={field} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {running && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" />
              {running === "read" ? "Reading" : "Editing"} {String(bgRun?.meta?.entity ?? entity.label)} for {String(bgRun?.meta?.prefix ?? prefix)}…
            </div>
          )}
          {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

          {/* Survived the page but not a full browser reload. */}
          {orphaned && !res && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="flex-1 text-xs text-amber-200 leading-relaxed">
                A run was still going when this browser reloaded, so the dashboard lost track of it.
                It may well have finished — check the terminal.
              </p>
            </div>
          )}

          {res?.hint && (
            <div className="rounded-xl border border-amber-800/50 bg-amber-950/25 p-4">
              <p className="flex items-start gap-2 text-sm text-amber-300">
                <Wifi size={15} className="shrink-0 mt-0.5" />{res.hint}
              </p>
            </div>
          )}

          {/* Fetch result — the record as it stands right now, so eSIM doesn't
              have to be opened just to check a value. */}
          {res?.result?.mode === "read" && res.result.fields && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Download size={15} className="text-indigo-400" />
                {res.result.entity} · prefix {res.result.prefix}
                <span className="ml-auto text-[11px] font-normal text-slate-500">read only — nothing changed</span>
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {res.result.fields.map(f => (
                  <div key={f.label} className="flex items-baseline gap-2 text-xs border-t border-slate-800/70 py-1.5">
                    <span className="text-slate-500 shrink-0">{f.label}</span>
                    <span className={clsx(
                      "ml-auto font-mono text-right break-all",
                      f.value ? "text-slate-200" : "text-slate-600",
                    )}>
                      {f.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res?.result?.mode !== "read" && res?.result?.status === "SUCCESS" && (
            <div className="rounded-xl border border-green-800/50 bg-green-950/25 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-300">
                <CheckCircle2 size={15} />Updated {res.result.entity} · prefix {res.result.prefix}
              </p>
              {applied.length > 0 && (
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-left">
                      <th className="pb-1 font-medium">Field</th>
                      <th className="pb-1 font-medium">Was</th>
                      <th className="pb-1 font-medium">Now</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {applied.map(a => (
                      <tr key={a.label} className="border-t border-green-900/30">
                        <td className="py-1 pr-3">{a.label}</td>
                        <td className="py-1 pr-3 text-slate-500 font-mono">{a.from}</td>
                        <td className="py-1 font-mono text-green-300">
                          {a.to}
                          {/* The saved record is read back; flag anything that
                              didn't show up so a silent reformat is visible. */}
                          {a.onPage === false && (
                            <span className="ml-2 text-[10px] text-amber-400 font-sans">not shown on record — check manually</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {(res?.steps?.length ?? 0) > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Steps</p>
              <div className="space-y-1">
                {res!.steps!.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={13} className="text-green-400 shrink-0 mt-1" />{s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {res?.log && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl">
              <button onClick={() => setShowLog(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200">
                {showLog ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Raw run log
              </button>
              {showLog && <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">{res.log}</pre>}
            </div>
          )}
          </div>
        </main>
      </div>

      {/* VPN gate. Opening this runs nothing — only "Confirmed" starts the run. */}
      {vpnAsk && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setVpnAsk(null)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldAlert size={16} />Is your VPN connected?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              eSIM lives at <span className="font-mono text-slate-300">172.30.202.114</span>, which is only
              reachable on the VPN. Without it the run just times out.
            </p>
            {/* Say plainly which of the two this is — a read changes nothing
                and shouldn't read like it's about to write. */}
            <div className="mt-3 rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs text-slate-400">
              {vpnAsk === "read" ? (
                <>
                  About to <strong className="text-slate-200">read</strong>{" "}
                  <strong className="text-slate-200">{entity.label}</strong> for prefix{" "}
                  <strong className="font-mono text-slate-200">{prefix}</strong>. Nothing will be changed.
                </>
              ) : (
                <>
                  About to change <strong className="text-slate-200">{filled.length}</strong> field
                  {filled.length === 1 ? "" : "s"} on <strong className="text-slate-200">{entity.label}</strong> for
                  prefix <strong className="font-mono text-slate-200">{prefix}</strong>.
                </>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setVpnAsk(null)}
                className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">
                Not yet — cancel
              </button>
              <button onClick={() => run(vpnAsk)}
                className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Confirmed VPN Connected
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-600">
              <a href={ESIM_URL} target="_blank" rel="noreferrer" className="hover:text-slate-400 underline">
                Open eSIM in a browser to check
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
