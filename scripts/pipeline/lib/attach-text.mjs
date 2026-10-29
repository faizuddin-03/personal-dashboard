// Text copies of Jira attachments (Faizuddin, 2026-10-27: "make sure all those
// agents can get the files they needed"). Characters read files with the Read
// tool, which cannot open .docx, .xlsx or long .html mock-ups, so every such
// attachment gets a plain-text twin next to it: <name>-text.md.
//
// Used by the toolbox (scripts/pipeline/tools/fetch.mjs) and the hourly Scout
// (scripts/agents/run-agent.mjs). Read only on the source file.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Extensions this module can turn into text. */
export const CONVERTIBLE = /\.(docx|xlsx|pdf|html?)$/i;

/** <dir>/<name>-text.md for <dir>/<name>.<ext>. */
export const textCopyPath = abs => abs.replace(/\.[^./\\]+$/, "") + "-text.md";

/** Marker written into every HTML text copy made by the rendering converter (2026-10-28). */
const HTML_MARK = "[converter: html-render-v2";

/**
 * True when the text copy exists and is not older than the source. An HTML
 * text copy also needs the html-render-v2 marker, so copies made by the older
 * tag-strip-only converter are redone once.
 */
export function textFresh(abs) {
  try {
    const dest = textCopyPath(abs);
    if (fs.statSync(dest).mtimeMs < fs.statSync(abs).mtimeMs) return false;
    if (/\.html?$/i.test(abs)) {
      const fd = fs.openSync(dest, "r");
      try {
        const buf = Buffer.alloc(1024);
        const n = fs.readSync(fd, buf, 0, buf.length, 0);
        return buf.subarray(0, n).toString("utf8").includes(HTML_MARK);
      } finally { fs.closeSync(fd); }
    }
    return true;
  } catch { return false; }
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™" };

function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/**
 * HTML → readable text that keeps the structure: headings as "#", list items
 * as "1.", table rows as "| a | b |", form fields as "[input name=... value=...]".
 * Scripts, styles and inline images are dropped.
 */
export function htmlToText(html) {
  let s = String(html ?? "");
  s = s.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, m => {
      const t = m.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      return t ? `\n# ${t.trim()}\n` : "";
    });
  s = s.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n${"#".repeat(Number(n))} ${t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
  // Form controls carry the field names and values a mock-up is about.
  s = s.replace(/<(input|select|textarea|button)\b([^>]*)>/gi, (m, tag, attrs) => {
    const pick = k => attrs.match(new RegExp(`\\b${k}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.slice(2).find(v => v != null);
    const bits = ["name", "id", "type", "value", "placeholder"].map(k => { const v = pick(k); return v ? `${k}=${v}` : ""; }).filter(Boolean);
    return tag.toLowerCase() === "button" ? " [button] " : ` [${tag.toLowerCase()}${bits.length ? " " + bits.join(" ") : ""}] `;
  });
  s = s.replace(/<img\b[^>]*>/gi, m => { const alt = m.match(/\balt\s*=\s*"([^"]*)"/i)?.[1]; return alt ? ` [image: ${alt}] ` : " "; });
  // One table row per line: flatten each cell's paragraphs / breaks first.
  s = s.replace(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, inner) => {
    const cell = inner.replace(/<\/(p|div|li)>|<br\s*\/?>/gi, " ⏎ ").replace(/<li\b[^>]*>/gi, " 1. ").replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ").replace(/^( ?⏎ ?)+|( ?⏎ ?)+$/g, "").replace(/(\s*⏎\s*){2,}/g, " ⏎ ").trim();
    return ` ${cell.replace(/\|/g, "/")} |`;
  });
  s = s.replace(/<tr\b[^>]*>/gi, "\n|").replace(/<\/tr>/gi, "").replace(/<\/table>/gi, "\n\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n1. ").replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|section|article|header|footer|ul|ol|table|form|label|option|h[1-6]|fieldset|legend|nav|main|aside)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decode(s);
  return s.split("\n").map(l => l.replace(/[ \t ]+/g, " ").trim()).filter((l, i, a) => l || (a[i - 1] ?? "") !== "")
    .filter(l => l !== "|" && l !== "| |").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function docxText(abs) {
  const { default: mammoth } = await import("mammoth");
  // HTML keeps headings and tables; images are dropped (the .docx stays for that).
  const { value } = await mammoth.convertToHtml({ path: abs }, {
    convertImage: mammoth.images.imgElement(() => ({ src: "" })),
  });
  return htmlToText(value);
}

async function pdfText(abs) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: await fsp.readFile(abs) });
  try { return String((await parser.getText()).text ?? "").trim(); }
  finally { try { await parser.destroy(); } catch { /* ignore */ } }
}

const RENDER_TIMEOUT_MS = 30000;

/**
 * Renders a saved .html file in a throw-away headless Chromium (file://, every
 * non-file request blocked, offline, new temporary context: never a saved
 * browser profile), so content the page's own scripts build is captured.
 * Returns { text, visible } or throws. Read only on the source file.
 */
async function renderedHtmlText(abs) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  let timer;
  try {
    const work = (async () => {
      const context = await browser.newContext({ offline: true, javaScriptEnabled: true, serviceWorkers: "block" });
      await context.route("**/*", route => (route.request().url().startsWith("file:") ? route.continue() : route.abort()));
      const page = await context.newPage();
      page.on("dialog", d => d.dismiss().catch(() => {}));
      await page.goto(pathToFileURL(abs).href, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(800); // let onload / DOMContentLoaded builders finish
      // Copy live form state into attributes so the serialised DOM carries it,
      // label dropdown options, and grab what a viewer sees on open (innerText).
      const res = await page.evaluate(() => {
        const visible = document.body ? document.body.innerText : "";
        for (const el of document.querySelectorAll("input, textarea, select")) {
          if (el.tagName === "SELECT") {
            for (const o of el.options) { if (o.selected) o.setAttribute("selected", ""); }
          } else if (el.type === "checkbox" || el.type === "radio") {
            if (el.checked) el.setAttribute("checked", "");
          } else if (el.value && !el.getAttribute("value")) el.setAttribute("value", el.value);
        }
        for (const sel of document.querySelectorAll("select")) {
          const opts = [...sel.options].map(o => o.textContent.trim()).filter(Boolean);
          if (opts.length) sel.insertAdjacentText("afterend", ` (options: ${opts.join(" / ")}) `);
          for (const o of [...sel.options]) o.textContent = "";
        }
        const t = document.title ? `<title>${document.title}</title>` : "";
        return { html: `<html><head>${t}</head>${document.body ? document.body.outerHTML : ""}</html>`, visible };
      });
      await context.close();
      return res;
    })();
    const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`render timed out after ${RENDER_TIMEOUT_MS / 1000}s`)), RENDER_TIMEOUT_MS); });
    const { html, visible } = await Promise.race([work, timeout]);
    return { text: htmlToText(html), visible: String(visible ?? "").replace(/\n{3,}/g, "\n\n").trim() };
  } finally {
    clearTimeout(timer);
    await browser.close().catch(() => {});
  }
}

/**
 * HTML file → text: the rendered DOM (every screen, hidden ones too, with
 * tables, form fields and option lists) plus the innerText seen on open.
 * Falls back to the plain tag strip if rendering fails, times out, or gives
 * much less text than the tag strip. Returns { body, how }.
 */
async function htmlFileText(abs) {
  const stripped = htmlToText(await fsp.readFile(abs, "utf8"));
  let r;
  try { r = await renderedHtmlText(abs); }
  catch (e) { return { body: stripped, how: `tag-strip fallback: ${String(e?.message ?? e).split("\n")[0].slice(0, 160)}` }; }
  // 90%: the browser decodes entities the tag strip leaves raw (&le; → ≤), so
  // an identical page can come out a few characters shorter.
  if (r.text.length < stripped.length * 0.9) return { body: stripped, how: "tag-strip fallback: rendered page gave less text" };
  const parts = [r.text];
  if (r.visible) parts.push("", "---", "", "## Visible on open (innerText of the first screen)", "", r.visible);
  return { body: parts.join("\n"), how: "rendered" };
}

/**
 * Writes <name>-text.md for a .docx / .xlsx / .pdf / .html file. Returns the
 * text copy's absolute path, or null when the type is not convertible.
 * Throws with a readable message when the file cannot be read.
 */
export async function convertAttachment(abs) {
  if (!CONVERTIBLE.test(abs)) return null;
  const dest = textCopyPath(abs);
  const ext = path.extname(abs).toLowerCase();
  if (ext === ".xlsx") {
    const { xlsxToMarkdown } = await import("./xlsx-text.mjs");
    await xlsxToMarkdown(abs, dest);
    return dest;
  }
  let body, how = "";
  if (ext === ".docx") body = await docxText(abs);
  else if (ext === ".pdf") body = await pdfText(abs);
  else ({ body, how } = await htmlFileText(abs));
  const kind = ext === ".docx" ? "Word document (headings and tables kept as text; images not kept)"
    : ext === ".pdf" ? "PDF (text layer only; open the PDF itself with the Read tool to see pages and images)"
    : how === "rendered"
      ? "HTML page, rendered offline in headless Chromium so script-built content is included (every screen, hidden ones too; form fields shown as [input ...], dropdowns as (options: ...)); open the .html file itself for layout"
      : "HTML page (tags removed; form fields shown as [input ...]; open the .html file itself for layout)";
  const out = [`# ${path.basename(abs)} — text copy (${new Date().toLocaleString("en-MY")})`, "", `Converted from a ${kind}.`];
  if (ext === ".html" || ext === ".htm") out.push(`${HTML_MARK}: ${how}]`);
  out.push("", body || "(no text found)", "");
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, out.join("\n"));
  return dest;
}

/** Converts only when the text copy is missing or older. Returns { dest, converted }. */
export async function ensureTextCopy(abs) {
  if (!CONVERTIBLE.test(abs)) return { dest: null, converted: false };
  if (textFresh(abs)) return { dest: textCopyPath(abs), converted: false };
  return { dest: await convertAttachment(abs), converted: true };
}
