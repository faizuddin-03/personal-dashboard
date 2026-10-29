"use client";
import { useState } from "react";
import { Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, Film, Download, Image as ImageIcon, FileArchive } from "lucide-react";
import { useApp } from "@/components/AppShell";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, type EvidenceGroup, type EvidenceGroupStatus } from "@/components/EvidenceBulkDownload";
import PastRunsSection from "./PastRunsSection";

/** Registry key for this tab's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. Keeps the run (and its result) alive across
 *  navigating to another dashboard page/tab and back. */
const RUN_KEY = "eauto/user-access-regression";

// User Access Regression — confirms a batch of BO accounts have VIEW-ONLY
// access to the Biometric Device Purchase & Software Installation Listing:
// logs in as each account, searches recent Biometric Device Purchase
// records, and checks the [Update Shipping Details] button is absent on a
// sample of rows (1, 4, 7). NOT tied to any TS or ticket — a standalone
// permissions regression check, lives as a second tab on the 12166 page per
// Faizuddin, 2026-09-24 ("put it in page 12166, but a different tab").

const ENV_PRESETS = [
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
  { label: "UAT4", value: "https://staging.eauto.my/uat4" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "SIT2", value: "https://staging.eauto.my/sit2" },
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
] as const;

const ACCOUNTS_KEY = "uar_accounts_text";

function loadAccountsText(): string {
  try {
    return localStorage.getItem(ACCOUNTS_KEY) ?? "";
  } catch {
    return "";
  }
}
function saveAccountsText(text: string) {
  try { localStorage.setItem(ACCOUNTS_KEY, text); } catch { /* ignore */ }
}

interface Account {
  username: string;
  password: string;
}

/** One "username,password" per line — blank lines and lines starting with
 *  "#" are ignored, so a QA can comment out an account without deleting it. */
function parseAccounts(text: string): { accounts: Account[]; badLines: number[] } {
  const accounts: Account[] = [];
  const badLines: number[] = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const idx = line.indexOf(",");
    if (idx === -1) { badLines.push(i + 1); return; }
    const username = line.slice(0, idx).trim();
    const password = line.slice(idx + 1).trim();
    if (!username || !password) { badLines.push(i + 1); return; }
    accounts.push({ username, password });
  });
  return { accounts, badLines };
}

interface RowCheck {
  rowNumber: number;
  reference: string;
  updateButtonPresent: boolean;
}
interface AccountResult {
  username: string;
  loginOk: boolean;
  rowsFound: number;
  checked: RowCheck[];
  pass: boolean;
  /** This account can't reach the listing's filter form at all — a genuine
   *  positive finding (no listing access implies no update access either),
   *  confirmed live 2026-09-24. Shown distinctly from a normal view-only pass. */
  noListingAccess?: boolean;
  error?: string;
}
interface EvidenceItem {
  label: string;
  url: string;
  kind: "video" | "image" | "trace";
}
interface RunResponse {
  result?: { results: AccountResult[] } | null;
  error?: string;
  stopped?: boolean;
  evidence?: EvidenceItem[];
  timestamp?: string;
  stderr?: string;
  stdout?: string;
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function UserAccessRegressionTab() {
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const res = (bgRun?.result as RunResponse | null) ?? null;
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || res?.error || "";

  const [baseUrl, setBaseUrl] = useState<string>(ENV_PRESETS[0].value);
  const [headless, setHeadless] = useState(true);
  const [detailed, setDetailed] = useState(true);
  const [accountsText, setAccountsText] = useState(
    typeof window !== "undefined" ? loadAccountsText() : "",
  );
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllError, setDownloadAllError] = useState("");

  const { accounts, badLines } = parseAccounts(accountsText);

