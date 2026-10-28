"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

// Google sign-in for the saved eAuto browser (12153, 12257, Create
// Pre-Application). A Chrome profile signed in to Google gets the reCAPTCHA
// as a single tick far more often than a blank one (2026-10-22). See
// app/api/eauto/browser-profile/route.ts and scripts/*/utils/savedBrowser.ts.

interface Status { chromeFound: boolean; account: string | null; open: boolean; error?: string }

export default function EautoBrowserSignIn() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/eauto/browser-profile").then(r => r.json()).then(setS).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // Re-check while the sign-in window may be open, and when the tab regains focus.
    const t = setInterval(load, 5000);
    window.addEventListener("focus", load);
    return () => { clearInterval(t); window.removeEventListener("focus", load); };
  }, [load]);

  async function open() {
    setBusy(true);
    try { const r = await fetch("/api/eauto/browser-profile", { method: "POST" }); setS(await r.json()); } catch { /* ignore */ }
    setBusy(false);
  }

  if (!s) return null;
  if (!s.chromeFound) {
    return <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-400"><AlertTriangle size={11} />Google Chrome not found — runs use a fresh browser</p>;
  }
  return (
    <div className="mt-1.5 space-y-1 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {s.account
          ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} />eAuto browser signed in to Google: {s.account}</span>
          : <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={11} />eAuto browser not signed in to Google — reCAPTCHA asks harder</span>}
        <button type="button" onClick={open} disabled={busy || s.open}
          className="flex items-center gap-1 rounded border border-slate-700 px-1.5 py-0.5 text-slate-300 hover:border-slate-500 hover:text-slate-100 disabled:opacity-50">
          {busy ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />}
          {s.account ? "Open eAuto browser" : "Open eAuto browser to sign in"}
        </button>
      </div>
      {s.open && <p className="text-amber-400">The eAuto browser window is open. Sign in, then close that window before you run — a run cannot use it while it is open.</p>}
    </div>
  );
}
