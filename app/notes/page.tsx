"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Pin, X, Search, Palette, ChevronLeft, LayoutGrid, Grid2x2, Grid3x3, SlidersHorizontal, ChevronDown, PictureInPicture2, Archive, ArchiveRestore, Maximize2, Minimize2, Download, Ticket, Flame, NotebookPen, Tag, Inbox, Zap, Keyboard } from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, NOTE_COLORS, noteColorMeta, getNotes, saveNotes, stripHtml } from "@/lib/notes-store";
import NotesGallery from "@/components/notes/NotesGallery";
import { NOTE_TEMPLATES } from "@/components/notes/templates";
import { noteAccent, relativeTime, jiraKeys, readingMinutes, activityStreak, dateBucket, digestNote, ACCENT_HEX } from "@/components/notes/noteVisuals";
import { downloadNoteMarkdown } from "@/components/notes/markdown";
import { useNotesSync, getRecentIds, pushRecentId } from "@/components/notes/useNotesSync";

type SortOrder = "updated" | "created" | "title-asc" | "title-desc";
type Library = "all" | "pinned" | "archived";

const PAGE_SOURCE = "notes-page";

/** Chrome 116+ Document Picture-in-Picture — not in the DOM lib types yet. */
type PipWindow = Window & { documentPictureInPicture?: { requestWindow(opts: { width?: number; height?: number }): Promise<Window> } };

function newId() { return crypto.randomUUID(); }

function createNote(): Note {
  return {
    id: newId(),
    title: "",
    content: "",
    color: "",
    pinned: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

// ── Note list item (editor sidebar) ─────────────────────────
function NoteListItem({ note, active, now, onClick }: { note: Note; active: boolean; now: number; onClick: () => void }) {
  const accent = noteAccent(note);
  const snippet = stripHtml(note.content).slice(0, 80);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left flex gap-2.5 px-3 py-2.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active ? "border-blue-600/60 bg-blue-600/10" : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/60"
      )}
    >
      <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: accent.hex, opacity: accent.chosen ? 1 : 0.55 }} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 mb-0.5">
          {note.pinned && <Pin size={10} className="text-yellow-400 shrink-0" />}
          <span className={clsx("text-sm font-medium truncate", note.title ? "text-slate-200" : "text-slate-600 italic")}>
            {note.title || "Untitled"}
          </span>
        </span>
        <span className="block text-xs text-slate-500 line-clamp-2 leading-snug">{snippet || "No content"}</span>
        {note.tags.length > 0 && (
          <span className="flex flex-wrap gap-1 mt-1">
            {note.tags.map(tag => (
              <span key={tag} className="bg-slate-800 text-slate-400 text-[11px] rounded-full px-2 py-0.5">#{tag}</span>
            ))}
          </span>
        )}
        <span className="block text-[11px] text-slate-600 mt-1">{note.archived ? "archived" : "edited"} {relativeTime(note.updatedAt, now)}</span>
      </span>
    </button>
  );
}

// ── PiP note editor (renders inside the floating window) ────
function PiPNoteEditor({ note, onChange }: {
  note: Note;
  onChange: (updated: Note) => void;
}) {
  const meta = noteColorMeta(note.color);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef(note);
  noteRef.current = note;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function update(partial: Partial<Note>) {
    onChangeRef.current({ ...noteRef.current, ...partial, updatedAt: new Date().toISOString() });
  }

  function handleContentChange(html: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onChangeRef.current({ ...noteRef.current, content: html, updatedAt: new Date().toISOString() });
    }, 400);
  }

  return (
    <div className={clsx("flex flex-col h-screen overflow-hidden bg-slate-950", meta.bg)}>
      {/* Editor — no header/title row, browser title bar shows the note name */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
        <RichTextEditor
          content={note.content}
          onChange={handleContentChange}
          placeholder="Start writing…"
          minHeight="300px"
          className="border-slate-700/50 bg-transparent"
        />
      </div>
    </div>
  );
}

