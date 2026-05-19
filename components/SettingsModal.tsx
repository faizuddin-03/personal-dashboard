"use client";
import { useState } from "react";
import { X, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { JiraCredentials, storeCredentials } from "@/lib/jira";

interface Props {
  onClose: () => void;
  onSaved: (creds: JiraCredentials) => void;
  initial: JiraCredentials | null;
}

export default function SettingsModal({ onClose, onSaved, initial }: Props) {
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [apiToken, setApiToken] = useState(initial?.apiToken ?? "");
  const [tokenExpiry, setTokenExpiry] = useState(initial?.tokenExpiry ?? "");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleTest() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/jira/myself", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, email, apiToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Connection failed");
      } else {
        setStatus("ok");
        setMessage(`Connected as ${data.displayName}`);
      }
    } catch {
      setStatus("error");
      setMessage("Network error — check the Jira URL");
    }
  }

  function handleSave() {
    const creds: JiraCredentials = { baseUrl, email, apiToken, tokenExpiry: tokenExpiry || undefined };
    storeCredentials(creds);
    onSaved(creds);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">Jira Connection Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Jira URL */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Jira Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-org.atlassian.net"
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Jira Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              API Token
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-blue-400 hover:underline"
              >
                Generate one →
              </a>
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Your API token"
                className="w-full px-3 py-2 pr-10 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Stored only in your browser&apos;s localStorage — never sent anywhere except your Jira.
            </p>
          </div>

          {/* Token expiry */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Token Expiry Date
              <span className="ml-1 text-slate-600">(optional — for expiry reminders)</span>
            </label>
            <input
              type="date"
              value={tokenExpiry}
              onChange={(e) => setTokenExpiry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 [color-scheme:dark]"
            />
          </div>

          {/* Status message */}
          {message && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                status === "ok"
                  ? "bg-green-950/60 text-green-400 border border-green-800"
                  : "bg-red-950/60 text-red-400 border border-red-800"
              }`}
            >
              {status === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {message}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-800">
          <button
            onClick={handleTest}
            disabled={!baseUrl || !email || !apiToken || status === "loading"}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" && <Loader2 size={13} className="animate-spin" />}
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={!baseUrl || !email || !apiToken}
            className="ml-auto px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
