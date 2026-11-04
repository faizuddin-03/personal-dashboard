# Session handoff — 2026-11-04 (all sessions)

One file for every Claude Code session on 2026-11-04. One section per session.
**To continue tomorrow, tell Claude: "pick up from the 2026-11-04 handoff".** Start at
"Open items / next steps" at the end of each section.

Session rule (Faizuddin, 2026-11-04): "MAKE SURE TO SAVE EVERY IMPORTANT DETAIL IN THIS REPO,
SO TOMORROW I CAN TELL THE CLAUDE TO PICK UP FROM TODAY'S SESSION". Claude memory is per
laptop (folder named after the Windows user), so **the repo is the record, not memory.**

---

## Session 0745bd69 + follow-ons: second laptop set-up, usage plugin, Claude-driven testing for EAINT-12028

Laptop: **second laptop**, Windows user `faizu`, machine `UdinHoue`. The main laptop (user
`Faizuddin`) was out of reach all day. Transcript:
`~/.claude/projects/C--Users-faizu-Documents-GitHub-personal-dashboard/0745bd69-4987-43f2-8fb8-142c01f253a6.jsonl`.
Later turns ran in new sessions after restarts, in the same project folder.

### 1. Second laptop set up

1. **Dependencies:** `npm ci` in all 17 `scripts/*` automation projects (none failed) and
   Playwright Chromium. WA-Blaster was skipped by rule.
2. **Tools installed with winget:**
   - `gh` (GitHub CLI, signed in as `faizuddin-03`, `gh auth setup-git` done)
   - `jq`
   - `ffmpeg`
   - poppler / `pdftotext`
3. **Git config:** global `core.longpaths true`; global git email set to
   `faizuddin@modefair.com` (was `faizbidi03@gmail.com`). The name is still
   "Muhammad Faizuddin Bin Bidi".
4. **jq on Claude's PATH:** VS Code was started before the winget installs, so terminals inside
   it keep the old PATH. `jq.exe` was copied to `C:\Users\faizu\bin`, which Git Bash already
   has on its PATH. `gh` and `ffmpeg` are found only after VS Code is fully quit and reopened.
5. **Fixed three repo files that hardcoded `C:\Users\Faizuddin\...`:**
   - `.claude/agents/session-handoff-writer.md`
   - `.claude/agents/teams-knowledge-sync.md`
   - `.claude/skills/monthly-appraisal/SKILL.md`

   They now use `%USERPROFILE%` and `C--Users-<user>-...`.
6. **Modefair marketplace:** `claude plugin marketplace add modefair/aitools` (private repo,
   needs the GitHub sign-in).
   - **The usage plugin Faizuddin wants is `mf-statusline@aitools`**: a three-line status bar
     with context, tokens, and session and weekly usage. It is installed, and `setup.sh` wired
     `statusLine` into `~/.claude/settings.json`.
   - `mf-usage-report@aitools` was installed by mistake, then **uninstalled**. Faizuddin: "i dont
     want to run mf usage report here". It posts usage and prompt text to `aihook.modefair.com`,
     and a few turns may have been sent before the uninstall.
   - The source for the marketplace name was `_reference/handoffs/Session-Handoff-2026-10-29.md`
     ("Sessions 1158ffcc + ef17a8a7 — laptop transfer").
7. **Playwright plugin:** `playwright@claude-plugins-official` installed (user scope) and
   `@playwright/mcp` 0.0.84 pre-fetched. It uses the installed Chrome.
8. **Still not on this laptop** (only on the main laptop, not in git):
   - `scripts/*/.env` and `.env.local` secrets
   - the QA Portal MCP (`C:\qa-portal\qa-portal-mcp.mjs` from `http://10.30.10.214`, company
     network only; its token expires **2026-11-28**)
   - the merged user `settings.json`
   - Claude memory and history from `C--Users-Faizuddin-...`
   - the dashboard's browser localStorage

   To move them: the OneDrive route in `scripts/migrate/README.md`.
9. **Not done; needs admin:**
   `reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f`.
   Also still to do: the Claude in Chrome extension, and logins to Jira, Teams, Miro, Mailtrap
   and BO in Chrome.
10. **No VPN** on this laptop. `staging.eauto.my/uat1` answers without VPN (HTTP 200).

### 2. EAINT-12028: which TS already ran (main laptop, 2–3 Nov)

The full pass/fail list is on the main laptop only:
- dashboard localStorage `eauto_12028_ui_state`
- `scripts/eauto-12028/test-results/_run/*/meta.json` (git-ignored)

