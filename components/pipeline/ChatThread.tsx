"use client";
// Chat thread with one character, plus the live job line (Faizuddin, 2026-10-27).
// Tool activity under each message stays collapsed so the thread reads like a
// conversation, not a log.
import { memo, useEffect, useRef, useState } from "react";
import { Send, Square, Loader2, User, Info, ImagePlus, X } from "lucide-react";
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

/** Older replies numbered their options ("   1. (a) Yes"); drop the number so the letter is the only label (2026-10-30). */
function lettered(text: string): string {
  return text.replace(/^(\s+)\d+[.)]\s+(\([a-z]\)\s)/gim, "$1$2");
}

export type PastedImage = { name: string; dataUrl: string };

const fileUrl = (rel: string) => `/api/pipeline/file?path=${encodeURIComponent(rel)}`;
const PICTURE_NOTE = /\n*\[Faizuddin pasted \d+ picture\(s\): [^\]]*\]\s*$/;

function readImage(f: File): Promise<PastedImage> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: f.name || "pasted.png", dataUrl: String(r.result) });
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

/**
 * One message, drawn once and kept (2026-10-30: typing in the chat lagged —
 * every key redrew and re-parsed the whole thread). It redraws only when the
 * message itself changes, not on each key or on the 3-second refresh.
 */
const ChatMessage = memo(function ChatMessage({ e }: { e: ChatEntry }) {
  return (
    <div className={clsx("flex gap-2", e.from === "faizuddin" && "flex-row-reverse")}>
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
          <MarkdownLite source={lettered((e.images?.length ? e.text.replace(PICTURE_NOTE, "") : e.text).replace(/\r\n/g, "\n"))} />
        </div>
        {e.images && e.images.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {e.images.map(p => (
              <a key={p} href={fileUrl(p)} target="_blank" rel="noreferrer" title={p}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(p)} alt="Pasted picture" className="h-24 max-w-[12rem] rounded border border-slate-700 object-cover hover:border-blue-400" />
              </a>
            ))}
          </div>
        )}
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
  );
}, (a, b) => a.e.at === b.e.at && a.e.text === b.e.text && a.e.from === b.e.from && a.e.via === b.e.via
  && (a.e.images ?? []).join() === (b.e.images ?? []).join() && (a.e.activity ?? []).length === (b.e.activity ?? []).length);

export function JobLine({ job, onStop }: { job: PipelineJob; onStop: (id: string) => void }) {
  const [stopping, setStopping] = useState(false);
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
      <Loader2 size={13} className="animate-spin shrink-0" aria-hidden />
      <span className="flex-1 min-w-0 truncate" title={job.activity}>
        {/* Queued jobs show why they wait (busy on this ticket, no free slot), set by the runner (2026-10-29). */}
        {job.activity || (job.state === "queued" ? "Waiting to start…" : "Working…")}
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
  onSend?: (text: string, images: PastedImage[]) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<PastedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const count = entries.length;

  // Keep the newest message in view when one arrives.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  async function addFiles(files: File[]) {
    const pics = files.filter(f => /^image\/(png|jpeg|gif|webp)$/.test(f.type));
    if (!pics.length) return;
    const read = await Promise.all(pics.map(readImage));
    setImages(prev => [...prev, ...read].slice(0, 8));
  }

  async function send() {
    const t = text.trim();
    if ((!t && !images.length) || !onSend) return;
    setSending(true);
    const ok = await onSend(t, images);
    setSending(false);
    if (ok) { setText(""); setImages([]); }
  }

  return (
    <div className="space-y-2">
      <div ref={listRef} className="max-h-[28rem] overflow-y-auto space-y-3 pr-1">
        {entries.length === 0 && (
          <p className="text-xs text-slate-500">No messages with {CHARACTER_INFO[character].name} yet.</p>
        )}
        {entries.map((e, i) => (
          <ChatMessage key={`${e.at}-${i}`} e={e} />
        ))}
      </div>

      {job && <JobLine job={job} onStop={onStop} />}

      {onSend && (
        <form
          onSubmit={e => { e.preventDefault(); void send(); }}
          onDragOver={e => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { if (!e.dataTransfer.files?.length) return; e.preventDefault(); setDragOver(false); void addFiles([...e.dataTransfer.files]); }}
          className={clsx("space-y-1.5 rounded-lg", dragOver && "ring-2 ring-blue-500/60")}
        >
          {images.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {images.map((img, i) => (
                <span key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt={img.name} className="h-16 max-w-[8rem] rounded border border-slate-700 object-cover" />
                  <button type="button" aria-label="Remove picture" title="Remove picture"
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-900 border border-slate-600 p-0.5 text-slate-300 hover:text-white">
                    <X size={10} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor={`chat-${character}`}>Message to {CHARACTER_INFO[character].name}</label>
          <textarea
            id={`chat-${character}`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }}
            onPaste={e => {
              const files = [...e.clipboardData.files].filter(f => f.type.startsWith("image/"));
              if (files.length) { e.preventDefault(); void addFiles(files); }
            }}
            rows={2}
            disabled={disabled || sending}
            placeholder={placeholder ?? `Message ${CHARACTER_INFO[character].name}… (Ctrl+Enter to send)`}
            className="flex-1 min-w-0 resize-y rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple className="hidden"
            onChange={e => { void addFiles([...(e.target.files ?? [])]); e.target.value = ""; }} />
          <button type="button" disabled={disabled || sending} onClick={() => fileRef.current?.click()}
            title="Add a picture (or paste one with Ctrl+V, or drop it here)" aria-label="Add a picture"
            className="inline-flex items-center px-2.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40">
            <ImagePlus size={14} aria-hidden />
          </button>
          <button
            type="submit"
            disabled={disabled || sending || (!text.trim() && !images.length)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-40"
          >
            {sending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
            Send
          </button>
          </div>
        </form>
      )}
    </div>
  );
}
