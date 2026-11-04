import * as fs from "node:fs";
import * as path from "node:path";

/**
 * The EAINT-11868 expiry email ("<Application No> - <company>: Your Application Link Has Expired"), read from an .eml
 * saved out of the Mailtrap web inbox (no API token, Azfar 28.10.2026). Its [Reactivate Application] button is the
 * only way into the "Dealer Application Reactivation" page (./reactivation.page.ts). Moved here from
 * cr/EAINT-11868/03-spec 30.10.2026 so the flow's verify spec can read it too (nothing imports a ticket folder).
 */
/**
 * The expiry email as saved by Claude / the QA from the Mailtrap web inbox as an .eml (Mailtrap > the email > Download,
 * no API token: Azfar 30.10.2026), at cr/EAINT-11868/04-runs/emails/<APPNO>-expiry.eml (gitignored, like the rest of
 * 04-runs). REACTIVATE_EML_<TS id> = that file's path (absolute, or relative to the repo root).
 *
 * The button's href is a SIGNED link (`/obs/form/reactivate?linkUuid=…&s=…&v=…`, seen 30.10.2026 in NA60001238's
 * email): only its host + path are ever logged, shown, annotated or written. The query string stays in memory.
 */
export interface ReactivateEmail {
  /** The full signed link. NEVER log, note, annotate or print this. */
  url: string;
  /** host + path only (safe to show). */
  shown: string;
  file: string;
  subject: string;
  date: string;
  to: string;
  /** The Application No the subject starts with ("NA60001238 - <company>: Your Application Link Has Expired"). */
  applicationNo: string;
  /** The button's `target` attribute ("" when none: NA60001238's email of 30.10.2026 had none). */
  target: string;
}

interface MimePart { headers: Record<string, string>; body: string }

function splitPart(raw: string): MimePart {
  const at = raw.search(/\r?\n\r?\n/);
  const head = at < 0 ? raw : raw.slice(0, at);
  const body = at < 0 ? "" : raw.slice(at).replace(/^\r?\n\r?\n/, "");
  const headers: Record<string, string> = {};
  // Unfold continuation lines (RFC 5322), then one header per line.
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const m = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (m) headers[m[1].toLowerCase()] = m[2].trim();
  }
  return { headers, body };
}

function decodeBody(part: MimePart): string {
  const cte = (part.headers["content-transfer-encoding"] ?? "7bit").toLowerCase();
  if (cte === "base64") return Buffer.from(part.body.replace(/\s+/g, ""), "base64").toString("utf8");
  if (cte === "quoted-printable") {
    const soft = part.body.replace(/=\r?\n/g, "");
    const bytes: number[] = [];
    for (let i = 0; i < soft.length; i++) {
      const hex = soft[i] === "=" ? /^[0-9A-Fa-f]{2}$/.exec(soft.slice(i + 1, i + 3))?.[0] : undefined;
      if (hex) { bytes.push(parseInt(hex, 16)); i += 2; } else bytes.push(soft.charCodeAt(i) & 0xff);
    }
    return Buffer.from(bytes).toString("utf8");
  }
  return part.body;
}

/** Every text/html part of a MIME message, decoded (multipart/* walked recursively). */
function htmlParts(part: MimePart): string[] {
  const type = part.headers["content-type"] ?? "text/plain";
  if (/^multipart\//i.test(type)) {
    const boundary = /boundary\s*=\s*"?([^";]+)"?/i.exec(type)?.[1];
    if (!boundary) return [];
    const pieces = part.body.split(`--${boundary}`).slice(1);
    return pieces.filter((p) => !p.startsWith("--")).flatMap((p) => htmlParts(splitPart(p.replace(/^\r?\n/, ""))));
  }
  return /^text\/html/i.test(type) ? [decodeBody(part)] : [];
}

/**
 * Read the expiry email (.eml), take its text/html part and the ONE href that contains /obs/form/reactivate
 * (&amp; decoded). Throws when there is none, or more than one different one. The link must point to this staging's
 * host (BASE_URL) under /obs/: an email whose button leads anywhere else is never opened (Q11 is recorded by the TS).
 */
export function readReactivateEmail(file: string): ReactivateEmail {
  if (!file || !fs.existsSync(file)) throw new Error(`No expiry email at "${file}": save it from Mailtrap as an .eml and set REACTIVATE_EML_<TS>.`);
  const msg = splitPart(fs.readFileSync(file, "utf8"));
  const html = htmlParts(msg);
  if (!html.length) throw new Error(`${path.basename(file)} has no text/html part.`);
  const hrefs = new Set<string>();
  let target = "";
  for (const h of html) {
    for (const a of h.matchAll(/<a\b[^>]*>/gi)) {
      const m = /href\s*=\s*(["'])(.*?)\1/is.exec(a[0]);
      if (!m) continue;
      const href = m[2].replace(/&amp;/gi, "&").trim();
      if (!/\/obs\/form\/reactivate/i.test(href)) continue;
      hrefs.add(href);
      target = /target\s*=\s*["']?([^"'\s>]+)/i.exec(a[0])?.[1] ?? target;
    }
  }
  if (hrefs.size !== 1) throw new Error(`${path.basename(file)}: ${hrefs.size} different /obs/form/reactivate links in the email, expected exactly one.`);
  const url = [...hrefs][0];
  let u: URL;
  try { u = new URL(url); } catch { throw new Error(`${path.basename(file)}: the reactivate link is not a full URL (host + path: unreadable).`); }
  const shown = `${u.host}${u.pathname}`;
  const base = (process.env.BASE_URL ?? "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (base && u.host !== base) throw new Error(`The email's [Reactivate Application] points to ${shown}, not this staging's host ${base}: not opened.`);
  if (!/^\/obs\/form\/reactivate/i.test(u.pathname)) throw new Error(`The reactivate link's path is ${u.pathname}, not /obs/form/reactivate: not opened.`);
  const decodeWord = (s: string) => s.replace(/=\?utf-8\?([BQ])\?([^?]*)\?=/gi, (_, enc: string, txt: string) =>
    enc.toUpperCase() === "B" ? Buffer.from(txt, "base64").toString("utf8") : txt.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_x, h: string) => String.fromCharCode(parseInt(h, 16))));
  const subject = decodeWord(msg.headers["subject"] ?? "");
  return {
    url,
    shown,
    file,
    subject,
    date: msg.headers["date"] ?? "",
    to: msg.headers["to"] ?? "",
    applicationNo: /^(NA\d{8})\b/.exec(subject)?.[1] ?? "",
    target,
  };
}
