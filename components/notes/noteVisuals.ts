// Pure helpers for the notes gallery: accent colour, content digest, relative
// time, and date grouping. Nothing here writes to the note — the accent for a
// note with no chosen colour is derived from its id on every render.
import { Note, stripHtml } from "@/lib/notes-store";

/** Hex accents for the colour values in NOTE_COLORS (lib/notes-store.ts). */
export const ACCENT_HEX: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  teal: "#14b8a6",
  orange: "#f97316",
  yellow: "#eab308",
  cyan: "#06b6d4",
};

const AUTO_ORDER = ["blue", "purple", "teal", "amber", "pink", "green", "orange", "cyan", "red", "yellow"];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Accent for a note. A colour the user picked wins (`chosen: true`); a note with
 * no colour gets a stable one from its id (`chosen: false`), shown more quietly.
 */
export function noteAccent(note: Pick<Note, "id" | "color">): { hex: string; chosen: boolean } {
  if (note.color && ACCENT_HEX[note.color]) return { hex: ACCENT_HEX[note.color], chosen: true };
  return { hex: ACCENT_HEX[AUTO_ORDER[hashString(note.id) % AUTO_ORDER.length]], chosen: false };
}

export interface NoteDigest {
  text: string;
  words: number;
  headings: string[];
  image: string | null;
  tasksTotal: number;
  tasksDone: number;
}

const digestCache = new Map<string, NoteDigest>();

/** Reads the note HTML once per (id, updatedAt) and keeps what the card shows. */
export function digestNote(note: Note): NoteDigest {
  const key = `${note.id}|${note.updatedAt}|${note.content.length}`;
  const hit = digestCache.get(key);
  if (hit) return hit;

  const text = stripHtml(note.content);
  const words = text ? text.split(/\s+/).length : 0;
  let headings: string[] = [];
  let image: string | null = null;
  let tasksTotal = 0;
  let tasksDone = 0;

  if (typeof window !== "undefined" && note.content) {
    const doc = new DOMParser().parseFromString(note.content, "text/html");
    headings = Array.from(doc.querySelectorAll("h1, h2, h3"))
      .map(n => (n.textContent ?? "").trim())
      .filter(Boolean)
      .slice(0, 4);
    const img = doc.querySelector("img[src]");
    const src = img?.getAttribute("src") ?? "";
    if (/^(https?:|data:image\/|blob:|\/)/i.test(src)) image = src;
    const tasks = doc.querySelectorAll('li[data-type="taskItem"]');
    tasksTotal = tasks.length;
    tasks.forEach(t => { if (t.getAttribute("data-checked") === "true") tasksDone++; });
  }

  const digest = { text, words, headings, image, tasksTotal, tasksDone };
  if (digestCache.size > 500) digestCache.clear();
  digestCache.set(key, digest);
  return digest;
}

/** "just now", "5m ago", "2h ago", "yesterday", "3d ago", then a short date. */
export function relativeTime(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  const d = new Date(t);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

export type DateBucket = "Today" | "This week" | "Earlier";

export function dateBucket(iso: string, now: number): DateBucket {
  const t = new Date(iso).getTime();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (t >= startOfToday.getTime()) return "Today";
  if (t >= startOfToday.getTime() - 6 * 86400000) return "This week";
  return "Earlier";
}

const JIRA_KEY_RE = /\b[A-Z]{2,10}-\d{2,6}\b/g;

/** Jira keys mentioned in the title, tags or body (e.g. EAINT-12107), max 4. */
export function jiraKeys(note: Pick<Note, "title" | "tags">, text: string): string[] {
  const hay = `${note.title} ${note.tags.join(" ").toUpperCase()} ${text}`;
  return Array.from(new Set(hay.match(JIRA_KEY_RE) ?? [])).slice(0, 4);
}

export function readingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.round(words / 200));
}

/** Consecutive days, ending today or yesterday, on which a note was created or edited. */
export function activityStreak(notes: Note[], now: number): number {
  const days = new Set<string>();
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  notes.forEach(n => { days.add(key(new Date(n.updatedAt))); days.add(key(new Date(n.createdAt))); });
  const d = new Date(now);
  if (!days.has(key(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(key(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
