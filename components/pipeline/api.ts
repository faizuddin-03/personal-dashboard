// Client helpers for the QA pipeline pages (Faizuddin, 2026-10-27). Every call
// goes to app/api/pipeline/* (contract: scripts/pipeline/README.md §3). A
// missing or failing route returns a plain message instead of throwing, so
// the pages stay usable while parts of the API are still being built.
import type {
  Character, ChatEntry, Finding, PipelineJob, PipelineTicket,
} from "@/lib/pipeline/types";

export interface TicketDetail {
  ticket: PipelineTicket;
  chats: Partial<Record<Character, ChatEntry[]>>;
  jobs: PipelineJob[];
  findings: Finding[];
  files: { studyMd?: string | null; relatedMd?: string | null; scenariosMd?: string | null };
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<ApiResult<T>> {
  const { json, ...rest } = init ?? {};
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const text = await res.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!res.ok) {
      const msg = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : "";
      if (res.status === 404 && !msg) return { ok: false, status: 404, error: "This part of the pipeline is not ready yet. Try again in a moment." };
      return { ok: false, status: res.status, error: msg || `Something went wrong (error ${res.status}).` };
    }
    if (body === null && text) return { ok: false, status: res.status, error: "The server sent back something unexpected." };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the dashboard server." };
  }
}

/** "12345" or "eaint-12345" → "EAINT-12345"; null when it does not look like a key. */
export function normaliseKey(raw: string): string | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d+$/.test(v)) return `EAINT-${v}`;
  const m = v.match(/^([A-Z][A-Z0-9]*)-?(\d+)$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Image source for a finding: URLs and public paths as-is, repo files via /api/pipeline/file. */
export function fileUrl(path: string): string {
  if (/^(https?:|data:|\/)/.test(path)) return path;
  return `/api/pipeline/file?path=${encodeURIComponent(path.replace(/\\/g, "/"))}`;
}

export const ACTIVE_JOB = (j: PipelineJob) => j.state === "queued" || j.state === "running";

const TZ = "Asia/Kuala_Lumpur";
const fmt = new Intl.DateTimeFormat("en-MY", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : fmt.format(d);
}

/** Polls `fn` every `ms` while the tab is visible; also runs once on show. */
export function startPolling(fn: () => void, ms: () => number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    if (document.visibilityState === "visible") fn();
    timer = setTimeout(tick, ms());
  };
  const onVis = () => { if (document.visibilityState === "visible") fn(); };
  document.addEventListener("visibilitychange", onVis);
  timer = setTimeout(tick, ms());
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVis);
  };
}