**From the repo, these definitely ran:**

| TS | Date | Result |
|---|---|---|
| TS06 | 2 Nov | failed: Summary didn't open |
| TS20 | 3 Nov | failed: Summary didn't open |
| TS21 | 3 Nov | failed one check: expected true, got false |
| TS23 | 2 Nov | stopped: no Drafter Review Again month |
| TS33 | 3 Nov | mixed: errored at the "not your turn yet" note |

Findings pages are in `_reference/tickets/EAINT-12028/EAINT-12028-12028_TS*-findings-*/`.

**Bugs raised under 12028:**
- EAINT-12716: a no-role user sees the link
- EAINT-12752: wrong tab logo and header
- EAINT-12738 / EAINT-12739: Audit Log wording and date format (see
  `knowledge/flow-association-payment-listing.md`)

### 3. Azfar's way of having Claude test

Repo `modefair/eauto-qa-azfar`. The full write-up is in `knowledge/claude-driven-testing.md`.
In short, his `cr-explore` agent drives the browser with the Playwright plugin. Copies of his
key files were read from GitHub through `gh api`; they were not cloned.

### 4. EAINT-12028 Claude-driven run: prepared, NOT started

Staging was being deployed when the run was about to start. Faizuddin: "they are currently
deploying new changes to the staging sites … just ready everything".

- **Plan:** `_reference/tickets/EAINT-12028/claude-run-2026-11-04/RUN-PLAN.md`. It holds:
  - the decisions
  - the batches and chains
  - the blocked list
  - the logins
- **Results file:** `_reference/tickets/EAINT-12028/claude-run-2026-11-04/RESULTS.md` (empty
  template).
- **Recorder:** `scripts/claude-run/recorder.js`, self-tested on a blank page: highlight, caption,
  screenshot, PDF download and `<TS>.webm` all work. On the main laptop set `page.__ROOT` to that
  laptop's path first; the default path is `C:/Users/faizu/...`.
- **Environment:** `https://staging.eauto.my/uat1` BackOffice. **Instance uat1**
  (Faizuddin, 2026-11-04).
- **Logins:** the dashboard defaults (`app/eauto/12028/Runner.tsx` DEFAULT_USERS), all with the
  shared staging password `SHARED_STAGING_PASS` in that file.

  | Role | Login |
  |---|---|
  | Drafter | mfared |
  | Second Drafter | eautozara |
  | Reviewer | eautonurul |
  | Approver | kmcheah |
  | Multi-role | mfizni |
  | No role | onghongkee |
  | Super Admin | none given |

- **Scope:** run every TS except the five that already ran (TS06, TS20, TS21, TS23, TS33).
- **Decisions (Faizuddin, 2026-11-04):**
  1. Claude chooses the month itself. It reads the Summary, uses a month already in the needed
     state, or moves one forward (PREP-style setup, recorded and marked as setup). It shows the
     allocation before the first setup click.
  2. There is no flow back to Pending, and that is correct. When months run out, Faizuddin asks
     the developer (Shane) to reset them.
  3. **Skip the first-signature TS: TS29 (Reviewer) and TS36 (Approver).** Faizuddin does them
     himself on **2026-11-05**. Until then, **do not approve as `eautonurul` or `kmcheah`** on
     any month, setup included, or their first signature is used up. This holds back most of
     F / G / J / K / L.
  4. **Audit Log:** check only that this run's own rows are present; ignore the extra rows.
  5. **Every TS gets a highlighted recording** like the Playwright demo-mode videos.
- **Possible snag:** TS33 on 3 Nov checked a month that was already Reviewer Approved, so a
  Reviewer may already have signed. The survey's Audit Log shows who did. If `eautonurul` or
  `kmcheah` already signed, tell Faizuddin before anything else, because TS29 / TS36 can't be a
  "first" signature with them.
- **Blocked until Faizuddin gives an input:**

  | TS | Needs |
  |---|---|
  | TS11–13 | month-close wait in minutes, and a closable month |
  | TS15 | Super Admin login |
  | TS16–19 | test transactions and expected counts |
  | TS24 | BA's KIV rule |
  | TS43 | BA's signature rule |
  | TS56–57 | full names to print on the PDFs |
  | TS61 | session timeout |

### 4b. Deploy done: survey run (2026-11-04, after the deploy)

The full table is in `RESULTS.md` → "Month states". Summary:

