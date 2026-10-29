# Charmain's QA repo (`eauto_qa_gpt`) — workflow, rules, agents, tools

Read-only clone at `_reference/codebases/eauto-qa-charmain/`. **Never edit or run anything there.** This file distils its process layer (docs, agents, skills, CLI tools) so we can reuse ideas without rediscovering them.

Source tag format: `[charmain-repo: <path>:<line>]`. Every fact below was read from the clone on 2026-10-27; nothing was run. Anything about runtime behaviour is `[unconfirmed]` unless the repo itself records a measurement.

## 1. What the repo is

1. **Name:** `eauto_qa_gpt` (npm package `eauto-qa-gpt`). GitHub `modefair/eauto-qa-gpt`.
2. **Branch / commit:** `consolidate-charmain`, `0ab45d1`, 2026-10-13, author Charmain, message "Record that row 4 cannot be a keep-as-is, and why". Authors in history: Charmain, huixin-modefair, MF-Azfar, faizuddin-03.
3. **Purpose:** "QA automation for the eAuto platform: Playwright specs for the dealer (UCD), BackOffice, JPJ Hasil and AATF portals, and the workflow that turns a Jira ticket into approved scenarios and then into those specs." `[charmain-repo: README.md:3]`
4. **Product source** is a sibling checkout `../eauto_v2`, **read-only**: "a cause found in it is a finding to report". `[charmain-repo: CLAUDE.md:3]`
5. **Stack:** Playwright 1.55.0 + TypeScript, Node ≥ 20 `[charmain-repo: package.json]`; Python ≥ 3.10 venv (`textual<1`, `pyyaml`) for terminal boards and gates `[charmain-repo: pyproject.toml]`.
6. **Relation to our team repo:** our memory says CR/regression scripts consolidate into `modefair/eauto-qa-automation`; this repo is a **different** repo (`eauto-qa-gpt`) running its own phase-1 consolidation. Which one is the team target today is `[unconfirmed]`.
7. **Our own code is already registered there:** `intake/sources.yaml` row `faizuddin-insurance` — our `scripts/eauto-insurance` was migrated as `tools/insurance-quote-checker/`, status `done`; the hardcoded BO credential fallback in `data/users.ts` lines 14–15 was stripped in the move. `[charmain-repo: intake/sources.yaml, row faizuddin-insurance]`

## 2. Folder map

| Path | Holds |
|---|---|
| `tests/<env>/<slice>/<screen>/` | **specs**, environment first, then screen. env = `staging` / `production`; slice = `ucd` / `bo` / `jpj` / `aatf` |
| `src/` | fixtures, page objects, auth, shared components, screen prober |
| `tools/` | MyKad card-reader emulator (vendored from `../eauto_v2`), standalone tools (e.g. insurance-quote-checker) |
| `config/` | environments, personas, `assertions.yaml`, `evidence.yaml` — **no credentials** |
| `env/` | `env-default` committed and empty; `.<env>.env-local` gitignored = the only place a credential lives |
| `test-scenarios/<slug>/` | one folder per **subject**: ledger `.md`, `.assertions.yaml`, `.review.yaml`, `.answers.yaml` |
| `test-scenarios/{questions,defects,voided-runs}.yaml` | shared hand-kept records across subjects |
| `scripts/` | boards, gates, evidence tooling (Python) |
| `bin/` + `./qa` | human launchers: `review`, `status`, `questions`, hub |
| `intake/` | phase-1 consolidation of each QA's old scripts; deleted when every row is `done` |
| `docs/` | principles, workflow, layout, writing-tests, evidence, lessons, replying, `modules/`, `runbooks/`, `source-material/` (read-only SRDs/manuals) |
| `.claude/` | 8 agents, 8 skills |

`[charmain-repo: README.md:25-40]`

## 3. The workflow — two ways in, two human gates

1. **Subject** = a **module** (`UCD-APT`, `BO-DEREG`, lives forever) or a **ticket** (`EAINT-12345`, retires on delivery). Nothing else. `[charmain-repo: README.md:79-84]`
2. **Pipeline** `[charmain-repo: docs/workflow.md:19-37]`:

