"use client";
import { useState, useEffect, useCallback } from "react";
import {
  AtSign, RefreshCw, CheckCheck, ExternalLink, Loader2,
  Bell, BellOff, AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";

interface Mention {
  issueKey: string;
  issueSummary: string;
  commentId: string;
  commenterName: string;
  commenterAvatar: string;
  snippet: string;
  created: string;
  issueUrl: string;
}

const READ_KEY = "jira_read_mentions";

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]")); }
  catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function AvatarImg({ src, name }: { src: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-700/40 border border-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      className="w-8 h-8 rounded-full border border-slate-700 shrink-0 object-cover"
    />
  );
}

export default function MentionsPage() {
  const { creds, openSettings } = useApp();
  const [mentions, setMentions]   = useState<Mention[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [readIds, setReadIds]     = useState<Set<string>>(new Set());
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => { setReadIds(getReadIds()); }, []);

  const fetchMentions = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        baseUrl:  creds.baseUrl,
        email:    creds.email,
        apiToken: creds.apiToken,
      });
      const res  = await fetch(`/api/jira/mentions?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setMentions(data.mentions ?? []);
      setLastFetched(new Date());
    } catch {
      setError("Network error — could not fetch mentions.");
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => { fetchMentions(); }, [fetchMentions]);

  function markRead(commentId: string) {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(commentId);
      saveReadIds(next);
      return next;
    });
  }

  function markAllRead() {
    setReadIds(prev => {
      const next = new Set(prev);
      mentions.forEach(m => next.add(m.commentId));
      saveReadIds(next);
      return next;
    });
  }

  const unread = mentions.filter(m => !readIds.has(m.commentId));
  const read   = mentions.filter(m => readIds.has(m.commentId));

  if (!creds) {
    return (
      <div className="flex flex-col min-h-full">
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center gap-3">
          <AtSign size={15} className="text-blue-400" />
          <h1 className="text-sm font-semibold text-slate-200">Mentions</h1>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 py-24 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <AtSign size={22} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">JIRA not connected</p>
          <p className="text-slate-600 text-xs mb-5">Connect your JIRA account to see mentions</p>
          <button onClick={openSettings} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Connect JIRA</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AtSign size={15} className="text-blue-400" />
          <h1 className="text-sm font-semibold text-slate-200">Mentions</h1>
          {unread.length > 0 && (
            <span className="text-xs bg-blue-600/20 text-blue-300 border border-blue-600/30 px-2 py-0.5 rounded-full font-semibold">
              {unread.length} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-xs text-slate-700 hidden sm:block">
              Updated {relativeTime(lastFetched.toISOString())}
            </span>
          )}
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              <BellOff size={12} /> Mark all read
            </button>
          )}
          <button
            onClick={fetchMentions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-2xl px-4 sm:px-6 py-4 sm:py-5 space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-800/40 rounded-xl">
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && mentions.length === 0 && (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-600">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Fetching mentions…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && mentions.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Bell size={22} className="text-slate-700" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No mentions found</p>
            <p className="text-slate-600 text-xs mt-1">When someone @mentions you in a JIRA comment, it'll show up here</p>
          </div>
        )}

        {/* Unread mentions */}
        {unread.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Unread</p>
            <div className="space-y-2">
              {unread.map(m => (
                <MentionRow key={m.commentId} mention={m} unread onMarkRead={() => markRead(m.commentId)} />
              ))}
            </div>
          </section>
        )}

        {/* Read mentions */}
        {read.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {unread.length > 0 ? "Earlier" : "All Mentions"}
            </p>
            <div className="space-y-2">
              {read.map(m => (
                <MentionRow key={m.commentId} mention={m} unread={false} onMarkRead={() => markRead(m.commentId)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MentionRow({ mention, unread, onMarkRead }: {
  mention: Mention;
  unread: boolean;
  onMarkRead: () => void;
}) {
  return (
    <div className={clsx(
      "flex gap-3 p-4 rounded-xl border transition-colors group",
      unread
        ? "bg-blue-600/5 border-blue-600/25 hover:border-blue-600/40"
        : "bg-slate-900 border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100"
    )}>
      {/* Unread dot + avatar */}
      <div className="relative shrink-0 mt-0.5">
        <AvatarImg src={mention.commenterAvatar} name={mention.commenterName} />
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-950" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Issue link + summary */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <a
            href={mention.issueUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-mono font-bold text-blue-400 hover:text-blue-300 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            {mention.issueKey}
            <ExternalLink size={9} />
          </a>
          <span className="text-xs text-slate-500 truncate">{mention.issueSummary}</span>
        </div>

        {/* Commenter + time */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-medium text-slate-300">{mention.commenterName}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-600">{relativeTime(mention.created)}</span>
        </div>

        {/* Comment snippet */}
        {mention.snippet && (
          <p className={clsx("text-xs leading-relaxed line-clamp-3", unread ? "text-slate-400" : "text-slate-600")}>
            {mention.snippet}
          </p>
        )}
      </div>

      {/* Mark read button */}
      {unread && (
        <button
          onClick={onMarkRead}
          title="Mark as read"
          className="shrink-0 self-start opacity-0 group-hover:opacity-100 text-slate-600 hover:text-blue-400 transition-all p-1 mt-0.5"
        >
          <CheckCheck size={14} />
        </button>
      )}
    </div>
  );
}
