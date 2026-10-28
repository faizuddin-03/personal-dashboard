"use client";
// Chat thread with one character, plus the live job line (Faizuddin, 2026-10-27).
// Tool activity under each message stays collapsed so the thread reads like a
// conversation, not a log.
import { useEffect, useRef, useState } from "react";
import { Send, Square, Loader2, User, Info } from "lucide-react";
import clsx from "clsx";
import MarkdownLite from "@/components/MarkdownLite";
import CharacterSprite, { CHARACTER_INFO } from "@/components/pipeline/CharacterSprite";
import { when } from "@/components/pipeline/api";
import type { Character, ChatEntry, PipelineJob } from "@/lib/pipeline/types";

function Avatar({ from, via }: { from: ChatEntry["from"]; via?: Character }) {
  // A note about another character (ask-each-other): show that character, small.
  if (from === "system" && via) {
    return <span className="w-6 h-8 flex items-center justify-center shrink-0 opacity-80"><CharacterSprite character={via} size={24} /></span>;
  }
  if (from === "faizuddin") {
    return <span className="w-6 h-8 flex items-center justify-center rounded bg-blue-600/20 text-blue-300 shrink-0"><User size={14} aria-label="You" /></span>;
  }
  if (from === "system") {
    return <span className="w-6 h-8 flex items-center justify-center rounded bg-slate-800 text-slate-400 shrink-0"><Info size={14} aria-label="System" /></span>;
  }
  return <CharacterSprite character={from} size={32} />;
}

function nameOf(from: ChatEntry["from"], via?: Character): string {
  if (from === "system" && via) return `Pipeline · ${CHARACTER_INFO[via].name}`;
  if (from === "faizuddin") return "You";
  if (from === "system") return "Pipeline";
  return CHARACTER_INFO[from].name;
}

export function JobLine({ job, onStop }: { job: PipelineJob; onStop: (id: string) => void }) {
  const [stopping, setStopping] = useState(false);
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
      <Loader2 size={13} className="animate-spin shrink-0" aria-hidden />
      <span className="flex-1 min-w-0 truncate" title={job.activity}>
        {job.state === "queued" ? "Waiting to start…" : job.activity || "Working…"}
      </span>
      <button
        type="button"
        disabled={stopping}
        onClick={() => { setStopping(true); onStop(job.id); }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        <Square size={10} aria-hidden /> {stopping ? "Stopping…" : "Stop"}
      </button>
    </div>
  );
}

export default function ChatThread({ character, entries, job, onStop, onSend, disabled, placeholder }: {
  character: Character;
  entries: ChatEntry[];
  job?: PipelineJob;
  onStop: (id: string) => void;
  onSend?: (text: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const count = entries.length;

  // Keep the newest message in view when one arrives.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  async function send() {
    const t = text.trim();
    if (!t || !onSend) return;
    setSending(true);
    const ok = await onSend(t);
    setSending(false);
    if (ok) setText("");
  }

  return (
    <div className="space-y-2">
      <div ref={listRef} className="max-h-[28rem] overflow-y-auto space-y-3 pr-1">
        {entries.length === 0 && (
          <p className="text-xs text-slate-500">No messages with {CHARACTER_INFO[character].name} yet.</p>
        )}
        {entries.map((e, i) => (
          <div key={`${e.at}-${i}`} className={clsx("flex gap-2", e.from === "faizuddin" && "flex-row-reverse")}>
            <Avatar from={e.from} via={e.via} />
            <div className={clsx(
              "min-w-0 max-w-[85%] rounded-lg border px-3 py-2",
              e.from === "faizuddin" ? "bg-blue-600/10 border-blue-500/30" : e.from === "system" && e.via ? "bg-violet-500/5 border-violet-500/25" : "bg-slate-950/60 border-slate-800",
            )}>
              <div className="flex items-baseline gap-2 text-[10px] text-slate-500 mb-1">
                <span className="font-medium text-slate-300">{nameOf(e.from, e.via)}</span>
                <span>{when(e.at)}</span>
              </div>
              <div className="text-sm text-slate-200 break-words [&_p]:my-1">
                <MarkdownLite source={e.text.replace(/\r\n/g, "\n")} />
              </div>
              {e.activity && e.activity.length > 0 && (
                <details className="mt-1.5">
                  <summary className="text-[11px] text-slate-500 cursor-pointer select-none">
                    {e.activity.length} step{e.activity.length === 1 ? "" : "s"} taken
                  </summary>
                  <ol className="mt-1 ml-4 list-decimal text-[11px] text-slate-400 space-y-0.5">
                    {e.activity.map((a, j) => <li key={j} className="break-words">{a}</li>)}
                  </ol>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>

      {job && <JobLine job={job} onStop={onStop} />}

      {onSend && (
        <form
          onSubmit={e => { e.preventDefault(); void send(); }}
          className="flex items-end gap-2"
        >
          <label className="sr-only" htmlFor={`chat-${character}`}>Message to {CHARACTER_INFO[character].name}</label>
          <textarea
            id={`chat-${character}`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }}
            rows={2}
            disabled={disabled || sending}
            placeholder={placeholder ?? `Message ${CHARACTER_INFO[character].name}… (Ctrl+Enter to send)`}
            className="flex-1 min-w-0 resize-y rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || sending || !text.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-40"
          >
            {sending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
            Send
          </button>
        </form>
      )}
    </div>
  );
}