// ── Note editor panel ───────────────────────────────────────
function NoteEditor({ note, onChange, onArchive, onRestore, onBack, allTags = [], contentRev = 0, zen = false, onToggleZen, now }: {
  note: Note;
  onChange: (updated: Note) => void;
  onArchive: () => void;
  onRestore: () => void;
  onBack?: () => void;
  allTags?: string[];
  /** Bumped when another view (mini panel, other tab) changed this note's body. */
  contentRev?: number;
  zen?: boolean;
  onToggleZen?: () => void;
  now: number;
}) {
  const [showPalette, setShowPalette] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const tagSuggestions = allTags.filter(t =>
    t.includes(tagInput.trim().toLowerCase()) && !(note.tags ?? []).includes(t)
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef(note);
  noteRef.current = note;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [pipContainer, setPipContainer] = useState<Element | null>(null);
  const pipWinRef = useRef<Window | null>(null);
  const originalTitleRef = useRef<string>("");

  async function openPiP() {
    if (!(window as PipWindow).documentPictureInPicture) {
      alert("Document Picture-in-Picture requires Chrome 116 or newer.");
      return;
    }
    try {
      const pipWin: Window = await (window as PipWindow).documentPictureInPicture!.requestWindow({
        width: 420,
        height: 600,
      });
      pipWinRef.current = pipWin;

      // Copy all compiled stylesheets into PiP window
      [...document.styleSheets].forEach(sheet => {
        try {
          const rules = [...sheet.cssRules].map(r => r.cssText).join("\n");
          const style = pipWin.document.createElement("style");
          style.textContent = rules;
          pipWin.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = pipWin.document.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            pipWin.document.head.appendChild(link);
          }
        }
      });

      // Mirror theme attributes so CSS variables apply
      pipWin.document.documentElement.setAttribute(
        "data-theme-type",
        document.documentElement.getAttribute("data-theme-type") ?? ""
      );
      const themeStyle = document.documentElement.getAttribute("style") ?? "";
      if (themeStyle) pipWin.document.documentElement.setAttribute("style", themeStyle);
      pipWin.document.body.style.cssText = "margin:0;height:100vh;overflow:hidden;";

      // PiP title bar shows the opener document's title — set it now and restore on close
      originalTitleRef.current = document.title;
      document.title = note.title || "Note";

      const container = pipWin.document.createElement("div");
      container.style.cssText = "height:100vh;overflow:hidden;";
      pipWin.document.body.appendChild(container);

      setPipContainer(container);

      pipWin.addEventListener("pagehide", () => {
        document.title = originalTitleRef.current;
        setPipContainer(null);
        pipWinRef.current = null;
      });
    } catch (e) {
      console.error("Failed to open Picture-in-Picture:", e);
    }
  }

  function closePiP() {
    document.title = originalTitleRef.current;
    pipWinRef.current?.close();
    setPipContainer(null);
    pipWinRef.current = null;
  }

  // Keep PiP title bar in sync with note title while PiP is open
  useEffect(() => {
    if (pipWinRef.current) {
      document.title = note.title || "Note";
    }
  }, [note.title]);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    const tags = note.tags ?? [];
    if (!tags.includes(tag)) {
      onChange({ ...note, tags: [...tags, tag], updatedAt: new Date().toISOString() });
    }
    setTagInput("");
    setShowTagSuggestions(false);
    setActiveSuggestion(0);
  }

  function removeTag(tag: string) {
    onChange({ ...note, tags: (note.tags ?? []).filter(t => t !== tag), updatedAt: new Date().toISOString() });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && showTagSuggestions && tagSuggestions.length > 0) {
      e.preventDefault();
      setActiveSuggestion(i => (i + 1) % tagSuggestions.length);
      return;
    }
    if (e.key === "ArrowUp" && showTagSuggestions && tagSuggestions.length > 0) {
      e.preventDefault();
      setActiveSuggestion(i => (i - 1 + tagSuggestions.length) % tagSuggestions.length);
      return;
    }
    if (e.key === "Escape") {
      setShowTagSuggestions(false);
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      // If a suggestion is highlighted, pick it — otherwise fall back to
      // whatever the user actually typed, so a brand-new tag still works.
      if (showTagSuggestions && tagSuggestions.length > 0) {
        addTag(tagSuggestions[activeSuggestion]);
      } else {
        addTag(tagInput);
      }
    }
  }

  function update(partial: Partial<Note>) {
    const updated = { ...note, ...partial, updatedAt: new Date().toISOString() };
    onChange(updated);
  }

  function handleContentChange(html: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const latest = noteRef.current;
      onChangeRef.current({ ...latest, content: html, updatedAt: new Date().toISOString() });
    }, 400);
  }

  const meta = noteColorMeta(note.color);
  const accent = noteAccent(note);
  const plainText = stripHtml(note.content);
  const linkedKeys = jiraKeys(note, plainText);
  const col = zen ? "w-full max-w-3xl mx-auto" : "";

  return (
    <div className={clsx("flex flex-col h-full", meta.bg)}>
      <div className="h-1 shrink-0" style={{ backgroundColor: accent.hex, opacity: accent.chosen ? 1 : 0.5 }} />
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-slate-800 shrink-0">
        {/* Back button — mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="sm:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors mr-1"
            aria-label="Back to notes list"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {/* Pin */}
        <button
          onClick={() => update({ pinned: !note.pinned })}
          title={note.pinned ? "Unpin" : "Pin note"}
          className={clsx("p-1.5 rounded-lg transition-colors", note.pinned ? "text-yellow-400 bg-yellow-400/10" : "text-slate-600 hover:text-slate-300 hover:bg-slate-800")}
        >
          <Pin size={15} />
        </button>

        {/* Color picker */}
        <div className="relative">
          <button
            onClick={() => setShowPalette(v => !v)}
            title="Note color"
            className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Palette size={15} />
          </button>
          {showPalette && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 flex gap-2">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  aria-label={`Colour ${c.label}`}
                  onClick={() => { update({ color: c.value }); setShowPalette(false); }}
                  style={c.value ? { backgroundColor: ACCENT_HEX[c.value] } : undefined}
                  className={clsx(
                    "w-6 h-6 rounded-full border border-slate-600 transition-all hover:scale-110",
                    c.value === "" && "bg-slate-700",
                    note.color === c.value && "ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-800"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {note.archived && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-900/30 border border-amber-800/60 rounded-full px-2 py-0.5">
            <Archive size={11} /> Archived
          </span>
        )}
        <p className="hidden sm:block text-xs text-slate-600" title={new Date(note.updatedAt).toLocaleString()}>
          edited {relativeTime(note.updatedAt, now)}
        </p>

        {/* Zen / focus mode */}
        {onToggleZen && (
          <button
            onClick={onToggleZen}
            title={zen ? "Exit focus mode (Esc)" : "Focus mode"}
            aria-pressed={zen}
            className={clsx("p-1.5 rounded-lg transition-colors", zen ? "text-blue-400 bg-blue-600/20 hover:bg-blue-600/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}
          >
            {zen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}

        {/* Export */}
        <button
          onClick={() => downloadNoteMarkdown(note)}
          title="Export as Markdown"
          aria-label="Export as Markdown"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Download size={15} />
        </button>

        {/* Float / PiP */}
        <button
          onClick={pipContainer ? closePiP : openPiP}
          title={pipContainer ? "Close floating note" : "Float note"}
          className={clsx("p-1.5 rounded-lg transition-colors", pipContainer ? "text-blue-400 bg-blue-600/20 hover:bg-blue-600/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}
        >
          <PictureInPicture2 size={15} />
        </button>

        {/* Archive / restore — permanent delete lives in the Archived view */}
        {note.archived ? (
          <button onClick={onRestore} title="Restore note" aria-label="Restore note" className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-colors">
            <ArchiveRestore size={15} />
          </button>
        ) : (
          <button onClick={onArchive} title="Archive note (restore any time from Archived)" aria-label="Archive note" className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors">
            <Archive size={15} />
          </button>
        )}
      </div>

      {/* PiP portal */}
      {pipContainer && createPortal(
        <PiPNoteEditor note={note} onChange={onChange} />,
        pipContainer
      )}

      {/* Title */}
      <div className={clsx("px-4 sm:px-6 pt-4 sm:pt-5 pb-3 shrink-0", col, zen && "sm:pt-10")}>
        <input
          value={note.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Untitled"
          className={clsx("w-full bg-transparent font-bold text-slate-100 placeholder-slate-700 focus:outline-none", zen ? "text-3xl" : "text-2xl")}
        />
      </div>

      {/* Tags */}
      <div className={clsx("px-4 sm:px-6 pb-3 shrink-0 relative", col)}>
        <div className="flex flex-wrap items-center gap-1.5">
          {(note.tags ?? []).map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-slate-700 text-slate-300 text-xs rounded-full px-2 py-0.5">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-slate-500 hover:text-slate-200 leading-none"
                aria-label={`Remove tag ${tag}`}
              >×</button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            value={tagInput}
            onChange={e => {
              setTagInput(e.target.value);
              setShowTagSuggestions(true);
              setActiveSuggestion(0);
            }}
            onKeyDown={handleTagKeyDown}
            onFocus={() => setShowTagSuggestions(true)}
            onBlur={() => {
              // Delay so a click on a suggestion registers before the list unmounts.
              setTimeout(() => setShowTagSuggestions(false), 150);
              addTag(tagInput);
            }}
            placeholder="Add tag…"
            className="bg-transparent text-xs text-slate-400 placeholder-slate-700 focus:outline-none min-w-[80px] flex-1"
          />
        </div>
        {linkedKeys.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-600">Linked:</span>
            {linkedKeys.map(k => (
              <Link
                key={k}
                href={`/jira/${k}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-blue-600/15 border border-blue-600/40 text-blue-300 hover:bg-blue-600/25"
              >
                <Ticket size={10} /> {k}
              </Link>
            ))}
          </div>
        )}
        {showTagSuggestions && tagSuggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 w-48 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg py-1">
            {tagSuggestions.map((tag, i) => (
              <li key={tag}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    addTag(tag);
                    tagInputRef.current?.focus();
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-xs",
                    i === activeSuggestion ? "bg-slate-700 text-slate-100" : "text-slate-300 hover:bg-slate-700/60"
                  )}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rich text content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        <div className={col}>
        <RichTextEditor
          key={contentRev}
          content={note.content}
          onChange={handleContentChange}
          placeholder="Start writing your note…"
          minHeight="400px"
          className="border-slate-700/50 bg-transparent"
        />
        </div>
      </div>

      {/* Word / char count */}
      {(() => {
        const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
        const charCount = plainText.length;
        const mins = readingMinutes(wordCount);
        const d = digestNote(note);
        return (
          <div className="px-4 sm:px-6 py-1.5 border-t border-slate-800/60 shrink-0">
            <p className="text-xs text-slate-600">
              {wordCount} word{wordCount !== 1 ? "s" : ""} · {charCount} char{charCount !== 1 ? "s" : ""}
              {mins > 0 && <> · {mins} min read</>}
              {d.tasksTotal > 0 && <> · {d.tasksDone}/{d.tasksTotal} tasks done</>}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

// ── Toast ───────────────────────────────────────────────────
interface ToastState { id: number; message: string; actionLabel?: string; action?: () => void }

// ── Page ────────────────────────────────────────────────────
export default function NotesPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950" />}>
      <NotesPageInner />
    </Suspense>
  );
}

function NotesPageInner() {
  const searchParams = useSearchParams();
  const [notes, setNotes]       = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [activeTags, setActiveTags]   = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [library, setLibrary] = useState<Library>("all");
  const [filterOpen, setFilterOpen]   = useState(false);
  const [showEditor, setShowEditor]   = useState(false);
  const [view, setView]           = useState<"gallery" | "editor">("gallery");
  const [gridSize, setGridSize]   = useState<"small" | "large">("large");
  const [sort, setSort] = useState<SortOrder>("updated");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [zen, setZen] = useState(false);
  const [contentRev, setContentRev] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [quick, setQuick] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const quickRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef(notes);
  const selectedRef = useRef(selectedId);
  useEffect(() => { notesRef.current = notes; selectedRef.current = selectedId; });

  useEffect(() => {
    const loaded = getNotes();
    setNotes(loaded);
    const firstActive = loaded.find(n => !n.archived);
    if (firstActive) setSelectedId(firstActive.id);
    setRecentIds(getRecentIds());
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Another view (mini panel, other tab) saved: reload, and remount the open
  // editor only if this note's body changed underneath it.
  const reload = useCallback(() => {
    const fresh = getNotes();
    const id = selectedRef.current;
    const before = notesRef.current.find(n => n.id === id);
    const after = fresh.find(n => n.id === id);
    if (before && after && before.content !== after.content) setContentRev(r => r + 1);
    setNotes(fresh);
  }, []);
  useNotesSync(PAGE_SOURCE, reload);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(message: string, actionLabel?: string, action?: () => void) {
    setToast({ id: Date.now(), message, actionLabel, action });
  }

  function persist(updated: Note[]) { setNotes(updated); saveNotes(updated, PAGE_SOURCE); }

  const openNote = useCallback((id: string) => {
    setSelectedId(id);
    setShowEditor(true);
    setView("editor");
    pushRecentId(id);
    setRecentIds(getRecentIds());
  }, []);

  // /notes?note=<id> (used by the mini panel's "Open in Notes"): adjust state
  // during render once the note exists, instead of in an effect.
  const noteParam = searchParams.get("note");
  const [handledParam, setHandledParam] = useState<string | null>(null);
  if (noteParam && noteParam !== handledParam && notes.some(n => n.id === noteParam)) {
    setHandledParam(noteParam);
    setSelectedId(noteParam);
    setShowEditor(true);
    setView("editor");
  }

  function handleNew(templateContent = "", title = "") {
    const note = { ...createNote(), title, content: templateContent };
    persist([note, ...notes]);
    setLibrary("all");
    openNote(note.id);
  }

  function quickCapture() {
    const text = quick.trim();
    if (!text) return;
    const note = { ...createNote(), title: text.slice(0, 120), content: text.length > 120 ? `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>` : "" };
    persist([note, ...notes]);
    setQuick("");
    showToast("Note added", "Open", () => openNote(note.id));
  }

  function handleChange(updated: Note) {
    persist(notes.map(n => n.id === updated.id ? updated : n));
  }

  /** Gallery quick actions (pin, colour) — no updatedAt bump, so cards don't jump sections. */
  function updateNote(id: string, partial: Partial<Note>) {
    persist(notes.map(n => n.id === id ? { ...n, ...partial } : n));
  }

  function restoreNote(id: string) {
    const list = getNotes();
    persist(list.map(n => n.id === id ? { ...n, archived: false, archivedAt: undefined } : n));
  }

  function archiveNote(id: string) {
    const target = notes.find(n => n.id === id);
    const updated = notes.map(n => n.id === id ? { ...n, archived: true, archivedAt: new Date().toISOString() } : n);
    persist(updated);
    if (selectedId === id && library !== "archived") {
      const next = updated.find(n => !n.archived);
      setSelectedId(next?.id ?? null);
      if (!next) setView("gallery");
      setShowEditor(false);
      setZen(false);
    }
    showToast(`Archived "${target?.title || "Untitled"}"`, "Undo", () => restoreNote(id));
  }

  function deleteForever(id: string) {
    const target = notes.find(n => n.id === id);
    const index = notes.findIndex(n => n.id === id);
    const remaining = notes.filter(n => n.id !== id);
    persist(remaining);
    if (selectedId === id) setSelectedId(remaining.find(n => !n.archived)?.id ?? null);
    if (target) {
      showToast(`Deleted "${target.title || "Untitled"}"`, "Undo", () => {
        const list = getNotes();
        list.splice(Math.min(index, list.length), 0, target);
        persist(list);
      });
    }
  }

  // ── Keyboard shortcuts ──
  const handleNewRef = useRef<() => void>(() => {});
  const zenRef = useRef(zen);
  const viewRef = useRef(view);
  useEffect(() => { handleNewRef.current = () => handleNew(); zenRef.current = zen; viewRef.current = view; });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "n") { // Alt+N belongs to the floating Notes window (components/floating)
        e.preventDefault();
        handleNewRef.current();
        return;
      }
      if (e.key === "Escape" && zenRef.current) { setZen(false); return; }
      if (isTypingTarget(e.target) || mod || e.altKey) return;
      if (viewRef.current !== "gallery") return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key.toLowerCase() === "n") { e.preventDefault(); quickRef.current?.focus(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Derived lists ──
  const activeNotes = notes.filter(n => !n.archived);
  const archivedCount = notes.length - activeNotes.length;
  const pinnedCount = activeNotes.filter(n => n.pinned).length;
  const libraryNotes = library === "archived" ? notes.filter(n => n.archived) : library === "pinned" ? activeNotes.filter(n => n.pinned) : activeNotes;

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags ?? []))).sort();
  const tagCounts = new Map<string, number>();
  const keyCounts = new Map<string, number>();
  activeNotes.forEach(n => {
    n.tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
    jiraKeys(n, digestNote(n).text).forEach(k => keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1));
  });
  const allKeys = Array.from(keyCounts.keys()).sort();

  const q = search.trim().toLowerCase();
  const filteredNotes = libraryNotes
    .filter(n => !q || n.title.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q) || n.tags.some(t => t.includes(q)))
    .filter(n => activeTags.every(t => (n.tags ?? []).includes(t)))
    .filter(n => activeColors.length === 0 || activeColors.includes(n.color ?? ""))
    .filter(n => !activeKey || jiraKeys(n, digestNote(n).text).includes(activeKey))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (sort) {
        case "created":    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "title-asc":  return (a.title || "").localeCompare(b.title || "");
        case "title-desc": return (b.title || "").localeCompare(a.title || "");
        default:           return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const activeFilterCount = activeTags.length + activeColors.length + (activeKey ? 1 : 0);
  const selectedNote = notes.find(n => n.id === selectedId);

  function clearFilters() { setActiveTags([]); setActiveColors([]); setActiveKey(null); setSearch(""); }
  function toggleTag(tag: string) { setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }
  function toggleColor(c: string) { setActiveColors(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c]); }

  // Stats line
  const editedToday = activeNotes.filter(n => dateBucket(n.updatedAt, now) === "Today").length;
  const wordsThisWeek = activeNotes
    .filter(n => dateBucket(n.updatedAt, now) !== "Earlier")
    .reduce((sum, n) => sum + digestNote(n).words, 0);
  const streak = activityStreak(activeNotes, now);

  const recentNotes = recentIds
    .map(id => activeNotes.find(n => n.id === id))
    .filter((n): n is Note => !!n)
    .slice(0, 6);

  const toastEl = toast && (
    <div
      key={toast.id}
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 max-w-[calc(100vw-2rem)] pl-4 pr-2 py-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl shadow-black/30 text-xs text-slate-200"
    >
      <span className="truncate">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action?.(); setToast(null); }}
          className="shrink-0 px-2.5 py-1 rounded-lg text-blue-300 hover:bg-blue-600/20 font-medium"
        >
          {toast.actionLabel}
        </button>
      )}
      <button onClick={() => setToast(null)} aria-label="Dismiss" className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700">
        <X size={12} />
      </button>
    </div>
  );

  // ── Shared filter widgets ──
  const libraryButtons = (
    [
      { id: "all" as Library, label: "All notes", icon: Inbox, count: activeNotes.length },
      { id: "pinned" as Library, label: "Pinned", icon: Pin, count: pinnedCount },
      { id: "archived" as Library, label: "Archived", icon: Archive, count: archivedCount },
    ]
  );

  const colourSwatches = (
    <div className="flex flex-wrap gap-2">
      {NOTE_COLORS.map(c => {
        const active = activeColors.includes(c.value);
        return (
          <button
            key={c.value}
            title={c.label}
            aria-label={`Filter colour ${c.label}`}
            aria-pressed={active}
            onClick={() => toggleColor(c.value)}
            style={c.value ? { backgroundColor: ACCENT_HEX[c.value] } : undefined}
            className={clsx(
              "w-5 h-5 rounded-full border border-slate-600 transition-all hover:scale-110",
              c.value === "" && "bg-slate-700",
              active && "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900"
            )}
          />
        );
      })}
    </div>
  );

  const chipClass = (active: boolean) => clsx(
    "text-xs rounded-full px-2.5 py-1 border transition-colors",
    active ? "bg-blue-600/20 border-blue-600/50 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
  );

  // ── Gallery view ────────────────────────────────────────────
  if (view === "gallery") {
    const templateGroups = (["General", "QA"] as const).map(g => ({ group: g, items: NOTE_TEMPLATES.filter(t => t.group === g) }));

    let body: React.ReactNode;
    if (notes.length === 0) {
      body = (
        <div className="max-w-2xl mx-auto text-center py-10 sm:py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/15 border border-blue-600/40 flex items-center justify-center mb-5">
            <NotebookPen size={26} className="text-blue-300" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">A clean page</h2>
          <p className="text-sm text-slate-500 mb-8">Type in the quick note box above, or start from a template.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {NOTE_TEMPLATES.map((t, i) => {
              const hex = Object.values(ACCENT_HEX)[i % Object.values(ACCENT_HEX).length];
              return (
                <button
                  key={t.label}
                  onClick={() => handleNew(t.content)}
                  className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-600 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${hex} 18%, transparent)`, color: hex }}>
                    <t.icon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-200">{t.label}</span>
                    <span className="block text-[11px] text-slate-500">{t.group === "QA" ? "QA template" : "General"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    } else if (filteredNotes.length === 0) {
      body = (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            {library === "archived" ? <Archive size={22} className="text-slate-600" /> : <Search size={22} className="text-slate-600" />}
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">
            {library === "archived" && !q && activeFilterCount === 0 ? "Archive is empty" : library === "pinned" && !q && activeFilterCount === 0 ? "Nothing pinned yet" : "Nothing matches"}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            {library === "archived" ? "Archived notes land here and can be restored." : library === "pinned" ? "Hover a card and press the pin to keep it on top." : "Try another word, or clear the filters."}
          </p>
          {(q || activeFilterCount > 0) && (
            <button onClick={clearFilters} className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800">Clear search and filters</button>
          )}
          {library !== "all" && !q && activeFilterCount === 0 && (
            <button onClick={() => setLibrary("all")} className="text-xs text-blue-400 hover:underline">Back to all notes</button>
          )}
        </div>
      );
    } else {
      body = (
        <>
          {library === "all" && !q && activeFilterCount === 0 && recentNotes.length > 1 && (
            <div className="mb-7">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Jump back in</p>
              <div className="flex flex-wrap gap-2">
                {recentNotes.map(n => {
                  const a = noteAccent(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNote(n.id)}
                      className="max-w-[14rem] inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800 text-xs text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.hex }} />
                      <span className="truncate">{n.title || "Untitled"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {library === "archived" && (
            <p className="mb-5 text-xs text-slate-500 flex items-center gap-2">
              <Archive size={12} /> Archived notes are kept until you delete them forever. Hover a card to restore it.
            </p>
          )}
          <NotesGallery
            notes={filteredNotes}
            sort={sort}
            compact={gridSize === "small"}
            allowFeatured={library === "all" && !q && activeFilterCount === 0}
            now={now}
            handlers={{ onOpen: openNote, onUpdate: updateNote, onArchive: archiveNote, onRestore: restoreNote, onDeleteForever: deleteForever }}
          />
        </>
      );
    }

    return (
      <div className="flex flex-col h-[calc(100vh-0px)] min-h-0 bg-slate-950 overflow-x-hidden">
        {/* Header */}
        <div className="px-4 sm:px-8 pt-5 pb-4 border-b border-slate-800 shrink-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-600/40 flex items-center justify-center shrink-0">
                <NotebookPen size={18} className="text-blue-300" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-slate-100 leading-tight">Notes</h1>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>{activeNotes.length} note{activeNotes.length !== 1 ? "s" : ""}</span>
                  {editedToday > 0 && <span>· {editedToday} edited today</span>}
                  {wordsThisWeek > 0 && <span>· {wordsThisWeek.toLocaleString()} words this week</span>}
                  {streak > 1 && (
                    <span className="inline-flex items-center gap-1 text-orange-300" title="Days in a row with a note created or edited">
                      · <Flame size={12} /> {streak}-day streak
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setTemplatesOpen(v => !v)}
                aria-expanded={templatesOpen}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus size={14} />
                New note
                <ChevronDown size={12} className={clsx("transition-transform", templatesOpen && "rotate-180")} />
              </button>
              {templatesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTemplatesOpen(false)} />
                  <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[200px] py-1">
                    {templateGroups.map(g => (
                      <div key={g.group}>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g.group}</p>
                        {g.items.map(t => (
                          <button
                            key={t.label}
                            onClick={() => { handleNew(t.content); setTemplatesOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors flex items-center gap-2"
                          >
                            <t.icon size={13} className="text-slate-500 shrink-0" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {library !== "archived" && (
              <div className="relative flex-1 min-w-[12rem] basis-full sm:basis-auto">
                <Zap size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  ref={quickRef}
                  value={quick}
                  onChange={e => setQuick(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); quickCapture(); } if (e.key === "Escape") { setQuick(""); e.currentTarget.blur(); } }}
                  placeholder="Quick note: type and press Enter"
                  aria-label="Quick note"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            )}
            <div className="relative flex-1 sm:flex-none min-w-[10rem]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") { setSearch(""); e.currentTarget.blur(); } }}
                placeholder="Search  ( / )"
                aria-label="Search notes"
                className="w-full sm:w-52 pl-7 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOrder)}
              aria-label="Sort notes"
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="updated">Last updated</option>
              <option value="created">Date created</option>
              <option value="title-asc">Title A→Z</option>
              <option value="title-desc">Title Z→A</option>
            </select>
            <button
              onClick={() => setFilterOpen(v => !v)}
              aria-expanded={filterOpen}
              className={clsx(
                "lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors",
                filterOpen || activeFilterCount > 0 || library !== "all"
                  ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
              )}
            >
              <SlidersHorizontal size={13} />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">{activeFilterCount}</span>
              )}
              <ChevronDown size={12} className={clsx("transition-transform", filterOpen && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Collapsible filter panel (below lg; the sidebar covers lg+) */}
        {filterOpen && (
          <div className="lg:hidden px-4 sm:px-8 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {libraryButtons.map(b => (
                <button key={b.id} onClick={() => setLibrary(b.id)} aria-pressed={library === b.id} className={chipClass(library === b.id)}>
                  {b.label} <span className="opacity-60">{b.count}</span>
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} aria-pressed={activeTags.includes(tag)} className={chipClass(activeTags.includes(tag))}>#{tag}</button>
                  ))}
                </div>
              </div>
            )}
            {allKeys.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Linked tickets</p>
                <div className="flex flex-wrap gap-1.5">
                  {allKeys.map(k => (
                    <button key={k} onClick={() => setActiveKey(activeKey === k ? null : k)} aria-pressed={activeKey === k} className={chipClass(activeKey === k)}>{k}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Colour</p>
              {colourSwatches}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setActiveTags([]); setActiveColors([]); setActiveKey(null); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 flex">
          {/* Sidebar (lg+) */}
          <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-slate-800 overflow-y-auto px-4 py-6 gap-7">
            <nav className="space-y-0.5">
              <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Library</p>
              {libraryButtons.map(b => (
                <button
                  key={b.id}
                  onClick={() => setLibrary(b.id)}
                  aria-current={library === b.id ? "page" : undefined}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                    library === b.id ? "bg-blue-600/15 text-blue-300" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                  )}
                >
                  <b.icon size={14} className={b.id === "pinned" && library !== b.id ? "text-yellow-400/80" : undefined} />
                  <span className="flex-1 text-left">{b.label}</span>
                  <span className="text-xs text-slate-600">{b.count}</span>
                </button>
              ))}
            </nav>

            {allTags.length > 0 && (
              <div>
                <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Tag size={11} /> Tags</p>
                <div className="space-y-0.5">
                  {allTags.map(tag => {
                    const active = activeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        aria-pressed={active}
                        className={clsx(
                          "w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors",
                          active ? "bg-blue-600/15 text-blue-300" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                        )}
                      >
                        <span className="flex-1 text-left truncate">#{tag}</span>
                        <span className="text-slate-600">{tagCounts.get(tag) ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allKeys.length > 0 && (
              <div>
                <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Ticket size={11} /> Linked tickets</p>
                <div className="space-y-0.5">
                  {allKeys.map(k => (
                    <div key={k} className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveKey(activeKey === k ? null : k)}
                        aria-pressed={activeKey === k}
                        className={clsx(
                          "flex-1 flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors",
                          activeKey === k ? "bg-blue-600/15 text-blue-300" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                        )}
                      >
                        <span className="flex-1 text-left font-mono">{k}</span>
                        <span className="text-slate-600">{keyCounts.get(k)}</span>
                      </button>
                      <Link href={`/jira/${k}`} title={`Open ${k}`} className="p-1 rounded text-slate-600 hover:text-blue-300"><Ticket size={11} /></Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Palette size={11} /> Colour</p>
              <div className="px-2">{colourSwatches}</div>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={() => { setActiveTags([]); setActiveColors([]); setActiveKey(null); }} className="px-2 text-left text-xs text-slate-500 hover:text-slate-300">
                Clear all filters
              </button>
            )}

            <div className="mt-auto px-2 text-[11px] text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-500"><Keyboard size={11} /> Shortcuts</p>
              <p><kbd className="font-mono text-slate-400">N</kbd> quick note</p>
              <p><kbd className="font-mono text-slate-400">/</kbd> search</p>
              <p><kbd className="font-mono text-slate-400">Ctrl+Shift+N</kbd> new note · <kbd className="font-mono text-slate-400">Alt+N</kbd> floating notes</p>
              <p><kbd className="font-mono text-slate-400">Esc</kbd> leave focus mode</p>
            </div>
          </aside>

          {/* Cards */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6 pb-24">
            {body}
          </div>
        </div>

        {/* Floating card-density toggle */}
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl shadow-black/40">
          <button
            onClick={() => setGridSize("large")}
            title="Comfortable cards"
            aria-pressed={gridSize === "large"}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              gridSize === "large" ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
            )}
          >
            <Grid2x2 size={16} />
          </button>
          <button
            onClick={() => setGridSize("small")}
            title="Compact cards"
            aria-pressed={gridSize === "small"}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              gridSize === "small" ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
            )}
          >
            <Grid3x3 size={16} />
          </button>
        </div>
        {toastEl}
      </div>
    );
  }

  // ── Editor view (split layout) ───────────────────────────────
  return (
    <div className="flex h-[calc(100vh-0px)] min-h-0">
      {/* ── Left panel — full width on mobile when not in editor, fixed sidebar on sm+, hidden in focus mode ── */}
      <div className={clsx(
        "bg-slate-900 border-r border-slate-800 flex-col",
        "sm:w-72 sm:shrink-0",
        zen ? "hidden" : showEditor ? "hidden sm:flex" : "flex flex-1 sm:flex-none"
      )}>
        {/* Header */}
        <div className="px-3 pt-4 pb-3 border-b border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => setView("gallery")} title="All notes" aria-label="Back to gallery" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                <LayoutGrid size={14} />
              </button>
              <h1 className="text-sm font-semibold text-slate-200 px-1">
                {library === "archived" ? "Archived" : library === "pinned" ? "Pinned" : "Notes"}
              </h1>
            </div>
            <button onClick={() => handleNew()} title="New note" className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
              <Plus size={16} />
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {allTags.map(tag => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      "shrink-0 text-xs rounded-full px-2 py-0.5 border transition-colors",
                      active ? "bg-blue-600/20 border-blue-600/50 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    )}
                  >#{tag}</button>
                );
              })}
            </div>
          )}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-slate-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-600">{search ? "No notes match" : "No notes yet"}</p>
              {!search && (
                <button onClick={() => handleNew()} className="text-xs text-blue-400 hover:underline mt-1">Create one</button>
              )}
            </div>
          ) : filteredNotes.map(note => (
            <NoteListItem
              key={note.id}
              note={note}
              now={now}
              active={note.id === selectedId}
              onClick={() => openNote(note.id)}
            />
          ))}
        </div>

        <div className="px-3 py-2 border-t border-slate-800 shrink-0">
          <p className="text-xs text-slate-600 text-center">{filteredNotes.length} of {activeNotes.length} note{activeNotes.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={clsx(
        "flex-1 min-w-0 overflow-hidden",
        zen || showEditor ? "flex flex-col" : "hidden sm:flex sm:flex-col"
      )}>
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onChange={handleChange}
            onArchive={() => archiveNote(selectedNote.id)}
            onRestore={() => restoreNote(selectedNote.id)}
            onBack={() => { setShowEditor(false); setZen(false); }}
            allTags={allTags}
            contentRev={contentRev}
            zen={zen}
            onToggleZen={() => setZen(z => !z)}
            now={now}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Search size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">No note selected</p>
            <p className="text-slate-600 text-xs mb-5">Pick one from the list or create a new one</p>
            <button onClick={() => handleNew()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">New Note</button>
          </div>
        )}
      </div>
      {toastEl}
    </div>
  );
}
