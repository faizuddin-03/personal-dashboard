# QA pipeline — design and build contract (2026-10-27)

Faizuddin's brief: "basically its everything we ever did before, but one whole
flow/complete pipeline in the dashboard" — "instead of my typing here in the
claude CLI, i want to be able to do most of my work in my dashboard itself".

Types: `lib/pipeline/types.ts` (the contract — do not change existing shapes;
adding optional fields is fine).

## 1. Flow

1. **Scout** (existing hourly job, `scripts/agents/run-agent.mjs jira-study`)
   studies a ticket. If the ticket is Faizuddin's (Jira QA field
   `customfield_10041` contains `accountId` from `data/agents/jira.json`), it
   creates `data/pipeline/tickets/<KEY>.json` (stage `studied`, addedBy
   `scout`, statusSync true) and queues `scribe:related`.
   Faizuddin can also add any ticket by key on `/pipeline` (addedBy
   `faizuddin`): if no study exists yet, the add route runs the Scout study for
   that one key first (`node scripts/agents/run-agent.mjs jira-study --force --key <KEY>`).
2. **Scribe** `scribe:related` → `_reference/tickets/Studying/<KEY>/<KEY>-related-history.md`
   (past SharePoint TS of related tickets: same module/page/flow, linked
   tickets). Stage → `related`. Then auto-queues `elf:plan`? **No** — Elf only
   starts when Faizuddin presses "Ask Elf for scenarios" ("when triggered").
   2a. **Ticket brief** (Faizuddin, 2026-10-27: "for every ticket, need to make
   sure to provide these 3 main items: high level scope, estimated tseting
   time (mandays) and the modules/pages affected/need to cover"). Scribe's
   `scribe:related` also writes `data/pipeline/work/<KEY>/brief.json`
   (`TicketBrief` in lib/pipeline/types.ts: `{key, updatedAt, scope[],
   estimate{mandays, range[min,max], confidence, basis, official?{miro?, jira?}},
   modules[{module, portal, pages[], why}], sources[]}`; since 2026-10-28 also
   `estimate.base/buffer/qaCount` and `testingScope{mode, outline[{text,
   numbered?, children?}]}`, shown under the three columns as a nested list
   like the Testing Scope of the team's Miro cards,
   `_reference/pipeline/miro-testing-scope-format-2026-10-28.png`; no Miro
   header fields (BA, QA, Test Env ...) per Faizuddin; older briefs without
   `testingScope` still pass) and a matching
   "## Ticket brief" section at the top of the related history. Schema text,
   validator and prompt blocks: `scripts/pipeline/lib/brief.mjs`.
   `finish()` checks it (`checkBrief`: all three items filled, mandays > 0,
   range valid): complete → `files.brief`; incomplete → ONE `scribe:chat`
   with `input.briefFix` naming what is missing (loop guard: one per job,
   `input.briefFixFor = <jobId>`); still incomplete after that → Scribe
   `waiting`, note "Ticket brief incomplete: <what>". `scout:chat` and
   `scribe:chat` may update brief.json when an answer changes scope /
   estimate / modules. Elf's `elf:plan` / `elf:chat` read it and must cover
   every module/page (scenarios.md "## Coverage of the ticket brief": page →
   TS ids, or why no TS). `POST /api/pipeline/approve` refuses (409) while the
   brief is missing or incomplete. `GET /api/pipeline/tickets/[key]` returns
   `brief` (parsed or null) and `briefProblems`.
3. **Elf** `elf:plan` → `data/pipeline/work/<KEY>/scenarios.md` (reviewable
   list) + `scenarios.json` (PipelineScenario[]). Stage `scenarios`.
   `elf:chat` revises both files from Faizuddin's message.
4. **Green light**: Faizuddin presses Approve. API sets `approvedAt`,
   `approvedScenarioHash`, stage `approved`, and queues `elf:build` (workbook
   via the draft-TS-excel skill) and `dwarf:build`.
5. **Dwarf** `dwarf:build` → new suite following the eauto-automation-scaffold
   skill (`scripts/eauto-<digits>/`, `app/api/eauto-<digits>/run|history|download-all`,
   `app/eauto/<digits>/page.tsx`, Sidebar entry, `lib/ticketAutomations.ts` entry).
   Sets `files.suiteDir`, `files.runnerPage`, `runKey`. Stage `automation`.
   **Build marker** `scripts/eauto-<digits>/.pipeline-build.json`
   `{status, ticket, startedAt, jobId, completedAt?}`: written `building` when
   the build creates the folder (Dwarf may not edit it); set `complete` on
   success, and only then are the ticket files/runKey set. Next build: marker
   `building` (same ticket) → Dwarf continues the stopped build (no restart, no
   duplicates); `complete` → linked, not rebuilt; folder without a marker (or
   with another ticket's) → automation made outside the pipeline, not touched,
   Dwarf asks. Dwarf's Edit deny list blocks every other suite.
   After approval, any `elf:chat` that changes scenarios.json appends a line to
   `pendingDwarfChanges` and auto-queues `dwarf:sync`.
6. **Runs** happen on the runner page as today. `components/pipeline/PipelineRunWatcher.tsx`
   (mounted once in AppShell) watches localStorage `dashboard_background_runs`
   (written by hooks/useBackgroundRuns.ts — never modify that hook): when a run
   for a pipeline ticket's `runKey` starts → POST `/api/pipeline/ts-status`
   `{key, ts:[ids], status:"In Progress"}`; when it resolves → Pass/Fail per TS
   from the result checks; if any failed → POST `/api/pipeline/jobs`
   `{key, action:"elf:findings", input:{runId, result}}`. Stage `testing`.
   On every resolved run it first POSTs the full result (checks with error,
   friendlyError, steps, evidence, video, details; runKey, runId, server
   runId/runLabel, timestamps, log tail) to `/api/pipeline/runs` →
   `data/pipeline/runs/<KEY>/<runId>.json`. Only one tab watches at a time
   (`navigator.locks` "pipeline-run-watcher"; without Web Locks every tab
   watches, as before). The jobs route never queues a second `elf:findings`
   for the same key+runId (returns the first job with `skipped:"duplicate"`;
   an errored or stopped one may be asked again).
7. **Official TS status**: `lib/server/pipeline/officialTs.ts` finds the official
   workbook for the key in the synced QA Team folder
   (`data/agents/setup.json` → `sharepointDir`), finds the TS row by id and the
   status column by header ("Status (Pass/Fail)", "Status", "Test Result"),
   backs the file up to `data/pipeline/backups/`, writes only that cell
   ("In Progress" | "Pass" | "Fail"), logs to `ts-sync.jsonl`. A repeat of a
   (key, runId, TS, status) already written, or without runId the same
   (key, TS, status) within 2 min, is skipped (`{ok:true, skipped:"duplicate"}`;
   index `data/pipeline/ts-sync-written.json`, kept 14 days). If the file is
   locked (open in Excel) → return a clear error, retry later. Standing
   permission from Faizuddin 2026-10-27: status column only.
8. **Findings** `elf:findings` → `data/pipeline/findings/<KEY>/<id>/finding.json`
   per failed TS: TS quote, red-box `*-ISSUE.png` / failed png from the run,
   SRD page image (rendered with pdfjs-dist + sharp, or Playwright) + quote,
   classification system/automation/data, actual/expected. Also a copy under
   `_reference/tickets/<KEY>/<KEY>-<TS>-findings-<yyyy-mm-dd>/` (rule). Stage `findings`.
   Elf reads the saved run file (by runId, or the server runId/runLabel) for
   the error text, failed step and evidence. Older runs without one fall back
   to the job input, then the run folder meta.json (title/status only), plus
   the log tail; the prompt then tells Elf the context is thinner.
9. **Raise**: Faizuddin presses Confirm on a finding → form (priority and
   Developer are always asked; environment; module) → `scout:issue` drafts the
   QA-Issue text (eauto-qa-issue-ticket format) → Faizuddin reviews → presses
   Raise → `/api/pipeline/issue` creates the QA-Issue via Jira REST (sub-task of
   the CR, QA = Faizuddin, Developer = chosen, ADF from the skill template),
   uploads the images as attachments, High/Highest → transition `28` On Hold +
   assignee Faizuddin. Duplicate check first. Stage `raised`.

## 2. Runner: scripts/pipeline/run-character.mjs

`node scripts/pipeline/run-character.mjs <jobId>` — the job file
`data/pipeline/jobs/<jobId>.json` (PipelineJob + `input`) is written by the API
first; the API spawns this detached (windowsHide) so jobs survive dev-server
reloads. It:
1. takes the ticket+character lock;
2. builds the prompt for the action (character persona + task + rules + files);
3. runs `claude -p --output-format stream-json --verbose` with
   `--session-id <new uuid>` on the first job of that ticket+character, else
   `--resume <sessionId>` (stored in `ticket.characters[c].sessionId`), prompt
   via stdin, cwd = repo root, `%APPDATA%\npm\claude.cmd`, shell true;
4. per-character tools (`--allowedTools`, `--permission-mode acceptEdits`):
   1. scribe / scout: Read Glob Grep Write Edit + the toolbox (§7); no other Bash
   2. elf: Read Glob Grep Write Edit `Skill` + the toolbox; `elf:build` also `Bash(node .claude/skills/draft-TS-excel/scripts/*)`
   3. dwarf: Read Glob Grep Write Edit `Bash(node *)` `Bash(npm *)` `Bash(npx tsc *)` `Bash(npx eslint *)` `Bash(npx playwright *)` `Skill`; `--disallowedTools` `Bash(git *)` `Bash(rm -rf *)`
   4. elf findings / scout issue: Read Glob Grep Write Edit `Bash(node *)`
   All: no WebFetch/WebSearch/Agent/Workflow, `--strict-mcp-config`. Jira
   and SharePoint are READ through the toolbox (§7) and written only by the
   API after Faizuddin approves. Scribe/Scout/Elf no longer deny plain
   `Bash` (a blanket deny beats the toolbox allow); instead `shellDenies()`
   in actions/_tools.mjs denies by name every command his settings files
   allow (curl, git, node -e, ...), so only the toolbox runs. Dwarf keeps
   its own Bash rules (+ the toolbox).
5. streams tool events into the job file (`activity`) and the chat file
   (`chats/<KEY>/<character>.jsonl`), appends the final assistant text as a
   ChatEntry, updates the ticket (files, stage, character state, events);
6. post-steps per action (e.g. `elf:plan` validates scenarios.json; Approve
   hashing; `dwarf:build` registers `runKey`).

Prompts live in `scripts/pipeline/prompts.mjs` (one function per action). Every
prompt names the skill(s) to use and the rules: Faizuddin's style (numbered
lists, no bullets, verbatim quotes with source, plain words), TS rules
(TS01 two digits, keep lean, in-cell bold/green/red marks, match the official
sheet when one exists, "Suggestion by Claude" naming when an official TS
exists), automation rules (12166 benchmark, act like a person, automation
creates its own data, inputs typed on the dashboard and never invented, runner
defaults Headless off / Detailed on, red-box captureIssue on failures, never
touch other suites, never sit4/uat3, Wholesale TS manual only), and "ask in the
chat instead of inventing" — a job may end by asking Faizuddin a question
(character state `waiting`).

## 3. API (app/api/pipeline/*, all server-side, Jira creds from data/agents/jira.json)

1. `GET /api/pipeline/tickets` → `{tickets: PipelineTicket[]}`; `POST` `{key}` → add.
2. `GET /api/pipeline/tickets/[key]` → `{ticket, chats:{elf,dwarf,scribe,scout}, jobs (active+recent), findings:Finding[], files:{studyMd, relatedMd, scenariosMd}}`;
   `PATCH` `{statusSync?, stage?}`; `DELETE` removes from the pipeline (files kept).
3. `POST /api/pipeline/jobs` `{key, action, input?}` → `{job}` (queues + spawns); `GET ?key=` → jobs; `DELETE ?id=` → stop.
4. `POST /api/pipeline/chat` `{key, character:"elf"|"dwarf", text}` → appends the ChatEntry and queues `<c>:chat`.
5. `POST /api/pipeline/approve` `{key}` → green light (see flow 4).
6. `POST /api/pipeline/ts-status` `{key, ts:string[], status, runId?}` → official sheet write (flow 7). `GET ?key=` → sync log.
7. `GET /api/pipeline/file?path=` → serves files under data/pipeline/, _reference/tickets/, public/qa-artifacts/ only (path traversal checked).
8. `POST /api/pipeline/findings/[id]` `{state, priority?, developerAccountId?, environment?, module?}` → update; `confirmed` queues `scout:issue`.
9. `GET /api/pipeline/jira/users?q=` → assignable users for the Developer picker.
10. `POST /api/pipeline/issue` `{key, findingId, dryRun?}` → creates the QA-Issue (flow 9) → `{issueKey, url}`; dryRun returns the payload only.
11. `POST /api/pipeline/runs` `{key, runId, runKey?, serverRunId?, runLabel?, startedAt?, finishedAt?, error?, meta?, checks[], log?, ...}` → saves `data/pipeline/runs/<KEY>/<runId>.json` (same runId overwrites); `GET ?key=` → saved run summaries, `&runId=` → one full run.

## 4. UI

1. `/pipeline` — board: one column per stage, a card per ticket (key, title,
   Jira status, which character is working, pending questions), "Add ticket".
2. `/pipeline/[key]` — workspace: stage stepper; Study and Related history
   (markdown); Elf panel (scenario list, chat, "Ask Elf for scenarios",
   Approve); Dwarf panel (state, chat, pending changes, link to runner page);
   Runs and official-sheet sync log + statusSync toggle; Findings cards (TS
   quote, red-box image, SRD image + quote, classification, Confirm / Not an
   issue, issue form, draft review, Raise). Character avatars: small pixel
   sprites. Plain simple wording.
3. Sidebar entry "Pipeline". Works in Normal and Medieval styles.

## 5. Safety

1. Never modify `hooks/useBackgroundRuns.ts`, existing `scripts/eauto-*`
   suites, existing run routes or runner pages. Dwarf only creates new ones.
2. Jira and SharePoint writes happen only in the API after an explicit button
   press by Faizuddin (Approve, Raise) or by the standing status-column permission.
3. Every official-sheet write is backed up first.

## 6. Module boundaries (build contract)

### 6.1 Shared store — `scripts/pipeline/store.mjs` (+ `store.d.mts` types)

Plain ESM so both the Node runners (`run-character.mjs`, `scripts/agents/run-agent.mjs`)
and the Next API routes (`import ... from "@/scripts/pipeline/store.mjs"`) use the
same code. Exports:

1. `ROOT`, `PIPE_DIR` (`data/pipeline`), `repoPath(rel)`, `safeResolve(rel)` (only
   data/pipeline, _reference/tickets, public/qa-artifacts; throws otherwise).
2. Tickets: `readTicket(key)`, `writeTicket(t)`, `updateTicket(key, fn)` (atomic
   read-modify-write, returns the new ticket), `listTickets()`,
   `ensureTicket({key, title, addedBy, jiraStatus})` (creates with defaults,
   statusSync true, all characters idle), `addEvent(key, text)`.
3. Chats: `appendChat(key, character, entry)`, `readChat(key, character)`.
4. Jobs: `createJob({key, action, input})` (character = action prefix),
   `readJob(id)`, `updateJob(id, patch)`, `listJobs({key, active})`,
   `spawnJob(id)` (detached `node scripts/pipeline/run-character.mjs <id>`),
   `queueJob({key, action, input})` = create + spawn.
5. Findings: `readFinding(key, id)`, `writeFinding(f)`, `listFindings(key)`.
6. Jira: `jiraCreds()` (from data/agents/jira.json or null), `jiraFetch(path, init)`
   (Basic auth, JSON, throws with status + body text on !ok).
7. Saved runs: `writeRun(rec)`, `readRun(key, runId)`, `listRuns(key)`,
   `findRun(key, id)` (client runId, server runId or runLabel), `isRunId(id)`.
8. Misc: `setupInfo()` (data/agents/setup.json), `hashFile(path)`, `nowIso()`.

### 6.2 Action modules — `scripts/pipeline/actions/<character>-<verb>.mjs`

One file per JobAction (`scribe-related.mjs`, `elf-plan.mjs`, `elf-chat.mjs`,
`elf-build.mjs`, `dwarf-build.mjs`, `dwarf-chat.mjs`, `dwarf-sync.mjs`,
`elf-findings.mjs`, `scout-issue.mjs`). Each default-exports:

```js
export default {
  tools: { allowed: [...], disallowed: [...] },   // claude --allowedTools / --disallowedTools
  async prepare(ctx) { return { prompt } },          // or { skip: "reason" }
  async finish(ctx, { ok, text }) { },               // update ticket/files/stage, queue follow-ups
}
// ctx = { job, ticket, input, store, log(text), activity(text) }
```

`run-character.mjs` loads the module by action name, runs prepare → claude →
finish, and owns locks, session ids, streaming, chat entries and job state.

### 6.3 Ownership

1. Engine: store.mjs(+d.mts), run-character.mjs, prompts-common.mjs (shared rule
   blocks), actions scribe-related / elf-plan / elf-chat / elf-build /
   dwarf-build / dwarf-chat / dwarf-sync, routes tickets, tickets/[key], jobs,
   chat, approve, file.
2. Status: scripts/pipeline/lib/official-ts.mjs, route ts-status,
   components/pipeline/PipelineRunWatcher.tsx, one mount line in AppShell.
3. Findings + issue: scripts/pipeline/lib/srd-render.mjs,
   scripts/pipeline/lib/qa-issue.mjs, actions elf-findings / scout-issue, routes
   findings/[id], jira/users, issue.
4. UI: app/pipeline/page.tsx, app/pipeline/[key]/page.tsx,
   components/pipeline/* (except PipelineRunWatcher), Sidebar entry, What's New.
5. Scout handoff: scripts/agents/run-agent.mjs (`--key`, my-ticket detection,
   ensureTicket + queueJob scribe:related).

## 7. Toolbox and ask-each-other (2026-10-27)

Faizuddin: "the pipeline characters are asking me a lot questions, requesting
me this file, and that file ... make sure all those agents can get the files
they needed, even if they need to ask each other".

### 7.1 Toolbox — `scripts/pipeline/tools/fetch.mjs`

Read only on Jira (GET + the search POST) and SharePoint. Writes only under
`_reference/tickets/Studying/<KEY>/` and `_reference/sharepoint/qa-team-ts/`.
Every character's tool set allows `Bash(node scripts/pipeline/tools/fetch.mjs *)`
and `Bash(node scripts/pipeline/lib/xlsx-text.mjs *)`.

1. `issue <KEY>` — Jira capture (same format as the hourly Scout, ALL comments) → `<KEY>-jira.md`.
2. `attachments <KEY> [--name <part>]` — every attachment up to 25 MB (videos only with `--name`), same-size files skipped; `.docx` / `.xlsx` / `.pdf` / `.html` get a `<name>-text.md` copy (`lib/attach-text.mjs`: mammoth, exceljs, pdf-parse, tag stripper); prints the newest SRD.
3. `search "<JQL>"` — up to 50: key | type | status | summary.
4. `linked <KEY>` — `issue` for each linked ticket and the parent (max 10).
5. `ts <EAINT-key or words>` — text copy of matching QA Team workbooks; clear message for cloud-only files.
6. `miro <board link|id> [--frame <name>]` — delegates to `tools/miro.mjs read` (see 7.3).
7. `help`.

The hourly Scout (`scripts/agents/run-agent.mjs`) also keeps `.html`
attachments, takes up to 25 MB and writes `-text.md` copies of `.docx` and `.html`.

### 7.2 Asking each other — `scripts/pipeline/ask.mjs`

1. Every prompt carries `ASK_RULES` (prompts-common.mjs): toolbox first; then
   end the final message with up to 3 blocks
   ````
   ```ask
   to: scout | scribe | elf | dwarf | sage
   question: <one clear request>
   ```
   ````
   (Scout = Jira/SRD/attachments/linked tickets, Scribe = past QA Team TS,
   Elf = scenarios/TS, Dwarf = automation code, Sage = knowledge base and his earlier answers, §8); Faizuddin only for decisions
   or facts nobody else has — never to convert, download or paste a file.
2. `run-character.mjs` strips the blocks from the chat text (a short line
   instead) and `handleAsks()` queues `<to>:help` with input
   `{from, question, askJobId, depth}`; system note "Asked Scout: ..." in the
   asker's chat (`ChatEntry.via`); asker state `working` + note "Waiting for
   Scout's answer". Refused (system note) when depth > 3 or the same question
   went to the same character for this ticket in the last hour. If the reply
   also has "## Questions for Faizuddin", his questions win (state `waiting`).
3. `actions/<c>-help.mjs` (`_help-common.mjs`): same tools as that
   character; Scout may refresh the study / download attachments, Scribe may
   update the related history, Elf and Dwarf answer read-only. The helper's
   chat shows "Answering Elf: ...".
4. `relayAnswer()`: a finished help job queues the asker's `<asker>:chat`
   with `{text: answer, from: helper, question, depth}` (the chat prompts say
   "Scout answered your request ... continue your task"), or `<asker>:help`
   with `answers[]` when the asker was itself answering someone. A helper that
   asks someone else answers in its follow-up help job.
5. `helpFailed()` (error, skip, crash) and `stopJob()` (stopped help job):
   system note in the asker's chat, asker state `waiting` so Faizuddin sees it.
6. `elf:plan` and `scribe:related` may end with an ask before writing their
   file; the continuation chat job writes it.
7. Help jobs never move a ticket card (`rooms.ts displayStage`).

### 7.3 Miro reader — `scripts/pipeline/tools/miro.mjs` (2026-10-27)

Faizuddin: "a toolbox command `miro <board link>` opens Miro in a separate
headless browser that keeps its own login. You sign in to Miro there once in a
visible window; after that, characters read boards without you."

1. Own Playwright profile `data/agents/miro-profile/` (gitignored; installed
   Chrome, bundled Chromium as fallback). Never `data/browser-profile` or his Chrome.
2. `login` — Faizuddin only (refused when `CLAUDE_PIPELINE_JOB` is set). Visible
   window on the Miro dashboard; he types his own login; the script only watches
   the URL for `miro.com/app/...` (up to 10 min), then closes and prints
   "Miro sign-in saved". Started by the Agents page button "Sign in to Miro"
   (`POST /api/agents/miro-login`, detached, visible; `?dry=1` returns the
   command only; `GET` returns the status). Never fills the form, never reads cookies.
3. `read <link|id> [--frame <name>]` — headless; waits up to 60 s for
   `window.miro.board.get()`, takes every item (+ tag names), strips HTML, maps
   items to frames (parentId chain, else frame box), sorts frame → y → x, writes
   `_reference/miro/<board-id>-<yyyy-mm-dd>[-<frame>].md` (header + one numbered
   line per item: `[frame] type: text`, cards with status/assignee/dates/tags/fields).
   Connectors, groups and empty items are skipped and counted. Fallback when the
   board API never appears: text from JSON the web app fetched. No clicks, no edits.
4. Signed-out private board ("This is a private board ... Sign in") → prints
   "Miro is not signed in for the agents. Faizuddin: open the Agents page and
   click 'Sign in to Miro' ..." and exits 1. No board access → asks him to
   request access.
5. A board link not yet in `_reference/miro-links.txt` is appended (date |
   unknown | "Board read by the pipeline Miro reader" | link). Old lines untouched.
6. Status (no secrets): `data/agents/miro-status.json` (signedIn, lastOkAt,
   lastCheckAt, lastError); `data/agents/miro-login.lock` while the window is open.

## 8. Sage — the knowledge keeper (2026-10-27)

Faizuddin: "every time we do something in the pipeline, ... an agent will
always make sure to improve the knowledge and flow based on everything that we
did ... as we do the pipeline, there is always aspects that we can improve" and
"one of the things i want to avoid is the agents asking me the same question
over and over again".

### 8.1 Triggers — `store.noteForSage(key, event)`

Appends a `SageEvent` to `data/pipeline/sage-inbox/<KEY>.jsonl`, then
`queueSage(key)`: a `sage:learn` job is queued only if none is queued or
running for that ticket (a queued one picks up every event; a running one
re-queues itself in `finish()` when events came in meanwhile). Ignored for the
Sage's own events (`character`/`by` "sage", `sage:*` actions) — no loops.
Callers:
1. `run-character.mjs` — every job that finishes ok (any character except the Sage, incl. `:help`), with the reply text.
2. `POST /api/pipeline/chat` — Faizuddin's message (not to the Sage), with `answering` = the questions in that character's last reply, and the saved paste path (`file`) when he pasted a page.
3. `POST /api/pipeline/approve` — the green light (not dry runs).
4. `POST /api/pipeline/findings/[id]` — confirmed / dismissed, with his optional `reason`.
5. `POST /api/pipeline/issue` — QA-Issue raised.
6. `scripts/agents/run-agent.mjs pipelineHandoff` — Scout study written or updated.

Debounce: `sage-learn.mjs` exports `waitUntilReady()`; the runner calls it
before taking the lock, and it waits until the inbox has been quiet for 2 min
(`PIPELINE_SAGE_QUIET_MS`), at most 20 min.

### 8.2 `sage:learn` (`actions/sage-learn.mjs`)

Prompt: the pending events, the chat entries since the first event, the
ticket's files, knowledge/README.md + flows.md + module files, answers /
improvements / pending review. Rules (`actions/_sage-common.mjs`): provenance
tags (`[source: pipeline <KEY>, <who>, <date>]`, `[Faizuddin, dashboard chat
to <character>, <date>]`, `[unconfirmed]` for inferences), verbatim quotes,
small additions only, never rewrite/delete, capture module flows into
`knowledge/flow-<module>.md` (+ README index), positions not names, no
team-standard claims, plus STYLE_RULES.
1. Non-contradicting durable facts → appended to `knowledge/` directly.
2. Changes/contradictions → hand-off `review` (never applied).
3. Pipeline ideas → hand-off `improvements`. Never edits code.
4. His answers → hand-off `answers` (8.4).
5. Final message = the Sage chat entry ("Learned / Waiting for your OK / Ideas / Answers remembered").

Hand-off: the Sage writes `data/pipeline/sage-out/<jobId>.json`; `finish()`
validates it and merges into `knowledge-review.json`, `improvements.json`,
`answers.json` under file locks (deduplicated), diffs `knowledge/` against the
snapshot taken in `prepare()` (lines added/removed per file; removed lines →
warning in the chat and the record), appends a `learnings.jsonl` record,
clears the processed inbox events. The model never edits the shared files.

Tools (`sageTools()` in `_tools.mjs`): Read Glob Grep Write Edit + the
read-only toolbox. Edit/Write denied everywhere except `knowledge/**` and
`data/pipeline/sage-out/**`: every top-level entry, every `data/` entry and
every `data/pipeline/` entry is denied by name (incl. the four shared files),
plus ALWAYS_PROTECTED minus knowledge. Other characters keep
`Edit(./knowledge/**)` denied.

### 8.3 Approval — `/api/pipeline/learnings` + `/pipeline/learnings`

1. `GET` → `{review, improvements, learnings (last 50), answers}`.
2. `POST {type:"review", id, decision:"approve"|"reject", note?}` — approve sets `approved` and hands it to `sage:apply` (`actions/sage-apply.mjs`, batched per item 2.3: applies each change exactly, tagged `[approved by Faizuddin, <date>]`; state `applied`, or `error` with a note).
   1. Any key (night of 2026-10-27, sage-apply-any-key): when `item.key` is not a ticket on the board (studying-only ticket, or a non-key such as `KNOWLEDGE-AUDIT`), the job runs as a **system job**: key `store.SYSTEM_KEY` (`KNOWLEDGE-0`), `system: true`, input `{reviewId, reviewKey}`. Only `store.SYSTEM_ACTIONS` (`sage:apply`) may run so; `ensureTicket` refuses the holder key. No ticket file is ever written: the runner uses an in-memory holder (fresh session, ticket updates are no-ops), so nothing appears on /pipeline, the board, counts or the ticket scope filter. `GET /api/pipeline/jobs` leaves system jobs out unless `?key=KNOWLEDGE-0`; their chat lines go to `data/pipeline/chats/KNOWLEDGE-0/sage.jsonl`. The prompt header and the `learnings.jsonl` record use the item's own key. A system approve is refused (409) when `item.file` is not `knowledge/<name>.md`.
   2. Checks (all jobs): before Claude runs, the current text must still be in the file word for word (CRLF-normalised; skipped when the Sage already marked `currentFound: false`), else state `error` ("no longer in <file> word for word"), a `learnings.jsonl` line, and Claude is not called. After the run: the file changed, the proposed text's first line is in it, and for a replacement the current text occurs fewer times than before.
   3. Batches (night of 2026-10-27, sage-batch-apply). The Sage runs one job at a time and a queued job waits at most 1 h, so approving dozens of changes one job each let the last ones time out and stay `approved` for good. Now:
      1. Approve calls `store.queueApply({reviewId, reviewKey, system})`: it **joins** a `sage:apply` job that is still `queued` (live process) for the same holder key — the ticket, or `KNOWLEDGE-0` for off-board keys — while it holds fewer than `store.APPLY_BATCH_MAX` (10) changes; else it queues a new job. Input `{reviewIds: [...], reviewKeys: {id: key}}`; older jobs' `{reviewId, reviewKey}` is still read (`store.applyIds`). The approve response carries `joined`; the item gets `jobId` at once (cleared on every approve).
      2. Joining and the runner's `queued → running` switch both go through `updateJob`'s file lock, and the runner takes `job.input` from that switch, so a joined change is never lost and the batch closes when the job starts.
      3. One Claude run per batch: changes that fail the pre-check (2) are set `error` and left out of the prompt; the rest are listed "Change i of n" with their ids. Time limit `min(60, 10 + 5n)` min for n > 1 (module `prep.timeoutMs`; one change keeps 20 min). The after-check (2) runs **per change**; a change found in the file counts as `applied` even if the job ended badly after it. **One `learnings.jsonl` line per change**, keyed to the change's own key (sage-out counts on the first).
      4. Never stuck at `approved`: a job that ends without applying a change (queue-wait timeout, crash, Claude error, after-step error, stopped) puts it back to `error` with the reason and "Approve again to retry" — `store.releaseApply(jobId, reason)` from the runner's cleanup / skip / end and from `store.stopJob`. Safety net: `GET /api/pipeline/learnings` calls `store.releaseStuckApprovals()` (an `approved` change older than 2 min that no live job holds → `error`), and approve also accepts an `approved` change no live job holds. The page needs no change: `error` already shows Approve.
      5. Tests: `PIPELINE_LOCK_WAIT_MS` shortens the 1 h queue wait (runner); `PIPELINE_CLAUDE_BIN` points at a fake CLI.
3. `POST {type:"improvement", id, state:"done"|"dismissed"|"open"}`.
4. `POST {type:"answer", id, decision:"wrong"|"active"}` — "wrong" stops the registry from using it.
5. Page "Learnings" (sidebar, after Pipeline): Waiting for your OK (current vs proposed side by side, why + sources, Approve / Reject + note), Ideas to improve the pipeline, Answered for you from memory (mark wrong), Recently learned.

### 8.4 Answer registry — `data/pipeline/answers.json` (`scripts/pipeline/answers.mjs`)

1. Entries (`SavedAnswer`): question (original + normalised), his exact answer, scope `global` | `ticket:<KEY>` | `module:<name>` (conservative; module matches when the ticket title contains the name), askedBy, ticket, date, source chat ref, state active/wrong, uses.
2. Written by the Sage (learn / chat hand-off). Durable general answers also go into `knowledge/`.
3. ASK_RULES item 3 (all characters): check answers.json and knowledge/ before asking him; cite `[answered by Faizuddin on <date>]`.
4. Safety net (`autoAnswer()` in `run-character.mjs`): a job that ends with "## Questions for Faizuddin" (not a help job, not the Sage, not a continuation the Sage started, no asks queued) has each question matched (Dice similarity of normalised words ≥ 0.72, scope applies). Matched → system note "Sage: you answered this on <date>: …" in that chat, `auto-answer` record in learnings.jsonl, uses+1, and the character's `<c>:chat` continuation queued with `{from:"sage", text}` (the still-open questions listed for it to re-ask). Unmatched questions reach him as before. A near miss (≥ 0.45) adds an improvement idea.

### 8.5 Chat and help

1. `sage:chat` — `POST /api/pipeline/chat {character:"sage"}`: answers from the knowledge base, applies small fixes he asks for (tagged `[Faizuddin, dashboard chat to Sage, <date>]`), unclear changes go to review. No inbox event (no loop).
2. `sage:help` — other characters `ask` the Sage "what do we know about X" (ASK_RULES lists **Sage**). Read only (`sageReadTools()`).
3. `GET /api/pipeline/tickets/[key]` returns `chats.sage`.

## 9. Review checks from Charmain's QA repo (night of 2026-10-27)

Ideas taken from the read-only clone `_reference/codebases/eauto-qa-charmain/`
(knowledge/charmain-qa-repo.md). Log: data/pipeline/night/pipeline-enhance-log.md.

### 9.1 Suite check — `scripts/pipeline/lib/suite-check.mjs`

Mechanical review of a pipeline-built suite, modelled on her spec-reviewer
reject list `[charmain-repo: .claude/agents/spec-reviewer.md:35-61]`.
1. CLI: `node scripts/pipeline/lib/suite-check.mjs <KEY> [--json]` (Dwarf runs it
   itself; exit 1 when something blocks). Result → `data/pipeline/work/<KEY>/suite-check.json`,
   `ticket.files.suiteCheck`.
2. Blocking: a non-manual TS with no test titled exactly `<id>: <title>`, a TS the
   runner page does not list, a manual TS automated, ids not in scenarios.json,
   `test.only`, sit4/uat3, password/token literals (incl. env() fallbacks),
   `.value`/`.checked` writes, dispatchEvent, readonly stripping, datepicker
   setDate, `force: true`, an action/wait followed by a swallowing `.catch` with no
   `timeout:`, an eAuto host/IP typed in pages/tests/utils. Minor (listed only):
   waitForTimeout, test.skip/fixme with no reason, page.goto to a typed deep path
   (night round 10), expect() on page.evaluate or an API response (round 10).
3. Kept on purpose: `// pipeline-check: allow <rule> — <reason>` on the line or the
   line above, or `allow-file` in the first 30 lines. Files that are unchanged
   copies of the same-named file in another `scripts/eauto-*` suite are kept
   automatically (copy working flows step for step).
4. `dwarf:build` / `dwarf:sync` finish() → `checkAfterDwarf()` (actions/_dwarf-check.mjs):
   clean → system note; blocking → ONE `dwarf:chat` with `input.suiteFix`
   (loop guard `input.suiteFixFor = <jobId>`); that chat's finish() checks again,
   still blocking → Dwarf `waiting`, note "Suite check: N problem(s) left".

### 9.2 Scenario self-review + lint — `scripts/pipeline/lib/scenario-review.mjs`

From her scenario reviewer `[charmain-repo: .claude/agents/scenario-reviewer.md:44-215]`
and ledger skill `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:46-83]`.
1. `SCENARIO_REVIEW_RULES` in the elf:plan / elf:chat prompts: every expected
   result has a source (`basis`; code/today's screen only → Open points), walk the
   changed rules (positive, negative, exemptions, boundaries, named variants,
   roles, independence, exactly-once, aftermath) but add a TS only where it can
   really break, same trigger + same setup = one TS, ticket scope only, visible
   to a user, specific enough to fail, setup reaches the rule, the project's
   words, 40 cap. scenarios.md gains a **Source** line per TS and a short
   "## Self-review" section.
2. `PipelineScenario.basis?` (optional; older lists lack it).
3. `lintAfterElf()` (actions/_elf-common.mjs, from finishScenarios when this job
   changed scenarios.json): judges only TS this job added/changed — vague
   expected ("works correctly", "is updated" …), no expected, expected without
   "<Screen> ->" (not when an official TS exists), no basis, duplicate title,
   same section + identical steps (not with an official TS), > 40. Warnings →
   system note in Elf's chat. Before approval, fixable ones → ONE `elf:chat`
   with `input.lintFix` + `warnings` (loop guard `lintFixFor`; never from a
   lint-fix job; "no-basis" fixable only on a first draft).

### 9.3 Findings triage — `scripts/pipeline/lib/triage-hints.mjs`

From her qa-triage agent `[charmain-repo: .claude/agents/qa-triage.md:32-89]`.
1. elf:findings prepare computes per failed check `context.hints`: error kind
   (network, login, card-reader (round 11), strict, empty-listing, locator-timeout, closed,
   value-mismatch, timeout — an expect() that received a value counts as a
   value mismatch), slow steps (≥ 20 s and ≥ 4x the sibling median, no error),
   earlier findings for the same TS (any state, with QA-Issue key), and other
   failed checks with the same first error line. They appear as "Hint:" lines in
   the prompt — leads, never the verdict.
2. `TRIAGE_RULES` in the prompt: read the run, suspect the script first, then the
   environment causes that look like defects, then "known", then the product;
   "unresolved" with what was ruled out instead of a guess. Environment maps to
   class "data" (the UI's three classes are unchanged).
3. finding.json gains `triage {verdict: defect|script|environment|data|known|unresolved,
   cause, ruledOut[], knownAs, confidence}`; finish() keeps it only with a known
   verdict (`Finding.triage?` in types). The findings page shows a "Triage" line.

### 9.4 Ask rules + automation lessons

1. `ASK_RULES` items 7-8 (prompts-common.mjs): never ask what the evidence would
   tell you; one question per numbered line, one decision, with the options seen
   and the recommended one (so he can answer "1a")
   `[charmain-repo: docs/replying.md:26-34]`. `normQuestion()` (answers.mjs) drops
   the "(a) … (b) …" options before matching earlier answers.
2. `STYLE_RULES` item 7: never name a ticket / REQ / TS / rule by number alone; a
   correction states the corrected fact first `[charmain-repo: docs/replying.md:55-56]`.
3. `AUTOMATION_LESSONS` (`scripts/pipeline/lib/automation-lessons.mjs`) in every
   Dwarf prompt (build, sync, chat): queued popups, mandatory date range, repeated
   ids, login throttling, swallowed-wait timeout, helpers that throw, suspect the
   script, tight assertions, grep is a regex, act on this run's record. Sources per
   line in the file.

### 9.5 Latest-run check before a Raise — `scripts/pipeline/lib/latest-run.mjs`

"Triage from the latest run, never from a report" `[charmain-repo: test-scenarios/defects.yaml:14-26]`.
1. `newerResult(key, finding)`: the newest saved run (data/pipeline/runs/<KEY>/)
   newer than the finding's own run that has a check for the finding's TS →
   `{runId, runLabel, at, status: passed|failed|partial|…}`.
2. `POST /api/pipeline/runs` → `markFindingsAfterRun()`: open/confirmed findings
   whose TS the new run passed get `passedSince` (+ a ticket event); a later
   failing run clears it. Advisory only; never fails the save. Response gains
   `findings {marked, cleared}` only when something changed.
3. `POST /api/pipeline/issue`: when the latest run passed the TS, the first Raise
   returns 409 "… passed in a newer run … press Raise again within 15 minutes"
   and stores `stalePassAck`; a second press within 15 minutes raises. dryRun is
   never blocked. No UI change needed (the card shows the error text).
4. `scout:issue` prompt: Scout still drafts, but starts its reply with the note.

### 9.6 Assertion guard — `scripts/pipeline/lib/assertion-guard.mjs`

"Assertions encode intent, never lowered to pass" `[charmain-repo: docs/qa-principles.md:23-30]`.
1. `dwarf:chat` and `dwarf:sync` prepare() snapshot every assertion line
   (`expect(`, `expect.soft(`, `test.skip/fixme(`) per test title (helpers: per
   file) of the ticket's own suite into `ctx.state`; finish() compares.
2. Reported: **removed** (gone from a test that still exists, not moved
   elsewhere), **looser matcher** (same subject, e.g. toHaveText → toContainText
   → toBeVisible), **softened** (new expect.soft, `.catch` on an expect,
   test.skip/fixme). A changed expected value with the same or a stricter matcher
   and a removed test (TS removed) are not reported.
3. Result: system note in Dwarf's chat + ticket event. Dwarf goes `waiting`
   ("N assertion(s) loosened: confirm or restore") unless Faizuddin's own message
   asked for assertion changes.

### 9.7 One next action per ticket — `scripts/pipeline/lib/next-step.mjs`

"Do not answer that by eye … names ONE next action, plus what is waiting on a
person versus what is waiting on work" `[charmain-repo: docs/workflow.md:6-17]`.
1. `nextStep(ticket)` → `{who, waitingOn: faizuddin|work|none, action, also[], stage, character?}`
   from the ticket file, jobs, findings, saved runs and brief.json. No model call.
2. Order: a character waiting for Faizuddin → a running job (the Sage's
   background learning never blocks) → a character in error → study → related
   history → brief → scenarios ("Ask Elf" is his button) → green light → Dwarf
   build → pending sync → suite check → findings (newer pass, open, draft,
   raise) → runs (none, failed without findings, failed and handled, all passed).
   A normally automatic step with nothing running is reported as stalled
   (waiting on Faizuddin, `character` = whose step).
3. `GET /api/pipeline/tickets` adds `next` to every ticket; `GET /api/pipeline/tickets/[key]`
   returns `next`. CLI: `node scripts/pipeline/lib/next-step.mjs [KEY]`.

### 9.8 Assertion plan with wrong outcomes — `scripts/pipeline/lib/assertion-plan.mjs`

From her assertion-plan skill `[charmain-repo: .claude/skills/assertion-plan/SKILL.md:8-11,95-113]`.
1. dwarf:build (prompt) writes `data/pipeline/work/<KEY>/assertion-plan.json`
   BEFORE the test code: per automated TS `{ts, checks[{screen, element, expect}],
   wrongOutcomes[{outcome, why}]}` — wrong outcomes are plausibly broken builds
   (old behaviour, neighbouring control, other role's view) the assertions must
   reject. dwarf:sync keeps it in step for changed TS.
2. `planAfterDwarf()` (actions/_dwarf-check.mjs) in both finish() steps: checks
   every automated TS is present, has checks and ≥ 1 wrong outcome, no wrong
   outcome equals an expected result, no unknown TS. Advisory: a note in Dwarf's
   chat; sets `ticket.files.assertionPlan`. Never fails the build.

### 9.9 Open questions per ticket — `scripts/pipeline/lib/open-questions.mjs`

"A question asked in a chat reply used to live only in that reply"
`[charmain-repo: test-scenarios/questions.yaml:1-21]`.
1. `openQuestions(key)`: every "## Questions for Faizuddin" item a character
   asked after his last message in that chat, minus those the answer registry
   already answers; rephrased repeats (similarity ≥ 0.7) keep the newest wording.
   Derived from the chats: no new store.
2. `GET /api/pipeline/tickets/[key]` returns `openQuestions`. `nextStep()` lists
   the ones the waiting note does not show in `also`, and when nobody is waiting
   and nothing runs, the oldest becomes the next action.

### 9.10 Voided runs — `scripts/pipeline/lib/voided-runs.mjs`

"A voided run is evidence of nothing … voiding withdraws the verdict, it does
not destroy the record" `[charmain-repo: test-scenarios/voided-runs.yaml:1-24]`.
1. Store: `data/pipeline/voided-runs.json` `[{key, runId, ts?, reason, voidedBy, voidedOn}]`
   (created on first use). The saved run file is never changed.
2. Only a person voids, naming the run: `PATCH /api/pipeline/runs {key, runId, ts?, void: true, reason (≥ 15 chars), by}`
   (`void: false` restores), or the CLI `node scripts/pipeline/lib/voided-runs.mjs void <KEY> <runId> "<reason>" [--ts <id>]`
   / `unvoid` / `list`. Never void to make a red go away. Every void / restore is a ticket event.
3. Effects: elf:findings skips a voided run (or the voided TS); the latest-run
   check (§9.5) and `nextStep()` (§9.7) ignore it; open findings from a voided
   run are listed in `next.also` as "dismiss them" and are not proposed for Raise.

### 9.11 Conflicts once; stated vs investigated

1. `ASK_RULES` 9: a conflict between sources is ONE question quoting both sides
   with locations; never re-raised in other words, never decided silently; until
   answered, work from the newest requirement source and tag dependants [unconfirmed]
   `[charmain-repo: .claude/skills/ticket-intake/SKILL.md:50-53]`.
2. scout:chat: when it updates the study, what the requestor STATED stays apart
   from what Scout INVESTIGATED (an "Investigated" heading with evidence)
   `[charmain-repo: .claude/skills/ticket-intake/SKILL.md:28-49]`. (The first study is
   written by scripts/agents/run-agent.mjs, outside the pipeline; not changed.)

### 9.12 Lessons written down — Sage KNOWLEDGE_RULES 10

"A lesson that is not written down will be paid for again" `[charmain-repo: docs/qa-principles.md:132-149]`.
1. `KNOWLEDGE_RULES` 10 (actions/_sage-common.mjs): a failure whose cause was the
   script, data or environment but looked like a product fault becomes ONE short
   lesson in knowledge/automation-playbook.md (trap, how it showed, cost, fix, tag).
2. The finding confirm/dismiss note to the Sage (`PATCH /api/pipeline/findings/[id]`)
   now carries Elf's triage (verdict, cause, ruled out) and the error line.

### 9.13 Pasted material = check only; questions routed to who can answer

1. `incomingMessage()` (prompts-common.mjs): when his chat message came with a
   pasted page / long text (`input.file`), the prompt says CHECK it and report
   what you would change; edit nothing unless his message asks for a change.
   Source: his own words to Scout, 2026-10-27 09:49 ("NEVER DO ANY CHANGES UNLESS
   I GIVE YOU THE GREEN LIGHT"; improvements.json `imp-20261027-175440-40c5ee`),
   and "Read freely … unless the run explicitly asked for that action by name"
   `[charmain-repo: .claude/skills/ticket-intake/SKILL.md:24-25]`.
2. `ASK_RULES` 4: a question only the BA or the developer can settle goes under
   "## Questions for the team" ending "(for: the BA)" / "(for: the developer)";
   it does not make the character wait. `openQuestions()` tracks it with `for`;
   `nextStep()` lists it as "to forward" (improvements.json `imp-20261027-175717-6b5c6c`;
   owner field `[charmain-repo: test-scenarios/questions.yaml:23]`).

### 9.14 "Answered on another ticket" hints — answers.mjs

1. `autoAnswer()` (run after every job that ends with questions): a remaining
   question that fully matches an active answer whose scope does NOT apply here
   (another ticket / module) is not answered automatically, but the Sage posts the
   earlier question and answer in that character's chat, so he can reply "same as
   <ticket>". `bestAnswerAnyScope()` in answers.mjs.
2. Source: "Never make the user say the same thing twice" `[charmain-repo: docs/replying.md:34]`;
   real case: the cron question asked three times on 2026-10-27 (improvements.json).

### 9.15 Parked (deferred) questions — `scripts/pipeline/lib/deferred-questions.mjs`

"deferred — real, parked on purpose, will not be chased now" `[charmain-repo: test-scenarios/questions.yaml:16-21]`.
1. `isDeferral()` (answers.mjs): a reply that only parks a question ("i will give
   you this later", "ignore first. i will come back to this later") is not an
   answer: `bestAnswer()` / `bestAnswerAnyScope()` skip such registry entries, and
   Sage ANSWER_RULES 6 stops storing them.
2. `deferredQuestions(key)`: questions he parked in a chat (numbered replies pair
   with numbered questions), with the characters he named ("dwarf can ask me
   again later"; none named = Elf and Dwarf). One drops off once a target
   character has replied after the deferral (it saw the reminder).
3. run-character.mjs appends `deferredBlock()` to the named character's next
   prompt (not help jobs, not the Sage): "ask it ONCE if your task needs it".
4. `GET /api/pipeline/tickets/[key]` returns `parkedQuestions`; `nextStep()` lists them in `also`.

### 9.16 Code data stays in code; pasted-page URL hints

1. Sage KNOWLEDGE_RULES 11: corrections to data held in code (lib/eautoFlows,
   lib/ticketStudies.ts, other .ts) go to improvements ("Code data fix: <file:line> …"),
   never into knowledge/ (one source of truth per fact, `[charmain-repo: docs/qa-principles.md:18]`).
2. `POST /api/pipeline/chat` saving a pasted HTML page: the capture header now lists
   the page's own paths (form actions, canonical, base, first links; row ids as
   `<id>`, hosts dropped) and marks eSIM pages "no environment", so the capture can
   be checked later (AGENTS.md save-every-page rule; `[charmain-repo: docs/qa-principles.md:31-39]`).

### 9.17 Selector trace — `scripts/pipeline/lib/selector-trace.mjs`

"A selector that cannot be traced to observed markup" `[charmain-repo: .claude/agents/spec-reviewer.md:40]`;
"A locator you did not observe may not be written" `[charmain-repo: .claude/skills/spec-author/SKILL.md:87]`.
1. The suite check (§9.1) now also lists, as **minor** (never failing), the `#id`,
   `[name=…]` and visible-text selectors in the suite's own pages/ and tests/ that
   appear in no saved capture (_reference/html/**), no file of this ticket's
   Studying / ticket folder (mock-ups and their text copies), and no other
   scripts/eauto-*/pages file. Files copied unchanged from a working suite are skipped.
   Result: `selectors {checked, untraced[]}` in suite-check.json.
2. AUTOMATION_LESSONS 14 (confirm every submit by the page's own words) and 15
   (each page-object method names its markup source in a one-line comment).

### 9.18 Observed basis is a question — scenario lint

`lintScenarios()` (§9.2) adds `observed-basis`: a TS whose basis is only today's
screen or code ("observed on staging", "current behaviour", "the JSP") and names
no requirement source (SRD / REQ / Jira / official TS / mock-up / his answer).
Fixable: the automatic Elf fix moves it to "## Open points" or cites a source.
`[charmain-repo: docs/writing-tests.md:107-124]` (code / obs never gate),
`[charmain-repo: docs/qa-principles.md:168-181]` (principle 17).

### 9.19 Reply rules

1. STYLE_RULES 8: first line is the answer (yes / no first); never end with a
   command for him to run `[charmain-repo: docs/replying.md:59-60]`.
2. elf:findings reply ends with "Next:" — ONE concrete step and who does it
   `[charmain-repo: docs/replying.md:36-45]`.

### 9.20 Automation lessons 16-19

AUTOMATION_LESSONS (§9.4) gains: check the host before typing a password
`[charmain-repo: docs/qa-principles.md:84-95]`; a test value needs a failing branch
(choose it against the record's current value) `[charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:131-137]`;
never pass a step that was not reached `[charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:77-83]`;
check the environment before the long part `[charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:85]`.

### 9.21 Self-test — `scripts/pipeline/tools/selftest.mjs`

Run after ANY change under scripts/pipeline/, lib/pipeline/ or app/api/pipeline/:
`node scripts/pipeline/tools/selftest.mjs [--jobs]` (exit 1 on any failure).
1. `node --check` and a real import of every pipeline module (run-character,
   fetch, miro, selftest: syntax only).
2. eslint on the pipeline folders, plus a `no-undef` pass on the `.mjs` files with
   Node globals (the repo config leaves no-undef off; a regex like `/**/g` is an
   empty comment and imports fine, then throws "g is not defined" when called).
3. Smoke: nextStep / openQuestions / deferredQuestions on every real ticket (read
   only), lint / triage / deferral helpers on samples.
4. `--jobs`: a PIPETEST-990099 fixture and `run-character.mjs --dry` of elf:plan,
   elf:chat, dwarf:build, dwarf:chat, scout:issue, scout:chat, scribe:chat,
   elf:findings, sage:chat; the fixture is deleted afterwards.
Idea: "do not rely on this principle to remind you of itself … move it into a
hook, a gate, or a reviewer's reject row" `[charmain-repo: docs/qa-principles.md:150-156]`.

### 9.22 TS priority P1 / P2 / P3

1. `PipelineScenario.priority?` ("P1" | "P2" | "P3"); validateScenarios rejects
   other values, accepts none (older lists). Elf's self-review rule 10: P1 = money,
   ownership / record transfer, visibility to a role or company that must not see
   it, approval bypass, unrecallable submission; P2 = the main rule otherwise;
   P3 = wording / layout. scenarios.md shows **Priority**; lint notes a missing one
   (not fixable, note only).
2. AUTOMATION_LESSONS 20: Dwarf tags each test `{ tag: ["@P1"] }`; the title stays "<id>: <title>".
Sources: `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:77]`, `[charmain-repo: .claude/skills/spec-author/SKILL.md:73-75]`.
3. Regression gaps (round 25): Elf lists unchanged behaviour that could break
   under "## Regression gaps" R1, R2 … (with the past TS that covers it, or "no
   TS"), never as TS `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:80]`.

### 9.23 QA-Issue draft check — `lintDraft()` in lib/qa-issue.mjs

scout:issue finish() checks Scout's draft and posts advisory notes in Scout's
chat (`Finding.draftWarnings`; the Raise is never blocked): a Staging Test ID
that is not in the finding / run context (an invented ID; an earlier draft is
not counted as evidence), a title with IDs / URLs, an Actual over 12 words, no
!!red!! / ++green++ marks, an Expected with no SRD / TS source, steps outside 3-5.
Sources: `[charmain-repo: docs/replying.md:53,57]`; Faizuddin's QA-Issue rules
(memory "QA-Issue tickets short", eauto-qa-issue-ticket skill).

### 9.24 Verbatim quotes in findings — `scripts/pipeline/lib/quote-check.mjs`

elf:findings finish(): each sentence (3+ words) of the finding's TS quote must be
in the TS text the run gave Elf, else the TS text itself replaces it
(`quoteCheck.ts = false`); the SRD quote is checked against the SRD's text copy
(`<SRD>-text.md`), and a miss is flagged (`quoteCheck.srd = false`) and shown on
the findings page ("not found word for word … check it"). Case, spacing,
punctuation and ** ++ !! marks are ignored; "…" splits a quote.
`[charmain-repo: .claude/agents/qa-runner.md:58]` (verbatim, never compose); STYLE_RULES 4.

### 9.25 Quote audit (tool) — `scripts/pipeline/lib/quote-audit.mjs`

`node scripts/pipeline/lib/quote-audit.mjs <KEY> <repo-relative .md>` lists the
quoted passages (4+ words) of a study / related history / scenarios.md that
appear in none of the saved sources for the ticket (its Studying and ticket
folders, _reference/sharepoint, _reference/teams, _reference/miro, the markdown
of _reference/codebases, knowledge/, the ticket's chats, answers.json). Jira
summaries from live searches are skipped. A tool for review, not a hook: on
tonight's three related histories about 5% of quotes were unverified, most of
them the character's own words in quotation marks.
`[charmain-repo: docs/qa-principles.md:7-9]`, `[charmain-repo: .claude/agents/qa-runner.md:58]`.
STYLE_RULES 4 (round 30): quotation marks only for words copied exactly from a saved source.
AUTOMATION_LESSONS 21 (round 31): evidence for a permission TS shows who is logged in.
Answer registry (round 32): a short question repeated word for word (after stop words, 2+ words) matches too.

### 9.26 Triage in its own conversation — run-character.mjs `SESSION_SLOT`

elf:findings resumes `characters.elf.triageSessionId` (created on its first run),
not the conversation in which Elf wrote the scenarios. Follow-ups stay in that
conversation: another character's answer or the Sage's answer to a findings job
(`input.askJobId`, now also set by the Sage's auto-answer), and Faizuddin's chat
reply while Elf waits after a findings job. Help jobs and everything else use
`sessionId` as before. Jobs record `sessionSlot` when it is not the main one.
"What a red MEANS … fresh context — never the session that watched the run"
`[charmain-repo: .claude/agents/qa.md:92]`; `[charmain-repo: .claude/agents/qa-runner.md:16-19]`.
Unit tests (round 39): `node scripts/pipeline/tools/unit-tests.mjs` (14 tests of tonight's
helpers, each with a must-fail and a must-pass case; a PIPETEST-9902xx fixture is
created and deleted). selftest.mjs runs them every time.
Round 40: elf:findings opens its reply with "Run by priority: P1 x/y passed (failed: …)".
Round 41: ASK_RULES 4 "Carry on where you can" (assume minor readings as [unconfirmed: assumed …], never inputs / strings / logins / expected results); TS_RULES 9 roles, never logins.

## 10. Runner contract and the ticket page's Automation panel (2026-10-28)

Faizuddin, 2026-10-27: "once the automation is created, the dwarf should also build a page for it in the ticket page, for me to track the automation, and to run it".

1. **Runner component.** For every suite the pipeline's Dwarf builds, the runner UI lives in `app/eauto/<digits>/Runner.tsx` ("use client", default export, props `RunnerProps = { embedded?: boolean; pick?: string[] }`). `embedded` hides the page header and back link and fits a panel; `pick` holds scenarios.json ids and ticks exactly those TS each time it changes. SCENARIOS are listed P1 first. `app/eauto/<digits>/page.tsx` only renders `<Runner />`.
2. **Registry.** `lib/pipeline/runnerRegistry.ts` → `RUNNERS[KEY] = { runKey, page, load: () => import("@/app/eauto/<digits>/Runner") }`, one line per suite (Dwarf adds it; the line shape is `registryLine()` in `actions/_dwarf-common.mjs`).
3. **Prompts.** `runnerContractRules(key)` (`_dwarf-common.mjs`) is in the dwarf:build and dwarf:sync tasks; AUTOMATION_RULES 11 carries the short form for every Dwarf job.
4. **Check.** dwarf:build / dwarf:sync `finish()` call `runnerAfterDwarf()`: `runnerContractProblems()` checks Runner.tsx (exists, default export, uses `embedded`, uses the RUN_KEY), page.tsx renders `./Runner`, and the registry line matches. Advisory: problems go to Dwarf's chat and the ticket's events; `files.runner` is set when Runner.tsx exists. `files.runnerPage` and `runKey` are set as before.
5. **Panel.** `components/pipeline/AutomationPanel.tsx`, after the Dwarf panel in `/pipeline/<KEY>`:
   1. Tracking strip from `GET /api/pipeline/automation?key=`: per TS the latest status (Pass / Fail / In Progress / Not run) from the saved runs (`data/pipeline/runs/<KEY>/`) and the official-sheet sync log (test writes and dry runs left out), whichever is newer; voided runs and voided TS are ignored and shown grey; last run, last sheet update, open findings, and each TS's assertion plan (`data/pipeline/work/<KEY>/assertion-plan.json`).
   2. Registry entry → the runner itself, embedded with `next/dynamic` (`ssr: false`), plus "P1 tests first", "Failed only" and "All" buttons that set `pick`. The panel and `/eauto/<digits>` use the same useBackgroundRuns key, so a run shows on both; PipelineRunWatcher still saves runs and syncs the sheet.
   3. No registry entry but `files.runnerPage`, or a suite listed for the key in `lib/ticketAutomations.ts` (made outside the pipeline: 12107, 12153, 12166, 12257, 12412, jomcheck …) → the strip and an "Open runner page" button. Those suites are never converted.
   4. Nothing yet → "No automation yet. Dwarf builds the automation after your green light."

## 11. Requirement changes flow on (2026-10-28)

Faizuddin, 2026-10-28: "if i update a requirement during the process, the other agents will also get updated and update the things from their ends immediately".

1. **Scout / Scribe → Elf.** `scout:chat` and `scribe:chat` hash the study, related history and brief.json in `prepare()` (`snapshotRequirements`, `lib/requirement-change.mjs`). In `finish()`, `passRequirementChange` queues `elf:chat` with `input { requirementChange, by, changed[] }` when one of them changed and Elf already has scenarios.json. A queued re-check is not queued twice; Elf's chat shows a system line.
2. **Elf re-check.** `requirementChangeTask()` is the task: read the changed files, change only the TS the requirement change affects, leave the files untouched when nothing is affected.
3. **Elf → Dwarf + workbook.** After approval, a scenario change (from Faizuddin's chat or the re-check) queues `dwarf:sync` (as before) and now also `elf:build` with `input.rebuild` (`finishScenarios`, `_elf-common.mjs`). The rebuilt workbook replaces the old one in `_reference/tickets/<KEY>/`; the old one is kept as "(superseded vN)". The official SharePoint TS is never written.
4. Jobs of one character run one at a time per ticket, so a rebuild waits for Elf's chat to finish.
5. Unit test: "requirement change: …" in `tools/unit-tests.mjs`.
