"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Pin, X, Search, Palette, ChevronLeft, LayoutGrid, Grid2x2, Grid3x3, SlidersHorizontal, ChevronDown, ArrowUpDown, FileText, Users, AlertCircle, CalendarDays, PictureInPicture2 } from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, NOTE_COLORS, noteColorMeta, getNotes, saveNotes, stripHtml } from "@/lib/notes-store";

type SortOrder = "updated" | "created" | "title-asc" | "title-desc";

const NOTE_TEMPLATES: { label: string; icon: React.ElementType; content: string }[] = [
  { label: "Blank",         icon: FileText,     content: "" },
  { label: "Meeting Notes", icon: Users,        content: "<h2>Meeting Notes</h2><h3>Attendees</h3><p></p><h3>Agenda</h3><p></p><h3>Discussion</h3><p></p><h3>Action Items</h3><p></p>" },
  { label: "Bug Report",    icon: AlertCircle,  content: "<h2>Bug Report</h2><h3>Description</h3><p></p><h3>Steps to Reproduce</h3><p></p><h3>Expected Result</h3><p></p><h3>Actual Result</h3><p></p>" },
  { label: "Daily Standup", icon: CalendarDays, content: "<h2>Daily Standup</h2><h3>Yesterday</h3><p></p><h3>Today</h3><p></p><h3>Blockers</h3><p></p>" },
];

function extractHeadings(html: string): string[] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("h1, h2, h3"))
    .slice(0, 3)
    .map(n => n.textContent ?? "")
    .filter(Boolean);
}

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