| State | Months |
|---|---|
| Drafter Approved + Reviewer Approved (Approver Pending) | Jan, May, Sep |
| Drafter Approved | Jun, Jul, Aug |
| Drafter Review Again | Mar |
| KIV | Feb, Apr |
| Pending (with KIV / Undo KIV history) | Oct |
| Not closed | Nov, Dec |

- **No fully approved month.**
- **Reviewer `eautonurul` already signed** on 03-11, so TS29 can't be a first signature with
  that user.
- **Approver `kmcheah` has never approved** (one Reject only), so TS36 is still possible.
  **Do not approve as `kmcheah`.**
- Undo KIV returns a month to Pending, and any Drafter can do it.

### 4c. Batch 1 (read-only) done, 2026-11-04

Full detail is in `RESULTS.md`.

| Result | TS |
|---|---|
| **Pass** | TS01, TS02, TS03, TS04, TS05, TS08, TS10, TS14 |
| **Fail** | TS07, TS25, TS28, TS35, TS49, TS58, TS60 |
| **Blocked** | TS09 (no zero-transaction month), TS47 (no untouched month) |

- **TS05 passes:** EAINT-12716 looks fixed after the deploy and can be retested.
- **TS07 fails** only on the total label: the page shows "YEAR TO DATE TOTAL"; the
  [unconfirmed] mock-up wording is "YEAR TO DATE (Jan – Oct)".