| # | Step | Owner | Output |
|---|---|---|---|
| 1 | **Intake** (ticket) or **Exploration** (untested module) | `ticket-intake` / `module-exploration` | ledger header: Requirement sources, Related, What changed, Impact; open questions |
| 2 | **Scenario ledger** | `scenario-ledger` + `scenario-reviewer` | `<slug>.md`, 0 drift |
| 3 | **GATE 1 (human):** is the coverage right? | `./bin/review s <subject>` | `<slug>.review.yaml` |
| 4 | **Assertion plan** — what each case asserts and what wrong outcome it must reject | `assertion-plan` | `<slug>.assertions.yaml` |
| 5 | **GATE 2 (human):** sign each block | `./bin/review <subject>` | `approved: "<who> <date>"` per block |
| 6 | Mechanical gate | `./bin/review --check` | 0 FAIL; a spec from an **unsigned block fails** |
| 7 | **Author spec** | `spec-author` + `spec-reviewer` | spec + page-object methods; typecheck + `--list` clean |
| 8 | **Run** (human asks) | `qa-runner` | `test-results/runs/<id>/results.json` |
| 9 | **Triage** reds | `qa-triage` | verdict per case, proposed `defects.yaml` row |
| 10 | **Evidence** record / upload | `test-evidence-recording` / `test-evidence-upload` | video + downloads in the CR OneDrive folder |

3. **Promotion:** ticket coverage that must outlast the CR is **copied** into the module ledger + spec (both gates again), and the ticket spec is marked `@status retired` — "copy, never move". `[charmain-repo: docs/layout.md:69-86]`
4. **Agent rules** `[charmain-repo: docs/workflow.md:105-111]`:
   1. "**An agent never spans a human gate.** It starts after one signature and stops at the next."
   2. "**Facts and judgement never share an agent.** A run agent that also sorts its own reds reports what it expected rather than what happened."
5. **Agent layers:** L0 router `qa` · L1 judgement `qa-explorer`, `qa-triage` · L2 workers `qa-author`, `qa-consolidator`, `scenario-reviewer`, `spec-reviewer` · L3 scripted `qa-runner`. `[charmain-repo: docs/workflow.md:112-118]`
6. **"What next?"** is never answered by eye: `scripts/qa-next.py --ticket <subject>` names one next action. `[charmain-repo: docs/workflow.md:6-17]`

## 4. Principles (`docs/qa-principles.md`, numbered, cited by agents)

| # | Principle (verbatim title) | Line |
|---|---|---|
| 1 | **Evidence over assertion** — every claim backed by a results path, `file:line`, ticket line or command output | 7 |
| 2 | **Traceability end-to-end** — requirement ↔ ledger ↔ assertion block ↔ spec ↔ run ↔ defect | 10 |
| 3 | **Reproducibility** | 12 |
| 4 | **Root cause over symptom** | 14 |
| 5 | **No silent failures** | 15 |
| 6 | **Change integrity** — touching one rule means checking all downstream references | 16 |
| 7 | **SSoT** — each rule lives in exactly one file | 18 |
| 8 | **Clarify, don't assume** — "Code you read tells you HOW to set a test up … It never tells you WHAT to test, what to skip, or what to expect." | 19 |
| 9 | **Assertions encode intent, never lowered to pass** | 23 |
| 10 | **Verify live before touching a field** — label, column, control, message confirmed on the live page | 31 |
| 11 | **Fixtures replicate the real contract — never shaped to force a green**: trivially-true, fixture-induced, vacuously env-dependent, stand-in data | 40 |
| 12 | **Verify at the boundary — never infer a selector, a URL, a flag, a label, or an import** | 60 |
| 13 | **Drive the product the way a user does — never construct a path to skip a step** | 80 |
| 14 | **Suspect YOUR OWN SCRIPT** before theorising about the product: silent return, unchecked press, non-unique scope key | 99 |
| 15 | **A lesson not written down will be paid for again** — write it before moving on, never into a private note | 132 |
| 16 | **Production is read-only** — `@destructive` grepped out of the production project | 158 |
| 17 | **Observed behaviour is a question, not a requirement** — `obs` never gates | 168 |

