import { remoteSync } from "./remote-sync";
export interface Note {
  id: string;
  title: string;
  content: string; // rich-text HTML
  color?: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const NOTE_COLORS: { label: string; value: string; bg: string; border: string }[] = [
  { label: "None",   value: "",       bg: "bg-slate-900",      border: "border-slate-700" },
  { label: "Red",    value: "red",    bg: "bg-red-950/40",     border: "border-red-800/60" },
  { label: "Amber",  value: "amber",  bg: "bg-amber-950/40",   border: "border-amber-800/60" },
  { label: "Green",  value: "green",  bg: "bg-green-950/40",   border: "border-green-800/60" },
  { label: "Blue",   value: "blue",   bg: "bg-blue-950/40",    border: "border-blue-800/60" },
  { label: "Purple", value: "purple", bg: "bg-purple-950/40",  border: "border-purple-800/60" },
];

export function noteColorMeta(color?: string) {
  return NOTE_COLORS.find(c => c.value === color) ?? NOTE_COLORS[0];
}

export function getNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: Note[] = JSON.parse(localStorage.getItem("notes") ?? "[]");
    return raw.map(n => ({ ...n, tags: n.tags ?? [] }));
  } catch { return []; }
}

export function saveNotes(notes: Note[]) {
  const json = JSON.stringify(notes);
  localStorage.setItem("notes", json);
  remoteSync("notes", json);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
