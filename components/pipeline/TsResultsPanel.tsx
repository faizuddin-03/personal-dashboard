"use client";
// Live Pass / Fail count of the official TS workbook (Faizuddin, 2026-11-03).
// Polls /api/pipeline/ts-results every 5 s while the tab is visible; the
// server only re-reads the workbook when the synced file changes.
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { api, startPolling, when } from "@/components/pipeline/api";
import type { Counts, TsResults } from "@/lib/officialTsResults";

const POLL_MS = 5000;

const TONE: Record<string, string> = {
  Pass: "text-green-300",
  Fail: "text-red-300",
  "In Progress": "text-amber-300",
  "Not Started": "text-slate-300",
};

const SHOWN = ["Pass", "Fail", "In Progress", "Not Started"] as const;
const counted = (c: Counts) => (Object.values(c) as number[]).reduce((a, b) => a + b, 0);

function Bar({ c }: { c: Counts }) {
  const total = counted(c) || 1;
  const seg = (n: number, cls: string, label: string) =>
    n > 0 && <span className={cls} style={{ width: `${(n / total) * 100}%` }} title={`${label}: ${n}`} />;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden>
      {seg(c.Pass, "bg-green-500", "Pass")}
      {seg(c.Fail, "bg-red-500", "Fail")}
      {seg(c["In Progress"], "bg-amber-400", "In Progress")}
    </div>
  );
}

export default function TsResultsPanel({ ticketKey }: { ticketKey: string }) {
  const [data, setData] = useState<TsResults | null>(null);
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState<string>("");
  const [flash, setFlash] = useState(false);
  const since = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await api<TsResults | { unchanged: true; mtimeMs: number }>(
        `/api/pipeline/ts-results?key=${encodeURIComponent(ticketKey)}${since.current ? `&since=${since.current}` : ""}`,
      );
      if (!alive) return;
      setCheckedAt(new Date().toISOString());
      if (!r.ok) { setError(r.error); return; }
      setError("");
      if ("unchanged" in r.data) return;
      const changed = since.current !== 0;
      since.current = r.data.mtimeMs;
      setData(r.data);
      if (changed) { setFlash(true); setTimeout(() => alive && setFlash(false), 2500); }
    };
    void load();
    const stop = startPolling(() => void load(), () => POLL_MS);
    return () => { alive = false; stop(); };
  }, [ticketKey]);

  if (!data) {
    return <p className="text-sm text-slate-400">{error || "Reading the official TS…"}</p>;
  }

  const c = data.counts;
  return (
    <div className={clsx("space-y-4 text-sm transition-colors rounded-lg", flash && "bg-blue-500/10")}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
          <div className="text-[11px] text-slate-400">Pass rate</div>
          <div className="text-xl font-semibold text-slate-100">{data.passRate === null ? "–" : `${data.passRate}%`}</div>
          <div className="text-[11px] text-slate-500">Pass ÷ (Pass + Fail)</div>
        </div>
        {SHOWN.map(s => (
          <div key={s} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
            <div className="text-[11px] text-slate-400">{s}</div>
            <div className={clsx("text-xl font-semibold", TONE[s])}>{c[s]}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Bar c={c} />
        <p className="text-[11px] text-slate-500">
          {data.executed}% of {counted(c)} result cells tested. Grey (blank) cells are not counted.
          {(data.deprioritized?.length ?? 0) > 0 && ` ${data.deprioritized.length} deprioritized TS not counted.`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800">
              <th className="py-1.5 pr-3 font-medium">Tab</th>
              <th className="py-1.5 pr-3 font-medium">TS</th>
              {SHOWN.map(s => <th key={s} className="py-1.5 pr-3 font-medium">{s}</th>)}
              <th className="py-1.5 font-medium w-32">Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.sheets.map(s => (
              <tr key={s.name} className="border-b border-slate-800/60 align-top">
                <td className="py-1.5 pr-3 text-slate-200">
                  <details>
                    <summary className="cursor-pointer">{s.name}</summary>
                    <ul className="mt-1 space-y-0.5 text-slate-400">
                      {s.columns.map(col => (
                        <li key={col.header}>
                          {col.header}: {SHOWN.filter(k => col.counts[k]).map(k => `${col.counts[k]} ${k}`).join(", ") || "none"}
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
                <td className="py-1.5 pr-3 text-slate-300">
                  {s.tsCount}
                  {s.deprioCount > 0 && <span className="block text-[10px] text-slate-500 italic">{s.deprioCount} deprioritized</span>}
                </td>
                {SHOWN.map(k => <td key={k} className={clsx("py-1.5 pr-3", s.counts[k] ? TONE[k] : "text-slate-600")}>{s.counts[k]}</td>)}
                <td className="py-1.5"><Bar c={s.counts} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.failed.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-300 mb-1">Failed ({data.failed.length})</h4>
          <ul className="space-y-0.5 text-xs text-slate-300">
            {data.failed.map((f, i) => (
              <li key={`${f.sheet}-${f.ts}-${f.column}-${i}`}><b>{f.ts}</b> on {f.column} — {f.objective || f.sheet}</li>
            ))}
          </ul>
        </div>
      )}
      {data.inProgress.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-300 mb-1">In Progress ({data.inProgress.length})</h4>
          <ul className="space-y-0.5 text-xs text-slate-300">
            {data.inProgress.map((f, i) => (
              <li key={`${f.sheet}-${f.ts}-${f.column}-${i}`}><b>{f.ts}</b> on {f.column} — {f.objective || f.sheet}</li>
            ))}
          </ul>
        </div>
      )}

      {(data.deprioritized?.length ?? 0) > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 italic mb-1">Deprioritized ({data.deprioritized.length})</h4>
          <ul className="space-y-0.5 text-xs text-slate-400">
            {data.deprioritized.map((d, i) => (
              <li key={`${d.sheet}-${d.ts}-${i}`}>
                <b className="text-slate-300 line-through">{d.ts}</b> ({d.sheet}) — {d.reason || "no reason in Remarks"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        File saved {when(data.modifiedAt)} · checked {when(checkedAt)} · checks every 5 s.
        Excel Online edits reach this file about 1–3 minutes after you make them.
        {error && <span className="text-amber-300"> {error}</span>}
      </p>
    </div>
  );
}