`[charmain-repo: docs/qa-principles.md:<line>]`

## 5. Writing rules

### 5a. Specs (`docs/writing-tests.md`, `docs/layout.md`, `docs/replying.md` Part 2)

1. **Path:** `tests/<env>/<slice>/<screen>/<slice>-<screen>[.<ticket>].<kind>.spec.ts`; **kind** `e2e` (journey, staging only) or `func` (one screen, one rule). `[charmain-repo: docs/layout.md:13-25]`
2. **Header block** on every spec: `@subject`, `@ledger … entries n`, `@plan`, `@env`, `@status draft|ready|retired`. Title starts with the **case id** so the JSON reporter joins runs to blocks. `[charmain-repo: docs/replying.md:121-148]`
3. **Tags:** exactly one `@P1..@P3`, one `@e2e|@func`; `@destructive` on any state change; `@readonly` only under production. `[charmain-repo: docs/replying.md:112-119]`
4. **Locators:** role/label first; table column by **header text, never index**; "**Never write a selector you have not seen.**" `[charmain-repo: docs/writing-tests.md:46-54]`
5. **Waiting:** no `waitForTimeout`; a swallowing `catch` must carry a short explicit timeout. `[charmain-repo: docs/writing-tests.md:56-61]`
6. **Failing:** "A helper that cannot find its control **throws, naming what it could not find**." `[charmain-repo: docs/writing-tests.md:63-67]`
7. **Reaching a screen:** "Log in where the login lives, then click. **Never construct a URL**"; `assertSafeToAuthenticate` before any password. One sanctioned exception: the eSerahan **thumbprint bypass** (`BYPASS_U<n>` env keys). `[charmain-repo: docs/writing-tests.md:69-98]`
8. **Assert what a user can see**, never a DB row or API response. `[charmain-repo: docs/writing-tests.md:173-175]`
9. **Playwright path filter is a regex**, not a glob: `"**/*.e2e.spec.ts"` runs zero tests and looks green. `[charmain-repo: docs/layout.md:40-43]`

### 5b. Ledger (scenario list) format (`test-scenarios/README.md`, `scenario-ledger` skill)

1. **Checklist line:** `- [x] **1** ★ EAINT-NNNNN-TS1 (REQ-001) — what the user sees`. Glyphs `[ ]` to write · `[x]` has spec · `[!]` blocked · `[~]` partial · `[-]` dropped. `★` = gates sign-off. `!` = expected to fail today. `[charmain-repo: test-scenarios/README.md:108-121]`
2. **Provenance tags** decide whether an entry may gate `[charmain-repo: docs/writing-tests.md:107-121]`:

| Tag | Source | Gates? |
|---|---|---|
| `REQ-00n` | ticket / SRD states it | yes |
| `doc` | team documentation states it | yes |
| `dim` | nothing states it; a coverage dimension demands it | yes |
| `code` | read from eAuto source | **never** → open question |
| `obs` | seen on screen, undocumented | **never** → open question |

