/**
 * The Firefox 36 step of a TS: `ts.ff36.run([...])` (EAINT-12253, 21.10.2026;
 * contract cr/EAINT-12253/02-plan/ff36-bridge-contract.md).
 *
 * Playwright cannot drive Firefox 36.0.4, so this writes a plan into the TS folder and runs
 * `<FF36_PY> -I src/ff36/bridge.py <plan.json>` (Selenium 2.53.6). The bridge records the Firefox
 * WINDOW only (ffmpeg gdigrab by hwnd) from before login to after the last step, into the TS folder
 * as video_<TS>_ff36-<k>.mp4, and takes its screenshots there as NN-ff36-<name>.png — numbered with
 * the TS's own screenshots, usable as `ts.prove` evidence. The Chrome tab shows a card meanwhile.
 *
 *   const r = await ts.ff36.run([
 *     { do: "login", as: "ucd" },                                   // the lane's dealer (like ts.portal("ucd"))
 *     { do: "resubmit", listing: "stms", ref: "S604495156", vehicle: "ON000125" },
 *     { do: "click", css: "#to-payment" }, { do: "confirm", accept: true },
 *     { do: "waitFor", css: "body", text: "JPJ Transfer Status", timeoutS: 120 },
 *     { do: "reminder", expect: "shown", waitS: 15, shot: "E3-step6-arrival" },
 *   ]);
 *   await ts.prove("E3", r.steps[5].state === "shown", r.steps[5].shot!, `reminder ${r.steps[5].state}: ${r.steps[5].text}`);
 *
 * Credentials go to the bridge by env (FF36_USER_<i> / FF36_PASS_<i>), never on the command line or in the plan.
 * Any bridge failure (no Firefox, no recorder, a step it could not do) throws "FF36 bridge: …", never a product FAIL.
 * The gate files start-up / driver / VPN / login-page failures as ENV and a failed step ("step N (…) failed") as SCRIPT
 * (ts-run.ts FF36_ENV_PATTERN, 21.10.2026). Card / thumbprint steps are never done in Firefox 36.
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { baseURL } from "@config/environments";
import { credentials, lanePersona, partnerPersona, PERSONAS, type PersonaKey } from "@config/personas";
import { claimPersonaLane } from "./lane-guard";

const BRIDGE = path.resolve(__dirname, "..", "ff36", "bridge.py");

export type Ff36Listing = "stms" | "estm" | "apt" | "insurance" | "jomcheck" | "dereg" | "precheck" | "bmk" | "servicehub";

/** `shot` on any step = a screenshot after it (for `confirm`: of the dialog, before it is answered). */
export type Ff36Action = { shot?: string } & (
  /** `keepPopups`: leave the home page's pop-ups open (to screenshot them); close them later with closeHomePopups. */
  /**
   * `firstLogin` (22.10.2026, EAINT-12253 AzfarCo6): landing on Account Activation or the first-login password page is
   * reported (found = false, text names the page), not a failure; nothing on it is touched.
   */
  | { do: "login"; as: "ucd" | "ucd2" | "aatf" | PersonaKey; keepPopups?: boolean; firstLogin?: boolean }
  | { do: "closeHomePopups" }
  | { do: "goto"; path: string }
  /** Open the address an earlier `saveUrl` kept under `saved` (21.10.2026, EAINT-12253: the paid APT's payment page). */
  | { do: "goto"; saved: string }
  /** Read-only: keep the current address under `key` for a later `goto` with `saved`; text = the address. */
  | { do: "saveUrl"; key: string }
  /** `vehicle` searches the listing by vehicle (else by ref when the listing has such a field, else the first page). `path` overrides the listing's address. */
  | { do: "resubmit"; listing: Ff36Listing; ref: string; vehicle?: string; path?: string }
  /** Read-only: the listing row that carries `ref` (found like `resubmit`), as `text`. Nothing is clicked. */
  | { do: "row"; listing: Ff36Listing; ref: string; vehicle?: string; path?: string; soft?: boolean }
  /**
   * First visible match of css; `text` = exact visible label (whitespace collapsed); `enabledOnly` skips disabled ones;
   * `next` = a control to press when nothing matches yet (e.g. a calendar's next-month arrow), up to `tries` (3) times.
   * `optional`: nothing to press is not a failure (as the page object's own `.catch()` on the same control).
   */
  | { do: "click"; css: string; text?: string; enabledOnly?: boolean; next?: string; tries?: number; optional?: boolean }
  /** Type into the first visible field matching css (cleared first). */
  | { do: "fill"; css: string; value: string }
  /** Choose an option of a visible <select> by its value. */
  | { do: "select"; css: string; value: string }
  /** Set a checkbox to ticked (on: true) / unticked; clicks only when it differs. `soft`: no failure, `found` = it took. */
  | { do: "check"; css: string; on: boolean; soft?: boolean }
  /** jQuery confirm (confirm-dialog-btn / Yes / OK) or a native confirm(); accept:false presses No / Cancel. */
  | { do: "confirm"; accept: boolean; timeoutS?: number }
  /**
   * Wait for css (containing `text`) and/or for the address to match `url` (a regex source). Native alerts that come up
   * while waiting are accepted and listed in `text`. `soft`: never fails the plan; the result's `found` says whether it came.
   * `exact`: the element's whole label (text, else value; whitespace collapsed) must EQUAL `text` (e.g. a plain-div "Done").
   */
  | { do: "waitFor"; css?: string; text?: string; exact?: boolean; url?: string; timeoutS?: number; soft?: boolean }
  /** Read-only: visible text of css (all matches), or the page text from the marker `from` (`chars` long, default 600). */
  | { do: "read"; css?: string; from?: string; chars?: number }
  /** Read-only: the reminder's computed styles, boxes and structure as JSON in `text` (see ReminderInspect). */
  | { do: "inspect" }
  /** Resize the Firefox window (EAINT-12253 UI_TS2 narrow layout); put it last in a plan. */
  | { do: "resize"; width: number; height?: number }
  /** Waits up to waitS (default 10) for the expected state, then reads it: state "shown" | "absent", text = title | body. Never closes it. */
  | { do: "reminder"; expect: "shown" | "absent"; waitS?: number }
  /** `ifShown`: when the reminder is not up, press nothing and carry on (state "absent"). */
  /** `tabShot` (guide): also screenshot the new tab it opens, before it is closed (result `tabShot`). */
  | { do: "reminderButton"; which: "continue" | "guide" | "close"; ifShown?: boolean; tabShot?: string }
  /** F5; a "resend?" dialog is dismissed (nothing is resent). */
  | { do: "refresh" }
  | { do: "shot"; name: string }
  /**
   * Press the reminder's View User Guide (#ebrGuideBtn) and stay on the tab it opens long enough for `shot` = one frame
   * of the Firefox WINDOW (tab bar, address bar, page); text = "url | title | tabs N | page text (400)". Then back to the first tab, the
   * new one left OPEN; state = the reminder on the first tab (added 21.10.2026, EAINT-12253 BEH_TS3).
   * 21.10.2026 late: the frame is of the window that SHOWS the guide (Selenium's Firefox opens it as a new window; it is
   * brought to the front and recorded on its own for a few seconds): result `tabWindow`, `tabVideo`.
   */
  | { do: "guideTab" }
  /**
   * Click css and report what it did within waitS (30): text = JSON {newTab, url, navigated, alert, files}, found = anything
   * happened. A new tab is shot (window frame) and closed. `files` needs `run(..., { downloads: true })` (EAINT-12253).
   */
  | { do: "clickObserve"; css: string; waitS?: number }
  // ---- added 22.10.2026 (cr-author, EAINT-12253 BEH_TS8 LKM Refund pop-up / BEH_TS6); bridge.py documents each
  /** Wait until the page's "Working..." box (.blockUI) is gone (timeoutS 90). `soft`: never fails, found = gone. */
  | { do: "idle"; timeoutS?: number; soft?: boolean }
  /**
   * Give a file (absolute path on this PC) to the file input `css`; a hidden input is shown by script for the upload
   * only (said in text). `label`: where the page writes the file name (a change event is sent once if it did not
   * change). `optional`: no such input is not a failure.
   */
  | { do: "upload"; css: string; path: string; label?: string; optional?: boolean; timeoutS?: number }
  /** Choose a <select> option by label (`text`: equal, else contains, else contained) or `index` (1 = first real option); `onlyIfEmpty`. */
  | { do: "choose"; css: string; text?: string; index?: number; onlyIfEmpty?: boolean; timeoutS?: number }
  /** Draw a signature stroke on a canvas and read its pixels back; fewer than minInk (200) inked fails the step. */
  | { do: "sign"; css: string; minInk?: number; timeoutS?: number }
  /** Read-only: each visible canvas's size and drawn (not white) pixels, text = JSON [{w,h,ink}]; found = one over minInk (500). */
  | { do: "canvasInk"; css: string; waitS?: number; minInk?: number }
  /** Wait until css's visible text matches `match` and not `noMatch` (regex sources); else the step fails (soft: found false). */
  | { do: "gate"; css: string; match?: string; noMatch?: string; timeoutS?: number; soft?: boolean }
  // ---- added 22.10.2026 (EAINT-12253 probe 2210/p03, Q14: the reminder's ✕ and Esc)
  /** Read-only: the reminder's raw state as JSON {inDom, display, visible, title} in text; state shown | absent. */
  | { do: "reminderRaw" }
  /** Press a key on the focused element (body when none), wait waitS (2), read the reminder: state + "<key> pressed on <el> | {inDom, display, visible}". `ifShown`: reminder not up → nothing pressed. */
  | { do: "key"; key: "escape"; waitS?: number; ifShown?: boolean }
  // ---- added 22.10.2026 (EAINT-12253 FF_TS6 / BEH_TS6: Azfar's real MyKad + thumbprint on Firefox 36's Java applet)
  /**
   * A step a PERSON does on the Firefox 36 window. A yellow banner at the top of the page says `banner` (with the time
   * left); the bridge beeps, brings the window to the front, presses NOTHING, and waits up to timeoutS (300) until
   * `until` holds ({url, css, text} as waitFor; url is searched from the start, so a negative look-ahead anchored with ^
   * means "no longer on that page") or the
   * person presses the banner's own button (`ready` = its label). The reminder is read about once a second throughout:
   * state "shown" if it was displayed at any moment. `shotBefore`: a screenshot as the wait starts (result shotBefore).
   * Not done in time: the step fails (soft: found false).
   */
  | { do: "manual"; banner: string; until: { url?: string; css?: string; text?: string }; ready?: string; timeoutS?: number; soft?: boolean; shotBefore?: string }
);

