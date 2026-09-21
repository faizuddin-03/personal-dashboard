"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, AlertTriangle, Film, History, CheckCircle2, FileWarning,
  ChevronDown, ChevronRight,
} from "lucide-react";
import Link from "next/link";

// Create eSTM (Original) — runs the known-good single-file spec,
// scripts/eauto-estm-legacy/tests/estm-bypass-test.spec.ts, copied verbatim from
// _reference/automation code/eSTM Bypass/.
//
// This is the version that predates the page-object refactor. Both work; keep
// this one as a known-good baseline for telling our code apart from staging or
// from per-tester setup (UCD patching, bypass slot) when a run fails.
//
// Kept visually distinct from /eauto/estm on purpose: amber accent instead of
// indigo, a History icon instead of the transfer arrows, and a banner naming
// which is which. Both drive the same eSERAHAN flow against the same staging
// environment, so without that it is easy to run one while reading the other's
// output.
//
// It offers FEWER fields than our page, and that is not an oversight — this
// spec reads only these. Bypass slot and eLKM came with the refactor, and the
// eVOC email is hardcoded here (nicholas.lim@modefair.com).
interface EstmResult { status?: string; vehicleRegNo?: string; envSegment?: string; idType?: string; emailAddress?: string; mobileNo?: string; finalUrl?: string; }
interface RunResponse {
  result?: EstmResult; error?: string; stopped?: boolean; video?: string; log?: string;
  progress?: { step: string; status: string; label?: string }[];
  // Playwright's failure dump: the call stack and a snapshot of the page as it
  // stood. This is the file that names WHICH step failed, so link it prominently
  // rather than leaving it to be found in test-results, where the next run
  // overwrites it.
  errorContext?: string;
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function EstmLegacyPage() {
  const [form, setForm] = useState({
    envSegment: "sit2", vehicleRegNo: "", emailAddress: "", mobileNo: "",
    username: "", password: "", idType: "1",
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<RunResponse | null>(null);
  const [showLog, setShowLog] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function run() {
    const missing = (["envSegment", "vehicleRegNo", "emailAddress", "mobileNo"] as const).filter(k => !form[k].trim());
    if (missing.length) { setError(`Required: ${missing.join(", ")}`); return; }
    setRunning(true); setError(""); setRes(null);
    try {
      const r = await fetch("/api/eauto-estm-legacy/run", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = (await r.json()) as RunResponse;
      if (!r.ok && data.error) throw new Error(data.error);
      setRes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  async function stop() { await fetch("/api/eauto-estm-legacy/run", { method: "DELETE" }).catch(() => {}); }

  const result = res?.result;
  const success = result?.status === "SUCCESS";
  const progress = res?.progress ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <History size={16} className="text-amber-400" />
        <h1 className="text-sm font-semibold text-slate-200">Create eSTM (Original)</h1>
        <span className="text-xs text-amber-500/80 hidden sm:block">The pre-refactor script, unmodified</span>
      </header>

      <div className="bg-amber-950/30 border-b border-amber-800/50 px-4 sm:px-6 py-3">
        <p className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="font-semibold">This is not your eSTM page.</strong>{" "}
          It runs the original single-file script — the one that was working
          before the page-object refactor — copied verbatim and left unmodified.
          Use it to tell &ldquo;we broke it&rdquo; from &ldquo;staging changed&rdquo;:
          if this one fails too, the fault isn&apos;t in our refactor.
          For everyday eSTM creation use{" "}
          <Link href="/eauto/estm" className="underline underline-offset-2 hover:text-amber-100">Create eSTM</Link>.
        </p>
      </div>

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
          {/* Everything our page grew after this version: the eVOC email is a
              hardcoded constant in the spec, and bypass slot / eLKM don't exist
              in it at all. Offering them here would silently do nothing. */}
          <p className="text-[11px] leading-snug text-slate-500">
            No eVOC email, bypass slot or eLKM field — this version doesn&apos;t
            read them. eVOC is fixed to <code>nicholas.lim@modefair.com</code> and
            the bypass slot falls back to <code>zzz/22</code>.
          </p>

          <div className="flex gap-2 pt-1">
            {!running ? (
              <button onClick={run} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                <Play size={14} />Run original eSTM
              </button>
            ) : (
              <button onClick={stop} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors">
                <Square size={14} />Stop
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </aside>

        <main className="p-4 sm:p-6 space-y-5">
          {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Running his eSERAHAN flow against staging — a browser window will open.</div>}
          {!running && !res && <p className="text-sm text-slate-500">Fill the buyer details and hit Run.</p>}
          {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

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
            <div className={success
              ? "rounded-xl border p-4 bg-green-950/30 border-green-800/50"
              : "rounded-xl border p-4 bg-red-950/30 border-red-800/50"}>
              <p className="text-sm font-semibold text-slate-200">{success ? "eSTM transaction completed ✅" : "eSTM run did not complete ❌"}</p>
              {success
                ? <p className="text-xs text-slate-400 mt-1">Vehicle {result.vehicleRegNo} · {result.idType} · {result.envSegment} · buyer {result.emailAddress}</p>
                : <p className="text-xs text-slate-400 mt-1">The steps above are the ones that completed — it stopped after the last one.</p>}
              {!success && res?.errorContext && (
                <a href={res.errorContext} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 mt-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2">
                  <FileWarning size={12} />Open the failure dump (stack + page snapshot)
                </a>
              )}
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
