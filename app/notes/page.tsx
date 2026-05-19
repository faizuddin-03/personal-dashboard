"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Pin, X, Search, Palette } from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, NOTE_COLORS, noteColorMeta, getNotes, saveNotes, stripHtml } from "@/lib/notes-store";

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
            <span key={tag} className="bg-slate-700 text-slate-300 text-[10px] rounded-full px-2 py-0.5">{tag}</span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-700 mt-1">{new Date(note.updatedAt).toLocaleDateString()}</p>
    </button>
  );
}

// ── Note editor panel ───────────────────────────────────────
function NoteEditor({ note, onChange, onDelete }: {
  note: Note;
  onChange: (updated: Note) => void;
  onDelete: () => void;
}) {
  const [showPalette, setShowPalette] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    saveTimer.current = setTimeout(() => update({ content: html }), 400);
  }

  const meta = noteColorMeta(note.color);

  return (
    <div className={clsx("flex flex-col h-full", meta.bg)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 shrink-0">
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

        {/* Delete */}
        <button onClick={onDelete} title="Delete note" className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <input
          value={note.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-bold text-slate-100 placeholder-slate-700 focus:outline-none"
        />
      </div>

      {/* Tags */}
      <div className="px-6 pb-3 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {(note.tags ?? []).map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-slate-700 text-slate-300 text-[10px] rounded-full px-2 py-0.5">
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
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <RichTextEditor
          content={note.content}
          onChange={handleContentChange}
          placeholder="Start writing your note…"
          minHeight="400px"
          className="border-slate-700/50 bg-transparent"
        />
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function NotesPage() {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getNotes();
    setNotes(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  function persist(updated: Note[]) { setNotes(updated); saveNotes(updated); }

  function handleNew() {
    const note = createNote();
    const updated = [note, ...notes];
    persist(updated);
    setSelectedId(note.id);
  }

  function handleChange(updated: Note) {
    persist(notes.map(n => n.id === updated.id ? updated : n));
  }

  function handleDelete(id: string) {
    const remaining = notes.filter(n => n.id !== id);
    persist(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags ?? []))).sort();

  const filteredNotes = notes
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || stripHtml(n.content).toLowerCase().includes(search.toLowerCase()))
    .filter(n => !activeTag || (n.tags ?? []).includes(activeTag))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const selectedNote = notes.find(n => n.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-0">
      {/* ── Left panel ── */}
      <div className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="px-3 pt-4 pb-3 border-b border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-slate-200 px-1">Notes</h1>
            <button onClick={handleNew} title="New note" className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
              <Plus size={16} />
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                onClick={() => setActiveTag(null)}
                className={clsx(
                  "shrink-0 text-[10px] rounded-full px-2 py-0.5 border transition-colors",
                  activeTag === null
                    ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >All</button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={clsx(
                    "shrink-0 text-[10px] rounded-full px-2 py-0.5 border transition-colors",
                    activeTag === tag
                      ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >{tag}</button>
              ))}
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
                <button onClick={handleNew} className="text-xs text-blue-400 hover:underline mt-1">Create one</button>
              )}
            </div>
          ) : filteredNotes.map(note => (
            <NoteListItem
              key={note.id}
              note={note}
              active={note.id === selectedId}
              onClick={() => setSelectedId(note.id)}
            />
          ))}
        </div>

        <div className="px-3 py-2 border-t border-slate-800 shrink-0">
          <p className="text-[10px] text-slate-700 text-center">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onChange={handleChange}
            onDelete={() => handleDelete(selectedNote.id)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Search size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">No note selected</p>
            <p className="text-slate-600 text-xs mb-5">Pick one from the list or create a new one</p>
            <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">New Note</button>
          </div>
        )}
      </div>
    </div>
  );
}
