#!/usr/bin/env node
/**
 * Pull still frames out of an evidence video so a reviewer (cr-evidence) can
 * look at them. There is no ffmpeg on the QA machines; Chrome plays webm, so
 * this opens the video in Playwright's Chrome, seeks and screenshots.
 *
 *   node automation/scripts/video-frames.mjs <video.webm> --out <dir> [--every 5] [--max 24]
 *
 * Writes <dir>/frame-<mm>m<ss>s.png and prints the duration, so a reviewer can
 * say "the Total appears at 01:12" and check the highlight is on screen.
 * Frames are written OUTSIDE the evidence folder: they are a reading aid, not evidence.
 */
import { chromium } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const video = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
if (!video || !fs.existsSync(video)) {
  console.error("usage: video-frames.mjs <video.webm> --out <dir> [--every 5] [--max 24]");
  process.exit(2);
}
const out = opt("out", path.join(path.dirname(video), "_frames"));
const every = Number(opt("every", 5));
const max = Number(opt("max", 24));
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.setContent(
  `<body style="margin:0;background:#000"><video id="v" muted preload="auto" style="width:1920px;height:1080px;object-fit:contain" src="${pathToFileURL(path.resolve(video)).href}"></video></body>`,
);
// setContent pages are about:blank, which may not load file: media. Fall back to the file itself.
let ok = await page.waitForFunction(() => document.getElementById("v")?.readyState >= 1, null, { timeout: 8000 }).then(() => true, () => false);
if (!ok) {
  await page.goto(pathToFileURL(path.resolve(video)).href);
  ok = await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1, null, { timeout: 15000 }).then(() => true, () => false);
}
if (!ok) {
  console.error(`could not load ${video}`);
  await browser.close();
  process.exit(1);
}

// webm from Playwright often reports Infinity until it is scanned to the end.
const duration = await page.evaluate(async () => {
  const v = document.querySelector("video");
  v.controls = false; // Chrome's own player bar would cover the bottom of every frame
  v.pause();
  if (!Number.isFinite(v.duration)) {
    v.currentTime = 1e9;
    await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
  }
  return v.duration;
});

const times = [];
for (let t = 0.5; t < duration && times.length < max; t += every) times.push(t);
if (duration > 1 && !times.includes(duration - 0.3)) times.push(Math.max(0, duration - 0.3)); // the end state

for (const t of times) {
  await page.evaluate(async (t) => {
    const v = document.querySelector("video");
    v.currentTime = t;
    await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
  }, t);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(Math.floor(t % 60)).padStart(2, "0");
  await page.locator("video").screenshot({ path: path.join(out, `frame-${mm}m${ss}s.png`) });
}
console.log(`${path.basename(video)}: ${duration.toFixed(1)} s, ${times.length} frames → ${out}`);
await browser.close();
