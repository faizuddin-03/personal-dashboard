"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, Film,
  ChevronDown, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

// ── Purchase E2E tab (eAuto UCD full-flow + cross-page verification) ──
// Rendered inside the Insurance page's tab area, so it has no header/layout
// of its own — just the run form + results body.

interface Check { name: string; pass: boolean; detail: string; }
interface E2EResult {
  outcome?: string; verdict?: string; passed?: number; failed?: number;
  insurer?: string; coverType?: string; coverage?: string;
  referenceNo?: string; eCert?: string; paymentAmount?: string; jpj?: string;
  email?: string; hirePurchase?: string; checks?: Check[];
}
interface RunResponse {
  result?: E2EResult; error?: string; stopped?: boolean;
  screenshots?: string[]; video?: string; reportMd?: string; log?: string;
  progress?: { step: string; status: string; label?: string }[];
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function InsuranceE2ETab() {
  const [form, setForm] = useState({
    env: "sit3", username: "", password: "", vehicleNo: "", ic: "",
    category: "individual", email: "", insurer: "first", coverage: "random",
    sumMode: "default", bank: "random", stopBeforePayment: true,
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<RunResponse | null>(null);
  const [showLog, setShowLog] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  async function run() {
    if (!form.vehicleNo.trim() || !form.ic.trim()) { setError("Vehicle number and IC are required."); return; }
    setRunning(true); setError(""); setRes(null);
    try {
      const r = await fetch("/api/eauto-e2e/run", {
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

  async function stop() { await fetch("/api/eauto-e2e/run", { method: "DELETE" }).catch(() => {}); }

  const result = res?.result;
  const checks = result?.checks ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]">
      {/* ── Run form ── */}
      <aside className="lg:border-r border-slate-800 p-4 sm:p-6 space-y-3">
        <p className="text-xs text-slate-500 mb-1">Drives the full purchase: quote → coverage → payment → confirm → listing → details, checking the data stays consistent across every page. Recording + annotated screenshots included.</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Environment</label>
            <select value={form.env} onChange={e => set("env", e.target.value)} className={field}>
              {["sit2", "sit3", "uat2"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><label className={label}>Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={field}>
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Username</label><input value={form.username} onChange={e => set("username", e.target.value)} placeholder="staging default" className={field} /></div>
          <div><label className={label}>Password</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="staging default" className={field} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Vehicle No <span className="text-red-400">*</span></label><input value={form.vehicleNo} onChange={e => set("vehicleNo", e.target.value.toUpperCase())} placeholder="e.g. JKC9998" className={field} /></div>
          <div><label className={label}>IC / SSM <span className="text-red-400">*</span></label><input value={form.ic} onChange={e => set("ic", e.target.value)} placeholder="e.g. 020406081081" className={field} /></div>
        </div>
        <div><label className={label}>Notification email</label><input value={form.email} onChange={e => set("email", e.target.value)} placeholder="staging default" className={field} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Insurer</label>
            <select value={form.insurer} onChange={e => set("insurer", e.target.value)} className={field}>
              {["first", "random", "zurich-comprehensive", "zurich-tpft", "takaful-comprehensive", "takaful-tpft", "chubb"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><label className={label}>Optional coverage</label>
            <select value={form.coverage} onChange={e => set("coverage", e.target.value)} className={field}>
              {["random", "none", "all"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Sum covered</label>
            <select value={form.sumMode} onChange={e => set("sumMode", e.target.value)} className={field}>
              {["default", "random", "max"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><label className={label}>Hire-purchase bank</label><input value={form.bank} onChange={e => set("bank", e.target.value)} placeholder="random" className={field} /></div>
        </div>
        <label className="flex items-start gap-2 pt-1 cursor-pointer">
          <input type="checkbox" checked={form.stopBeforePayment} onChange={e => set("stopBeforePayment", e.target.checked)} className="mt-0.5 accent-blue-600" />
          <span className="text-xs text-slate-300">Stop before payment <span className="text-slate-500">— safe dry run; no real transaction is created and the vehicle number is not consumed.</span></span>
        </label>

        <div className="flex gap-2 pt-1">
          {!running ? (
            <button onClick={run} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Play size={14} />Run E2E
            </button>
          ) : (
            <button onClick={stop} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors">
              <Square size={14} />Stop
            </button>
          )}
        </div>
        {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
      </aside>

      {/* ── Results ── */}
      <main className="p-4 sm:p-6 space-y-5">
        {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Running against staging — a full purchase can take several minutes…</div>}
        {!running && !res && <p className="text-sm text-slate-500">Fill the form and hit Run. Leave &quot;Stop before payment&quot; on for a safe first try.</p>}
        {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

        {result && (
          <>
            <div className={clsx("rounded-xl border p-4", (result.failed ?? 0) === 0 ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50")}>
              <p className="text-sm font-semibold text-slate-200">{result.verdict ?? result.outcome}</p>
              <p className="text-xs text-slate-400 mt-1">
                {result.insurer} · {result.coverType} · coverage: {result.coverage} · Ref {result.referenceNo || "-"} · E-Cert {result.eCert || "-"} · Paid {result.paymentAmount || "-"}
              </p>
              {result.jpj && <p className="text-xs text-slate-500 mt-0.5">JPJ: {result.jpj} · HP: {result.hirePurchase || "-"}</p>}
            </div>

            {checks.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Verification checks ({result.passed}/{checks.length} passed)</p>
                <div className="space-y-1.5">
                  {checks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {c.pass ? <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" /> : <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />}
                      <span className="text-slate-300">{c.name}<span className="text-slate-600"> — {c.detail}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {res?.video && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><Film size={12} />Run recording</p>
            <video src={res.video} controls className="w-full rounded-lg border border-slate-800" />
          </div>
        )}

        {(res?.screenshots?.length ?? 0) > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Annotated screenshots ({res!.screenshots!.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {res!.screenshots!.map(s => (
                <a key={s} href={s} target="_blank" rel="noreferrer" className="block">
                  <img src={s} alt="" className="w-full rounded-lg border border-slate-800 hover:border-slate-600 transition-colors" />
                </a>
              ))}
            </div>
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
  );
}
