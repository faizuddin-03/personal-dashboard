"use client";
// One finding from a failed run (Faizuddin, 2026-10-27): the TS wording, the
// red-box evidence, the SRD rule, then Confirm → form → Scout's draft → Raise.
// Priority and Developer are always asked and have no default; nothing goes
// to Jira until the final Raise is confirmed.
import { useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Loader2, Send, RotateCcw } from "lucide-react";
import clsx from "clsx";
import CharacterSprite from "@/components/pipeline/CharacterSprite";
import DeveloperPicker, { type JiraUser } from "@/components/pipeline/DeveloperPicker";
import { api, fileUrl, when } from "@/components/pipeline/api";
import type { Finding, FindingClass, PipelineJob, QaIssueDraft } from "@/lib/pipeline/types";

const PRIORITIES: NonNullable<QaIssueDraft["priority"]>[] = ["Highest", "High", "Medium", "Low", "Lowest"];

const CLASS_INFO: Record<FindingClass, { label: string; tone: string }> = {
  system: { label: "System issue", tone: "bg-red-500/15 text-red-300 border-red-500/30" },
  automation: { label: "Automation issue", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  data: { label: "Test data issue", tone: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
};

const STATE_INFO: Record<Finding["state"], { label: string; tone: string }> = {
  open: { label: "Needs your check", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  confirmed: { label: "Confirmed", tone: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  dismissed: { label: "Not an issue", tone: "bg-slate-800 text-slate-400 border-slate-700" },
  raised: { label: "Raised", tone: "bg-green-500/15 text-green-300 border-green-500/30" },
};

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border", tone)}>{children}</span>;
}

function Shot({ src, label }: { src: string; label: string }) {
  const url = fileUrl(src);
  return (
    <figure className="space-y-1">
      <a href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-800 bg-slate-950 hover:border-slate-600">
        {/* eslint-disable-next-line @next/next/no-img-element -- local evidence files, sizes unknown */}
        <img src={url} alt={label} loading="lazy" className="w-full h-auto max-h-80 object-contain" />
      </a>
      <figcaption className="text-[11px] text-slate-500">{label}</figcaption>
    </figure>
  );
}

// Elf sometimes writes "None" when no SRD rule applies; show nothing then.
const realSection = (v?: string) => (v && !/^(none|n\/a|-|—)$/i.test(v.trim()) ? v : "");

const input = "w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

export default function FindingCard({ finding, ticketKey, issueUrl, scoutJob, onChanged }: {
  finding: Finding;
  ticketKey: string;
  issueUrl?: string;
  scoutJob?: PipelineJob;
  onChanged: () => void;
}) {
  const f = finding;
  const section = realSection(f.srd?.section);
  const draft = f.issueDraft;
  const [mode, setMode] = useState<"view" | "form" | "dismiss" | "raise">("view");
  // The Confirm form answers live in f.raiseForm; the draft carries copies.
  const form = f.raiseForm ?? {};
  const devId = form.developerAccountId ?? draft?.developerAccountId;
  const [priority, setPriority] = useState<string>(form.priority ?? draft?.priority ?? "");
  const [developer, setDeveloper] = useState<JiraUser | null>(
    devId ? { accountId: devId, displayName: form.developerName || "Chosen developer" } : null,
  );
  const [environment, setEnvironment] = useState(form.environment ?? draft?.environment ?? "");
  const [moduleName, setModuleName] = useState(form.module ?? draft?.module ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [raised, setRaised] = useState<{ issueKey: string; url: string } | null>(null);

  async function post(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true); setError("");
    const r = await api(`/api/pipeline/findings/${encodeURIComponent(f.id)}`, { method: "POST", json: { key: ticketKey, ...body } });
    setBusy(false);
    if (!r.ok) { setError(r.error); return false; }
    onChanged();
    return true;
  }

  async function submitForm() {
    if (!priority) { setError("Choose a priority."); return; }
    if (!developer) { setError("Choose a developer."); return; }
    const ok = await post({
      state: "confirmed", priority, developerAccountId: developer.accountId, developerName: developer.displayName,
      environment: environment.trim(), module: moduleName.trim(),
    });
    if (ok) setMode("view");
  }

  async function raise(allowDuplicate = false) {
    setBusy(true); setError("");
    const r = await api<{ issueKey: string; url: string }>("/api/pipeline/issue", { method: "POST", json: { key: ticketKey, findingId: f.id, allowDuplicate } });
    setBusy(false);
    // A possible duplicate is saved on the finding (f.duplicates) and listed below after the reload.
    if (!r.ok) { setError(r.error); onChanged(); return; }
    setRaised(r.data);
    setMode("view");
    onChanged();
  }

  const issueKey = raised?.issueKey ?? f.issueKey;
  const link = raised?.url ?? issueUrl;
  const canRaise = f.state === "confirmed" && !!draft && !!draft.priority && !!draft.developerAccountId;

  return (
    <article className={clsx("rounded-xl border p-4 space-y-3", f.state === "dismissed" ? "border-slate-800 bg-slate-900/40 opacity-75" : "border-slate-700 bg-slate-950/40")}>
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-slate-100">{f.ts}</span>
        <Badge tone={CLASS_INFO[f.classification]?.tone ?? CLASS_INFO.system.tone}>{CLASS_INFO[f.classification]?.label ?? f.classification}</Badge>
        <Badge tone={STATE_INFO[f.state].tone}>{STATE_INFO[f.state].label}</Badge>
        <span className="ml-auto text-[11px] text-slate-500">{when(f.createdAt)}</span>
      </header>

      <p className="text-sm text-slate-100 font-medium">{f.summary}</p>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-red-300 mb-1">What happened</div>
          <div className="text-slate-200">{f.actual}</div>
        </div>
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-green-300 mb-1">What should happen</div>
          <div className="text-slate-200">{f.expected}</div>
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Test scenario says</div>
        <blockquote className="border-l-2 border-slate-600 pl-3 text-sm text-slate-300 whitespace-pre-wrap">{f.tsQuote}</blockquote>
      </div>

      {(f.evidence.length > 0 || f.srd?.image) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {f.evidence.map((ev, i) => <Shot key={i} src={ev.image} label={ev.label} />)}
          {f.srd?.image && <Shot src={f.srd.image} label={`SRD${f.srd.page ? ` page ${f.srd.page}` : ""}${section ? ` · ${section}` : ""}`} />}
        </div>
      )}

      {f.srd && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
            SRD says <span className="normal-case tracking-normal">({f.srd.file}{f.srd.page ? `, page ${f.srd.page}` : ""}{section ? `, ${section}` : ""})</span>
          </div>
          <blockquote className="border-l-2 border-blue-500/50 pl-3 text-sm text-slate-300 whitespace-pre-wrap">{f.srd.quote}</blockquote>
        </div>
      )}

      {f.questionForDev && (
        <p className="text-xs text-slate-400"><span className="text-slate-500">Question for the developer:</span> {f.questionForDev}</p>
      )}

      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}

      {/* Not a system bug: say so before a QA-Issue is drafted (tester report, 2026-10-27). */}
      {f.classification !== "system" && (f.state === "open" || mode === "form") && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          {f.classification === "automation"
            ? "Elf thinks the automation is wrong here, not the system. Tell Dwarf in its chat to fix it. Only confirm if you are sure it is a real system bug."
            : "Elf thinks the test data is the problem, not the system. Try the run again with other data. Only confirm if you are sure it is a real system bug."}
        </p>
      )}

      {/* Open: Confirm / Not an issue */}
      {f.state === "open" && mode === "view" && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode("form")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500">
            <CheckCircle2 size={14} aria-hidden /> {f.classification === "system" ? "Confirm" : "Confirm anyway"}
          </button>
          <button type="button" onClick={() => setMode("dismiss")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">
            <XCircle size={14} aria-hidden /> Not an issue
          </button>
        </div>
      )}

      {mode === "dismiss" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 p-3 text-sm">
          <span className="text-slate-300 flex-1 min-w-[12rem]">Mark {f.ts} as not an issue?</span>
          <button type="button" disabled={busy} onClick={async () => { if (await post({ state: "dismissed" })) setMode("view"); }} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50">
            Yes, not an issue
          </button>
          <button type="button" onClick={() => setMode("view")} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</button>
        </div>
      )}

      {f.state === "dismissed" && mode === "view" && (
        <button type="button" disabled={busy} onClick={() => post({ state: "open" })} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <RotateCcw size={12} aria-hidden /> Check again
        </button>
      )}

      {/* Confirm form */}
      {mode === "form" && (
        <form onSubmit={e => { e.preventDefault(); void submitForm(); }} className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-3">
          <p className="text-xs text-slate-300">Fill these in. Scout then writes the QA-Issue draft for you to check. Nothing is sent to Jira yet.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-400 space-y-1">
              <span>Priority <span className="text-red-300">*</span></span>
              <select required value={priority} onChange={e => setPriority(e.target.value)} className={input}>
                <option value="">Choose…</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <div className="block text-xs text-slate-400 space-y-1">
              <span>Developer <span className="text-red-300">*</span></span>
              <DeveloperPicker value={developer} onChange={setDeveloper} />
            </div>
            <label className="block text-xs text-slate-400 space-y-1">
              <span>Environment</span>
              <input value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="e.g. staging" className={input} />
            </label>
            <label className="block text-xs text-slate-400 space-y-1">
              <span>Module</span>
              <input value={moduleName} onChange={e => setModuleName(e.target.value)} placeholder="e.g. Service Portal" className={input} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <CheckCircle2 size={14} aria-hidden />}
              Confirm and ask Scout for the draft
            </button>
            <button type="button" onClick={() => setMode("view")} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">Cancel</button>
          </div>
        </form>
      )}

      {/* Confirmed: waiting for Scout, or the draft */}
      {f.state === "confirmed" && !raised && mode !== "form" && (
        <div className="space-y-3">
          {!draft && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CharacterSprite character="scout" size={28} busy={!!scoutJob} />
              {scoutJob ? <span>Scout is writing the QA-Issue draft… {scoutJob.activity}</span> : <span>Waiting for Scout&apos;s draft.</span>}
            </div>
          )}
          {draft && (
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CharacterSprite character="scout" size={28} /> Scout&apos;s QA-Issue draft
              </div>
              <p className="font-medium text-slate-100">{draft.title}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-slate-500">Under</dt><dd className="text-slate-300">{draft.parent}</dd>
                <dt className="text-slate-500">Environment</dt><dd className="text-slate-300">{draft.environment || "—"}</dd>
                <dt className="text-slate-500">Module</dt><dd className="text-slate-300">{draft.module || "—"}</dd>
                <dt className="text-slate-500">Priority</dt><dd className="text-slate-300">{draft.priority ?? <span className="text-red-300">Not chosen</span>}</dd>
                <dt className="text-slate-500">Developer</dt><dd className="text-slate-300">{draft.developerAccountId ? (developer?.accountId === draft.developerAccountId ? developer.displayName : form.developerName || "Chosen") : <span className="text-red-300">Not chosen</span>}</dd>
                {draft.stagingIds.length > 0 && (<><dt className="text-slate-500">Staging IDs</dt><dd className="text-orange-300">{draft.stagingIds.join(", ")}</dd></>)}
              </dl>
              {draft.steps.length > 0 && (
                <ol className="list-decimal ml-5 text-xs text-slate-300 space-y-0.5">
                  {draft.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div><span className="text-red-300">Actual:</span> <span className="text-slate-300">{draft.actual}</span></div>
                <div><span className="text-green-300">Expected:</span> <span className="text-slate-300">{draft.expected}</span></div>
              </div>
              {draft.attachments.length > 0 && <p className="text-[11px] text-slate-500">{draft.attachments.length} image{draft.attachments.length === 1 ? "" : "s"} will be attached.</p>}
            </div>
          )}

          {mode === "view" && (
            <div className="flex flex-wrap gap-2">
              {draft && (
                <button type="button" disabled={!canRaise} onClick={() => setMode("raise")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500 disabled:opacity-40">
                  <Send size={14} aria-hidden /> Raise QA-Issue
                </button>
              )}
              <button type="button" onClick={() => setMode("form")} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">
                Change details
              </button>
            </div>
          )}

          {mode === "raise" && draft && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-3 space-y-2 text-sm">
              <p className="text-slate-200">This creates a real QA-Issue in Jira:</p>
              <ol className="list-decimal ml-5 text-xs text-slate-300 space-y-0.5">
                <li>Title: <span className="text-slate-100">{draft.title}</span></li>
                <li>Sub-task of {draft.parent}, priority {draft.priority}</li>
                <li>{draft.attachments.length} image{draft.attachments.length === 1 ? "" : "s"} attached</li>
                {(draft.priority === "High" || draft.priority === "Highest") && <li>Goes to On Hold and is assigned to you for a manual check first</li>}
              </ol>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => { void raise(); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
                  Yes, raise it
                </button>
                <button type="button" onClick={() => setMode("view")} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</button>
              </div>
              {(f.duplicates?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-2.5 space-y-2 text-xs">
                  <p className="text-amber-300">These QA-Issues under {draft.parent} look the same. Check them before raising:</p>
                  <ol className="list-decimal ml-5 text-slate-300 space-y-0.5">
                    {f.duplicates!.map(d => (
                      <li key={d.key}><a href={`/jira/${d.key}`} className="text-blue-300 hover:underline">{d.key}</a> {d.summary}{d.status ? ` (${d.status})` : ""}</li>
                    ))}
                  </ol>
                  <button type="button" disabled={busy} onClick={() => { void raise(true); }} className="px-3 py-1.5 rounded-lg border border-amber-500/50 text-amber-200 hover:bg-amber-500/10 disabled:opacity-50">
                    It is a different issue, raise anyway
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(f.state === "raised" || raised) && issueKey && (
        <a href={link ?? `/jira/${issueKey}`} target={link ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-green-300 hover:underline">
          <ExternalLink size={14} aria-hidden /> {issueKey} raised
        </a>
      )}
    </article>
  );
}