- **TS25, TS28, TS35, TS49 fail on wording only.** The buttons are correctly hidden, but the
  `#wf-not-your-turn` line is gone and the notes are worded per role (table in
  `knowledge/flow-association-payment-listing.md` → "Notes per role and state after the
  2026-11-04 deploy"). The PDF pending note says "become available"; the SRD says "will be".
- **TS58 fails:** the module has no Logout (EAINT-12752).
- **TS60 fails:** after the core logout, refreshing the module tab gives a bare
  **"Unauthorized"** server page at `/uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING`
  instead of the BO login. **Possible new QA-Issue: not raised; waiting for Faizuddin.**

### 4d. Batch 2 (workflow): Faizuddin said "yes" to the plan and to `eautonurul` approving / rejecting

Faizuddin: "keep super detailed tracked of the fail and block. i will review and tell you which
on to raise". So every fail and block is written in full in
`_reference/tickets/EAINT-12028/claude-run-2026-11-04/FAILS-AND-BLOCKS.md` (F1–F8, B1–B11).
**Nothing has been raised in Jira.**

**Done so far** (all detail in `RESULTS.md`):

| Result | TS |
|---|---|
| **Pass** | TS22, TS27, TS38, TS44, TS45, TS46, TS64 |
| Fail on wording only, every action passed | TS26 |
| Done later, same wording fails | RRA parts of TS25, TS35, TS49 |
| Setups (Undo KIV) | SETUP-01 (Feb), SETUP-02 and SETUP-03 (Apr) |

**`kmcheah` has still never approved.** Its only action today is the TS38 Reject.

**Month states after these runs** (before the Reviewer batch TS30 / 31 / 32 / 34 / 65):

| Month | Drafter / Reviewer / Approver | Set by |
|---|---|---|
| Jan | DA / RRA / P | TS38 |
| Feb | DA / P / P | TS64 |
| Mar | DA / P / P | TS22 |
| Apr | DA / P / P | TS27 |
| May | DA / RA / P | (untouched) |
| Jun | DA / P / P | (untouched) |
| Jul | DA / P / P | TS45 |
| Aug | DA / P / P | (untouched) |
| Sep | DA / RRA / P | TS46 |
| Oct | DA / P / P | TS26 |

**Reviewer batch done:** TS30, TS31, TS32, TS34 and TS65 all **pass** (`eautonurul`).

**Month states at the end of today's run** (2026-11-04 ~11:40; D / R / A):

| Month | State | Set by | Good for |
|---|---|---|---|
| Jan | DRA / P / P | TS32 | — |
| Feb | DA / **RA** / P | TS65 | an Approver approve, e.g. TS36 / TS66 |
| Mar | DA / P / P | TS22 | — |
| Apr | DA / P / P | TS27 | — |
| May | DA / **RA** / P | untouched | an Approver approve |
| Jun | DRA / P / P | TS30 | — |
| Jul | DA / P / P | TS45 | — |
| Aug | DA / **RA** / P | TS34 | an Approver approve |
| Sep | DA / **RA** / P | TS31 | **TS41** (Approver approves after the Reviewer re-approved) |
| Oct | DA / P / P | TS26 | — |

There are 4 Reviewer Approved months (Feb, May, Aug, Sep) ready for tomorrow's Approver work:
TS36 (Faizuddin), then TS37, TS39–TS42, TS50–TS57 and TS66.

### 4e. Progress made visible (Faizuddin: "update this repo and the dashboard TS tracker with the progress … after that, commit only")

1. **Dashboard TS Tracker:** EAINT-12028 shows **28/69 tested · 20 pass · 8 fail**, with each
   TS coloured.
   - Fed from `scripts/claude-run/results/EAINT-12028.json`, through
     `/api/ts-tracker/official` (new `lib/claudeRunResults.ts`).
   - Rebuild it after more runs: edit `OUTCOME` in `scripts/claude-run/build-results-12028.mjs`,
     then `node scripts/claude-run/build-results-12028.mjs`.
   - Screenshot: `_reference/tickets/EAINT-12028/claude-run-2026-11-04/ts-tracker-12028.png`.
   - What's New entry added: "TS Tracker Shows Claude-Run Results".
2. **Repo:** `RESULTS.md` now starts with a "Progress at a glance" table.
3. **SharePoint fallback:** Faizuddin gave the official TS workbook link, to use if the tracker
   could not be updated:
   https://modefair.sharepoint.com/:x:/s/QATeam/IQAVhWo90ELXQo68LGqnCER6AdUFf69SeOsa0-cocqMs6mQ?e=t21pWk
   - **Not edited:** the tracker worked, and this laptop has no SharePoint connector and no
     MODE FAIR sign-in.
   - If he wants the official sheet updated too, do it on the main laptop (OneDrive-synced copy)
     or in Excel Online by hand.
4. **Committed only, not pushed** (Faizuddin: "commit only").

### 4g. Afternoon: TS62 check, TS61 timeout, Batch 3 (full approval through `mfizni`)

1. **TS62 and EAINT-12752.**
   - Faizuddin had raised the header in EAINT-12752 item 2.
   - Shane replied 2026-11-03 that it is "expected, not a bug … removed on purpose", with
     **no reason given**.
   - Faizuddin, 2026-11-04: "its not about logout, but its about the header, because the header
     itself is incorrect".
   - So TS62 is blocked by 12752 item 2.
   - **Item 1 (favicon) retested: pass** (same icon file).
2. **TS61 run for real.** `#session-cfg` on uat1 sets idle 900 s / warn 120 s. The warning shows
   at 13.5 min, but **after 16 min idle the user is still signed in** (F9, possible bug).
3. **Batch 3** (Faizuddin: "yes, do that"): `mfizni` (Approver role, never approved) made the
   fully approved months, so `kmcheah` stays unsigned for TS36.
   - SETUP-05: May, by `mfizni`, no pad, so signatures look per person.
   - **Pass:** TS40, 41, 48, 50, 51, 52, 53, 55, 66, 69.
   - **Fail:** TS37 (blank-date wording; the page posts past dates and only the server
     refuses, F12), TS39 and the Full parts of TS25 / TS33 (note wording, F10), TS54 (PDF address
     ignores the month in the path, F11).
   - TS42 blocked (no unsigned Approver besides `kmcheah`).
   - TS56 / 57 PDFs saved, with things to check in F13 (".Bhd." typo from the mock-up; FMC
     "(PPM-…)" on the Address row).
4. **SETUP-06:** `eautonurul` approved **March as Reviewer**, so Faizuddin has a Reviewer Approved
   month for **TS36 tomorrow** (log in as `kmcheah`, View March, Approve, sign, tomorrow's date).
5. **Totals:** 32 pass · 16 fail (TS48 corrected from pass to fail in the evening, F14) · 18 blocked · 1 (TS36) for Faizuddin · 2 not in this run. The
   TS Tracker has been rebuilt.
6. **Not committed yet** (since `c8b435c`): all of 4f / 4g, the recorder `approverApprove`
   helper and the knowledge updates.

### 4f. Pushed, then more TS ("continue with other TS that you can do")

1. **Pushed** `c8b435c` to `origin/claude/qa-dashboard-jira-OUEhf`.
   - The first push was refused as a credential leak, because `scripts/claude-run/recorder.js`
     held the staging password.
   - The unpushed commit was amended so the password never reached GitHub. The recorder now
     needs `page.__PASS` set before loading.
   - The same password was already on GitHub before today, in `app/eauto/12028/Runner.tsx`,
     `12153`, `12257` and `12412`. Faizuddin was told; moving it to `.env.local` was offered.
2. **New results** (details in `RESULTS.md` / `FAILS-AND-BLOCKS.md`):

   | Result | TS |
   |---|---|
   | Pass | **TS23**, **TS67** (forced Reviewer approval refused), **TS68** (forced Approver approval refused, run as `mfizni`) |
   | Fail | **TS59**, **TS63** (security parts pass; both show the bare "Unauthorized" page, same cause as F1 / TS60) |
   | Blocked | **TS21** (no Pending month), **TS62** (no module Logout), **TS53 / TS54 / TS69** (need a fully approved month) |

3. **Learned:**
   - Undo KIV restores the state before the KIV, so there is no new Pending month without a
     developer reset.
   - The SSO hand-off chain, the `r=` validation, and the action form plus server-side order
     checks are written in `knowledge/flow-association-payment-listing.md` items 5–7.
4. **Totals now (tracker rebuilt):** 23 pass · 10 fail · 21 blocked · 12 waiting for TS36 · 3
   not in this run.
5. **Month states changed since 4d:** Jan is DRA again (TS23 KIV, then SETUP-04 Undo KIV). Every
   other month is as in the 4d table plus the Reviewer batch.
6. **Everything that can run without an Approver approval or a missing input has now been
   run.**

### 5. Repo changes today (pushed `c8b435c`; later changes committed after it)

- **`.gitignore`:** added `.playwright-mcp/` and `_reference/tickets/*/claude-run-*/**/*.webm`.
- **New files:**
  - `scripts/claude-run/recorder.js`
  - `knowledge/claude-driven-testing.md` (with an index row in `knowledge/README.md`)
  - `_reference/tickets/EAINT-12028/claude-run-2026-11-04/RUN-PLAN.md` and `RESULTS.md`
  - this handoff
- **Path fixes:** the three agent and skill files (item 1.5).
- **TS Tracker feed:**
  - `lib/claudeRunResults.ts`
  - `app/api/ts-tracker/official/route.ts` (merges run files)
  - `scripts/claude-run/results/EAINT-12028.json`
  - `scripts/claude-run/build-results-12028.mjs`
  - `lib/changelog.ts` (What's New entry)
- **Run records:** `FAILS-AND-BLOCKS.md` and `ts-tracker-12028.png` in the claude-run folder.
- **Recorder:** `scripts/claude-run/recorder.js` gained the 12028 workflow helpers (`goMonth`,
  `viewMonth`, `state`, `approve`, `kiv`, `undoKiv`, `rejectOpen` / `Type` / `Submit`,
  `logCount`).
- **Flow knowledge:** `knowledge/flow-association-payment-listing.md` gained the section "Notes
  per role and state after the 2026-11-04 deploy".
- `package-lock.json` was already modified before the session.

### Open items / next steps

1. **Done on 2026-11-04:** the survey, Batch 1 (read-only), and Batch 2 (Drafter, Reviewer,
   Multi-role and Approver-reject TS). See sections 4b–4d.
2. **Faizuddin reviews `FAILS-AND-BLOCKS.md` (F1–F8, B1–B14) and says which to raise.** Raise
   only what he picks, using the `eauto-qa-issue-ticket` skill. Candidates:
   - F1: the "Unauthorized" page instead of the BO login (TS59, TS60, TS63), a possible new bug
   - EAINT-12716 retest: TS05 passed
   - the wording decisions F3–F8
3. **2026-11-05:** Faizuddin runs **TS36** (Approver `kmcheah` first signature) on one of the RA
   months (Feb, May, Aug or Sep; keep **Sep for TS41**). After that, Claude runs:
   - TS66 (two tabs, RA), TS37 (date popup), TS42, TS40, TS41 (Sep)
   - then, on the resulting fully approved months: TS39, TS50, TS51, TS52, TS55, and TS56 / TS57
     (these need the PDF full names), plus the Full parts of TS25 and TS33.
   - TS29: `eautonurul` has already signed, so Faizuddin decides how to cover it (B10).
4. **After TS36, also:**
   - **TS53 / TS54:** read the FMC Payment Request address on a fully approved month; open it
     as `onghongkee`, and with the month changed to an Approver-Pending one.
   - **TS69:** a forced Reject on a fully approved month, using `#wf-form` as in
     TS67 / TS68.
5. Ask Faizuddin for the blocked inputs (FAILS-AND-BLOCKS B3–B9).
6. **Commit and push** the later changes when he says so.
7. **Second-laptop leftovers** (item 1.9): long paths (admin), the Chrome extension and logins,
   and a full VS Code restart.

---

## Session: EAINT-12406 Claude-driven run (Secarang /ia/ + CIBO, second laptop)

**Full detail is in `_reference/tickets/EAINT-12406/claude-run-2026-11-04/`. Read these, in order:**
1. `SESSION-LOG.md`: decisions, answers, what ran, what comes next.
2. `RUN-PLAN.md`: method, sources and Azfar's 30.10 state.
3. `RESULTS.md`: one line per TS.

**How the session works**
- Faizuddin guides. Claude runs 12406 in the browser through the Playwright plugin, using
  `scripts/claude-run/recorder.js` with `page.__ROOT` set to the folder above.
- Steps and expected points come from Azfar's `scripts/eauto-12406/cr/EAINT-12406/`
  (`scenarios.yaml`, `03-spec/`, `automation/src/flows/`).
- Azfar's 04.11 defect list (D1, D2, Q44, …) is already in his STATUS file. His artifact board was not re-opened.

**Decided so far**
- /ia/ is on Allianz's real UAT API now.
- First TS: a real-API Allianz purchase, plus E2E_TS9 gender re-pricing.
- Faizuddin supplies the real IC, plate and postcode.

- Recording follows **Azfar's style**, not the 12028 amber/green style. Tools:
  - `scripts/claude-run/recorder-azfar.js`
  - `scripts/claude-run/finish-ts.mjs`
  - method in the run folder's `RUN-PLAN.md`

- Test data:
  - Real plates and ICs from `_reference/tickets/EAINT-12406/secarang-insurance-checker_2026-11-02 (1).xlsx`
    (PROCEED rows).
  - Postcode 55000.
- Blocked: the Playwright browser profile is shared with the 12028 session ("Browser is already in use").
  Faizuddin is finishing 12028 first.
- Step plan ready: `BRIEF-E2E_TS1-TS9.md` in the run folder.

**Next:** once the browser is free, run E2E_TS1 (real API, FPX), then E2E_TS9 (gender re-pricing).

## 4h. Evening: automation (`scripts/eauto-12028`) cross-checked against the live run

Faizuddin: "cross check that with the automation, and if the automation codes are incorrect, fix those".

**Fixed in code (typecheck passes, not run against staging):**
1. `pages/AplDetailsPage.ts` `checkLogRowFormat`: the expected Reject action was
   "Rejected — returned to Drafter" (mock-up form), which would fail a correct build. Changed it to
   "Rejected (returned to Drafter|Reviewer)", the wording in TS30, SRD REQ-015 Examples 4/6, and the live log.
2. `tests/m-session.spec.ts` TS64–66: the refusal in tab 2 is a message on the page ("Someone else
   already actioned this month. Please refresh and try again."), not a browser alert. The run log
   used to record "(none)"; it now records the page message as well.
3. Comments updated with today's verified facts: `#wf-not-your-turn` is gone (AplDetailsPage,
   checks.ts); the server refuses forced past or today dates (expected.ts); the live Audit Log
   columns and newest-first order (i-audit-log.spec.ts).

**Not changed: these need Faizuddin's decision.** The suite, the TS workbook and the live build
each use different wording:

| TS | TS workbook | Suite expects | Live build |
|---|---|---|---|
| TS28 / TS35 | Buttons "disabled"; "Waiting for the Drafter/Reviewer to approve first." | Buttons not rendered; "You hold <ROLE> … not your turn yet." + "Awaiting the next role …" (2 Nov capture) | Not rendered; per-role notes (F3/F4) |
| TS37 blank date | "Please select a payment date." | "Please pick a future payment date." (2 Nov capture), so the suite PASSES where the TS fails | "Please pick a future payment date." |
| TS47 | "No activity yet." | "No workflow actions recorded yet." (2 Nov capture) | not seen (no empty month) |
| TS48 | Date/Time, Role, Action/Status, Remarks; time order | + Payment Date, Actor ignored; oldest first | When/Actor/Role/Action/Payment Date/Remarks; newest first |

**Correction to this run:** TS48 was first marked pass. It is now **fail (F14)** for the column
names and the newest-first order. Totals are now 32 pass · 16 fail · 18 blocked.