3. **Ten coverage dimensions** per requirement: Positive, Negative, Exemptions, Boundaries, Enumerated variants, Independence, Exactly-once, Ordering/races, Aftermath, Roles & parties. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:46-63]`
4. **A scenario is a case, not an assertion** — same trigger + same setup = one entry with "Also assert:" lines. **Hard cap 40 entries**, split by flow/portal, never by priority. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:73-83]`
5. **Ticket scope vs regression:** unchanged behaviour with no spec → `R1, R2…` under *Regression gaps*; existing cases to re-run listed one id at a time in a machine-read yaml block. `[charmain-repo: test-scenarios/README.md:139-161]`
6. **Words the board reads as state** — never in prose: `BLOCKED`, `DEFERRED`, `DROPPED`, `PROPOSED-DROP`, `SUPERSEDED`, `FOLDED`. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:41-43]`

### 5c. Assertion plan block (`assertion-plan` skill)

1. One YAML block per case: `case`, `entry`, `priority`, `kind`, `requirement` (REQ id **and** clause), `situation`, `preconditions[{role, fixture}]`, `steps[{actor, action, page, expect[], wrong_outcomes[]}]`, `expected_to_fail`, `approved`. `[charmain-repo: .claude/skills/assertion-plan/SKILL.md:17-42]`
2. **`wrong_outcomes` REQUIRED on every step** — "each one a *plausibly broken build* — the pre-change behaviour, the neighbouring control, the other role's view. Must DIFFER from every `expect` row". `[charmain-repo: .claude/skills/assertion-plan/SKILL.md:108]`
3. **Assertion vocabulary** (5 shapes: `element`, `row`, `page`, `download`, `message`; 14 element states incl. `absent` vs `hidden`, `readonly` ≠ `disabled`, `value` ≠ text) generated from `config/assertions.yaml`. `[charmain-repo: docs/writing-tests.md:133-170]`
4. **`approved:` is never written by Claude.** `[charmain-repo: .claude/skills/assertion-plan/SKILL.md:110]`

### 5d. Replying (Claude output style in that repo, `docs/replying.md`)

1. **One numbered table per reply** — only the table the reader must answer. `[charmain-repo: docs/replying.md:9-20]`
2. **Every question in a table, one per row**; "Never ask what the evidence would tell you". `[charmain-repo: docs/replying.md:26-34]`
3. **Every issue in a four-column table:** Issue · Cause (with evidence) · Action needed · Action from who (never blank). `[charmain-repo: docs/replying.md:36-45]`
4. "**A correction states the corrected fact**"; "Never name a ticket, REQ, or rule by number alone". `[charmain-repo: docs/replying.md:55-56]`
5. **Git:** never change a branch without saying so; never `git stash` / `checkout .` / `restore` in a shared tree; never `git add -A`. `[charmain-repo: docs/replying.md:62-69]`

## 6. Lessons learned (verbatim, `docs/lessons.md`)

| # | Lesson (verbatim bold line) | Line |
|---|---|---|
| 1 | "**Dashboard popups are queued, not simultaneous.**" — sweep until a pass closes nothing; campaign selector needs `:visible` | 10 |
| 2 | "**A listing with a mandatory date range returns nothing without one.**" | 17 |
| 3 | "**Exported identifiers repeat.**" — 243 duplicated refs in one export; match on the whole field set | 22 |
| 4 | "**Repeated logins look like a wrong password.**" — shared instance throttles; wait, do not retry into lockout | 26 |
| 5 | "**Chrome 138+ blocks an HTTPS page from opening `ws://localhost`.**" — MyKad emulator needs `--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests` | 33 |
| 6 | "**Instances share a host and differ only by a path segment.**" — `sit2`, `uat1`, `preprod1`, production | 37 |
| 7 | "**Suspect your own script before theorising about the product.**" — 3 days lost; tells: 30 s step vs 7 s, step that changed nothing | 44 |
| 8 | "**A guessed URL sent QA credentials to production six times.**" | 50 |
| 9 | "**An assertion loose enough for a broken build to pass is not an assertion.**" — shipped in 14 cases | 53 |
| 10 | "**A `.catch(() => {})` still pays the full action timeout.**" | 58 |
| 11 | "**The key baked into the emulator is not inert.**" — treat as a working credential | 73 |
| 12 | "**Three environment causes look exactly like a broken reader**" — wrong key, company not in allowlist, Chrome local-network block | 78 |
| 13 | "**The card must be the logged-in dealer's.**" | 84 |
| 14 | "**Wait for "Verification Passed", not for "Scanning IC" to disappear.**" | 89 |
| 15 | "**Bundled Chromium fails the activation page's browser check**" — use `channel: "chrome"` | 92 |

