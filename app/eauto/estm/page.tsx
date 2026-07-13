"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, AlertTriangle, Film, ArrowLeftRight,
  ChevronDown, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

interface EstmResult { status?: string; vehicleRegNo?: string; envSegment?: string; idType?: string; emailAddress?: string; mobileNo?: string; finalUrl?: string; }
interface RunResponse {
  result?: EstmResult; error?: string; stopped?: boolean; video?: string; log?: string;
  progress?: { step: string; status: string; label?: string }[];
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function EstmPage() {
  const [form, setForm] = useState({
    envSegment: "sit3", vehicleRegNo: "", emailAddress: "", mobileNo: "",
    username: "", password: "", idType: "1", evocEmail: "",
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
      const r = await fetch("/api/eauto-estm/run", {
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

  async function stop() { await fetch("/api/eauto-estm/run", { method: "DELETE" }).catch(() => {}); }

  const result = res?.result;
  const success = result?.status === "SUCCESS";
  const progress = res?.progress ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <ArrowLeftRight size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">eAuto eSTM</h1>
        <span className="text-xs text-slate-600 hidden sm:block">Automated eSERAHAN vehicle-transfer transaction (with video)</span>
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
            <div><label className={label}>Username</label><input value={form.username} onChange={e => set("username", e.target.value)} placeholder="staging default" className={field} /></div>
            <div><label className={label}>Password</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="staging default" className={field} /></div>
          </div>
          <div><label className={label}>eVOC email</label><input value={form.evocEmail} onChange={e => set("evocEmail", e.target.value)} placeholder="staging default" className={field} /></div>

          <div className="flex gap-2 pt-1">
            {!running ? (
              <button onClick={run} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Play size={14} />Run eSTM
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
          {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Running the eSERAHAN flow against staging…</div>}
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
