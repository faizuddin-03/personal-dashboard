"use client";
// Learnings (Faizuddin, 2026-10-27): what the Sage, the pipeline's knowledge
// keeper, learned and what it needs from him. Four parts: changes to existing
// knowledge waiting for his OK (Approve / Reject), ideas to improve the
// pipeline (done / dismiss), questions answered for him from his earlier
// answers (mark one wrong), and what was recently added to knowledge/.
// Data: /api/pipeline/learnings, polled every 10 s. README §8.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Check, X, Lightbulb, BookOpen, MessageSquareReply, AlertTriangle, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { api, startPolling, when } from "@/components/pipeline/api";
import type { KnowledgeReview, LearningRecord, PipelineImprovement, SavedAnswer } from "@/lib/pipeline/types";

interface Data {
  review: KnowledgeReview[];
  improvements: PipelineImprovement[];
  learnings: LearningRecord[];
  answers: SavedAnswer[];
}

const NAMES: Record<string, string> = { scout: "Scout", scribe: "Scribe", elf: "Elf", dwarf: "Dwarf", sage: "Sage" };

function Section({ icon: Icon, title, count, children }: { icon: typeof BookOpen; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Icon size={16} className="text-blue-400" />
        {title}
        {count !== undefined && <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-normal text-slate-400">{count}</span>}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}

function TextBox({ label, text, tone }: { label: string; text: string; tone: "old" | "new" }) {
  return (
    <div className="min-w-0 flex-1">
      <div className={clsx("text-[11px] font-medium uppercase tracking-wide", tone === "old" ? "text-slate-400" : "text-blue-300")}>{label}</div>
      <pre className={clsx(
        "mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border p-2 text-xs",
        tone === "old" ? "border-slate-700 bg-slate-950 text-slate-300" : "border-blue-500/40 bg-blue-500/5 text-slate-100",
      )}>{text || "(nothing: this adds new text)"}</pre>
    </div>
  );
}

const STATE_LABEL: Record<KnowledgeReview["state"], string> = {
  pending: "Waiting for your OK",
  approved: "Approved: Sage is applying it",
  applied: "Applied",
  rejected: "Rejected",
  error: "Could not apply",
};

export default function LearningsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showClosed, setShowClosed] = useState(false);

  const load = useCallback(async () => {
    const r = await api<Data>("/api/pipeline/learnings");
    if (r.ok) { setData(r.data); setError(null); } else setError(r.error);
  }, []);

  useEffect(() => {
    const first = setTimeout(() => { void load(); }, 0);
    const stop = startPolling(() => { void load(); }, () => 10_000);
    return () => { clearTimeout(first); stop(); };
  }, [load]);

  async function post(json: Record<string, unknown>, busyId: string) {
    setBusy(busyId);
    const r = await api("/api/pipeline/learnings", { method: "POST", json });
    setBusy(null);
    if (!r.ok) setError(r.error);
    await load();
  }

  const waiting = useMemo(() => (data?.review ?? []).filter(r => r.state === "pending" || r.state === "approved" || r.state === "error"), [data]);
  const decided = useMemo(() => (data?.review ?? []).filter(r => r.state === "applied" || r.state === "rejected"), [data]);
  const ideas = useMemo(() => (data?.improvements ?? []).filter(i => showClosed || i.state === "open"), [data, showClosed]);
  const answerById = useMemo(() => new Map((data?.answers ?? []).map(a => [a.id, a])), [data]);
  const autoAnswers = useMemo(() => (data?.learnings ?? []).filter(l => l.type === "auto-answer"), [data]);
  const learned = useMemo(() => (data?.learnings ?? []).filter(l => l.type !== "auto-answer"), [data]);
  const remembered = useMemo(() => (data?.answers ?? []), [data]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header>
        <div className="text-xs text-slate-500"><Link href="/pipeline" className="hover:text-blue-300">Pipeline</Link> / Learnings</div>
        <h1 className="mt-1 text-xl font-semibold text-slate-100">Learnings</h1>
        <p className="mt-1 text-sm text-slate-400">
          After every pipeline step, the Sage adds what was learned to the knowledge base. Changes to facts that already exist wait here for your OK.
          It also keeps your answers, so the characters do not ask you the same thing twice.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      {!data && !error && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>}

      {data && (
        <>
          <Section icon={Check} title="Waiting for your OK" count={waiting.filter(r => r.state === "pending").length}>
            {!waiting.length && <Empty text="Nothing waiting. The Sage only asks when new information changes something already in the knowledge base." />}
            {waiting.map(r => (
              <article key={r.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-blue-300">{r.file}</span>
                  <span className="text-slate-500">from {r.key} · {when(r.at)}</span>
                  <span className={clsx("ml-auto rounded-full px-2 py-0.5",
                    r.state === "pending" ? "bg-amber-500/15 text-amber-300" : r.state === "error" ? "bg-red-500/15 text-red-300" : "bg-blue-500/15 text-blue-300")}>
                    {STATE_LABEL[r.state]}
                  </span>
                </div>
                {r.currentFound === false && (
                  <p className="mt-2 text-xs text-amber-300">The current text was not found word for word in the file. Check it before approving.</p>
                )}
                <div className="mt-2 flex flex-col gap-3 md:flex-row">
                  <TextBox label="Now in the file" text={r.current} tone="old" />
                  <TextBox label="Proposed" text={r.proposed} tone="new" />
                </div>
                <p className="mt-2 text-sm text-slate-300"><span className="text-slate-500">Why:</span> {r.why || "(no reason given)"}</p>
                {!!r.sources?.length && (
                  <ol className="mt-1 list-decimal pl-5 text-xs text-slate-400">{r.sources.map((s, i) => <li key={i}>{s}</li>)}</ol>
                )}
                {r.note && <p className="mt-1 text-xs text-slate-400"><span className="text-slate-500">Note:</span> {r.note}</p>}
                {(r.state === "pending" || r.state === "error") && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      value={notes[r.id] ?? ""}
                      onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Note (optional)"
                      className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600"
                    />
                    <button
                      disabled={!!busy}
                      onClick={() => post({ type: "review", id: r.id, decision: "approve", note: notes[r.id] }, r.id)}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={() => post({ type: "review", id: r.id, decision: "reject", note: notes[r.id] }, r.id)}
                      className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
            {!!decided.length && (
              <details className="text-sm text-slate-400">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-300">Already decided ({decided.length})</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
                  {decided.map(r => <li key={r.id}><span className="font-mono text-slate-300">{r.file}</span> · {STATE_LABEL[r.state]} · {when(r.decidedAt ?? r.at)}{r.note ? ` · ${r.note}` : ""}</li>)}
                </ol>
              </details>
            )}
          </Section>

          <Section icon={Lightbulb} title="Ideas to improve the pipeline" count={(data.improvements ?? []).filter(i => i.state === "open").length}>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} /> Show done and dismissed
            </label>
            {!ideas.length && <Empty text="No open ideas." />}
            {ideas.map(i => (
              <article key={i.id} className={clsx("rounded-lg border border-slate-700 bg-slate-900 p-3", i.state !== "open" && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{NAMES[i.area] ?? i.area}</span>
                  <span className="text-slate-500">{i.key} · {when(i.at)}</span>
                  {i.state !== "open" && <span className="ml-auto text-slate-400">{i.state === "done" ? "Done" : "Dismissed"}</span>}
                </div>
                <p className="mt-2 text-sm text-slate-300"><span className="text-slate-500">Seen:</span> {i.observation}</p>
                <p className="mt-1 text-sm text-slate-100"><span className="text-slate-500">Idea:</span> {i.suggestion}</p>
                <div className="mt-2 flex gap-2">
                  {i.state === "open" ? (
                    <>
                      <button disabled={!!busy} onClick={() => post({ type: "improvement", id: i.id, state: "done" }, i.id)}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500 disabled:opacity-50"><Check size={12} /> Mark done</button>
                      <button disabled={!!busy} onClick={() => post({ type: "improvement", id: i.id, state: "dismissed" }, i.id)}
                        className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"><X size={12} /> Dismiss</button>
                    </>
                  ) : (
                    <button disabled={!!busy} onClick={() => post({ type: "improvement", id: i.id, state: "open" }, i.id)}
                      className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"><RotateCcw size={12} /> Reopen</button>
                  )}
                </div>
              </article>
            ))}
          </Section>

          <Section icon={MessageSquareReply} title="Answered for you from memory" count={autoAnswers.length}>
            {!autoAnswers.length && <Empty text="No question has been answered from your earlier answers yet." />}
            {autoAnswers.map((l, n) => {
              const a = l.answerId ? answerById.get(l.answerId) : undefined;
              return (
                <article key={`${l.jobId}-${n}`} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm">
                  <div className="text-xs text-slate-500">{l.key} · {NAMES[l.character ?? ""] ?? l.character} asked · {when(l.at)}</div>
                  <p className="mt-1 text-slate-300"><span className="text-slate-500">Question:</span> {l.question}</p>
                  <p className="mt-1 text-slate-100"><span className="text-slate-500">Your answer on {l.answeredOn}:</span> &ldquo;{l.answer}&rdquo;</p>
                  {a && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {a.state === "wrong" ? (
                        <>
                          <span className="text-amber-300">Marked wrong: the characters will ask you again.</span>
                          <button disabled={!!busy} onClick={() => post({ type: "answer", id: a.id, decision: "active" }, a.id)}
                            className="rounded-lg border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50">Use it again</button>
                        </>
                      ) : (
                        <button disabled={!!busy} onClick={() => post({ type: "answer", id: a.id, decision: "wrong" }, a.id)}
                          className="flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50"><X size={12} /> Wrong, ask me next time</button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-300">All remembered answers ({remembered.length})</summary>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs">
                {remembered.map(a => (
                  <li key={a.id} className={clsx(a.state === "wrong" && "opacity-60")}>
                    <span className="text-slate-300">{a.question}</span>
                    <br />&ldquo;{a.answer}&rdquo; <span className="text-slate-500">· {a.scope} · {NAMES[a.askedBy] ?? a.askedBy} asked on {a.ticket}, {a.date}{a.uses ? ` · used ${a.uses}x` : ""}{a.state === "wrong" ? " · marked wrong" : ""}</span>
                    <button disabled={!!busy} onClick={() => post({ type: "answer", id: a.id, decision: a.state === "wrong" ? "active" : "wrong" }, a.id)}
                      className="ml-2 text-blue-300 hover:underline disabled:opacity-50">{a.state === "wrong" ? "use again" : "mark wrong"}</button>
                  </li>
                ))}
              </ol>
            </details>
          </Section>

          <Section icon={BookOpen} title="Recently learned" count={learned.length}>
            {!learned.length && <Empty text="Nothing learned yet. The Sage starts about 2 minutes after the pipeline goes quiet." />}
            {learned.map((l, n) => (
              <article key={`${l.jobId}-${n}`} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Link href={`/pipeline/${l.key}`} className="font-mono text-blue-300 hover:underline">{l.key}</Link>
                  <span>{l.type === "apply" ? "Applied your OK" : l.type === "chat" ? "From your chat" : "Learned"}</span>
                  <span>· {when(l.at)}</span>
                  {!!l.review && <span>· {l.review} waiting for OK</span>}
                  {!!l.improvements && <span>· {l.improvements} idea(s)</span>}
                  {!!l.answers && <span>· {l.answers} answer(s) remembered</span>}
                </div>
                {!!l.files?.length && (
                  <ol className="mt-2 list-decimal pl-5 text-xs text-slate-300">
                    {l.files.map(f => (
                      <li key={f.path}><span className="font-mono">{f.path}</span> {f.change === "added" ? "(new file)" : ""} +{f.linesAdded}{f.linesRemoved ? ` / -${f.linesRemoved}` : ""} lines</li>
                    ))}
                  </ol>
                )}
                {l.summary && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{l.summary}</p>}
                {l.warning && <p className="mt-1 text-xs text-amber-300">{l.warning}</p>}
              </article>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
