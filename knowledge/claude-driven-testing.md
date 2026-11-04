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

## Showing progress on the dashboard TS Tracker

"update this repo and the dashboard TS tracker with the progress, so i have a visual sign on
whats happening" `[Faizuddin, session chat, 2026-11-04]`

1. **Results file:** the per-TS outcome of a Claude-driven run goes in
   `scripts/claude-run/results/<KEY>.json`. For EAINT-12028 it is generated by
   `node scripts/claude-run/build-results-12028.mjs`: edit its `OUTCOME` table, then re-run.
   - Fields: `key`, `title`, `column` (e.g. "Claude uat1 04-11"), and
     `cases[{ sheet, section, ts, objective, cells:[{ column, status }] }]`.
   - Status is one of Pass / Fail / Blocked / Not Started / In Progress / N/A.
2. **Route:** `/api/ts-tracker/official` (`lib/claudeRunResults.ts`) serves those files
   alongside the official TS sheets.
   - If the ticket has an official sheet on this laptop, the run is an extra result column.
   - Otherwise the run creates the ticket.
   - The tracker (`hooks/useOfficialTsSync.ts`, every 10 s on any page) creates the CR and
     colours each TS.
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
