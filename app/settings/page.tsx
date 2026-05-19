"use client";
import { useState, useRef, useEffect } from "react";
import {
  Eye, EyeOff, CheckCircle, AlertCircle, Loader2,
  Download, Upload, Save, RefreshCw, LogOut, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/components/AppShell";
import { clearCredentials } from "@/lib/jira";
import { storeCredentials, exportLocalStorage, importLocalStorage } from "@/lib/jira";
import {
  BackupSettings, getBackupSettings, saveBackupSettings,
  nextBackupDate, DEFAULT_BACKUP_SETTINGS,
} from "@/lib/kanban";

export default function SettingsPage() {
  const { creds, setCreds } = useApp();

  // Jira fields
  const [baseUrl, setBaseUrl] = useState(creds?.baseUrl ?? "");
  const [email, setEmail] = useState(creds?.email ?? "");
  const [apiToken, setApiToken] = useState(creds?.apiToken ?? "");
  const [tokenExpiry, setTokenExpiry] = useState(creds?.tokenExpiry ?? "");
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [jiraSaved, setJiraSaved] = useState(false);
  const [disconnectStep, setDisconnectStep] = useState<0 | 1 | 2>(0);

  // Backup fields
  const [backup, setBackup] = useState<BackupSettings>(DEFAULT_BACKUP_SETTINGS);
  const [importMsg, setImportMsg] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBackup(getBackupSettings());
  }, []);

  // Update jira fields when creds change (e.g. on first load)
  useEffect(() => {
    if (creds) {
      setBaseUrl(creds.baseUrl);
      setEmail(creds.email);
      setApiToken(creds.apiToken);
      setTokenExpiry(creds.tokenExpiry ?? "");
    }
  }, [creds]);

  async function handleTestJira() {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const res = await fetch("/api/jira/myself", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, email, apiToken }),
      });
      const data = await res.json();
      if (!res.ok) { setTestStatus("error"); setTestMsg(data.error ?? "Connection failed"); }
      else { setTestStatus("ok"); setTestMsg(`Connected as ${data.displayName}`); }
    } catch {
      setTestStatus("error");
      setTestMsg("Network error — check the Jira URL");
    }
  }

  function handleSaveJira() {
    const c = { baseUrl, email, apiToken, tokenExpiry: tokenExpiry || undefined };
    storeCredentials(c);
    setCreds(c);
    setJiraSaved(true);
    setTimeout(() => setJiraSaved(false), 2500);
  }

  function handleSaveBackup(updated: BackupSettings) {
    setBackup(updated);
    saveBackupSettings(updated);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importLocalStorage(file);
      setImportMsg("Imported! Reload the page to apply.");
      setTimeout(() => setImportMsg(""), 5000);
    } catch {
      setImportMsg("Invalid backup file.");
      setTimeout(() => setImportMsg(""), 3000);
    }
    e.target.value = "";
  }

  const nextBackup = nextBackupDate(backup);

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center">
        <h1 className="text-sm font-semibold text-slate-200">Settings</h1>
      </header>

      <div className="flex-1 px-6 py-6 max-w-3xl space-y-6">

        {/* ── Jira Connection ── */}
        <Section title="Jira Connection" description="Connect your Atlassian account to sync issues.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jira Base URL" className="sm:col-span-2">
              <input
                type="url"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://your-org.atlassian.net"
                className={input}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={input}
              />
            </Field>
            <Field label={<>API Token <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline ml-1">Generate →</a></>}>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={e => setApiToken(e.target.value)}
                  placeholder="Paste your token"
                  className={input + " pr-9"}
                />
                <button type="button" onClick={() => setShowToken(v => !v)} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300">
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="Token Expiry Date" hint="Used to show expiry reminders on the dashboard.">
              <input
                type="date"
                value={tokenExpiry}
                onChange={e => setTokenExpiry(e.target.value)}
                className={input + " [color-scheme:dark]"}
              />
            </Field>
          </div>

          {testMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mt-2 ${testStatus === "ok" ? "bg-green-950/60 border border-green-800 text-green-400" : "bg-red-950/60 border border-red-800 text-red-400"}`}>
              {testStatus === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {testMsg}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleTestJira}
              disabled={!baseUrl || !email || !apiToken || testStatus === "loading"}
              className={secondaryBtn}
            >
              {testStatus === "loading" && <Loader2 size={13} className="animate-spin" />}
              <RefreshCw size={13} />
              Test Connection
            </button>
            <button
              onClick={handleSaveJira}
              disabled={!baseUrl || !email || !apiToken}
              className={primaryBtn}
            >
              {jiraSaved ? <CheckCircle size={13} /> : <Save size={13} />}
              {jiraSaved ? "Saved!" : "Save"}
            </button>
          </div>
        </Section>

        {/* ── Backup & Data ── */}
        <Section title="Backup & Data" description="Automatically download a backup of all your dashboard data.">
          <div className="space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200 font-medium">Automatic Backup</p>
                <p className="text-xs text-slate-500 mt-0.5">Downloads a JSON file while your laptop is running</p>
              </div>
              <button
                onClick={() => handleSaveBackup({ ...backup, enabled: !backup.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${backup.enabled ? "bg-blue-600" : "bg-slate-700"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${backup.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {backup.enabled && (
              <div className="grid gap-4 sm:grid-cols-3 pt-1 border-t border-slate-800">
                <Field label="Frequency">
                  <select
                    value={backup.intervalWeeks}
                    onChange={e => handleSaveBackup({ ...backup, intervalWeeks: Number(e.target.value) as 1 | 2 })}
                    className={select}
                  >
                    <option value={1}>Every Friday</option>
                    <option value={2}>Every 2 Fridays</option>
                  </select>
                </Field>
                <Field label="Time">
                  <input
                    type="time"
                    value={backup.time}
                    onChange={e => handleSaveBackup({ ...backup, time: e.target.value })}
                    className={input + " [color-scheme:dark]"}
                  />
                </Field>
                <Field label="Status">
                  <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm space-y-1">
                    <p className="text-slate-500 text-xs">Last backup</p>
                    <p className="text-slate-300 font-medium text-xs">
                      {backup.lastBackupDate
                        ? new Date(backup.lastBackupDate).toLocaleDateString()
                        : "Never"}
                    </p>
                    {nextBackup && (
                      <>
                        <p className="text-slate-500 text-xs pt-1">Next scheduled</p>
                        <p className="text-slate-300 font-medium text-xs">
                          {nextBackup.toLocaleDateString()} at {backup.time}
                        </p>
                      </>
                    )}
                  </div>
                </Field>
              </div>
            )}

            <p className="text-xs text-slate-600">
              The backup runs automatically when the app is open and the scheduled time passes. Nothing is sent to any server.
            </p>
          </div>

          {/* Manual export/import */}
          <div className="border-t border-slate-800 pt-4 mt-2">
            <p className="text-sm text-slate-300 font-medium mb-3">Manual Export / Import</p>
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={exportLocalStorage} className={secondaryBtn}>
                <Download size={13} />
                Export Backup
              </button>
              <button onClick={() => importRef.current?.click()} className={secondaryBtn}>
                <Upload size={13} />
                Import Backup
              </button>
              <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              {importMsg && <p className="text-xs text-blue-400">{importMsg}</p>}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Exports all localStorage data (Jira credentials, Kanban board, backup settings) as a single JSON file.
            </p>
          </div>
        </Section>

        {/* ── Danger Zone ── */}
        {creds && (
          <Section title="Danger Zone" description="Irreversible actions. Please read carefully before proceeding.">
            <div className="border border-red-900/60 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <LogOut size={14} className="text-red-400" />
                    Disconnect Jira
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Removes your Jira URL, email, and API token from this browser.
                    Your Kanban cards and notes will be kept.
                  </p>
                </div>
                {disconnectStep === 0 && (
                  <button onClick={() => setDisconnectStep(1)} className="shrink-0 px-3 py-1.5 text-xs text-red-400 border border-red-800 rounded-lg hover:bg-red-950/40 transition-colors">
                    Disconnect
                  </button>
                )}
              </div>

              {disconnectStep === 1 && (
                <div className="mt-4 bg-red-950/30 border border-red-800/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-300 space-y-1">
                      <p className="font-semibold">Are you sure you want to disconnect?</p>
                      <p className="text-xs text-red-400/80">
                        Your API token will be deleted from this browser. If you did not save it somewhere else, you will need to generate a new one from
                        {" "}<a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer" className="underline hover:no-underline">id.atlassian.com</a>{" "}
                        to reconnect.
                      </p>
                      <p className="text-xs text-red-400/80">
                        Your Kanban board, notes, and to-do list will <strong>not</strong> be affected.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setDisconnectStep(0)} className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => setDisconnectStep(2)} className="px-3 py-1.5 text-xs bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors">
                      Yes, I understand — continue
                    </button>
                  </div>
                </div>
              )}

              {disconnectStep === 2 && (
                <div className="mt-4 bg-red-950/40 border border-red-700 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-200 flex items-center gap-2">
                    <AlertTriangle size={15} />
                    Final confirmation
                  </p>
                  <p className="text-xs text-red-400">
                    This is your last chance. Click &quot;Disconnect now&quot; to permanently remove your Jira credentials from this browser.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setDisconnectStep(0)} className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        clearCredentials();
                        setCreds(null);
                        setBaseUrl(""); setEmail(""); setApiToken(""); setTokenExpiry("");
                        setDisconnectStep(0);
                      }}
                      className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 font-semibold transition-colors"
                    >
                      Disconnect now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

// ── Shared style constants ──
const input = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600";
const select = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
const primaryBtn = "flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
const secondaryBtn = "flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children, className }: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}