// ── Note list item ──────────────────────────────────────────
function NoteListItem({ note, active, onClick }: { note: Note; active: boolean; onClick: () => void }) {
  const meta = noteColorMeta(note.color);
  const snippet = stripHtml(note.content).slice(0, 80);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left px-3 py-2.5 rounded-xl border transition-all",
        active ? "border-blue-600/60 bg-blue-600/10" : `${meta.border} ${meta.bg} hover:border-slate-600`
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {note.pinned && <Pin size={10} className="text-yellow-400 shrink-0" />}
        <p className={clsx("text-sm font-medium truncate", note.title ? "text-slate-200" : "text-slate-600 italic")}>
          {note.title || "Untitled"}
        </p>
      </div>
      <p className="text-xs text-slate-600 line-clamp-2 leading-snug">{snippet || "No content"}</p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {note.tags.map(tag => (
            <span key={tag} className="bg-slate-700 text-slate-300 text-xs rounded-full px-2 py-0.5">{tag}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-700 mt-1">{new Date(note.updatedAt).toLocaleDateString()}</p>
    </button>
  );
}

// ── Note gallery card ───────────────────────────────────────
function NoteGalleryCard({ note, size, onClick }: { note: Note; size: "small" | "large"; onClick: () => void }) {
  const meta = noteColorMeta(note.color);

  if (size === "small") {
    const headings = extractHeadings(note.content);
    return (
      <button
        onClick={onClick}
        className={clsx(
          "w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 active:scale-100",
          `${meta.border} ${meta.bg}`
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {note.pinned && <Pin size={10} className="text-yellow-400 shrink-0" />}
          <p className={clsx("text-xs font-semibold truncate", note.title ? "text-slate-200" : "text-slate-600 italic")}>
            {note.title || "Untitled"}
          </p>
        </div>
        {headings.length > 0 ? (
          <ul className="space-y-0.5">
            {headings.map((h, i) => (
              <li key={i} className="text-xs text-slate-500 truncate leading-snug">{h}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-700 italic">No headings</p>
        )}
      </button>
    );
  }

  const snippet = stripHtml(note.content).slice(0, 160);
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 active:scale-100",
        `${meta.border} ${meta.bg}`
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {note.pinned && <Pin size={11} className="text-yellow-400 shrink-0" />}
        <p className={clsx("text-sm font-semibold truncate", note.title ? "text-slate-200" : "text-slate-600 italic")}>
          {note.title || "Untitled"}
        </p>
      </div>
      <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed mb-2">{snippet || "No content"}</p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 4).map(tag => (
            <span key={tag} className="bg-slate-700/60 text-slate-400 text-xs rounded-full px-2 py-0.5">{tag}</span>
          ))}
          {note.tags.length > 4 && (
            <span className="text-slate-600 text-xs">+{note.tags.length - 4}</span>
          )}
        </div>
      )}
      <p className="text-xs text-slate-700">{new Date(note.updatedAt).toLocaleDateString()}</p>
    </button>
  );
}

// ── PiP note editor (renders inside the floating window) ────
function PiPNoteEditor({ note, onChange, onClose }: {
  note: Note;
  onChange: (updated: Note) => void;
  onClose: () => void;
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
      {/* PiP header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/80 shrink-0">
        <span className="text-xs text-slate-500 flex-1 truncate">{note.title || "Untitled"}</span>
        <button onClick={onClose} title="Close floating note" className="p-1 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Title */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <input
          value={note.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Untitled"
          className="w-full bg-transparent text-lg font-bold text-slate-100 placeholder-slate-700 focus:outline-none"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
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
function NoteEditor({ note, onChange, onDelete, onBack }: {
  note: Note;
  onChange: (updated: Note) => void;
  onDelete: () => void;
  onBack?: () => void;
}) {
  const [showPalette, setShowPalette] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef(note);
  noteRef.current = note;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [pipContainer, setPipContainer] = useState<Element | null>(null);
  const pipWinRef = useRef<Window | null>(null);

  async function openPiP() {
    if (!(window as any).documentPictureInPicture) {
      alert("Document Picture-in-Picture requires Chrome 116 or newer.");
      return;
    }
    try {
      const pipWin: Window = await (window as any).documentPictureInPicture.requestWindow({
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

      const container = pipWin.document.createElement("div");
      container.style.cssText = "height:100vh;overflow:hidden;";
      pipWin.document.body.appendChild(container);

      setPipContainer(container);

      pipWin.addEventListener("pagehide", () => {
        setPipContainer(null);
        pipWinRef.current = null;
      });
    } catch (e) {
      console.error("Failed to open Picture-in-Picture:", e);
    }
  }

  function closePiP() {
    pipWinRef.current?.close();
    setPipContainer(null);
    pipWinRef.current = null;
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    const tags = note.tags ?? [];
    if (!tags.includes(tag)) {
      onChange({ ...note, tags: [...tags, tag], updatedAt: new Date().toISOString() });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    onChange({ ...note, tags: (note.tags ?? []).filter(t => t !== tag), updatedAt: new Date().toISOString() });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
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

  return (
    <div className={clsx("flex flex-col h-full", meta.bg)}>
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
                  onClick={() => { update({ color: c.value }); setShowPalette(false); }}
                  className={clsx(
                    "w-6 h-6 rounded-full border transition-all hover:scale-110",
                    c.value === "" ? "bg-slate-700 border-slate-500" : `${c.bg} ${c.border}`,
                    note.color === c.value && "ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-800"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <p className="text-xs text-slate-600">
          {new Date(note.updatedAt).toLocaleString()}
        </p>

        {/* Float / PiP */}
        <button
          onClick={pipContainer ? closePiP : openPiP}
          title={pipContainer ? "Close floating note" : "Float note"}
          className={clsx("p-1.5 rounded-lg transition-colors", pipContainer ? "text-blue-400 bg-blue-600/20 hover:bg-blue-600/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}
        >
          <PictureInPicture2 size={15} />
        </button>

        {/* Delete */}
        <button onClick={onDelete} title="Delete note" className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* PiP portal */}
      {pipContainer && createPortal(
        <PiPNoteEditor note={note} onChange={onChange} onClose={closePiP} />,
        pipContainer
      )}

      {/* Title */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 shrink-0">
        <input
          value={note.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-bold text-slate-100 placeholder-slate-700 focus:outline-none"
        />
      </div>

      {/* Tags */}
      <div className="px-4 sm:px-6 pb-3 shrink-0">
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
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => addTag(tagInput)}
            placeholder="Add tag…"
            className="bg-transparent text-xs text-slate-400 placeholder-slate-700 focus:outline-none min-w-[80px] flex-1"
          />
        </div>
      </div>

      {/* Rich text content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        <RichTextEditor
          content={note.content}
          onChange={handleContentChange}
          placeholder="Start writing your note…"
          minHeight="400px"
          className="border-slate-700/50 bg-transparent"
        />
      </div>

      {/* Word / char count */}
      {(() => {
        const plain = stripHtml(note.content);
        const wordCount = plain.trim() ? plain.trim().split(/\s+/).length : 0;
        const charCount = plain.length;
        return (
          <div className="px-4 sm:px-6 py-1.5 border-t border-slate-800/60 shrink-0">
            <p className="text-xs text-slate-700">
              {wordCount} word{wordCount !== 1 ? "s" : ""} · {charCount} char{charCount !== 1 ? "s" : ""}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function NotesPage() {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [activeTags, setActiveTags]   = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [showEditor, setShowEditor]   = useState(false);
  const [view, setView]           = useState<"gallery" | "editor">("gallery");
  const [gridSize, setGridSize]   = useState<"small" | "large">("large");
  const [sort, setSort] = useState<SortOrder>("updated");
  const [templatesOpen, setTemplatesOpen] = useState(false);

  useEffect(() => {
    const loaded = getNotes();
    setNotes(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  function persist(updated: Note[]) { setNotes(updated); saveNotes(updated); }

  function handleNew(templateContent = "") {
    const note = { ...createNote(), content: templateContent };
    const updated = [note, ...notes];
    persist(updated);
    setSelectedId(note.id);
    setShowEditor(true);
    setView("editor");
  }

  function openNote(id: string) {
    setSelectedId(id);
    setShowEditor(true);
    setView("editor");
  }

  function handleChange(updated: Note) {
    persist(notes.map(n => n.id === updated.id ? updated : n));
  }

  function handleDelete(id: string) {
    const remaining = notes.filter(n => n.id !== id);
    persist(remaining);
    setSelectedId(remaining[0]?.id ?? null);
    if (remaining.length === 0) setView("gallery");
    setShowEditor(false);
  }

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags ?? []))).sort();

  const filteredNotes = notes
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || stripHtml(n.content).toLowerCase().includes(search.toLowerCase()))
    .filter(n => activeTags.every(t => (n.tags ?? []).includes(t)))
    .filter(n => activeColors.length === 0 || activeColors.includes(n.color ?? ""))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (sort) {
        case "created":    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "title-asc":  return (a.title || "").localeCompare(b.title || "");
        case "title-desc": return (b.title || "").localeCompare(a.title || "");
        default:           return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const activeFilterCount = activeTags.length + activeColors.length;

  const selectedNote = notes.find(n => n.id === selectedId);

  // ── Gallery view ────────────────────────────────────────────
  if (view === "gallery") {
    return (
      <div className="flex flex-col h-[calc(100vh-0px)] min-h-0 bg-slate-950">
        {/* Gallery header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 shrink-0">
          <h1 className="text-sm font-semibold text-slate-200">Notes</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="pl-7 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600 w-48"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOrder)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="title-asc">Title A→Z</option>
              <option value="title-desc">Title Z→A</option>
            </select>
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors",
                filterOpen || activeFilterCount > 0
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
            <div className="relative">
              <button
                onClick={() => setTemplatesOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
              >
                <Plus size={13} />
                New
                <ChevronDown size={11} className={clsx("transition-transform", templatesOpen && "rotate-180")} />
              </button>
              {templatesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTemplatesOpen(false)} />
                  <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[160px]">
                    {NOTE_TEMPLATES.map(t => (
                      <button
                        key={t.label}
                        onClick={() => { handleNew(t.content); setTemplatesOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors flex items-center gap-2"
                      >
                        <t.icon size={12} className="text-slate-500 shrink-0" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible filter panel */}
        {filterOpen && (
          <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-3">
            {allTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => {
                    const active = activeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setActiveTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={clsx(
                          "text-xs rounded-full px-2.5 py-1 border transition-colors",
                          active ? "bg-blue-600/20 border-blue-600/50 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                        )}
                      >{tag}</button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Colour</p>
              <div className="flex flex-wrap gap-2">
                {NOTE_COLORS.map(c => {
                  const active = activeColors.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => setActiveColors(prev => active ? prev.filter(v => v !== c.value) : [...prev, c.value])}
                      className={clsx(
                        "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                        c.value === "" ? "bg-slate-700 border-slate-500" : `${c.bg} ${c.border}`,
                        active && "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900"
                      )}
                    />
                  );
                })}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setActiveTags([]); setActiveColors([]); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                <LayoutGrid size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">{search ? "No notes match" : "No notes yet"}</p>
              {!search && <button onClick={() => handleNew()} className="text-xs text-blue-400 hover:underline mt-1">Create your first note</button>}
            </div>
          ) : (
            <div className={clsx(
              "grid gap-3",
              gridSize === "large"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            )}>
              {filteredNotes.map(note => (
                <NoteGalleryCard key={note.id} note={note} size={gridSize} onClick={() => openNote(note.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 shrink-0">
          <p className="text-xs text-slate-700 text-center">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Floating grid-size toggle */}
        <div className="fixed bottom-6 right-6 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl shadow-black/40">
          <button
            onClick={() => setGridSize("large")}
            title="Large cards"
            className={clsx(
              "p-2 rounded-lg transition-colors",
              gridSize === "large" ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
            )}
          >
            <Grid2x2 size={16} />
          </button>
          <button
            onClick={() => setGridSize("small")}
            title="Small cards"
            className={clsx(
              "p-2 rounded-lg transition-colors",
              gridSize === "small" ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
            )}
          >
            <Grid3x3 size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Editor view (split layout) ───────────────────────────────
  return (
    <div className="flex h-[calc(100vh-0px)] min-h-0">
      {/* ── Left panel — full width on mobile when not in editor, fixed sidebar on sm+ ── */}
      <div className={clsx(
        "bg-slate-900 border-r border-slate-800 flex flex-col",
        "sm:w-64 sm:shrink-0",
        showEditor ? "hidden sm:flex" : "flex-1 sm:flex-none"
      )}>
        {/* Header */}
        <div className="px-3 pt-4 pb-3 border-b border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => setView("gallery")} title="All notes" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                <LayoutGrid size={14} />
              </button>
              <h1 className="text-sm font-semibold text-slate-200 px-1">Notes</h1>
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
                    onClick={() => setActiveTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className={clsx(
                      "shrink-0 text-xs rounded-full px-2 py-0.5 border transition-colors",
                      active ? "bg-blue-600/20 border-blue-600/50 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    )}
                  >{tag}</button>
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
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
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
              active={note.id === selectedId}
              onClick={() => openNote(note.id)}
            />
          ))}
        </div>

        <div className="px-3 py-2 border-t border-slate-800 shrink-0">
          <p className="text-xs text-slate-700 text-center">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={clsx(
        "flex-1 min-w-0 overflow-hidden",
        showEditor ? "flex flex-col" : "hidden sm:flex sm:flex-col"
      )}>
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onChange={handleChange}
            onDelete={() => handleDelete(selectedNote.id)}
            onBack={() => setShowEditor(false)}
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
    </div>
  );
}