`[charmain-repo: docs/lessons.md:<line>]`. The rig's own catalogue (~95 diagnosed failures) is `.claude/skills/test-evidence-recording/references/rig-lessons.md` (1,436 lines). Selected entries worth knowing:

1. "**A listing returns nothing at all**" — apply a mandatory date filter "**as a fallback, never unconditionally**"; forcing it everywhere dropped coverage 5/18 → 1/18. `[charmain-repo: .claude/skills/test-evidence-recording/references/rig-lessons.md:160-168]`
2. "**Empty-state messages counted as data rows**". `[… rig-lessons.md:179-185]`
3. "**A 2xx that is really a login page**" — unauthorised request answered by login page at HTTP 200; judge by **state (sentinel)**, not response. `[… rig-lessons.md:485-494]`
4. "**A negative that passes because nothing was there to check**" — assert the **denominator**; zero found = INCONCLUSIVE. `[… rig-lessons.md:513-517]`
5. "**A 404 counted as "access refused"**". `[… rig-lessons.md:519-523]`
6. "**"Not on screen" and "not available to this role" look identical**" — BO export link `<a id="to-export" style="display:none">` revealed only after a search returns rows. `[… rig-lessons.md:737-745]`
7. "**A control that is present, visible, and does nothing**" — two BO export controls on one build; record non-response as the result. `[… rig-lessons.md:747-755]`
8. "**Readonly datepickers swallow both obvious approaches**" — `datepicker('setDate', '19-06-2026')` misparsed to `12/02/2021` (widget format `mm/dd/yyyy`). `[… rig-lessons.md:757-765]` — see conflict C1.

## 7. Claude agents (`.claude/agents/`)

| Agent | Model | Purpose | Trigger | In → Out |
|---|---|---|---|---|
| `qa` | session | main-thread QA posture + router; never a subagent | `claude --agent qa` | any request → right lifecycle step |
| `qa-author` | inherit | ticket → ledger → plan → specs via 4 skills; stops twice for a human; never runs a test | "intake this ticket", "author the approved blocks" | EAINT key → ledger, plan, specs |
| `qa-explorer` | inherit | learn one untested module read-only; writes module map + proposed coverage | "explore the APT module" | module + docs → `docs/modules/…/README.md`, module ledger |
| `qa-consolidator` | inherit | inventory another QA's repo, one numbered keep/merge/rewrite/drop table, migrate approved rows only | "consolidate", "migrate", "import" | repo URL → `intake/reports/<qa>.md`, migrated specs |
| `qa-runner` | haiku | run one spec/grep/case on a project; report pass/fail, cause field **blank**; refuses `@destructive` on production | "run EAINT-12345-TS3 on staging" | project + grep → results.json path, per-case table |
| `qa-triage` | sonnet | fresh-context verdict per red: `defect` / `spec` / `environment` / `known` (or unresolved); proposes `defects.yaml` row | after a run with reds | results.json → verdict + evidence |
| `scenario-reviewer` | sonnet | adversarial ledger review: 10-dimension matrix, dev-view leakage, silent drops, proportionality | spawned by `scenario-ledger` | ledger + sources → findings (read-only) |
| `spec-reviewer` | sonnet | adversarial spec review against its signed block: 23 reject rows | spawned by `spec-author` | spec + block → MAY RUN / FIX FIRST / REJECT |

`[charmain-repo: .claude/agents/*.md frontmatter]`

## 8. Claude skills (`.claude/skills/`)

