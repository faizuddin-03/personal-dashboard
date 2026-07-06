"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Loader2, FileText, Upload, X, CheckCircle2, AlertTriangle,
  HelpCircle, RefreshCw, ShieldCheck, History, ChevronRight,
  ClipboardList, Plus, Trash2, ChevronUp, ChevronDown, ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { getKanbanState, KanbanCard, ColumnId } from "@/lib/kanban";
import { getActiveAi } from "@/lib/aiSettings";
import {
  QaFlowState, QaFlowTicketState, StudyResult, StudyMeta,
  getQaFlowState, saveQaFlowState, emptyTicketState, addAudit,
} from "@/lib/qaFlow";
import { TestPlanTemplate, getTemplates, addTemplate, removeTemplate } from "@/lib/testTemplates";
import {
  TestPlanState, TestPlanTicketState, DraftTestPlan, DraftScenario, ScenarioPriority,
  getTestPlanState, saveTestPlanState, emptyPlanState, addPlanAudit, newScenario, syncPlanToTracker,
} from "@/lib/testPlan";

interface UploadedDoc { name: string; mediaType: string; data: string; }

const sectionTitle = "text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2";

export default function QaFlowPage() {
  const { creds } = useApp();
  const [flowState, setFlowState] = useState<QaFlowState>({});
  const [crCards, setCrCards] = useState<KanbanCard[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [manualKey, setManualKey] = useState("");
  const [studying, setStudying] = useState(false);
  const [error, setError] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // Phase 2 — test plan drafting
  const [templates, setTemplates] = useState<TestPlanTemplate[]>([]);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [planState, setPlanState] = useState<TestPlanState>({});
  const [drafting, setDrafting] = useState(false);
  const [planError, setPlanError] = useState("");

  useEffect(() => {
    setFlowState(getQaFlowState());
    setPlanState(getTestPlanState());
    setTemplates(getTemplates());
    const kanban = getKanbanState();
    // Only active work: To-Do and On-Going CR tickets (finished/on-hold can still be studied by key)
    const cards = (["todo", "ongoing"] as ColumnId[])
      .flatMap(col => kanban[col])
      .filter(c => c.boardType === "cr" && c.jiraKey);
    setCrCards(cards);
    if (cards.length && !selectedKey) setSelectedKey(cards[0].jiraKey!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ticket: QaFlowTicketState = useMemo(
    () => flowState[selectedKey] ?? emptyTicketState(selectedKey),
    [flowState, selectedKey]
  );
  const plan: TestPlanTicketState = useMemo(
    () => planState[selectedKey] ?? emptyPlanState(selectedKey),
    [planState, selectedKey]
  );
  const selectedCard = crCards.find(c => c.jiraKey === selectedKey);

  function persistTicket(next: QaFlowTicketState) {
    const nextState = { ...flowState, [next.issueKey]: next };
    setFlowState(nextState);
    saveQaFlowState(nextState);
  }

  function persistPlan(next: TestPlanTicketState) {
    const nextState = { ...planState, [next.issueKey]: next };
    setPlanState(nextState);
    saveTestPlanState(nextState);
  }

  async function handleTemplateUpload(files: FileList | null) {
    if (!files) return;
    setTemplateError("");
    for (const file of Array.from(files)) {
      setTemplateUploading(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => { const r = reader.result as string; resolve(r.slice(r.indexOf(",") + 1)); };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        const res = await fetch("/api/qa-flow/extract-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, mediaType: file.type, data: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to read template");
        setTemplates(addTemplate(file.name, data.text));
      } catch (e) {
        setTemplateError(e instanceof Error ? e.message : "Failed to add template");
      }
    }
    setTemplateUploading(false);
  }

  function handleRemoveTemplate(id: string) {
    setTemplates(removeTemplate(id));
  }

  async function draftPlan() {
    if (!selectedKey || !ticket.study || !ticket.approved) return;
    const ai = getActiveAi();
    if (!ai) {
      setPlanError("No AI provider configured. Go to Settings → AI Settings, pick a provider (Gemini is free) and save its API key.");
      return;
    }
    setDrafting(true);
    setPlanError("");
    try {
      const res = await fetch("/api/qa-flow/draft-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueKey: selectedKey,
          summary: ticket.summary ?? selectedCard?.title ?? "",
          study: ticket.study,
          templates: templates.map(t => ({ name: t.name, text: t.text })),
          ai,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Drafting failed (${res.status})`);
      const draft = data.plan as DraftTestPlan;
      let next: TestPlanTicketState = {
        ...plan,
        issueKey: selectedKey,
        draft, model: data.model,
        draftedAt: new Date().toISOString(),
        approved: false, approvedAt: undefined,
        syncedToTracker: false, syncedAt: undefined,
      };
      next = addPlanAudit(next, `Drafted test plan (${draft.scenarios.length} scenario(s))${templates.length ? ` using ${templates.length} style template(s)` : ""} — model ${data.model}`);
      persistPlan(next);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Drafting failed");
    } finally {
      setDrafting(false);
    }
  }

  function updateDraft(mutator: (d: DraftTestPlan) => DraftTestPlan) {
    if (!plan.draft) return;
    persistPlan({ ...plan, draft: mutator(plan.draft) });
  }

  function approvePlan() {
    let next: TestPlanTicketState = { ...plan, approved: true, approvedAt: new Date().toISOString() };
    next = addPlanAudit(next, "Test plan approved by QA");
    persistPlan(next);
  }

  function syncToTracker() {
    if (!plan.draft) return;
    const { suiteTitle, tsNumbers } = syncPlanToTracker(selectedKey, ticket.summary ?? selectedCard?.title ?? "", plan.draft);
    let next: TestPlanTicketState = { ...plan, syncedToTracker: true, syncedAt: new Date().toISOString() };
    next = addPlanAudit(next, `Synced ${tsNumbers.length} case(s) to TS Tracker as suite "${suiteTitle}"`);
    persistPlan(next);
  }

  async function runStudy() {
    if (!creds || !selectedKey) return;
    const ai = getActiveAi();
    if (!ai) {
      setError("No AI provider configured. Go to Settings → AI Settings, pick a provider (Gemini is free) and save its API key.");
      return;
    }
    setStudying(true);
    setError("");
    try {
      const answers = ticket.study
        ? ticket.study.openQuestions
            .filter(q => (ticket.answers[q.question] ?? "").trim())
            .map(q => ({ question: q.question, answer: ticket.answers[q.question].trim() }))
        : [];
      const res = await fetch("/api/qa-flow/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken,
          issueKey: selectedKey,
          ai,
          extraNotes: ticket.extraNotes || undefined,
          answers: answers.length ? answers : undefined,
          userDocs: uploadedDocs.length ? uploadedDocs : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Study failed (${res.status})`);
      const study = data.study as StudyResult;
      const meta = data.meta as StudyMeta;
      let next: QaFlowTicketState = {
        ...ticket,
        issueKey: selectedKey,
        summary: meta.summary,
        study, meta,
        studiedAt: new Date().toISOString(),
        approved: false, approvedAt: undefined,
      };
      next = addAudit(next, ticket.study
        ? `Re-studied with ${answers.length} answer(s)${uploadedDocs.length ? ` and ${uploadedDocs.length} uploaded doc(s)` : ""} — ${study.openQuestions.length} open question(s) remain`
        : `Studied ticket (${meta.attachmentsUsed.length} attachment(s) read) — ${study.openQuestions.length} open question(s)`);
      persistTicket(next);
      setUploadedDocs([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Study failed");
    } finally {
      setStudying(false);
    }
  }

  function approve() {
    let next: QaFlowTicketState = { ...ticket, approved: true, approvedAt: new Date().toISOString() };
    next = addAudit(next, "Study approved by QA");
    persistTicket(next);
  }

  function handleUpload(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.slice(result.indexOf(",") + 1);
        setUploadedDocs(prev => [...prev, { name: file.name, mediaType: file.type || "application/octet-stream", data: base64 }]);
      };
      reader.readAsDataURL(file);
    });
  }

  const blockingUnanswered = ticket.study
    ? ticket.study.openQuestions.filter(q => q.blocking && !(ticket.answers[q.question] ?? "").trim())
    : [];
  const canApprove = !!ticket.study && !ticket.approved && blockingUnanswered.length === 0;

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Sparkles size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">QA Flow — Ticket Study</h1>
        <span className="text-xs text-slate-600 hidden sm:block">Auto-study a CR: full picture, affected pages, and the questions to answer before testing</span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
        {/* ── Ticket picker ── */}
        <aside className="border-r border-slate-800 p-4 space-y-3">
          <p className={sectionTitle}>My active CRs (To-Do & On-Going)</p>
          <div className="space-y-1.5">
            {crCards.length === 0 && <p className="text-xs text-slate-600">No active CR tickets — sync the kanban board first, or enter any ticket key below.</p>}
            {crCards.map(c => {
              const st = flowState[c.jiraKey!];
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedKey(c.jiraKey!); setError(""); setUploadedDocs([]); }}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                    selectedKey === c.jiraKey ? "bg-indigo-950/50 border-indigo-700" : "bg-slate-900 border-slate-800 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-blue-400 font-bold">{c.jiraKey}</span>
                    {st?.approved && <ShieldCheck size={11} className="text-green-400" />}
                    {st?.study && !st.approved && <HelpCircle size={11} className="text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.title}</p>
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-800">
            <p className={sectionTitle}>Study any ticket</p>
            <p className="text-xs text-slate-600 mb-1.5">Type a key and press Enter — works for any ticket, not just the board:</p>
            <div className="flex gap-1.5">
              <input
                value={manualKey}
                onChange={e => setManualKey(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === "Enter" && manualKey.trim()) { setSelectedKey(manualKey.trim()); setManualKey(""); } }}
                placeholder="EAINT-1234"
                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                onClick={() => { if (manualKey.trim()) { setSelectedKey(manualKey.trim()); setManualKey(""); } }}
                className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700"
              ><ChevronRight size={13} /></button>
            </div>
          </div>
        </aside>

        {/* ── Study panel ── */}
        <main className="p-4 sm:p-6 space-y-5 max-w-4xl">
          {!creds && <p className="text-sm text-amber-400">Connect Jira in Settings first.</p>}
          {!selectedKey && creds && <p className="text-sm text-slate-500">Pick a CR ticket on the left to start.</p>}

          {selectedKey && (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold text-slate-200">
                    <span className="font-mono text-blue-400">{selectedKey}</span>
                    {ticket.approved && (
                      <span className="ml-2 text-xs bg-green-900/50 text-green-300 border border-green-700/50 px-2 py-0.5 rounded-full font-medium align-middle">
                        Approved {ticket.approvedAt && new Date(ticket.approvedAt).toLocaleString()}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-400">{ticket.summary ?? selectedCard?.title ?? ""}</p>
                </div>
                <button
                  onClick={runStudy}
                  disabled={studying || !creds}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {studying ? <Loader2 size={14} className="animate-spin" /> : ticket.study ? <RefreshCw size={14} /> : <Sparkles size={14} />}
                  {studying ? "Studying… this can take a few minutes" : ticket.study ? "Re-study with my answers" : "Study this ticket"}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />{error}
                </div>
              )}

              {/* Extra info + uploads (always available) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <p className={sectionTitle}>Additional info for the study (optional)</p>
                <textarea
                  value={ticket.extraNotes}
                  onChange={e => persistTicket({ ...ticket, extraNotes: e.target.value })}
                  rows={2}
                  placeholder="Anything the AI should know that isn't in the ticket — environment quirks, related CRs, verbal decisions…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
                    <Upload size={12} />Upload doc (PDF / docx / txt)
                    <input type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={e => { handleUpload(e.target.files); e.target.value = ""; }} />
                  </label>
                  {uploadedDocs.map((d, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-full">
                      <FileText size={10} />{d.name}
                      <button onClick={() => setUploadedDocs(prev => prev.filter((_, j) => j !== i))} aria-label={`Remove ${d.name}`}><X size={10} /></button>
                    </span>
                  ))}
                  {uploadedDocs.length > 0 && <span className="text-xs text-slate-600">included on next study</span>}
                </div>
              </div>

              {ticket.study && <StudyView ticket={ticket} onAnswer={(q, a) => persistTicket({ ...ticket, answers: { ...ticket.answers, [q]: a } })} />}

              {ticket.study && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <p className={sectionTitle}>Approval</p>
                  {ticket.approved ? (
                    <p className="flex items-center gap-2 text-sm text-green-400"><ShieldCheck size={15} />Study approved — draft the test plan below.</p>
                  ) : blockingUnanswered.length > 0 ? (
                    <p className="flex items-center gap-2 text-sm text-amber-400"><AlertTriangle size={15} />{blockingUnanswered.length} blocking question(s) need answers before you can approve. Answer them above, then re-study.</p>
                  ) : (
                    <button onClick={approve} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <CheckCircle2 size={14} />Approve this study
                    </button>
                  )}
                </div>
              )}

              {ticket.approved && (
                <TestPlanSection
                  plan={plan}
                  templates={templates}
                  templateUploading={templateUploading}
                  templateError={templateError}
                  drafting={drafting}
                  planError={planError}
                  onUploadTemplate={handleTemplateUpload}
                  onRemoveTemplate={handleRemoveTemplate}
                  onDraft={draftPlan}
                  onUpdateDraft={updateDraft}
                  onApprove={approvePlan}
                  onSync={syncToTracker}
                />
              )}

              {ticket.audit.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className={clsx(sectionTitle, "flex items-center gap-1.5")}><History size={12} />Audit trail</p>
                  <div className="space-y-1">
                    {[...ticket.audit, ...plan.audit].sort((a, b) => a.ts.localeCompare(b.ts)).reverse().map((a, i) => (
                      <p key={i} className="text-xs text-slate-500">
                        <span className="text-slate-600 font-mono">{new Date(a.ts).toLocaleString()}</span> — {a.event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Test plan drafting section (Phase 2) ──────────────────
function TestPlanSection({ plan, templates, templateUploading, templateError, drafting, planError, onUploadTemplate, onRemoveTemplate, onDraft, onUpdateDraft, onApprove, onSync }: {
  plan: TestPlanTicketState;
  templates: TestPlanTemplate[];
  templateUploading: boolean;
  templateError: string;
  drafting: boolean;
  planError: string;
  onUploadTemplate: (files: FileList | null) => void;
  onRemoveTemplate: (id: string) => void;
  onDraft: () => void;
  onUpdateDraft: (mutator: (d: DraftTestPlan) => DraftTestPlan) => void;
  onApprove: () => void;
  onSync: () => void;
}) {
  const d = plan.draft;

  function updateScenario(id: string, patch: Partial<DraftScenario>) {
    onUpdateDraft(draft => ({ ...draft, scenarios: draft.scenarios.map(s => s.id === id ? { ...s, ...patch } : s) }));
  }
  function moveScenario(id: string, dir: -1 | 1) {
    onUpdateDraft(draft => {
      const idx = draft.scenarios.findIndex(s => s.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= draft.scenarios.length) return draft;
      const next = [...draft.scenarios];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...draft, scenarios: next };
    });
  }
  function removeScenario(id: string) {
    onUpdateDraft(draft => ({ ...draft, scenarios: draft.scenarios.filter(s => s.id !== id) }));
  }
  function addScenario() {
    onUpdateDraft(draft => ({ ...draft, scenarios: [...draft.scenarios, newScenario()] }));
  }
  function updateStep(scenarioId: string, stepIdx: number, patch: Partial<{ action: string; expected: string }>) {
    onUpdateDraft(draft => ({
      ...draft,
      scenarios: draft.scenarios.map(s => s.id !== scenarioId ? s : { ...s, steps: s.steps.map((st, i) => i === stepIdx ? { ...st, ...patch } : st) }),
    }));
  }
  function addStep(scenarioId: string) {
    onUpdateDraft(draft => ({
      ...draft,
      scenarios: draft.scenarios.map(s => s.id !== scenarioId ? s : { ...s, steps: [...s.steps, { action: "", expected: "" }] }),
    }));
  }
  function removeStep(scenarioId: string, stepIdx: number) {
    onUpdateDraft(draft => ({
      ...draft,
      scenarios: draft.scenarios.map(s => s.id !== scenarioId ? s : { ...s, steps: s.steps.filter((_, i) => i !== stepIdx) }),
    }));
  }

  return (
    <div className="space-y-4">
      {/* Template manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className={sectionTitle}>Your test plan style templates</p>
        <p className="text-xs text-slate-600">Upload 1–3 of your own past test plans/scenarios/scripts (.docx, .xlsx, .txt). The AI drafts in this format instead of a generic one. Replace or remove them anytime.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer">
            {templateUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {templateUploading ? "Reading…" : "Upload template"}
            <input type="file" multiple accept=".docx,.xlsx,.xls,.txt,.md" className="hidden" disabled={templateUploading}
              onChange={e => { onUploadTemplate(e.target.files); e.target.value = ""; }} />
          </label>
          {templates.map(t => (
            <span key={t.id} className="flex items-center gap-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-full">
              <FileText size={10} />{t.name}
              <button onClick={() => onRemoveTemplate(t.id)} aria-label={`Remove template ${t.name}`}><X size={10} /></button>
            </span>
          ))}
          {templates.length === 0 && !templateUploading && <span className="text-xs text-slate-600">No templates yet — drafts will use a generic structure.</span>}
        </div>
        {templateError && <p className="text-xs text-red-400">{templateError}</p>}
      </div>

      {/* Draft action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className={clsx(sectionTitle, "!mb-0 flex items-center gap-1.5")}><ClipboardList size={12} />Test Plan</p>
          <button
            onClick={onDraft}
            disabled={drafting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {drafting ? <Loader2 size={14} className="animate-spin" /> : d ? <RefreshCw size={14} /> : <Sparkles size={14} />}
            {drafting ? "Drafting… this can take a few minutes" : d ? "Re-draft test plan" : "Draft test plan"}
          </button>
        </div>
        {planError && (
          <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />{planError}
          </div>
        )}
        {plan.approved && (
          <p className="flex items-center gap-2 text-sm text-green-400"><ShieldCheck size={15} />Test plan approved {plan.approvedAt && new Date(plan.approvedAt).toLocaleString()}</p>
        )}
      </div>

      {d && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Plan title</label>
            <input
              value={d.planTitle}
              onChange={e => onUpdateDraft(draft => ({ ...draft, planTitle: e.target.value }))}
              disabled={plan.approved}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:opacity-60"
            />
          </div>

          {d.preconditions.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-1">Preconditions</p>
              <BulletList items={d.preconditions} />
            </div>
          )}

          <div className="space-y-3">
            {d.scenarios.map((s, i) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                index={i}
                total={d.scenarios.length}
                readOnly={!!plan.approved}
                onUpdate={patch => updateScenario(s.id, patch)}
                onMove={dir => moveScenario(s.id, dir)}
                onRemove={() => removeScenario(s.id)}
                onUpdateStep={(idx, patch) => updateStep(s.id, idx, patch)}
                onAddStep={() => addStep(s.id)}
                onRemoveStep={idx => removeStep(s.id, idx)}
              />
            ))}
          </div>

          {!plan.approved && (
            <button onClick={addScenario} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
              <Plus size={13} />Add scenario
            </button>
          )}

          {d.testDataNotes && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-600 mb-1">Test data notes</p>
              <p className="text-sm text-slate-400">{d.testDataNotes}</p>
            </div>
          )}
        </div>
      )}

      {d && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <p className={sectionTitle}>Approval & tracker sync</p>
          {!plan.approved ? (
            <button onClick={onApprove} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors">
              <CheckCircle2 size={14} />Approve this test plan
            </button>
          ) : plan.syncedToTracker ? (
            <p className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 size={15} />Synced to TS Tracker {plan.syncedAt && `(${new Date(plan.syncedAt).toLocaleString()})`}
              <Link href="/tests" className="flex items-center gap-1 text-indigo-400 hover:underline ml-1">View in TS Tracker <ArrowRight size={11} /></Link>
            </p>
          ) : (
            <button onClick={onSync} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <ClipboardList size={14} />Sync {d.scenarios.length} case(s) to TS Tracker
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const priorityDot: Record<ScenarioPriority, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-slate-500" };

function ScenarioCard({ scenario, index, total, readOnly, onUpdate, onMove, onRemove, onUpdateStep, onAddStep, onRemoveStep }: {
  scenario: DraftScenario;
  index: number;
  total: number;
  readOnly: boolean;
  onUpdate: (patch: Partial<DraftScenario>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onUpdateStep: (idx: number, patch: Partial<{ action: string; expected: string }>) => void;
  onAddStep: () => void;
  onRemoveStep: (idx: number) => void;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-600 shrink-0">#{index + 1}</span>
        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", priorityDot[scenario.priority])} />
        <input
          value={scenario.title}
          onChange={e => onUpdate({ title: e.target.value })}
          disabled={readOnly}
          className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 font-medium focus:outline-none focus:bg-slate-900 rounded px-1 py-0.5 disabled:opacity-70"
        />
        {scenario.tsNumber && <span className="text-xs font-mono text-indigo-400 shrink-0">{scenario.tsNumber}</span>}
        {!readOnly && (
          <>
            <select
              value={scenario.priority}
              onChange={e => onUpdate({ priority: e.target.value as ScenarioPriority })}
              className="text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button onClick={() => onMove(-1)} disabled={index === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-30 shrink-0"><ChevronUp size={13} /></button>
            <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-30 shrink-0"><ChevronDown size={13} /></button>
            <button onClick={onRemove} className="text-slate-600 hover:text-red-400 shrink-0"><Trash2 size={13} /></button>
          </>
        )}
      </div>

      {scenario.preconditions && (
        <p className="text-xs text-slate-500 pl-6"><span className="text-slate-600">Precondition:</span> {scenario.preconditions}</p>
      )}

      <div className="pl-6 space-y-1.5">
        {scenario.steps.map((step, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-start gap-1.5 text-xs">
            <span className="text-slate-600 font-mono pt-1.5">{i + 1}.</span>
            <textarea
              value={step.action}
              onChange={e => onUpdateStep(i, { action: e.target.value })}
              disabled={readOnly}
              rows={1}
              placeholder="Action"
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-300 resize-y focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:opacity-70"
            />
            <textarea
              value={step.expected}
              onChange={e => onUpdateStep(i, { expected: e.target.value })}
              disabled={readOnly}
              rows={1}
              placeholder="Expected result"
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-300 resize-y focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:opacity-70"
            />
            {!readOnly && (
              <button onClick={() => onRemoveStep(i)} className="text-slate-700 hover:text-red-400 pt-1.5"><X size={12} /></button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button onClick={onAddStep} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1">
            <Plus size={11} />Add step
          </button>
        )}
      </div>

      {scenario.notes && <p className="text-xs text-slate-600 pl-6 italic">{scenario.notes}</p>}
    </div>
  );
}

// ── Study result rendering ────────────────────────────────
function StudyView({ ticket, onAnswer }: {
  ticket: QaFlowTicketState;
  onAnswer: (question: string, answer: string) => void;
}) {
  const s = ticket.study!;
  return (
    <div className="space-y-4">
      <Section title="Overview">
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{s.overview}</p>
      </Section>

      <Section title={`Changes (${s.changes.length})`}>
        <BulletList items={s.changes} />
      </Section>

      <Section title="Affected pages & portals">
        <div className="space-y-2">
          {s.affectedAreas.map((a, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-300 mb-1">{a.portal}</p>
              <p className="text-xs text-slate-500 mb-1">{a.pages.join(" · ")}</p>
              <p className="text-sm text-slate-300">{a.whatChanges}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What to test (priority order)">
        <BulletList items={s.testFocus} numbered />
      </Section>

      {s.risks.length > 0 && (
        <Section title="Risks & regression areas" tone="amber">
          <BulletList items={s.risks} />
        </Section>
      )}

      {s.outOfScope.length > 0 && (
        <Section title="Out of scope">
          <BulletList items={s.outOfScope} />
        </Section>
      )}

      <Section title={`Open questions (${s.openQuestions.length})`} tone={s.openQuestions.some(q => q.blocking) ? "red" : undefined}>
        {s.openQuestions.length === 0 && <p className="text-sm text-green-400">None — the requirement looks complete.</p>}
        <div className="space-y-3">
          {s.openQuestions.map((q, i) => (
            <div key={i} className={clsx("rounded-lg p-3 border", q.blocking ? "bg-red-950/30 border-red-800/50" : "bg-slate-800/60 border-slate-700/60")}>
              <div className="flex items-start gap-2">
                <HelpCircle size={14} className={clsx("shrink-0 mt-0.5", q.blocking ? "text-red-400" : "text-amber-400")} />
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{q.question}
                    {q.blocking && <span className="ml-2 text-xs bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded-full font-medium">blocking</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.why}</p>
                  <textarea
                    value={ticket.answers[q.question] ?? ""}
                    onChange={e => onAnswer(q.question, e.target.value)}
                    rows={2}
                    placeholder="Your answer… (then hit Re-study to fold it in)"
                    className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="text-xs text-slate-600 space-y-1">
        <p>{s.confidenceNote}</p>
        {ticket.meta && (
          <p>
            Read: {ticket.meta.attachmentsUsed.join(", ") || "no attachments"}
            {ticket.meta.attachmentsSkipped.length > 0 && ` · Skipped: ${ticket.meta.attachmentsSkipped.join(", ")}`}
            {ticket.studiedAt && ` · Studied ${new Date(ticket.studiedAt).toLocaleString()}`}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone?: "amber" | "red"; children: React.ReactNode }) {
  return (
    <div className={clsx(
      "bg-slate-900 border rounded-xl p-4",
      tone === "red" ? "border-red-900/60" : tone === "amber" ? "border-amber-900/60" : "border-slate-800"
    )}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{title}</p>
      {children}
    </div>
  );
}

function BulletList({ items, numbered }: { items: string[]; numbered?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <span className="text-slate-600 shrink-0 mt-0.5 text-xs font-mono">{numbered ? `${i + 1}.` : "•"}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
