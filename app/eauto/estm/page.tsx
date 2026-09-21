"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, AlertTriangle, Film, ArrowLeftRight,
  ChevronDown, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useApp } from "@/components/AppShell";

/** Registry key for this page's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. Keeps the run alive across navigating away. */
const RUN_KEY = "eauto/estm";

interface EstmResult { status?: string; vehicleRegNo?: string; envSegment?: string; idType?: string; emailAddress?: string; mobileNo?: string; finalUrl?: string; }
interface RunResponse {
  result?: EstmResult; error?: string; stopped?: boolean; video?: string; log?: string;
  progress?: { step: string; status: string; label?: string }[];
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function EstmPage() {
  const [form, setForm] = useState({
    envSegment: "sit2", vehicleRegNo: "", mobileNo: "",
    // #buyerEmail — the BUYER's email. Must NOT equal the eVOC email below;
    // the portal rejects the form with "Please enter Buyer's Email Address."
    emailAddress: "faizbidi03@gmail.com",
    // faizuddinsub2 is the account the eSTM settings are set up under — it is
    // the one patched to the bypass slot IC, so a run as anyone else is blocked
    // at step 3 with "Please use login user's mykad". Editable, not hardcoded.
    username: "faizuddinsub2", password: "password", idType: "1",
    // #email — readonly on step 2, reconfirmed in #reconfirmEmail. FIXED:
    // eVOC always goes to faizuddin@modefair.com.
    evocEmail: "faizuddin@modefair.com",
  });
  // Payment-step add-ons. Both default ON, matching what the portal itself
  // ticks on load. Separate from `form` because they're booleans, not strings.
  const [addons, setAddons] = useState({ elkm: true, evoc: true });

  // The run lives in AppShell (hooks/useBackgroundRuns.ts) so it survives
  // navigating away and back — this page has no live-log route, so `liveLog`
  // is unused here; only running/result/error carry over.
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || "";
  const res = (bgRun?.result as RunResponse | null) ?? null;
  const [showLog, setShowLog] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  function run() {
    const missing = (["envSegment", "vehicleRegNo", "emailAddress", "mobileNo"] as const).filter(k => !form[k].trim());
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-estm/run",
      stopUrl: "/api/eauto-estm/run",
      meta: { vehicleRegNo: form.vehicleRegNo, envSegment: form.envSegment },
      body: { ...form, ...addons },
    });
  }

  function stop() { stopRun(RUN_KEY); }

  const result = res?.result;
  const success = result?.status === "SUCCESS";
  const progress = res?.progress ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <ArrowLeftRight size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">Create eSTM</h1>
        <span className="text-xs text-slate-600 hidden sm:block">Automated eSERAHAN vehicle-transfer transaction (with video)</span>
        {/* Azfar's unmodified version runs the same flow at /eauto/estm-legacy.
            Named here so it's clear which page you're on. */}
        <Link href="/eauto/estm-legacy" className="ml-auto text-xs text-slate-600 hover:text-amber-400 transition-colors">
          Original version →
        </Link>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-slate-800 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Environment</label>
              <select value={form.envSegment} onChange={e => set("envSegment", e.target.value)} className={field}>
                {["sit2", "sit3", "uat2"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><label className={label}>ID type</label>
              <select value={form.idType} onChange={e => set("idType", e.target.value)} className={field}>
                <option value="1">MyKad (Malaysian)</option>
                <option value="2">MyPR</option>
              </select>
            </div>
          </div>
          <div><label className={label}>Vehicle Reg No <span className="text-red-400">*</span></label><input value={form.vehicleRegNo} onChange={e => set("vehicleRegNo", e.target.value.toUpperCase())} placeholder="e.g. WXY1234" className={field} /></div>
          <div><label className={label}>Buyer email <span className="text-red-400">*</span></label><input value={form.emailAddress} onChange={e => set("emailAddress", e.target.value)} placeholder="buyer@example.com" className={field} /></div>
          <div><label className={label}>Buyer mobile <span className="text-red-400">*</span></label><input value={form.mobileNo} onChange={e => set("mobileNo", e.target.value)} placeholder="0123456789" className={field} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Username</label><input value={form.username} onChange={e => set("username", e.target.value)} placeholder="faizuddinsub2" className={field} /></div>
            <div><label className={label}>Password</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="default" className={field} /></div>
          </div>
          <div><label className={label}>eVOC email (fixed)</label><input value={form.evocEmail} onChange={e => set("evocEmail", e.target.value)} placeholder="staging default" className={field} /></div>

          {/* Step 5 add-ons. The portal ticks both on load; these mirror that,
              so an untouched run behaves exactly as a manual one would. */}
          <div className="pt-1">
            <label className={label}>Add-ons (Payment step)</label>
            <div className="space-y-1.5">
              {([
                { key: "elkm" as const, name: "eLKM (Road Tax)", cost: "+RM200 & RM2.75 fee" },
                { key: "evoc" as const, name: "eVOC", cost: "+RM10 fee" },
              ]).map(a => (
                <label key={a.key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addons[a.key]}
                    onChange={e => setAddons(p => ({ ...p, [a.key]: e.target.checked }))}
                    className="accent-indigo-600"
                  />
                  <span>{a.name}</span>
                  <span className="text-[11px] text-slate-500">{a.cost}</span>
                </label>
              ))}
            </div>
            {/* Cheap to say, saves a confusing failure: eLKM needs the vehicle
                to already have insurance, and EAINT-11864 TS02/TS03 need it off. */}
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Both on by default. eLKM needs the vehicle to have active insurance
              — untick it if the enquiry errors, and for EAINT-11864 TS02/TS03.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            {!running ? (
              <button onClick={run} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Play size={14} />Run eSTM
              </button>
            ) : (
              <button onClick={stop} disabled={bgRun?.stopping} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </aside>

        <main className="p-4 sm:p-6 space-y-5">
          {running && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" />
              Running the eSERAHAN flow for {String(bgRun?.meta?.vehicleRegNo ?? form.vehicleRegNo)} against {String(bgRun?.meta?.envSegment ?? form.envSegment)}…
            </div>
          )}
          {!running && !res && !orphaned && <p className="text-sm text-slate-500">Fill the buyer details and hit Run.</p>}
          {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

          {orphaned && !res && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="flex-1 text-xs text-amber-200 leading-relaxed">
                A run was still going when this browser reloaded, so the dashboard lost track of it.
                It may well have finished — check the terminal.
              </p>
            </div>
          )}

          {progress.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Steps</p>
              <div className="space-y-1">
                {progress.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={13} className="text-green-400 shrink-0" />{p.label ?? p.step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className={clsx("rounded-xl border p-4", success ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50")}>
              <p className="text-sm font-semibold text-slate-200">{success ? "eSTM transaction completed ✅" : "eSTM run did not complete ❌"}</p>
              {success && <p className="text-xs text-slate-400 mt-1">Vehicle {result.vehicleRegNo} · {result.idType} · {result.envSegment} · buyer {result.emailAddress}</p>}
            </div>
          )}

          {res?.video && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><Film size={12} />Run recording</p>
              <video src={res.video} controls className="w-full rounded-lg border border-slate-800" />
            </div>
          )}

          {res?.log && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl">
              <button onClick={() => setShowLog(v => !v)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200">
                {showLog ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Raw run log
              </button>
              {showLog && <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">{res.log}</pre>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
