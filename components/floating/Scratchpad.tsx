"use client";
import { useEffect, useRef, useState } from "react";
import { Copy, Check, Eraser, Undo2, Clock } from "lucide-react";
import { loadScratch, saveScratch } from "@/lib/floatingWindows";

/**
 * Plain-text scratchpad for vehicle numbers, refs and log snippets while
 * testing. Autosaves to localStorage a moment after typing stops.
 */
export default function Scratchpad() {
  const [text, setText] = useState(loadScratch);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cleared, setCleared] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(next: string) {
    setText(next);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { saveScratch(next); setSaved(true); }, 400);
  }

  // Flush a pending save if the window closes mid-typing.
  const latest = useRef(text);
  useEffect(() => { latest.current = text; }, [text]);
  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); saveScratch(latest.current); }
  }, []);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked */ }
  }

  function stamp() {
    const el = ref.current;
    const d = new Date();
    const tag = `[${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}] `;
    const at = el ? el.selectionStart : text.length;
    const before = text.slice(0, at);
    const prefix = before === "" || before.endsWith("\n") ? "" : "\n";
    update(before + prefix + tag + text.slice(at));
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = at + prefix.length + tag.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  const lines = text === "" ? 0 : text.split("\n").length;

  return (
    <div className="h-full flex flex-col">
      <textarea
        ref={ref}
        value={text}
        onChange={e => { update(e.target.value); setCleared(null); }}
        spellCheck={false}
        placeholder={"Paste vehicle numbers, refs, log lines…\nSaved automatically in this browser."}
        className="flex-1 min-h-0 w-full resize-none bg-transparent px-3.5 py-3 text-[13px] leading-relaxed font-mono text-slate-200 placeholder:text-slate-600 outline-none"
      />
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-slate-800 text-[11px] text-slate-500">
        <span className="px-1.5 tabular-nums">{lines} line{lines === 1 ? "" : "s"} · {text.length} chars</span>
        <span className={saved ? "text-slate-600" : "text-amber-400"}>{saved ? "saved" : "saving…"}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolBtn onClick={stamp} title="Insert time stamp"><Clock size={13} /></ToolBtn>
          <ToolBtn onClick={copyAll} title="Copy all" disabled={!text}>
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </ToolBtn>
          {cleared !== null ? (
            <ToolBtn onClick={() => { update(cleared); setCleared(null); }} title="Undo clear"><Undo2 size={13} /></ToolBtn>
          ) : (
            <ToolBtn onClick={() => { setCleared(text); update(""); }} title="Clear (can undo)" disabled={!text}><Eraser size={13} /></ToolBtn>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="grid place-items-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}
