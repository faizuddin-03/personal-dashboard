import { SearchCheck, CircleDashed } from "lucide-react";

// Placeholder page — the plan only, in text. Nothing is wired up yet; the rules,
// items to check and the flow itself land tomorrow. Kept as a static server
// component on purpose: no state, no fetching, nothing to hydrate.

const card = "bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur";
const h2 = "text-sm font-semibold text-slate-200 mb-3";
const p = "text-sm text-slate-400 leading-relaxed";
const li = "text-sm text-slate-400 leading-relaxed flex gap-2.5";
const bullet = <span className="text-slate-600 select-none">—</span>;

export default function CheckerPage() {
  return (
    <div className="p-6 sm:p-8 space-y-5 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 ring-1 ring-emerald-400/20 grid place-items-center">
          <SearchCheck size={20} className="text-emerald-300" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Checker</h1>
          <p className="text-xs text-slate-500">eAuto · data-validity checks, not test runs</p>
        </div>
      </div>

      {/* ── Status banner ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4">
        <CircleDashed size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-200">Planned — nothing is built yet</p>
          <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
            This page is the written plan only. Rules, items to check and the flow come next.
          </p>
        </div>
      </div>

      {/* ── Purpose ── */}
      <div className={card}>
        <h2 className={h2}>What this page is for</h2>
        <p className={p}>
          Some flows need <span className="text-slate-300">legitimately valid</span> company details,
          which have to be sourced by hand. The catch is that a detail can be perfectly valid and
          still be unusable, because it has already been consumed in the staging database. This page
          automates that cross-check: give it the details, it reports whether each one is still free
          to use.
        </p>
        <p className={`${p} mt-3`}>
          These are <span className="text-slate-300">not tests</span>. No pass/fail, no evidence, and
          <span className="text-slate-300"> no recording</span> — the video/trace pipeline used by the
          test runners does not apply here.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className={card}>
        <h2 className={h2}>Layout — one page, many checkers</h2>
        <p className={p}>
          Several kinds of checker will live here, reached by a tab strip along the top. Sketch:
        </p>
        <div className="mt-4 flex items-center gap-1 border-b border-slate-800 pb-0">
          <span className="px-3.5 py-2 text-xs font-medium text-slate-200 border-b-2 border-emerald-500 -mb-px">
            Checker A
          </span>
          <span className="px-3.5 py-2 text-xs text-slate-600">Checker B</span>
          <span className="px-3.5 py-2 text-xs text-slate-600">Checker C</span>
          <span className="px-3.5 py-2 text-xs text-slate-700">+</span>
        </div>
        <p className={`${p} mt-4`}>
          Each tab is self-contained — its own inputs, its own run, its own results — but they all
          share the standard controls below, so moving between them feels the same.
        </p>
      </div>

      {/* ── Standard controls ── */}
      <div className={card}>
        <h2 className={h2}>Standard controls — on every checker, always</h2>
        <ul className="space-y-2.5">
          <li className={li}>{bullet}<span><span className="text-slate-300">Staging environment</span> — chosen per run, since a detail free on one environment may already be taken on another.</span></li>
          <li className={li}>{bullet}<span><span className="text-slate-300">User credentials</span> — username and password, entered per run.</span></li>
        </ul>
      </div>

      {/* ── Checker A ── */}
      <div className={card}>
        <h2 className={h2}>Checker A — Company ROC, New ROC &amp; TIN</h2>
        <p className={p}>The first checker. Takes company registration details and answers one question per item: can this be used?</p>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-2">Single check</p>
            <p className="text-xs text-slate-500 leading-relaxed">One set of details, one result. For when you just need to clear a single company before using it.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-2">Bulk check</p>
            <p className="text-xs text-slate-500 leading-relaxed">Many at once, with <span className="text-slate-400">multiple runners in parallel</span> rather than one after another, so a long list doesn&apos;t take a long time.</p>
          </div>
        </div>

        <p className={`${p} mt-5 mb-3`}>Result per item — two states for now:</p>
        <div className="flex flex-wrap gap-2.5">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-950/60 text-green-300 border border-green-800">Able to use</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 text-red-300 border border-red-800">Unable to use</span>
        </div>
      </div>

      {/* ── Open questions ── */}
      <div className={card}>
        <h2 className={h2}>To settle tomorrow</h2>
        <p className={`${p} mb-3`}>Answers needed before any of this gets built:</p>
        <ul className="space-y-2.5">
          <li className={li}>{bullet}<span>The rules — what makes an ROC / New ROC / TIN usable, and how &quot;already used&quot; is determined (which screen or record proves it).</span></li>
          <li className={li}>{bullet}<span>Which environments appear in the picker, and whether credentials should be remembered or re-entered each run.</span></li>
          <li className={li}>{bullet}<span>Bulk input format — pasted list, CSV, or Excel — and how many runners should go at once.</span></li>
          <li className={li}>{bullet}<span>Whether a third state is needed. <span className="text-slate-300">Unable to use</span> and <span className="text-slate-300">the check itself failed</span> (login died, page timed out) are different outcomes, and red for both would hide a broken run.</span></li>
          <li className={li}>{bullet}<span>Whether bulk results need exporting, and whether a run should be stoppable midway.</span></li>
        </ul>
      </div>
    </div>
  );
}