| Skill | Purpose | Trigger | In → Out |
|---|---|---|---|
| `ticket-intake` | fetch ticket fully (MCP, REST fallback), keep **Stated by the requestor** apart from **Investigated**, impact analysis in `../eauto_v2`, terminology, open questions | "intake EAINT-12345", Jira link | key → ledger header + `questions.yaml` rows |
| `module-exploration` | read provided docs, walk screens read-only per role, tag `doc` / `obs` / `dim` | "explore …", "we have no tests for …" | module → map + module ledger |
| `scenario-ledger` | write ledger: provenance, 10 dimensions, P1–P3, R# gaps, regression yaml, 40 cap, promotion | after intake/exploration | header → full ledger, 0 drift |
| `assertion-plan` | one block per kept entry with `wrong_outcomes`; run gate; STOP for sign-off | after gate 1 | ledger → `.assertions.yaml` |
| `spec-author` | one approved block → one spec; probe live page before every locator; STOP without running | "author TS3", "promote TS3" | block → spec + page-object methods |
| `test-evidence-recording` | one annotated full-screen video per scenario, yellow ring, captions, live checklist, sidecar `.txt`, before/after sweep | "record evidence", "run TS3 end to end" | scenario → `evidence/<TICKET>/{video,export,manifest.json}` |
| `test-evidence-upload` | find pre-created CR folder in the OneDrive library, pick evidence, rename to `TS<n> - <Brief Title>`, copy + verify | "upload evidence", "where is the CR folder" | CR dir → files in library |
| `script-consolidation` | phase-1 translation of a legacy repo; never copy a credential; never migrate an unanswered row | via `qa-consolidator` | repo → decision table → migrated specs |

`[charmain-repo: .claude/skills/*/SKILL.md frontmatter]`

## 9. CLI tools

### 9a. Human launchers (`bin/`, `./qa`)

| Command | Does |
|---|---|
| `./qa [subject]` | TUI hub; pick subject once with `t`; rows: n What next, Q Questions, O Its questions, x Explore, b Probe, s Scenarios, a Assertions, k Gate, l Ledger figures, c Its specs, p/P Progress, r Run, e Evidence, i Intake |
| `./bin/review s <subject>` | scenario board — verdicts ok / wrong / missing / drop → `.review.yaml`; ledger never edited |
| `./bin/review <subject>` | assertion board — fills `approved:` per block |
| `./bin/review --check [subject]` | gate, no UI (`--strict` in CI) |
| `./bin/status [--text\|--ticket\|--drift\|--json]` | live progress board; writes nothing |
| `./bin/questions [brief\|add\|check …]` | chat-raised questions record; every verb appends, nothing deleted |

### 9b. Scripts (`scripts/`, Python 3.12 venv)

