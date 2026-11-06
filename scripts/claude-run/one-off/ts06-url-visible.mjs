// ONE-OFF (Faizuddin, 2026-11-05): rerun of 12028_TS06 recorded as a SCREEN video, so the Chrome
// address bar is visible and a viewer can see every address being copied and pasted by hand.
// "only for this TS for this one particular time. after that, make sure to change back the recording style"
// Normal Claude-run recording stays scripts/claude-run/recorder.js (page-only video). Do not reuse this
// for other TS unless Faizuddin asks again.
//
// How: Playwright opens a visible Chrome window (maximised). Page steps (typing, clicking) go through
// Playwright like a person. Address-bar steps are real Windows keystrokes sent to that Chrome window
// (Ctrl+L, Ctrl+C / Ctrl+V, Enter). ffmpeg records the whole screen.
// Run:  CLAUDE_BO_PASS=<staging password> node scripts/claude-run/one-off/ts06-url-visible.mjs <out dir>
import { createRequire } from "node:module";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../../..");
const { chromium } = require(path.join(root, "scripts/eauto-12028/node_modules/playwright"));
const FF = process.env.FFMPEG || "ffmpeg";
const PASS = process.env.CLAUDE_BO_PASS;
const OUT = process.argv[2];
if (!PASS || !OUT) throw new Error("need CLAUDE_BO_PASS and an output dir");
fs.mkdirSync(OUT, { recursive: true });
const BASE = "https://staging.eauto.my/uat1";
const log = [];
const note = (s) => { const l = `${new Date().toISOString().slice(11, 19)} ${s}`; log.push(l); console.log(l); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pid;
const ps = (body) => {
  const r = spawnSync("powershell", ["-NoProfile", "-Command", body], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("powershell: " + r.stderr);
  return r.stdout.trim();
};
const keys = (seq) => ps(`$w = New-Object -ComObject WScript.Shell; if (-not $w.AppActivate(${pid})) { throw 'cannot focus Chrome' }; Start-Sleep -Milliseconds 400; ${seq}`);
// Visible copy: click into the address bar (Ctrl+L), copy (Ctrl+C), leave it (Esc). Returns the copied text.
const copyAddress = async () => {
  keys(`$w.SendKeys('^l'); Start-Sleep -Milliseconds 900; $w.SendKeys('^c'); Start-Sleep -Milliseconds 700; $w.SendKeys('{ESC}')`);
  await sleep(500);
  return ps("Get-Clipboard");
};
// Visible paste: address bar, paste the copied address, Enter.
const pasteAddress = async (url) => {
  ps(`Set-Clipboard -Value '${url.replace(/'/g, "''")}'`);
  keys(`$w.SendKeys('^l'); Start-Sleep -Milliseconds 900; $w.SendKeys('^v'); Start-Sleep -Milliseconds 1800; $w.SendKeys('{ENTER}')`);
};

// Step caption (display only, bottom-left), same look as recorder.js
const cap = async (page, text, color = "#f59e0b") => {
  note(text);
  await page.evaluate(({ t, c }) => {
    let d = document.getElementById("__cap");
    if (!d) { d = document.createElement("div"); d.id = "__cap"; document.body.appendChild(d); }
    d.style.cssText = `position:fixed;left:12px;bottom:12px;z-index:2147483647;background:rgba(15,23,42,.92);color:#fff;font:600 18px Segoe UI,Arial;padding:10px 16px;border-radius:6px;max-width:1500px;pointer-events:none;border-left:6px solid ${c}`;
    d.textContent = "12028_TS06 · " + t;
  }, { t: text, c: color }).catch(() => {});
};
const hl = async (loc, ms = 900) => {
  const h = await loc.first().elementHandle();
  await h.evaluate((n) => { n.__o = n.style.outline; n.style.outline = "3px solid #f59e0b"; n.style.outlineOffset = "2px"; });
  await sleep(ms);
  await h.evaluate((n) => { n.style.outline = n.__o; }).catch(() => {});
};
const login = async (page, user) => {
  await page.goto(`${BASE}/public/login/`, { waitUntil: "load" });
  await cap(page, `Log in to BackOffice uat1 as ${user}`);
  const u = page.locator('input[placeholder="Username"]').first(); await hl(u); await u.click(); await u.pressSequentially(user, { delay: 60 });
  const p = page.locator('input[placeholder="Password"]').first(); await hl(p); await p.click(); await p.pressSequentially(PASS, { delay: 40 });
  const b = page.locator('button:has-text("Login"), input[type="submit"], button[type="submit"]').first(); await hl(b); await b.click();
  await page.waitForLoadState("load"); await sleep(1500);
  const name = (await page.locator("span.user-name").first().textContent().catch(() => "")).trim();
  await cap(page, `Logged in: ${name} (top right)`); await sleep(2500);
  return name;
};

const server = await chromium.launchServer({ channel: "chrome", headless: false, args: ["--start-maximized"] });
const browser = await chromium.connect(server.wsEndpoint());
pid = server.process().pid;
note(`chrome pid ${pid}`);
const video = path.join(OUT, "12028_TS06-url-visible.mp4");
const ff = spawn(FF, ["-y", "-loglevel", "error", "-f", "gdigrab", "-framerate", "12", "-i", "desktop", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", video], { stdio: ["pipe", "inherit", "inherit"] });
await sleep(1500);
const result = {};
try {
  // ── Part 1: same browser window, as the TS steps say ─────────────────────
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage(); await sleep(800); keys("");
  await sleep(1500);
  await login(page, "mfared");
  const reports = page.locator("span.category", { hasText: /^\s*Reports\s*$/ }).locator("xpath=..");
  await cap(page, "BO Home → Reports → click Association Payment Listing"); await hl(reports, 1200);
  const link = reports.getByRole("link", { name: "Association Payment Listing", exact: true });
  await hl(link); await link.click(); await page.waitForLoadState("load"); await sleep(2500);
  await cap(page, "Copy the Summary page address from the address bar (Ctrl+L, Ctrl+C)");
  await sleep(1500);
  result.summaryUrl = await copyAddress();
  await cap(page, `Copied Summary address: ${result.summaryUrl}`, "#22c55e"); await sleep(3500);
  const feb = page.locator("table tr", { has: page.locator("td", { hasText: /^February$/ }) });
  await cap(page, "Click [View] on February 2026"); await hl(feb);
  const view = feb.getByText("View", { exact: true }); await hl(view); await view.click();
  await page.waitForLoadState("load"); await sleep(2500);
  await cap(page, "Copy the February Details page address from the address bar");
  await sleep(1500);
  result.detailsUrl = await copyAddress();
  await cap(page, `Copied Details address: ${result.detailsUrl}`, "#22c55e"); await sleep(3500);
  await cap(page, 'Click "Back to Backoffice", then Logout');
  const back = page.getByText("Back to Backoffice").first(); await hl(back); await back.click();
  await page.waitForLoadState("load"); await sleep(2000);
  const out = page.getByRole("link", { name: "Logout", exact: true }); await hl(out, 1500); await out.click();
  await page.waitForLoadState("load"); await sleep(2500);
  await cap(page, "Logged out of BackOffice"); await sleep(2000);
  result.noRoleName = await login(page, "onghongkee");
  await cap(page, 'No-role user: Reports has no "Association Payment Listing" link'); await hl(reports, 2500);
  await cap(page, "Paste the copied Summary address into the address bar and press Enter");
  await sleep(1500);
  await pasteAddress(result.summaryUrl);
  await page.waitForURL(result.summaryUrl, { timeout: 20000 }); await page.waitForLoadState("load"); await sleep(2500);
  result.sameSummary = (await page.locator("body").innerText()).slice(0, 300).replace(/\s+/g, " ");
  const sumShown = /Monthly Summary/i.test(result.sameSummary);
  await cap(page, sumShown ? "✘ Summary listing is shown to the no-role user (expected: access blocked)" : "✔ Summary blocked", sumShown ? "#ef4444" : "#22c55e");
  await sleep(4500);
  await cap(page, "Paste the copied February Details address into the address bar and press Enter");
  await sleep(1500);
  await pasteAddress(result.detailsUrl);
  await page.waitForURL(result.detailsUrl, { timeout: 20000 }); await page.waitForLoadState("load"); await sleep(2500);
  result.sameDetails = (await page.locator("body").innerText()).slice(0, 300).replace(/\s+/g, " ");
  const detShown = /February 2026/i.test(result.sameDetails) && !/No access/i.test(result.sameDetails);
  await cap(page, detShown ? "✘ February Details page is shown to the no-role user (expected: access blocked)" : "✔ Details blocked", detShown ? "#ef4444" : "#22c55e");
  await sleep(4500);
  await ctx.close();
  await sleep(1500);

  // ── Part 2: fresh browser window, no earlier Drafter session ─────────────
  const ctx2 = await browser.newContext({ viewport: null });
  const p2 = await ctx2.newPage(); await sleep(800); keys("");
  await sleep(1500);
  await cap(p2, "New browser window with no earlier session").catch(() => {});
  await login(p2, "onghongkee");
  await cap(p2, "Paste the same Summary address into the address bar and press Enter");
  await sleep(1500);
  await pasteAddress(result.summaryUrl);
  await p2.waitForLoadState("load"); await sleep(3500);
  result.freshSummary = (await p2.locator("body").innerText()).slice(0, 200).replace(/\s+/g, " ");
  await cap(p2, /No access/i.test(result.freshSummary) ? '✔ "No access to this module"' : "✘ Summary shown", /No access/i.test(result.freshSummary) ? "#22c55e" : "#ef4444");
  await sleep(4000);
  await cap(p2, "Paste the same Details address into the address bar and press Enter");
  await sleep(1500);
  await pasteAddress(result.detailsUrl);
  await p2.waitForLoadState("load"); await sleep(3500);
  result.freshDetails = (await p2.locator("body").innerText()).slice(0, 200).replace(/\s+/g, " ");
  await cap(p2, /No access/i.test(result.freshDetails) ? '✔ "No access to this module"' : "✘ Details shown", /No access/i.test(result.freshDetails) ? "#22c55e" : "#ef4444");
  await sleep(4000);
  await ctx2.close();
} catch (e) {
  result.error = e.message.split("\n")[0];
  note("ERROR " + result.error);
} finally {
  await sleep(1000);
  ff.stdin.write("q"); ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close().catch(() => {}); await server.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, "run-log.txt"), log.join("\n") + "\n\n" + JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
}