export interface Ff36StepResult {
  do: string;
  ok: boolean;
  state?: "shown" | "absent";
  text?: string;
  /** waitFor / read: whether it was found. */
  found?: boolean;
  url: string;
  /** Absolute path of the PNG in the TS folder. */
  shot?: string;
  /** manual with `shotBefore`: the screenshot taken as the wait started. */
  shotBefore?: string;
  /** manual: the address as the wait started. */
  urlBefore?: string;
  /** reminderButton guide with `tabShot`: the new tab's screenshot. */
  tabShot?: string;
  /** guideTab: "new window (hwnd …)" or "new tab in the same window (…)": which window `shot` is a frame of. */
  tabWindow?: string;
  /** guideTab: absolute path of the short recording of the new window (<video>-guide-tab.mp4), when it was a new window. */
  tabVideo?: string;
  error?: string;
}

export interface Ff36Result {
  ok: boolean;
  steps: Ff36StepResult[];
  /** Absolute path of the Firefox-window video in the TS folder. */
  video: string;
  videoBytes: number;
  userAgent: string | null;
  error: string | null;
}

/** What the step needs from the TS (TsRun passes itself through these). */
export interface Ff36Host {
  id: string;
  dir: string;
  inst: string;
  numbered(name: string): string;
  note(text: string): void;
  card(big: string, line2?: string, line3?: string, ms?: number): Promise<void>;
  /** Shot path → the Firefox 36 URL and side it was taken on, for ts.prove. */
  shotUrls: Map<string, { url: string; side: string }>;
}

