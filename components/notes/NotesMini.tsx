"use client";
// Compact notes panel (~360x480) for the in-tab floating window. Reads and
// writes the same localStorage `notes` as /notes and stays in sync through the
// `notes-updated` window event (lib/notes-store.ts NOTES_EVENT).
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Search, ChevronLeft, Pin, ExternalLink, StickyNote } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, NOTES_EVENT, getNotes, saveNotes, stripHtml } from "@/lib/notes-store";
import { noteAccent, relativeTime } from "./noteVisuals";
import { useNotesSync, pushRecentId } from "./useNotesSync";

function blankNote(title = ""): Note {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title, content: "", color: "", pinned: false, tags: [], createdAt: now, updatedAt: now };
}

// localStorage `notes` as an external store: the raw string is the snapshot.
function subscribe(cb: () => void) {
  window.addEventListener(NOTES_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(NOTES_EVENT, cb); window.removeEventListener("storage", cb); };
}
function readRaw() { try { return localStorage.getItem("notes") ?? "[]"; } catch { return "[]"; } }
function readServer() { return "[]"; }

export default function NotesMini() {
  const source = `notes-mini-${useId()}`;
  const raw = useSyncExternalStore(subscribe, readRaw, readServer);
  const notes = useMemo<Note[]>(() => {
    try { return (JSON.parse(raw) as Note[]).map(n => ({ ...n, tags: n.tags ?? [] })); } catch { return []; }
  }, [raw]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rev, setRev] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const openIdRef = useRef(openId);
  const notesRef = useRef(notes);
  useEffect(() => { openIdRef.current = openId; notesRef.current = notes; });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  // Another view saved: remount the open editor only if this note's body changed.
  const onExternal = useCallback(() => {
    const id = openIdRef.current;
    if (!id) return;
    const before = notesRef.current.find(n => n.id === id);
    const after = getNotes().find(n => n.id === id);
    if (before && after && before.content !== after.content) setRev(r => r + 1);
  }, []);
  useNotesSync(source, onExternal);

  // Write one note into the latest stored list, so other views' edits survive.
  const writeNote = useCallback((updated: Note) => {
    const stored = getNotes();
    const exists = stored.some(n => n.id === updated.id);
    const next = exists ? stored.map(n => (n.id === updated.id ? updated : n)) : [updated, ...stored];
    saveNotes(next, source);
  }, [source]);

  const visible = notes
    .filter(n => !n.archived)
    .filter(n => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return n.title.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q) || n.tags.some(t => t.includes(q));
    })
    .sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

  const open = notes.find(n => n.id === openId && !n.archived) ?? null;

  function openNote(id: string) { setOpenId(id); pushRecentId(id); }

  function createNote() {
    const n = blankNote(query.trim());
    writeNote(n);
    setQuery("");
    openNote(n.id);
  }

  function patch(partial: Partial<Note>) {
    if (!open) return;
    writeNote({ ...open, ...partial, updatedAt: new Date().toISOString() });
  }

  function onContent(html: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const id = openIdRef.current;
    saveTimer.current = setTimeout(() => {
      const current = getNotes().find(n => n.id === id);
      if (current) writeNote({ ...current, content: html, updatedAt: new Date().toISOString() });
    }, 400);
  }

  // ── Editor view ──
  if (open) {
    const accent = noteAccent(open);
    return (
      <div className="flex flex-col h-full min-h-0 bg-slate-950 text-slate-200">
        <div className="h-1 shrink-0" style={{ backgroundColor: accent.hex }} />
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-800 shrink-0">
          <button type="button" onClick={() => setOpenId(null)} aria-label="Back to notes" title="Back" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <ChevronLeft size={16} />
          </button>
          <input
            value={open.title}
            onChange={e => patch({ title: e.target.value })}
            placeholder="Untitled"
            aria-label="Note title"
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none px-1"
          />
          <button
            type="button"
            onClick={() => patch({ pinned: !open.pinned })}
            title={open.pinned ? "Unpin" : "Pin"}
            aria-pressed={open.pinned}
            className={clsx("p-1.5 rounded-lg hover:bg-slate-800", open.pinned ? "text-yellow-400" : "text-slate-500 hover:text-slate-200")}
          >
            <Pin size={14} />
          </button>
          <Link href={`/notes?note=${open.id}`} title="Open in Notes" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800">
            <ExternalLink size={14} />
          </Link>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
          <RichTextEditor
            key={`${open.id}-${rev}`}
            content={open.content}
            onChange={onContent}
            placeholder="Start writing…"
            minHeight="220px"
            className="border-slate-700/50 bg-transparent"
          />
        </div>
        <p className="px-3 py-1 text-[11px] text-slate-600 border-t border-slate-800 shrink-0">Saved · edited {relativeTime(open.updatedAt, now)}</p>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-950 text-slate-200">
      <div className="flex items-center gap-1.5 p-2 border-b border-slate-800 shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && query.trim() && visible.length === 0) createNote(); }}
            placeholder="Search or type a new title…"
            aria-label="Search notes"
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <button type="button" onClick={createNote} title="New note" className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">
          <Plus size={13} /> New
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <StickyNote size={22} className="text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">{query ? "No notes match." : "No notes yet."}</p>
            <button type="button" onClick={createNote} className="text-xs text-blue-400 hover:underline mt-1">
              {query ? `Create "${query.trim().slice(0, 30)}"` : "Create one"}
            </button>
          </div>
        ) : visible.map(n => {
          const accent = noteAccent(n);
          const snippet = stripHtml(n.content).slice(0, 90);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => openNote(n.id)}
              className="w-full text-left flex gap-2.5 px-2.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: accent.hex, opacity: accent.chosen ? 1 : 0.6 }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  {n.pinned && <Pin size={10} className="text-yellow-400 shrink-0" />}
                  <span className={clsx("text-xs font-medium truncate", n.title ? "text-slate-200" : "text-slate-500 italic")}>{n.title || "Untitled"}</span>
                  <span className="ml-auto text-[10px] text-slate-600 shrink-0">{relativeTime(n.updatedAt, now)}</span>
                </span>
                {snippet && <span className="block text-[11px] text-slate-500 truncate mt-0.5">{snippet}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