| Script | Does |
|---|---|
| `subjects.py` | single definition of a subject id (module or ticket) |
| `ledger.py` | parse a ledger; `--extract` prints figures, exit 1 on checklist-vs-prose **drift** |
| `case_index.py` | index every spec by case id from headers |
| `assertion_schema.py` | loads `config/assertions.yaml`; `--docs` prints the table; `--check` fails stale copies |
| `assertion-plan-check.py` | the gate behind `./bin/review --check` |
| `assertion-review-tui.py`, `scenario-review-tui.py`, `review_core.py`, `review_lib.py` | the two sign-off boards and shared verdict logic |
| `test-status.py`, `test-status-tui.py` | progress derived from run results → specs → ledgers, "never from prose claims" |
| `qa-next.py` | one next action per subject |
| `questions.py`, `questions-tui.py`, `ledger_questions.py`, `ticket-questions-tui.py` | global and per-subject question records |
| `module_map.py` | scaffold/check module maps; fails an `obs` entry marked ★ |
| `intake_inventory.py` | regex inventory of a legacy Playwright repo: tests, tags, personas, red flags (waitForTimeout, secrets, hostnames), proposed destination |
| `qa-hub-tui.py` | the `./qa` hub |
| `bootstrap.sh` | create `.venv` (uv preferred) |
| `lesson-reminder-hook.sh` | PostToolUse hook: after a commit touching `tests/`, `src/`, `scripts/` or agent/skill files, asks whether a lesson is owed |
| `sync-mykad-emulator.sh` | check vendored emulator is byte-identical to `../eauto_v2` |
| `evidence/find_cr_folder.py` | locate the CR folder by ticket number (emoji, truncation, multi-ticket names) |
| `evidence/build_plan.py` | `--audit` gaps, `--emit-titles`, `--titles … --dest` → `plan.json`; fails on collisions / illegal chars / long titles |
| `evidence/upload.py` | dry run → `--apply` (resumable, `\\?\` long paths) → `--verify` (Office files compared part by part) |
| `evidence/probe_office_compare.py` | negative controls proving the Office comparator still refuses tampering |

`[charmain-repo: bin/*, qa, scripts/*.py docstrings]`

### 9c. Shared records (hand-kept, `test-scenarios/`)

1. **`defects.yaml`** — states: `raised to dev`, `pending confirmation`, `false alarm`, `resolved`, `deferred`. A failing case with no row shows as **UNTRIAGED**. "TRIAGE FROM THE LATEST RUN, NEVER FROM A REPORT." `[charmain-repo: test-scenarios/defects.yaml:1-30]`
2. **`voided-runs.yaml`** — a run made against the wrong build/branch/env "is evidence of nothing"; output stays on disk; voiding is a **human** call, "Never void a run to make a red go away." `[charmain-repo: test-scenarios/voided-runs.yaml:1-25]`
3. **`questions.yaml`** — id `Q-YYYY-MM-DD-NN`, kind question/task, status open/answered/deferred/closed/superseded, owner user/requestor/dev/claude. `[charmain-repo: test-scenarios/questions.yaml:1-30]`
4. **`docs/published-pages.yaml`** — registry of every claude.ai Artifact the repo points at: url, share link, sources, `generator` or `none` (= dated snapshot), archive copy. "a published page is a VIEW. The repo is the source." `[charmain-repo: docs/published-pages.yaml:1-24]`

## 10. Team-wide facts found in this slice

1. **Evidence library** (QA Team OneDrive): `<root>\eAuto Project\eAuto - Test Evidence\` with `1. Enhancement CR`, `2. Staging Regression` (by date), `3. Production Regression` (by deployment date). Other products: FWI, MyInspector, Secarang & CIBO. `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:15-24]`
2. **CR evidence folders are pre-created by someone else**; match by ticket number, not title (truncated, emoji, stray spaces, multi-ticket folders). If it already has files, stop. `[… test-evidence-upload/SKILL.md:26-40]`
3. **Upload only video + downloaded artefacts**; never `_run-summary.txt` (stale). `[… test-evidence-upload/SKILL.md:43-60]`
4. **Download filename ruling (Charmain, 01-09-2026, EAINT-11982):** "just put the ts no if there are same filetype, just put TS1 - 1, TS1 - 2 like this. i need the filename as short as possible cus will hit error in the future if we put long filename" `[… test-evidence-upload/SKILL.md:131-134]`. Older rule (EAINT-11073): keep the browser's original name. "Which rule applies is the user's call per CR."
5. **SharePoint rewrites every uploaded Office file** (adds `customXml/`, `docProps/custom.xml`); a 4,678-byte workbook came back 13,782 bytes, sheet data identical. Do not treat a size/hash change as corruption. `[… test-evidence-upload/SKILL.md:204-209]`
6. **Path limits:** aim ≤ 325 chars (corpus max), SharePoint ceiling ~400; 260 is not reachable. `[… test-evidence-upload/SKILL.md:147-174]`
7. **Environments:** `sit2`, `uat1`, `preprod1` and production share one host, differ by path segment. `[charmain-repo: docs/lessons.md:37-40]`
8. **Charmain's other sources** registered for consolidation (useful for us): `tools/macrokiosk-fixtures` — eSTM / insurance / STMS **test-data creation** flows ("probably the single most reusable thing here"); `by-module/backoffice-audit` — "THE ONLY AATF AUTOMATION ON THE TEAM"; `by-ticket/eaint-639-jpj-monthly-report` — Python xlsx-vs-SRD checker; `tools/payment-breakdown-report` — report comparison. These live in `modefair/eauto-qa-charmain`, **not** in this clone. `[charmain-repo: intake/sources.yaml]`

## 11. What we can reuse here

| # | Item | Where it fits in our repo |
|---|---|---|
| 1 | **Ten coverage dimensions** checklist | `knowledge/test-design-techniques.md` (added); `draft-TS-excel` skill scope step |
| 2 | **`wrong_outcomes` per check** — name the plausibly broken build each expected result must reject | `draft-TS-excel` review step; `eauto-automation-scaffold` assertion rule |
| 3 | **Stated vs Investigated** split in ticket studies | `jira-ticket-study` skill output; `lib/ticketStudies.ts` fields |
| 4 | **Provenance `code`/`obs` never gate** | `knowledge/flows.md` (DOM seen live is `obs` for behaviour); TS drafting |
| 5 | **`qa-runner` / `qa-triage` split** with 4 verdicts (defect / spec / environment / known) | `run-findings-page` skill: add a verdict column per failure |
| 6 | **`spec-reviewer` reject list** (23 rows) | new `.claude/agents/spec-reviewer.md` or a checklist inside `eauto-automation-scaffold` |
| 7 | **`defects.yaml` / `voided-runs.yaml` / `questions.yaml` formats** | `data/` records behind the dashboard; voided runs for "wrong branch" reds |
| 8 | **Lesson-reminder PostToolUse hook** | `.claude/settings.json` via `update-config` skill, pointing at `knowledge/quirks.md` |
| 9 | **`assertSafeToAuthenticate()` host guard** before typing a password | shared BasePage in `scripts/eauto-*` and `tests/service-hub` |
| 10 | **Evidence upload tooling** (`find_cr_folder`, collision-checked plan, Office part-by-part verify) | our SharePoint/OneDrive evidence step; `knowledge/automation-testing.md` evidence section |
| 11 | **Evidence rules:** failing branch, before-and-after sweep, never tick an uncaptured point, sidecar is the evidence | `knowledge/data-verification-standard.md`; `captureIssue()` red-box flow |
| 12 | **`published-pages.yaml`** Artifact registry (view vs source, snapshot archive) | `_reference/` or `data/` index of our published Artifacts |
| 13 | **Rig lessons on BO listings** (hidden export link, dead export control, empty-state row, denominator) | `knowledge/quirks.md` / `flow-bo-shell.md` after live check |
| 14 | **MacroKiosk fixture flows** (eSTM / insurance / STMS creation) | compare with `scripts/eauto-estm`; outside this clone `[unconfirmed]` |

## 12. Conflicts with our existing knowledge

| # | Charmain repo says | We say | Status |
|---|---|---|---|
| C1 | Readonly datepicker: drive with `$(el).datepicker('setDate', d)` Date object; fall back to clearing `readonly` `[… rig-lessons.md:761-763]` | "Never `.fill()` a readonly date field, never `datepicker('setDate')`" `[knowledge/automation-playbook.md:177]`; act like a person, no readonly stripping (memory) | **Ours stands**; their method is injection |
| C2 | Evidence folder `TS<n>` "**no zero-padding** (`TS9`, not `TS09`)" `[… test-evidence-upload/SKILL.md:115]` | `TS01`, never `TS1` `[knowledge/test-scripts.md:412]` | **Ours stands** for Faizuddin's work; library precedent differs |
| C3 | "Never construct a URL to reach a screen" (one exception: thumbprint bypass) | `BasePage.goto(path)` in `tests/service-hub`; eSTM URL-path bypass `[knowledge/flow-estm.md:22]` | Bypass agrees; direct `goto(path)` for screens is a gap to review |
| C4 | Helper that cannot find its control **throws** | "Assertions record, they never throw" `[knowledge/data-verification-standard.md:45]` | **Compatible**: theirs is navigation helpers, ours is data checks |
| C5 | Evidence goes to the **QA Team** OneDrive library `eAuto - Test Evidence` | Faizuddin's "my SharePoint" = personal OneDrive `eAuto Documents\EAINT-XXXXX`, never the QA Team site (memory, 2026-10-21) | Different target per user; keep ours |
| C6 | Consolidation target repo `eauto-qa-gpt` | `eauto-qa-automation`, `consolidate` branch `[knowledge/qa-team-process.md:132-134]` | `[unconfirmed]` which is current |