  // Evidence is published per account under "Account <user> - Account <user>/<file>" —
  // those folders are the groups for All / Passed only / Failed only / Selected
  // (Faizuddin, 2026-10-21).
  const [bulkPicked, setBulkPicked] = useState<Set<string>>(new Set());
  const toggleBulk = (key: string) => setBulkPicked(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const folderOf = (e: EvidenceItem) => (e.label.includes("/") ? e.label.split("/")[0] : "");
  const statusOfFolder = (folder: string): EvidenceGroupStatus => {
    const r = res?.result?.results.find(a => folder === `Account ${a.username} - Account ${a.username}`);
    return r ? (r.pass ? "passed" : "failed") : "unknown";
  };
  const evidenceGroups: EvidenceGroup[] = Array.from(new Set((res?.evidence ?? []).map(folderOf).filter(Boolean))).map(folder => ({
    key: folder, label: folder, status: statusOfFolder(folder), fileCount: (res?.evidence ?? []).filter(e => folderOf(e) === folder).length,
  }));

  /** `folders` = per-account evidence subfolders (Passed only / Failed only /
   *  Selected); omitted = the whole run. */
  async function downloadAllEvidence(runId: string, folders?: string[], zipSuffix = "") {
    setDownloadingAll(true);
    setDownloadAllError("");
    try {
      const r = await fetch("/api/eauto/user-access-regression/download-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, ...(folders ? { folders } : {}) }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${r.status})`);
      }
      const blob = await r.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl; a.download = `user-access-regression-evidence${zipSuffix}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setDownloadAllError(e instanceof Error ? e.message : "Failed to download the evidence bundle.");
    } finally {
      setDownloadingAll(false);
    }
  }

  function run() {
    if (accounts.length === 0) {
      setFormError("Enter at least one account as \"username,password\" (one per line).");
      return;
    }
    setFormError("");
    saveAccountsText(accountsText);
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto/user-access-regression/run",
      stopUrl: "/api/eauto/user-access-regression/run",
      meta: { accountCount: accounts.length, env: baseUrl },
      body: { accounts, headless, baseUrl, detailed },
    });
  }

  const results = res?.result?.results ?? [];
  // An error (login failure, page/selector timeout, etc.) means we never
  // actually got to check a row — that's INCONCLUSIVE, not proof of access.
  // Conflating the two used to show real timeouts as "Has access", which is
  // simply false: the automation never saw a single row for that account.
  const errorCount = results.filter((r) => !!r.error).length;
  const passCount = results.filter((r) => r.pass && !r.error).length;
  const failCount = results.length - passCount - errorCount;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr]">
      <aside className="border-r border-slate-800 p-4 space-y-3">
        <div>
          <label className={label}>Environment</label>
          <select value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className={field}>
            {ENV_PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>BO Accounts <span className="text-red-400">*</span></label>
          <textarea
            value={accountsText}
            onChange={e => setAccountsText(e.target.value)}
            className={field}
            rows={8}
            placeholder={"username1,password1\nusername2,password2\n# lines starting with # are ignored"}
          />
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            One account per line, as <code className="text-slate-400">username,password</code>. Each account
            is checked in turn — login, search recent Biometric Device Purchase records, confirm no
            [Update Shipping Details] button on rows 1, 4 and 7 of the results.
          </p>
          {accountsText.trim() && (
            <p className="mt-1 text-[11px] text-slate-500">
              {accounts.length} account(s) parsed
              {badLines.length > 0 && (
                <span className="text-amber-400"> · line(s) {badLines.join(", ")} couldn&apos;t be parsed (need &quot;username,password&quot;)</span>
              )}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)}
            className="accent-indigo-600" />
          Headless
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each element being acted on or checked, so the recording is easy to review step by step.">
          <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)}
            className="accent-indigo-600" />
          Detailed (slow + highlighted)
        </label>

        <div className="pt-1">
          {!running ? (
            <button onClick={run}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Play size={14} />Run Access Check
            </button>
          ) : (
            <button onClick={() => stopRun(RUN_KEY)} disabled={bgRun?.stopping}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
              <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
            </button>
          )}
        </div>
        {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
      </aside>

      <main className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-2xl space-y-5">
          {running && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" />
              Checking {String(bgRun?.meta?.accountCount ?? accounts.length)} account(s)
              {" "}on {String(bgRun?.meta?.env ?? baseUrl).replace("https://staging.eauto.my/", "")}…
            </div>
          )}

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

          {results.length > 0 && (
            <>
              <p className="text-xs text-slate-400">
                <span className="text-green-400">{passCount} view-only</span>
                {" · "}
                <span className={failCount > 0 ? "text-red-400" : "text-slate-500"}>{failCount} still have access</span>
                {errorCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-amber-400">{errorCount} inconclusive</span>
                  </>
                )}
              </p>

              <div className="space-y-3">
                {results.map((r, i) => {
                  const status: "pass" | "fail" | "error" = r.error ? "error" : r.pass ? "pass" : "fail";
                  return (
                  <div key={`${r.username}-${i}`} className={
                    "rounded-xl border p-4 " + (
                      status === "pass" ? "border-green-800/50 bg-green-950/25"
                      : status === "error" ? "border-amber-800/50 bg-amber-950/25"
                      : "border-red-800/50 bg-red-950/25"
                    )
                  }>
                    <p className={"flex items-center gap-2 text-sm font-semibold " + (
                      status === "pass" ? "text-green-300"
                      : status === "error" ? "text-amber-300"
                      : "text-red-300"
                    )}>
                      {status === "pass" ? <CheckCircle2 size={15} />
                        : status === "error" ? <AlertTriangle size={15} />
                        : <XCircle size={15} />}
                      {r.username}
                      <span className="ml-auto text-[10px] font-normal uppercase tracking-wide">
                        {r.noListingAccess ? "No listing access" : status === "pass" ? "View-only" : status === "error" ? "Inconclusive" : "Has access"}
                      </span>
                    </p>

                    {r.noListingAccess && (
                      <p className="mt-2 text-xs text-green-400">
                        Confirmed: this account can&apos;t reach the listing&apos;s filter form at all — no
                        listing access, so no update access either.
                      </p>
                    )}
                    {!r.loginOk && !r.error && (
                      <p className="mt-2 text-xs text-red-400">Login failed — could not verify this account.</p>
                    )}
                    {r.loginOk && !r.noListingAccess && r.checked.length === 0 && !r.error && (
                      <p className="mt-2 text-xs text-amber-400">
                        {r.rowsFound === 0
                          ? "No Biometric Device Purchase records found in the last month to check."
                          : "None of rows 1, 4 or 7 existed in the result set."}
                      </p>
                    )}
                    {r.error && (
                      <p className="mt-2 text-xs text-amber-400">
                        Could not finish checking this account — the automation hit an error before it could look
                        at any row, so this is NOT confirmation of access either way: {r.error}
                      </p>
                    )}

                    {r.checked.length > 0 && (
                      <div className="mt-3 space-y-1 text-xs">
                        {r.checked.map((c) => (
                          <div key={c.rowNumber} className="flex justify-between border-t border-slate-800/50 py-1">
                            <span className="text-slate-500">Row {c.rowNumber} · {c.reference}</span>
                            <span className={c.updateButtonPresent ? "text-red-400" : "text-slate-300"}>
                              {c.updateButtonPresent ? "[Update Shipping Details] present" : "No update button"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          )}

          {res?.evidence && res.evidence.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 flex-1"><Film size={12} />Evidence ({res.evidence.length} files)</p>
                {evidenceGroups.length < 2 && <button
                  onClick={() => downloadAllEvidence(res.timestamp ?? "")}
                  disabled={downloadingAll || !res.timestamp}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-colors"
                >
                  {downloadingAll ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  {downloadingAll ? "Zipping…" : "Download all"}
                </button>}
              </div>
              <EvidenceBulkDownload groups={evidenceGroups} selected={bulkPicked} busy={downloadingAll}
                onDownload={(g, mode) => downloadAllEvidence(res.timestamp ?? "", g.map(x => x.key), mode === "all" ? "" : `-${mode}`)}
                onClearSelection={() => setBulkPicked(new Set())} />
              {downloadAllError && <p className="text-[11px] text-red-400">{downloadAllError}</p>}
              <div className="space-y-3">
                {res.evidence.map((e, idx) => (
                  <div key={e.url} className="space-y-1">
                    {evidenceGroups.length > 1 && folderOf(e) !== (idx > 0 ? folderOf(res.evidence![idx - 1]) : null) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800 first:border-t-0 first:pt-0">
                        <EvidenceGroupCheckbox checked={bulkPicked.has(folderOf(e))} onChange={() => toggleBulk(folderOf(e))} />
                        {statusOfFolder(folderOf(e)) === "passed" ? <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                          : statusOfFolder(folderOf(e)) === "failed" ? <XCircle size={12} className="text-red-400 shrink-0" /> : null}
                        <span className="text-[11px] font-mono font-semibold text-slate-300">{folderOf(e)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {e.kind === "video" ? <Film size={12} className="shrink-0" />
                        : e.kind === "image" ? <ImageIcon size={12} className="shrink-0" />
                          : <FileArchive size={12} className="shrink-0" />}
                      <span className="font-mono break-all flex-1">{e.label}</span>
                      <a href={e.url} download className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 shrink-0">
                        <Download size={11} />Download
                      </a>
                    </div>
                    {e.kind === "video" && (
                      <video src={e.url} controls className="w-full max-w-xl rounded-lg border border-slate-800" />
                    )}
                    {e.kind === "image" && (
                      <img src={e.url} alt={e.label} className="max-w-xl rounded-lg border border-slate-800" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <PastRunsSection
            historyUrl="/api/eauto/user-access-regression/history"
            downloadUrl="/api/eauto/user-access-regression/download-all"
            zipPrefix="user-access-regression-evidence"
            currentRunId={res?.timestamp}
            refreshKey={bgRun?.finishedAt}
          />

          {(res?.stderr || res?.stdout) && (
            <details className="bg-slate-900 border border-slate-800 rounded-xl">
              <summary className="cursor-pointer px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200">
                Raw run output
              </summary>
              <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                {res.stderr}
                {res.stdout}
              </pre>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}
