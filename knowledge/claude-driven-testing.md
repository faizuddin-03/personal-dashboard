# Claude-driven testing (Claude runs the TS in a browser itself)

How Claude runs a ticket's test scenarios by driving a real browser, instead of running the
Playwright suite from the dashboard. Started 2026-11-04 on EAINT-12028.

## Why

1. Faizuddin, 2026-11-04: "instead of having to run automation, i want you to run the tests
   itself". `[Faizuddin, session chat, 2026-11-04]`
2. The dashboard runners keep their state in browser `localStorage`: run configuration, results
   ticks, the month pool. That state is lost on another laptop or browser. Claude-driven runs
   write everything to the repo instead. `[verified: app/eauto/12028/Runner.tsx CREDS_KEY / UI_KEY / POOL_KEY, 2026-11-04]`

## Where the method comes from: Azfar's repo

1. **Repo:** `modefair/eauto-qa-azfar` (private; Faizuddin's GitHub login can read it).
2. **Agents:** ten Claude agents in `.claude/agents/`: cr-fetch, cr-research, cr-draft,
   cr-coverage-review, cr-author, cr-runner, cr-evidence, cr-triage, cr-defect, cr-explore.
3. **Workflow:** `.claude/workflows/cr-execute.js` chains author → run → evidence → triage.
4. **Plain-language overview:** `knowledge/playbooks/cr-pipeline-explained.md`.

`[verified: gh api repos/modefair/eauto-qa-azfar, read 2026-11-04]`

- **Claude testing by eye:** `cr-explore` drives the browser through the official
  `playwright` plugin (`mcp__plugin_playwright_playwright__browser_*` tools). It compares each
  page with the mockup, the SRD and /eauto, and writes findings with both images.
  `[verified: .claude/agents/cr-explore.md in that repo]`
- **Scripted runs:** `cr-runner` runs everything through `automation/scripts/cr-run.mjs`.
- **Rules borrowed from `cr-runner`, which apply to Claude-driven runs too:**
  - Never re-run to get a green; a flake is a finding.
  - A failure is reported as what was expected, what happened instead, and where the evidence is.
    Diagnosing it is a separate step.
  - Keep going when one TS blocks.
  - Never run state-changing steps on production.
  - Check the instance the run actually hit before reporting.

  `[verified: .claude/agents/cr-runner.md in that repo]`

## Set-up on a laptop

1. **Plugin:** `claude plugin install playwright@claude-plugins-official`, then restart Claude
   Code. It runs `npx @playwright/mcp@latest` and uses the installed Chrome.
   `[done on the second laptop, 2026-11-04]`
2. **Recorder helper:** `scripts/claude-run/recorder.js`. Load it once per session with
   `browser_run_code_unsafe`, setting `filename: scripts/claude-run/recorder.js`.
   - The plugin only reads files inside the repo; the scratchpad is refused.
   - `globalThis` does not survive between run_code calls, but the `page` object does, so the
     helper lives on `page.__R`.

   `[verified: 2026-11-04]`
3. **Password and overrides:** set them in a `browser_run_code_unsafe` call **before**
   loading.
   - **`page.__PASS` is required.** It is the shared staging password; take it from
     `SHARED_STAGING_PASS` in `app/eauto/12028/Runner.tsx`.
   - The recorder file never holds the password: on 2026-11-04 the push was blocked as a
     credential leak while it did.
   - `page.__ROOT` (evidence folder) and `page.__BASE` (BO base URL) are optional. Set them
     when they differ from the defaults written in the file.

## Recording: required for every TS

"the recording should be the same as the playwright recording, where the pages and
buttons/items clicked/observed is highlighted" `[Faizuddin, session chat, 2026-11-04]`

- **Video:** one 1920×1080 video per TS, from a separate browser context with `recordVideo`.
  `R.stop()` writes it as `<TS>.webm`, plus `<TS>-tab2.webm` for a second tab.
- **Highlights:** the same look as `BasePage.demoHighlight` (3px outline plus a 4px glow):
  - **amber** before a click or typing
  - **green** for an observed result that matches
  - **red** for a mismatch
- **Caption:** bottom-left, showing `<TS> · <step>`.
- **Screenshots:** one per check, numbered `NN-<name>.png`.
- **Downloads:** `R.download()` saves the file into the TS folder as `NN-<name>.pdf` and
  returns the server's file name.
- **Evidence folder:** `_reference/tickets/<KEY>/claude-run-<date>/<TS>/`, with `RUN-PLAN.md`
  and `RESULTS.md` beside the TS folders.
- **Git:** `.webm` files under `claude-run-*` are git-ignored because they are large. They
  stay on the laptop that recorded them; copy them by hand if needed. Screenshots, PDFs and
  results are tracked.

### Second style: Azfar's (chosen per ticket)

"for the recording on this one, i want you to follow Azfar's style of recording"
`[Faizuddin, session chat, 2026-11-04, for EAINT-12406]`

When a ticket uses Azfar's style:
- Use `scripts/claude-run/recorder-azfar.js` with `scripts/claude-run/finish-ts.mjs`, not `recorder.js`.
- They copy Azfar's `ts` fixture: `scripts/eauto-12406/automation/src/fixtures/ts-run.ts`,
  `highlight.ts` and `window-video.ts`.

**What it records**
- **Cards:** a navy (#172B4D) full-screen title card at the start, a "Now: <site>" card at
  every switch between sites, and an "End of <TS>" card at the end.
- **Clock:** a live "● REC hh:mm:ss" clock at the top of every page.
- **Clicks and typing:** a short red-outline, yellow-wash mark with a label.
- **Proofs:** `R.prove('E1', { shows, match, hl })` draws a red (#DE350B) box round the element
  and a navy banner at the bottom: `time MYT · staging/<inst> · side · path · TS · E1: what it shows`.
  The view is held for 1.2 s, then a screenshot is taken.
- **Payment window:** a window the site opens (the Fiuu payment window) is kept open. It gets
  its own video, which `finish-ts.mjs` lays into `video_<TS>.webm` with ffmpeg: bottom right,
  orange frame, from the second the window opened. Azfar rule: one video per TS, the payment
  window included.

**Files**
- In the TS folder: `NN-<name>.png`, `video_<TS>.webm`, `checks.txt`
  (`when | point | expected | page shows | matches | screenshot`), `proofs.json`, and `gate.json`.
- Verdicts in `gate.json`: VALID, DEFECT, or EVIDENCE.
- Downloads go to `downloadable/`.

**Why there are two steps**
- `run_code` runs in a sandbox with no `node:fs`, so the recorder writes files only through
  Playwright: screenshots, `video.saveAs` and `download.saveAs`.
- After `R.finish()`, Claude saves the object it returns as `<TS>/_raw/finish.json`.
- Claude then runs `node scripts/claude-run/finish-ts.mjs <TS folder> <TS>/_raw/finish.json`.

## Running TS without the Playwright plugin: `run-ts.mjs` (EAINT-12406, 2026-11-04)

`[verified: EAINT-12406 runs of 04.11.2026, _reference/tickets/EAINT-12406/claude-run-2026-11-04/]`

**Faizuddin's way of working (04.11.2026).** "the testing will be done by you, using claude, instead of me clicking
the playwright". Claude drives the browser and records every TS. Faizuddin guides and decides; he does not run the
automation suite himself.

**Why the plugin was not enough.** Two Claude sessions on one laptop (12028 and 12406) share the plugin's Chrome
profile, and the second one gets "Browser is already in use … use --isolated". Two fixes exist:
- **(a) A second, isolated MCP server**, after which the session must be restarted:
  `claude mcp add playwright-iso -s local -- npx @playwright/mcp@latest --isolated`. Its tools are `mcp__playwright-iso__*`.
  This config is local to each laptop, so repeat it there.
- **(b) The local runner (what was used).** It needs no MCP and no restart, and launches its own Chrome:
  `node scripts/claude-run/run-ts.mjs scripts/claude-run/<ticket>/<steps>.mjs`

**What the runner does.**
1. Loads Playwright from `scripts/eauto-12406/automation/node_modules` (run `npm ci` there once).
2. Launches Chrome (`channel: 'chrome'`, headed), loads `scripts/claude-run/recorder-azfar.js`, and sets `page.__ROOT` to
   the run folder (default `_reference/tickets/EAINT-12406/claude-run-2026-11-04`; `--root <dir>` for another ticket).
3. Imports the step file. A step file exports:
   - `ts`: the folder name;
   - `situation`;
   - `points`, or `pointsFrom` (an id in `scripts/eauto-12406/cr/EAINT-12406/01-intake/ts.json`);
   - `default async (R, { cfg, util })`.
4. `cfg` holds the logins, read at run time from the dashboard defaults in `app/eauto/12107/page.tsx` DEFAULT_CREDS:
   site password, CIBO, FPX simulator, card, owner email and phone. Nothing secret is written into the step files.
5. `util` is `scripts/claude-run/secarang-steps.mjs`, the shared Secarang / CIBO steps:
   - quote, Car Details (variant pop-up), cards, buy, Continue, owner details, pricing, Confirm and Pay;
   - payments: FPX (bank + status code), card (3D Secure OTP), PayLater by Grab, SPayLater / ShopeePay;
   - Success page and receipt;
   - CIBO login / search / Transaction Details;
   - receipt PDF text (pdftotext) and showing a PDF or text lines on screen for a proof.
6. At the end: `R.finish()`, `_raw/finish.json`, then `scripts/claude-run/finish-ts.mjs`. That writes `checks.txt`,
   `proofs.json` and `gate.json` (VALID / DEFECT / EVIDENCE) and lays the payment window into the video. The runner
   prints the proofs so Claude can report them.

**One-time set-up on a laptop.**
- `npm ci` in `scripts/eauto-12406/automation`.
- `npx playwright install ffmpeg` in the same folder. Playwright's own ffmpeg is needed for video.
- WinGet `Gyan.FFmpeg`, for the picture-in-picture merge.
- `pdftotext`, which comes with Git for Windows' mingw64.
- `exceljs` (repo root `node_modules`), to read the checker xlsx.

**Rules that held up on 04.11.**
- Each TS gets its own folder, `<TS>_rerun-YYYYMMDD` or `<TS>_real-YYYYMMDD`. A failed try is **renamed** with a
  suffix (`-a-…`) before a new try, never overwritten. Do not `cd` into a run folder: Windows then refuses the rename
  ("Device or resource busy").
- A stop caused by a **script fault** (selector, parser, wait) is fixed and the TS run again from the start; note it
  in RESULTS.md. A stop caused by **the system** is a result. Never re-run to get a green.
- If the gate's verdict is wrong because of a script comparison, do not re-buy. Write `CORRECTION.txt` in the TS folder
  that cites the evidence (example: `12406_E2E_TS2_rerun-20261104/CORRECTION.txt`).
- Record each TS on one line in the run folder's `RESULTS.md`, and keep `SESSION-LOG.md` current. The handoff points
  to both.

**Choosing real-API test data (Secarang /ia/ on Allianz's real UAT API).**
- Plates and ICs come from the checker xlsx (`_reference/tickets/EAINT-12406/secarang-insurance-checker_2026-11-02 (1).xlsx`,
  PROCEED rows).
- `node scripts/claude-run/quote-scan.mjs '[[row,"PLATE","IC"],…]'` is an **unrecorded** quote-only scan that lists which
  insurers quote each car. Use it to find "all three quote" / "X unavailable" cars before a recorded run.
- A car that was bought shows "You may renew as early as 2 months prior to current policy expiry date" (a visitor
  form). Never fill it: it creates a CIBO lead. Every purchase needs a fresh row.
- Owner Full Name: **not "QA SECARANG TEST"**. The real Allianz API refuses it after payment ("Invalid fullName",
  EAINT-12766). "FAIZUDDIN TEST ALLIANZ" works.
- Fiuu sandbox: FPX and card refuse over MYR 2,000, and PayLater by Grab opens a blank window over about RM2,000. Keep
  a purchase under RM2,000.
- Car Details variants change the quote. `VARIANT_AVOID="TYPE R"` (env) makes the runner skip a variant.

## Showing progress on the dashboard TS Tracker

"update this repo and the dashboard TS tracker with the progress, so i have a visual sign on
whats happening" `[Faizuddin, session chat, 2026-11-04]`

1. **Results file:** the per-TS outcome of a Claude-driven run goes in
   `scripts/claude-run/results/<KEY>.json`. For EAINT-12028 it is generated by
   `node scripts/claude-run/build-results-12028.mjs`: edit its `OUTCOME` table, then re-run.
   - Fields: `key`, `title`, `column` (e.g. "Claude uat1 04-11"), and
     `cases[{ sheet, section, ts, objective, cells:[{ column, status }] }]`.
   - Status is one of Pass / Fail / Blocked / Not Started / In Progress / N/A.
   - EAINT-12406: `node scripts/claude-run/build-results-12406.mjs` reads `lib/eauto12406.ts`
     (`TS_12406[].azfar` = Azfar's 30.10 result, `CLAUDE_12406` = the 04.11 Claude run) and writes
     two columns, "Azfar sim 30-10" and "Claude real-API 04-11". KIV maps to Blocked, RE-RUN to In
     Progress; an Azfar RE-RUN that a Claude run settled is dropped so the newer result shows.
     `[Faizuddin, session chat, 2026-11-04: "update this repo and the dashboard the progress for 12406, including azfar's progress"]`
   - TS ids match the official sheet after dropping the ticket-number prefix (`12028_TS01` = `TS01`);
     a last-segment match was removed 04.11 because it paired `12406_QT_TS10` with `RC_TS10`.
2. **Route:** `/api/ts-tracker/official` (`lib/claudeRunResults.ts`) serves those files
   alongside the official TS sheets.
   - If the ticket has an official sheet on this laptop, the run is an extra result column.
   - Otherwise the run creates the ticket.
   - The tracker (`hooks/useOfficialTsSync.ts`, every 10 s on any page) creates the CR and
     colours each TS.
   - **Newer run wins.** When the run's `ranAt` is on or after the sheet's last-saved date, the
     run's result is the TS's overall status (`OfficialCase.overall`). Before this, an old sheet
     "Not Started" + run "Pass" showed In Progress, so the main laptop (which has the official
     sheet, saved 3 Nov) showed 7 pass instead of 32. `[verified: /api/ts-tracker/official on the
     main laptop, 2026-11-05: 33 pass · 16 fail · 1 in progress · 19 not started]`
3. **Blocked and Not Started** count as "not started" in the tracker. The TS's note shows
   "<column>: Blocked".
4. **Git:** the file is tracked, so the main laptop shows the same progress after a `git pull`.
   `[verified: /tests on this laptop, 2026-11-04, EAINT-12028 card "28/69 · 20 pass · 8 fail"]`

## Workflow modules with month or record states (EAINT-12028 decisions, 2026-11-04)

These are all `[Faizuddin, session chat, 2026-11-04]`.

1. **Choosing the record:** Claude picks the month or record automatically.
   - It reads the listing before each workflow TS.
   - It uses a record already in the state the TS needs, or moves one forward with
     PREP-style setup steps. Setup steps are recorded and marked as setup, never counted as a TS.
   - It shows the allocation to Faizuddin before the first setup click.
2. **No reset:** there is no flow back to Pending, and there should not be one; only KIV,
   Reject or moving forward. When test data runs out, Faizuddin asks the developer to reset it.
3. **Audit Log:** check only that the rows from this run's own actions are there. Extra rows
   from earlier runs or setup are ignored.
4. **First-signature TS** (a user's first-ever approval with the signature pad) are run by
   Faizuddin himself. Do not approve as that role's user on any month until he has run them,
   or the first signature is used up.

## Kick-off on any laptop: "Claude, run the TS yourself"

This is what Faizuddin says, and what Claude does, to have Claude test instead of running the
dashboard automation. Written 2026-11-04 so the next session on either laptop can start cold.

**What to say:** "pick up from the 2026-11-04 handoff, and run <TS list> on <instance> yourself
with the Playwright plugin, with recordings". Claude then:

1. **Reads** `_reference/handoffs/Session-Handoff-<latest>.md` ("START HERE" block first), this
   file, and the module's `knowledge/flow-<module>.md`.
2. **Checks the plugin:** `claude plugin list` must show `playwright@claude-plugins-official`.
   If it is missing: install it, then restart Claude Code (the tools only appear after a restart).
3. **Logins:** the user names and roles come from the dashboard defaults
   (`app/eauto/<ticket>/Runner.tsx` and `scripts/eauto-<ticket>/data/users.ts`). The password
   is `SHARED_STAGING_PASS` in the same Runner, set at runtime as `page.__PASS`. Never written
   into a tracked file.
4. **Evidence root:** on the main laptop (Windows user `Faizuddin`) set
   `page.__ROOT = 'C:/Users/Faizuddin/.../_reference/tickets/<KEY>/claude-run-<date>'`. The default
   in `recorder.js` is the second laptop's (user `faizu`) path.
5. **Shows the plan first:** which TS, which records or months, which user, and any setup steps.
   It waits for Faizuddin's "yes" before the first state-changing click.
6. **Per TS:** `R.start` → steps → `R.check`/`R.boxShot` → `R.stop`. Then it writes the outcome
   to `<run folder>/RESULTS.md`, a fail/block to `FAILS-AND-BLOCKS.md`, and the TS Tracker
   (`build-results-<n>.mjs` → `results/<KEY>.json`). Jira is untouched until Faizuddin says
   which to raise.
7. **Keeps the handoff current** as it goes, not only at the end.

### Recorder API (`scripts/claude-run/recorder.js`, attached as `page.__R`)

| Call | What it does |
| --- | --- |
| `R.start(ts)` / `R.stop()` | Opens a recorded 1920×1080 context; stops it and writes `<TS>.webm` |
| `R.caption(text)` | Bottom-left step caption |
| `R.hl(target, 'amber'/'green'/'red')`, `R.unhl()` | Highlights like `BasePage.demoHighlight` |
| `R.click(target, text)` | Amber highlight + caption, then click |
| `R.check(target, text, ok, name)` | Green/red highlight + screenshot `NN-<name>.png` |
| `R.shot(name)` | Plain numbered screenshot |
| `R.boxShot(target, name, {ok, ctx, label, pad})` | **Tight crop** with a solid red (`ok:false`) or green (`ok:true`) box and a label. `ctx` widens the crop to a surrounding element. Used for the wording pairs. |
| `R.alertCard(text)` / `R.clearAlertCard()` | Native alerts cannot be screenshotted: this draws the alert's exact text into the page so `boxShot` can capture it |
| `R.download(target, text, name)` | Saves the download into the TS folder; returns the server file name |
| `R.doLogin(user)`, `R.openListing()` | BO login (uses `page.__PASS`), opens the module from BO Home |
| 12028 helpers | `R.goMonth`, `R.viewMonth`, `R.state()` (statuses, buttons, note, log), `R.btn`, `R.approve`, `R.kiv`, `R.undoKiv`, `R.rejectOpen/Type/Submit`, `R.approverApprove(iso)`, `R.drawSignature`, `R.watchDialogs`, `R.logCount`, `R.isoDate`, `R.today` |

### Traps that already cost time (2026-11-04)

- **Loading by `filename` echoes the whole file** back into the conversation each time. Load
  once per session and reuse `page.__R`.
- **"Browser is already in use" / profile lock:** a previous plugin Chrome is still alive. Kill
  the `ms-playwright-mcp` Chrome processes (PowerShell: the `chrome` processes whose command
  line contains `ms-playwright-mcp`), then retry. If it stays locked, the 12406 session's
  fallback works: a local script (`scripts/claude-run/run-ts.mjs`) with its own Chrome.
- **BO Logout asks "Sure to logout?" (a browser confirm).** Playwright dismisses an unanswered confirm, which
  means **Cancel**: the user stays logged in. Always log out with `R.logout()` (accepts it, like clicking OK)
  and check the page lands on `/uat1/public/login/`. Missing this produced a false F17 on TS06,
  2026-11-05. `[verified: Faizuddin's manual video 12028_TS06_Manual Test.mp4 + check-C rerun, 2026-11-05]`
- **BO login field:** `input[name=username]` does not match; use the `placeholder="Username"`
  input.
- **Never put the password in a tracked file.** The push was refused as a credential leak.
- **Run-code sandbox has no `node:fs`:** files are written only through Playwright
  (`screenshot`, `video.saveAs`, `download.saveAs`). Anything else is a separate Bash step.

### Comparing with the SA mock-up (wording, layout, PDFs)

- **Expected wording comes from the mock-up** (EAINT-12028 rule, see
  `knowledge/flow-association-payment-listing.md`, "Wording rule"). Every wording item gets a
  pair: the live build with a **red** box (`WORDING-live/`) and the mock-up with a **green** box
  (`WORDING-mockup/`), from `R.boxShot`.
- **Serving the mock-up:** copy `_reference/tickets/<KEY>/<mockup>.html` to a scratch folder and
  serve it (`python -m http.server 8765`), then open `http://127.0.0.1:8765/`. Drive it through
  its own JS rather than clicking: for 12028, `getSt(m)`, `changeRole`, `showDetails`,
  `refresh`, `askDate`, `askReject`, `addLog`, `downloadInvoice` (saves an HTML page named
  `.pdf`; render that to PNG to compare). Month index: `months.indexOf('May')` = 4.

### Post-processing evidence (Bash, after the run)

- **Faizuddin's evidence folder** (main laptop): `C:\Users\Faizuddin\Documents\Modefair\eAuto Test Evidences\<ticket number>\`,
  one zip per TS named `12028_TS01.zip`, holding `12028_TS01.webm` and `12028_TS01-<step>.png`
  (no "NN-" prefix). Build them with
  `python -I scripts/claude-run/export_evidence.py <run folder> "<evidence folder>" <TS> … [--suffix S] [--dry]`.
  It never overwrites an existing zip. `[Faizuddin, session chat, 2026-11-05: "i want the files to be saved here, with this the naming the follows the existing folders"]`
- **Failed TS zips start with `[FAILED] - `** (e.g. `[FAILED] - 12028_TS47.zip`): pass `--prefix "[FAILED] - "`. `[Faizuddin, session chat, 2026-11-05: "for failed scenarios, i want you to put in the front of the naming, this: \"[FAILED] - ....\""]`
- **Address-bar recording is a one-off, not the default.** For TS06 on 2026-11-05 only, Faizuddin asked
  for a whole-screen video so the address bar shows each address being pasted by hand
  (`scripts/claude-run/one-off/ts06-url-visible.mjs`). Every other run stays on `recorder.js` (page-only
  video) unless he asks again. `[Faizuddin, session chat, 2026-11-05: "only for this TS for this one particular time. after that, make sure to change back the recording style"]`

- Python packages on the second laptop: `openpyxl`, `pymupdf` (render PDF pages to PNG),
  `imageio-ffmpeg` (a full ffmpeg binary), `pillow` (stack or crop images). Install with
  `pip install` on the other laptop if missing.
- **Clip with a timestamp** (F9 example: `12028_TS61/12028_TS61-clip-with-time.mp4`): ffmpeg
  `trim` segments joined with `concat`, a `drawtext` MYT clock and idle counter. This build's
  ffmpeg refuses `-filter_complex_script`; write the filter to a file and pass it as
  `-/filter_complex <file>`.
- **Jira images:** one image per table cell. Uploading while an image is selected replaces it,
  so stack several pictures into one with Pillow first. Placing the caret: see the
  `eauto-qa-issue-ticket` skill, "Caveats".

### Rules carried from Claude memory (memory is per laptop; these are the repo copies)

- Every TS Claude runs gets a highlighted video; screenshots alone are not enough.
- Bug evidence folders under a ticket are named `Bug - <BUG-KEY>`.
- Nothing goes to Jira until Faizuddin says which to raise. Commit or push only when he asks.
- On the second laptop the usage plugin is `mf-statusline@aitools`, never `mf-usage-report`.