export class Ff36BridgeError extends Error {
  /** What the bridge did read before it stopped (steps up to the failed one), when it got that far. */
  constructor(msg: string, readonly result?: Ff36Result) { super(`FF36 bridge: ${msg}`); }
}

/**
 * FF36_PY, else automation/.ff36venv (the set-up in ONBOARDING.md, gitignored), else the Selenium 2.53 venv in a
 * Claude scratchpad (…/scratchpad/ff36venv).
 */
function ff36Python(): string {
  if (process.env.FF36_PY) return process.env.FF36_PY;
  const local = path.resolve(__dirname, "..", "..", ".ff36venv", "Scripts", "python.exe");
  if (fs.existsSync(local)) return local;
  const base = path.join(os.tmpdir(), "claude");
  const found: string[] = [];
  for (const proj of fs.existsSync(base) ? fs.readdirSync(base) : [])
    for (const sess of fs.readdirSync(path.join(base, proj), { withFileTypes: true }).filter((d) => d.isDirectory())) {
      const py = path.join(base, proj, sess.name, "scratchpad", "ff36venv", "Scripts", "python.exe");
      if (fs.existsSync(py)) found.push(py);
    }
  if (!found.length) throw new Ff36BridgeError("FF36_PY is not set and no scratchpad ff36venv was found (python with selenium==2.53.6)");
  return found.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

const personaOf = (as: string): PersonaKey =>
  as === "ucd" ? lanePersona() : as === "ucd2" ? partnerPersona() : (as as PersonaKey);

export class Ff36Step {
  private k = 0;
  constructor(private readonly ts: Ff36Host) {}

  /** `opts.downloads`: Firefox 36 saves downloads (PDFs too) into the TS folder's downloadable/ without its Save dialog. */
  /** `opts.javaPlugin` (22.10.2026): the Java plugin always active in the Firefox profile (the MyKad applet, manual runs). */
  async run(steps: Ff36Action[], label = "Firefox 36", opts: { downloads?: boolean; javaPlugin?: boolean } = {}): Promise<Ff36Result> {
    const k = ++this.k;
    const tag = `ff36-${k}`;
    const env: NodeJS.ProcessEnv = { ...process.env, PYTHONIOENCODING: "utf-8" };
    const login = { who: "" as PersonaKey | "" };
    const plan = steps.map((s, i) => {
      const p: Record<string, unknown> = { ...s };
      if (s.do === "login") {
        const key = personaOf(s.as);
        if (!PERSONAS[key]) throw new Error(`ts.ff36: no persona "${s.as}"`);
        const c = credentials(key);
        claimPersonaLane(key); // same account rule as LoginPage.as (lane-guard.ts)
        env[`FF36_USER_${i}`] = c.username;
        env[`FF36_PASS_${i}`] = c.password;
        Object.assign(p, { persona: key, userEnv: `FF36_USER_${i}`, passEnv: `FF36_PASS_${i}` });
        delete p.as;
        login.who = key;
      }
      if (s.do === "manual" && s.shotBefore) p.shotBefore = path.join(this.ts.dir, this.ts.numbered(`ff36-${s.shotBefore}`));
      const name = s.do === "shot" ? s.name : s.shot;
      if (name) p.shot = path.join(this.ts.dir, this.ts.numbered(`ff36-${name}`));
      if (s.do === "reminderButton" && s.tabShot) p.tabShot = path.join(this.ts.dir, this.ts.numbered(`ff36-${s.tabShot}`));
      return p;
    });
    const root = baseURL();
    if (!root) throw new Ff36BridgeError("no base URL (BASE_HOST / INSTANCE not set)");
    const video = path.join(this.ts.dir, `video_${this.ts.id}_${tag}.mp4`);
    const planFile = path.join(this.ts.dir, `${tag}-plan.json`);
    const resultFile = path.join(this.ts.dir, `${tag}-result.json`);
    fs.writeFileSync(planFile, JSON.stringify({
      root, instance: this.ts.inst, label: this.ts.id, video, result: resultFile, log: path.join(this.ts.dir, `${tag}.log.jsonl`),
      failShot: path.join(this.ts.dir, this.ts.numbered(`ff36-step-failed`)), steps: plan,
      ...(opts.downloads ? { downloadDir: path.join(this.ts.dir, "downloadable") } : {}),
      ...(opts.javaPlugin ? { javaPlugin: true } : {}),
    }, null, 2));

    await this.ts.card(`Now: Firefox 36`, label, `recorded in ${path.basename(video)} (Firefox window only)`, 1800);
    const who = login.who;
    const side = `${who ? `${PERSONAS[who].portal.toUpperCase()} (${who})` : "?"} in Firefox 36`;
    this.ts.note(`Firefox 36 step ${k} (${label}): ${steps.length} steps, video ${path.basename(video)}`);

    const py = ff36Python();
    const code = await new Promise<number>((resolve) => {
      const p = spawn(py, ["-I", BRIDGE, planFile], { env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
      const out = fs.createWriteStream(path.join(this.ts.dir, `${tag}.stdout.txt`));
      p.stdout.pipe(out, { end: false });
      p.stderr.pipe(out, { end: false });
      p.on("error", (e) => { out.write(String(e)); resolve(-1); });
      p.on("close", (c) => { out.end(); resolve(c ?? -1); });
    });

    if (!fs.existsSync(resultFile)) throw new Ff36BridgeError(`no result (exit ${code}); see ${tag}.stdout.txt`);
    const r = JSON.parse(fs.readFileSync(resultFile, "utf8")) as Ff36Result;
    for (const [i, s] of r.steps.entries()) {
      // guideTab's shot is a frame of the window that shows the guide; its step url is the first tab's (switched back).
      const shotUrl = s.do === "guideTab" && s.text && !s.text.startsWith("no new tab") ? s.text.split(" | ")[0] : s.url;
      if (s.shot) this.ts.shotUrls.set(s.shot, { url: shotUrl, side });
      if (s.shotBefore) this.ts.shotUrls.set(s.shotBefore, { url: s.urlBefore ?? s.url, side });
      if (s.tabShot) this.ts.shotUrls.set(s.tabShot, { url: (s.text ?? "").replace(/^opened a new tab: /, ""), side });
      this.ts.note(`ff36 ${k}.${i + 1} ${s.do}: ${s.ok ? "ok" : "FAILED"}${s.state ? ` | reminder ${s.state}` : ""}${s.text ? ` | ${s.text.slice(0, 200)}` : ""}` +
        ` | ${s.url}${s.shot ? ` | ${path.basename(s.shot)}` : ""}${s.tabWindow ? ` | shot of the ${s.tabWindow}` : ""}` +
        `${s.tabVideo ? ` | its own video ${path.basename(s.tabVideo)}` : ""}${s.error ? ` | ${s.error}` : ""}`);
    }
    this.ts.note(`Firefox 36 step ${k} ended: ${r.ok ? "ok" : "FAILED"}, video ${path.basename(video)} ${r.videoBytes} bytes, ${r.userAgent ?? ""}`);
    await this.ts.card(`Back from Firefox 36`, label, r.ok ? "" : "the Firefox 36 step failed — see checks.txt", 1200);
    if (r.error) throw new Ff36BridgeError(r.error, r);
    const bad = r.steps.findIndex((s) => !s.ok);
    if (bad >= 0) throw new Ff36BridgeError(`step ${bad + 1} (${r.steps[bad].do}) failed: ${r.steps[bad].error}`, r);
    if (!r.videoBytes) throw new Ff36BridgeError(`no window video (${path.basename(video)})`, r);
    return r;
  }
}
