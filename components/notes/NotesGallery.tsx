"use client";
// Notes gallery: masonry cards whose height follows their content, a Pinned
// strip, a featured "Latest" card, and Today / This week / Earlier sections.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Pin, Palette, Archive, ArchiveRestore, Trash2, ListChecks, Sparkles, Clock, CalendarDays, History, PartyPopper, Ticket } from "lucide-react";
import { Note, NOTE_COLORS } from "@/lib/notes-store";
import { noteAccent, digestNote, relativeTime, dateBucket, jiraKeys, readingMinutes, ACCENT_HEX, type DateBucket } from "./noteVisuals";
import s from "./NotesGallery.module.css";

export type CardVariant = "featured" | "pinned" | "normal" | "compact";

export interface CardHandlers {
  onOpen: (id: string) => void;
  onUpdate: (id: string, partial: Partial<Note>) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
}

const PREVIEW_CHARS: Record<CardVariant, number> = { featured: 650, pinned: 420, normal: 280, compact: 120 };

function accentStyle(hex: string): CSSProperties {
  return { ["--accent-hex" as string]: hex } as CSSProperties;
}

// ── Single card ─────────────────────────────────────────────
export function NoteCard({ note, variant, now, handlers }: {
  note: Note; variant: CardVariant; now: number; handlers: CardHandlers;
}) {
  const accent = noteAccent(note);
  const d = digestNote(note);
  const keys = jiraKeys(note, d.text);
  const [palette, setPalette] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const archived = !!note.archived;

  useEffect(() => {
    if (!palette && !confirmDelete) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setPalette(false); setConfirmDelete(false); }
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { setPalette(false); setConfirmDelete(false); } }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [palette, confirmDelete]);

  const limit = PREVIEW_CHARS[variant];
  const preview = d.text.slice(0, limit);
  const truncated = d.text.length > limit;
  const showImage = d.image && variant !== "compact";
  const big = variant === "featured";
  const tasksPct = d.tasksTotal ? Math.round((d.tasksDone / d.tasksTotal) * 100) : 0;
  const title = note.title || "Untitled";
  const mins = readingMinutes(d.words);

  const actionBtn = "p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <article
      ref={ref}
      style={accentStyle(accent.hex)}
      className={clsx(s.card, accent.chosen && s.chosen, "relative rounded-2xl", (palette || confirmDelete) && "z-20")}
    >
      <div className={clsx(s.strip, "rounded-t-2xl", accent.chosen ? "h-1.5" : "h-1 opacity-60")} />

      {/* Whole-card open target; content sits above it with pointer-events off. */}
      <button
        type="button"
        onClick={() => handlers.onOpen(note.id)}
        aria-label={`Open note: ${title}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />

      <div className={clsx("relative z-[1] pointer-events-none", big ? "p-5 sm:p-6" : variant === "compact" ? "p-3" : "p-4")}>
        <div className={clsx(big && showImage && "md:flex md:gap-6")}>
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start gap-2">
              {big && (
                <span className={clsx(s.chip, "shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 rounded-full px-2 py-0.5 mt-1")}>
                  <Sparkles size={11} /> Latest
                </span>
              )}
              {note.pinned && !big && <Pin size={12} className="text-yellow-400 shrink-0 mt-1" />}
              <h3 className={clsx(
                "flex-1 min-w-0 font-semibold leading-snug break-words",
                big ? "text-xl text-slate-100" : variant === "pinned" ? "text-base text-slate-100" : variant === "compact" ? "text-xs text-slate-200" : "text-sm text-slate-200",
                !note.title && "text-slate-500 italic font-medium",
                variant === "compact" ? "line-clamp-2" : "line-clamp-3",
              )}>
                {title}
              </h3>

              {/* Quick actions */}
              <div className={clsx(s.actions, (palette || confirmDelete) && s.actionsOpen, "pointer-events-auto relative flex items-center gap-0.5 -mr-1 -mt-1 shrink-0")}>
                {confirmDelete ? (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1">
                    <span className="text-xs text-red-400">Delete forever?</span>
                    <button type="button" onClick={() => { setConfirmDelete(false); handlers.onDeleteForever(note.id); }} className="px-2 py-0.5 text-xs bg-red-700 text-white rounded hover:bg-red-600">Yes</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-800">No</button>
                  </div>
                ) : archived ? (
                  <>
                    <button type="button" title="Restore" aria-label="Restore note" onClick={() => handlers.onRestore(note.id)} className={actionBtn}><ArchiveRestore size={14} /></button>
                    <button type="button" title="Delete forever" aria-label="Delete note forever" onClick={() => setConfirmDelete(true)} className={clsx(actionBtn, "hover:text-red-400")}><Trash2 size={14} /></button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      title={note.pinned ? "Unpin" : "Pin"}
                      aria-label={note.pinned ? "Unpin note" : "Pin note"}
                      aria-pressed={note.pinned}
                      onClick={() => handlers.onUpdate(note.id, { pinned: !note.pinned })}
                      className={clsx(actionBtn, note.pinned && "text-yellow-400")}
                    ><Pin size={14} /></button>
                    <button type="button" title="Colour" aria-label="Note colour" aria-expanded={palette} onClick={() => setPalette(v => !v)} className={actionBtn}><Palette size={14} /></button>
                    <button type="button" title="Archive" aria-label="Archive note" onClick={() => handlers.onArchive(note.id)} className={actionBtn}><Archive size={14} /></button>
                  </>
                )}
                {palette && (
                  <div className="absolute top-full right-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl grid grid-cols-6 gap-1.5 w-max">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        aria-label={`Colour ${c.label}`}
                        onClick={() => { handlers.onUpdate(note.id, { color: c.value }); setPalette(false); }}
                        style={c.value ? { backgroundColor: ACCENT_HEX[c.value] } : undefined}
                        className={clsx(
                          "w-6 h-6 rounded-full border border-slate-600 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                          c.value === "" && "bg-slate-700",
                          (note.color ?? "") === c.value && "ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-800",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Outline for bigger cards */}
            {(big || variant === "pinned") && d.headings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {d.headings.slice(0, big ? 4 : 3).map((h, i) => (
                  <span key={i} className="text-[11px] text-slate-400 bg-slate-800/60 rounded-md px-1.5 py-0.5 truncate max-w-[12rem]">{h}</span>
                ))}
              </div>
            )}

            {/* Preview */}
            {preview ? (
              <p className={clsx(
                "mt-2 text-slate-400 whitespace-pre-line break-words",
                big ? "text-sm leading-relaxed" : "text-xs leading-relaxed",
                truncated && s.fade,
              )}>
                {preview}
              </p>
            ) : variant !== "compact" && !d.image && d.tasksTotal === 0 ? (
              <p className="mt-2 text-xs text-slate-600 italic">Empty note</p>
            ) : null}
          </div>

          {showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={d.image!}
              alt=""
              loading="lazy"
              className={clsx(
                "w-full object-cover rounded-xl border border-slate-800 mt-3",
                big ? "md:mt-0 md:w-2/5 max-h-56" : variant === "pinned" ? "max-h-44" : "max-h-32",
              )}
            />
          )}
        </div>

        {/* Checklist progress */}
        {d.tasksTotal > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="inline-flex items-center gap-1">
                {tasksPct === 100 ? <PartyPopper size={11} className="text-green-400" /> : <ListChecks size={11} />}
                {tasksPct === 100 ? "All done" : `${d.tasksDone} of ${d.tasksTotal} done`}
              </span>
              <span>{tasksPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className={clsx(s.fill, "h-full rounded-full transition-[width]")} style={{ width: `${tasksPct}%` }} />
            </div>
          </div>
        )}

        {/* Chips */}
        {(note.tags.length > 0 || keys.length > 0) && variant !== "compact" && (
          <div className="flex flex-wrap gap-1 mt-3">
            {keys.map(k => (
              <Link
                key={k}
                href={`/jira/${k}`}
                title={`Open ${k}`}
                className="pointer-events-auto inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-blue-600/15 border border-blue-600/40 text-blue-300 hover:bg-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Ticket size={10} /> {k}
              </Link>
            ))}
            {note.tags.slice(0, 4).map(tag => (
              <span key={tag} className={clsx(s.chip, "text-[11px] text-slate-300 rounded-full px-2 py-0.5")}>#{tag}</span>
            ))}
            {note.tags.length > 4 && <span className="text-[11px] text-slate-500 px-1">+{note.tags.length - 4}</span>}
          </div>
        )}

        {/* Footer */}
        <div className={clsx("flex items-center gap-2 text-[11px] text-slate-500", variant === "compact" ? "mt-2" : "mt-3")}>
          <span className={clsx(s.dot, "w-1.5 h-1.5 rounded-full shrink-0")} />
          <span title={new Date(note.updatedAt).toLocaleString()}>
            {archived && note.archivedAt ? `archived ${relativeTime(note.archivedAt, now)}` : `edited ${relativeTime(note.updatedAt, now)}`}
          </span>
          {variant !== "compact" && mins > 0 && <span className="ml-auto shrink-0">{d.words} words · {mins} min</span>}
        </div>
      </div>
    </article>
  );
}

// ── Section header ──────────────────────────────────────────
function Section({ icon, label, count, children }: { icon: ReactNode; label: string; count: number; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        <span>{label}</span>
        <span className="text-slate-600 font-normal normal-case tracking-normal">{count}</span>
        <span className="flex-1 h-px bg-slate-800 ml-1" />
      </h2>
      {children}
    </section>
  );
}

const BUCKET_ICON: Record<DateBucket, ReactNode> = {
  "Today": <Clock size={12} />,
  "This week": <CalendarDays size={12} />,
  "Earlier": <History size={12} />,
};

// ── Gallery ────────────────────────────────────────────────
export default function NotesGallery({ notes, sort, compact, allowFeatured, now, handlers }: {
  notes: Note[];
  sort: "updated" | "created" | "title-asc" | "title-desc";
  compact: boolean;
  allowFeatured: boolean;
  now: number;
  handlers: CardHandlers;
}) {
  const cardVariant: CardVariant = compact ? "compact" : "normal";
  const masonry = clsx(s.masonry, compact && s.compact);

  const pinned = notes.filter(n => n.pinned && !n.archived);
  let rest = notes.filter(n => !(n.pinned && !n.archived));

  let featured: Note | null = null;
  if (allowFeatured && sort === "updated" && rest.length >= 3) {
    featured = rest[0];
    rest = rest.slice(1);
  }

  const dateField = sort === "created" ? "createdAt" : "updatedAt";
  const grouped = sort === "updated" || sort === "created";
  const buckets: { label: DateBucket; notes: Note[] }[] = [];
  if (grouped) {
    for (const label of ["Today", "This week", "Earlier"] as DateBucket[]) {
      const list = rest.filter(n => dateBucket(n[dateField], now) === label);
      if (list.length) buckets.push({ label, notes: list });
    }
  }

  return (
    <div>
      {pinned.length > 0 && (
        <Section icon={<Pin size={12} className="text-yellow-400" />} label="Pinned" count={pinned.length}>
          <div className={clsx(s.masonry, s.pinned)}>
            {pinned.map(n => <NoteCard key={n.id} note={n} variant={compact ? "normal" : "pinned"} now={now} handlers={handlers} />)}
          </div>
        </Section>
      )}

      {featured && (
        <section className="mb-8">
          <NoteCard note={featured} variant="featured" now={now} handlers={handlers} />
        </section>
      )}

      {grouped ? (
        buckets.map(b => (
          <Section key={b.label} icon={BUCKET_ICON[b.label]} label={sort === "created" ? `Created ${b.label.toLowerCase()}` : b.label} count={b.notes.length}>
            <div className={masonry}>
              {b.notes.map(n => <NoteCard key={n.id} note={n} variant={cardVariant} now={now} handlers={handlers} />)}
            </div>
          </Section>
        ))
      ) : rest.length > 0 && (
        <Section icon={<History size={12} />} label={pinned.length ? "Everything else" : "All notes"} count={rest.length}>
          <div className={masonry}>
            {rest.map(n => <NoteCard key={n.id} note={n} variant={cardVariant} now={now} handlers={handlers} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
