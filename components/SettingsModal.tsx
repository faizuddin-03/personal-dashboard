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
    const creds: JiraCredentials = { baseUrl, email, apiToken };
    storeCredentials(creds);
    onSaved(creds);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Jira Connection Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jira Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-org.atlassian.net"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jira Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Token
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-blue-500 text-xs hover:underline"
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
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Stored only in your browser&apos;s localStorage — never sent to any server other than your Jira instance.
            </p>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                status === "ok"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {status === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={handleTest}
            disabled={!baseUrl || !email || !apiToken || status === "loading"}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" && <Loader2 size={14} className="animate-spin" />}
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={!baseUrl || !email || !apiToken}
            className="ml-auto px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
