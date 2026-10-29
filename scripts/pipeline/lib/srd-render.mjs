#!/usr/bin/env node
// SRD page renderer for pipeline findings (Faizuddin, 2026-10-27).
//
//   node scripts/pipeline/lib/srd-render.mjs <pdf> <page> <out.png> [scale]
//   node scripts/pipeline/lib/srd-render.mjs --find <KEY>
//
// A finding shows the SRD page its expected result comes from, so the
// picture is the real page, never one we drew. Renders in Node with
// pdfjs-dist + @napi-rs/canvas; if that fails, falls back to a headless
// Playwright chromium in a NEW temporary context (never data/browser-profile).

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PDFJS_DIR = path.join(ROOT, "node_modules", "pdfjs-dist");

/** "v1.2" / "V1_2" / "v1.0" in a file name → [1, 2]; none → [0]. */
function versionOf(name) {
  const m = name.match(/[vV](\d+)[._](\d+)(?:[._](\d+))?/) ?? name.match(/[vV](\d+)(?!\d)/);
  return m ? m.slice(1).filter(Boolean).map(Number) : [0];
}
/** First 8-digit 20xxxxxx date in the name, else 0. */
function dateOf(name) {
  const m = name.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})/);
  return m ? Number(`${m[1]}${m[2]}${m[3]}`) : 0;
}
function cmpVersion(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/**
 * Newest SRD PDF for a ticket: looks in _reference/tickets/Studying/<KEY>/
 * and _reference/tickets/<KEY>/ (one folder level down too). Highest
 * version wins, then the newest date in the name, then file time.
 * Returns a repo-relative path (forward slashes) or null.
 */
export function findSrd(key) {
  const dirs = [
    path.join(ROOT, "_reference", "tickets", "Studying", key),
    path.join(ROOT, "_reference", "tickets", key),
  ];
  const found = [];
  const look = (dir, depth) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && depth > 0 && !/findings-\d{4}/.test(e.name)) look(full, depth - 1);
      else if (e.isFile() && /\.pdf$/i.test(e.name) && /srd/i.test(e.name)) {
        found.push({ full, name: e.name, v: versionOf(e.name), d: dateOf(e.name), t: fs.statSync(full).mtimeMs });
      }
    }
  };
  for (const d of dirs) look(d, 1);
  if (!found.length) return null;
  found.sort((a, b) => cmpVersion(b.v, a.v) || b.d - a.d || b.t - a.t);
  return path.relative(ROOT, found[0].full).split(path.sep).join("/");
}

const abs = p => (path.isAbsolute(p) ? p : path.join(ROOT, p));

async function renderWithNode(pdfPath, pageNumber, outPng, scale) {
  const pdfjs = await import(pathToFileURL(path.join(PDFJS_DIR, "legacy", "build", "pdf.mjs")).href);
  const { createCanvas } = await import("@napi-rs/canvas");
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({
    data,
    standardFontDataUrl: PDFJS_DIR.split(path.sep).join("/") + "/standard_fonts/",
    cMapUrl: PDFJS_DIR.split(path.sep).join("/") + "/cmaps/",
    cMapPacked: true,
    isEvalSupported: false,
    verbosity: 0,
  }).promise;
  try {
    if (pageNumber < 1 || pageNumber > doc.numPages) throw new Error(`page ${pageNumber} is outside 1-${doc.numPages}`);
    const page = await doc.getPage(pageNumber);
    const vp = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
    fs.mkdirSync(path.dirname(outPng), { recursive: true });
    fs.writeFileSync(outPng, await canvas.encode("png"));
    return { width: canvas.width, height: canvas.height, pages: doc.numPages };
  } finally {
    await doc.destroy();
  }
}

async function renderWithBrowser(pdfPath, pageNumber, outPng, scale) {
  const { chromium } = await import("playwright");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "srd-render-"));
  const html = path.join(tmp, "render.html");
  fs.copyFileSync(pdfPath, path.join(tmp, "srd.pdf"));
  const lib = pathToFileURL(path.join(PDFJS_DIR, "build", "pdf.mjs")).href;
  const worker = pathToFileURL(path.join(PDFJS_DIR, "build", "pdf.worker.mjs")).href;
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0;background:#fff"><canvas id="c"></canvas>
<script type="module">
import * as pdfjs from "${lib}";
pdfjs.GlobalWorkerOptions.workerSrc = "${worker}";
try {
  const doc = await pdfjs.getDocument("srd.pdf").promise;
  const page = await doc.getPage(${Number(pageNumber)});
  const vp = page.getViewport({ scale: ${Number(scale)} });
  const c = document.getElementById("c");
  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  await page.render({ canvasContext: c.getContext("2d"), canvas: c, viewport: vp }).promise;
  window.__done = { pages: doc.numPages, width: c.width, height: c.height };
} catch (e) { window.__done = { error: String(e) }; }
</script></body></html>`);
  const browser = await chromium.launch({ headless: true, args: ["--allow-file-access-from-files"] });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(pathToFileURL(html).href);
    await page.waitForFunction(() => window.__done, null, { timeout: 60_000 });
    const done = await page.evaluate(() => window.__done);
    if (done.error) throw new Error(done.error);
    fs.mkdirSync(path.dirname(outPng), { recursive: true });
    await page.locator("#c").screenshot({ path: outPng });
    await context.close();
    return done;
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Renders one PDF page to a PNG. pageNumber is 1-based.
 * Returns { out, width, height, pages, via: "node" | "browser" }.
 */
export async function renderPdfPage(pdfPath, pageNumber, outPng, { scale = 1.6 } = {}) {
  const src = abs(pdfPath);
  const out = abs(outPng);
  if (!fs.existsSync(src)) throw new Error(`SRD file not found: ${pdfPath}`);
  const n = Number(pageNumber);
  if (!Number.isInteger(n) || n < 1) throw new Error(`Page must be a whole number from 1 (got ${pageNumber})`);
  try {
    return { out, ...(await renderWithNode(src, n, out, scale)), via: "node" };
  } catch (e) {
    if (/outside 1-/.test(String(e?.message))) throw e;
    if (process.env.SRD_RENDER_DEBUG) console.error("node render failed:", e);
    return { out, ...(await renderWithBrowser(src, n, out, scale)), via: "browser" };
  }
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [a, b, c, d] = process.argv.slice(2);
  try {
    if (a === "--find") {
      if (!b) throw new Error("Usage: --find <KEY>");
      console.log(findSrd(b) ?? "No SRD PDF found");
    } else {
      if (!a || !b || !c) throw new Error("Usage: node scripts/pipeline/lib/srd-render.mjs <pdf> <page> <out.png> [scale]");
      const r = await renderPdfPage(a, Number(b), c, { scale: d ? Number(d) : undefined });
      console.log(`Rendered page ${b} of ${r.pages} → ${path.relative(ROOT, r.out).split(path.sep).join("/")} (${r.width}x${r.height}, ${r.via})`);
    }
  } catch (e) {
    console.error(String(e?.message ?? e));
    process.exit(1);
  }
}
