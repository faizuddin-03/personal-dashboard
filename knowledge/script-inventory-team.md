# Team script inventory — who has which automation, where, and what we can reuse

Built 2026-10-27 from the intake reports in a read-only clone of Charmain's QA
consolidation repo: `_reference/codebases/eauto-qa-charmain/` (branch
`consolidate-charmain` of `github.com/modefair/eauto-qa-gpt`, commit `0ab45d1`,
last commit 2026-10-13). **Never edit or run anything in that folder.**

Tag used here: `[charmain-repo: <path>:<line>]`, path relative to that clone.
Most paths are under `intake/reports/` (inventory and migration reports) or
`intake/sources.yaml` / `intake/briefs/charmain.md` (registry and brief).

What these reports are: static inventories made by `scripts/intake_inventory.py`
over each QA's script folder — file list, `describe()` / `test()` titles, flags,
hostnames. They do **not** hold run results. A test title is a tested
expectation, not verified system behaviour. `[charmain-repo: intake/reports/azfar.md:4]`
"Nothing here is a decision."

## 1. The consolidation effort in one paragraph

1. Goal: push each QA's CR / regression scripts into one team repo, sorted by
   slice (UCD / BO / JPJ / AATF), with personas instead of hard-coded logins.
   See memory note "QA repo consolidation directive" (2026-09-18).
2. Status ladder per source: "registered → inventoried → decisions-pending →
   migrating → done". `[charmain-repo: intake/sources.yaml:20-25]`
3. Gate: "Where a row says **re-author**, nothing reaches `tests/` before the
   subject has a ledger signed on `./bin/review s` and a signed assertion block
   per case." `[charmain-repo: intake/reports/charmain-decisions.md:12-13]`
4. The target repo runs TypeScript specs only: "`playwright.config.ts` matches
   `**/*.@(e2e|func).spec.ts` ... A `.spec.js` file is never collected."
   `[charmain-repo: intake/reports/charmain-12131-migration.md:47-49]` So every
   JavaScript source (11982, 12131, 12155, shopping cart) is a rewrite, not a move.
5. Tools that are not tests go to `tools/<name>/` (standalone, own
   `playwright.config.ts`, outside the gates). Precedent: our own
   `insurance-quote-checker` and the vendored `mykad-reader-emulator`.
   `[charmain-repo: intake/reports/faizuddin-insurance-migration.md:9-17]`

## 2. Inventory by person

### 2a. Charmain (Senior QA) — `modefair/eauto-qa-charmain`

Brief drafted 2026-10-13 from commit `4a9f86b`. "All written for eAuto CRs
between April and September 2026. Nothing copied from the shared legacy repo."
`[charmain-repo: intake/briefs/charmain.md:3-4, 30]`

| # | Source (report) | Ticket / module | Folder on her PC | Size | Status | Verdict |
|---|---|---|---|---|---|---|
| 1 | `charmain-11982` | EAINT-11982 Application expiry Extend (BO + UCD) | `by-ticket/eaint-11982-application-expiry-extension` | 23 files, 25 describes, 107 tests (JSON); brief says 440 cases, 334 assertions | inventoried | **re-author** (row 1) |
| 2 | `charmain-12054` | EAINT-12054 STMS SSM bulk payment checking (UCD + BO) | `by-ticket/eaint-12054-stms-bulk-payment` | 74 files, 103 tests; 4 functional specs, 26 data-prep tools, 38 probes | inventoried | **re-author, not keep-as-is** (row 3) |
| 3 | `charmain-12131` | EAINT-12131 Special Remark on BDP/SI (BO) | `by-ticket/eaint-12131-special-remark` | 4 files, 42 tests | migrating | rows 1-2 drop, 3 rewrite, 4 keep → blocked |
| 4 | `charmain-12155` | EAINT-12155 12-character password (UCD, BO, AATF, bank) | `by-ticket/eaint-12155-password-complexity` | 18 files, 62 tests, all probes / recorder | inventoried | ledger, not spec (row 7) |
| 5 | `charmain-104` | EAINT-104 STMS LKM Refund (UCD + BO) | `by-ticket/eaint-104-lkm-refund` | 36 asserting scripts (of 334 files); no Playwright spec | inventoried | ledger, not spec (row 7) |
| 6 | `charmain-639` | EAINT-639 JPJ monthly report verification | `by-ticket/eaint-639-jpj-monthly-report` | 11 Python files incl. 2 pytest | inventoried | needs a home for non-browser checks |
| 7 | `charmain-shopping-cart` | EAINT-10960 Software Installation + EAINT-11880 BDP | `by-module/shopping-cart-si-bdp` | 247 scenario rows (114 bdp-e2e, 99 si-e2e, 20 bdp-prc, 14 si-prc) + 4,424-line lib | inventoried | rewrite only |
| 8 | `charmain-backoffice-audit` | BO audit-trail concurrency (11 modules incl. AATF) | `by-module/backoffice-audit` | 13 files, 24 unit tests | inventoried | no ledger; harness is a tools/ candidate |
| 9 | `charmain-bo-audit-v1` | First version of #8 | `by-module/backoffice-audit-v1` | 5 files | inventoried | "Expect most rows to be drop" |
| 10 | `charmain-macrokiosk` | Test-data creators: eSTM, insurance, STMS, Secarang, CIBO | `tools/macrokiosk-fixtures` | 29 files | inventoried | tools/ candidate |
| 11 | `charmain-lhdn` | EAINT-12126 LHDN e-Invoice | `by-ticket/eaint-12126-lhdn` | 26 .mjs files | inventoried | no ledger |
| 12 | `charmain-payment-breakdown` | Payment Breakdown Report comparison tool | `tools/payment-breakdown-report` | 20 files | inventoried | tools/ candidate |
| 13 | `charmain-compare-text-1` / `-2` | Figma-vs-page text comparison, v1 and v2 | `tools/compare-text-1`, `tools/compare-text-2` | 2 + 1 files | inventoried | keep one, drop one |
| 14 | `charmain-files-compare` | Side-by-side file diff | `tools/files-compare` | 1 file | inventoried | "almost certainly a drop" |
| 15 | `charmain-12175` | EAINT-12175 Lonpac insurer name (Secarang + eAuto) | `by-ticket/eaint-12175-lonpac-insurer-name` | 21 files, 9 tests | inventoried | no ledger |
| 16 | `charmain-8622` | EAINT-8622 New BRN for JPJ Enquiry / Final Submission | `by-ticket/eaint-8622-new-brn-jpj` | 10 .cjs scripts | inventoried | no ledger |

Sources: `[charmain-repo: intake/sources.yaml:58-240]` and the summary block
(lines 6-22) of each `intake/reports/<source>.md`.

Facts about her setup worth knowing before reusing anything:
1. "Hostnames are hardcoded in 399 places." `[charmain-repo: intake/briefs/charmain.md:191]`
2. "No spec carries a P-tag." `[charmain-repo: intake/briefs/charmain.md:109]`
3. Playwright versions differ per folder; `backoffice-audit` depends on
   "`file:../Compare Text 2/node_modules/playwright`, a path that only resolves
   on my machine". `[charmain-repo: intake/briefs/charmain.md:34-40]`
4. Shopping Cart "runs on the raw `playwright` library through a custom
   `Harness` class ... 702 `h.step()` calls and **zero `expect()`**."
   `[charmain-repo: intake/briefs/charmain.md:194-196]`
5. Last-run dates are guesses from folder names: 12054 ≈ 2026-08-12, 11982 ≈
   2026-08-28, 12155 ≈ 2026-09-06; `backoffice-audit` ran on UAT3; production
   "Believed never run". `[charmain-repo: intake/briefs/charmain.md:60-66]`
6. 12175 "Ran against UAT4 as well as staging, which no other source here does."
   `[charmain-repo: intake/sources.yaml:228]`
7. Data she depends on: `.env` application numbers in 11982 ("Several are
   probably consumed by now"), MyKad emulator for 8 `backoffice-audit` files,
   Mailtrap for the SI/BDP suite, the `QA1215*` accounts at known password
   states, setup specs that must run first in 12054.
   `[charmain-repo: intake/briefs/charmain.md:125-141]`
8. Logins her scripts use (IDs only): UCD `ucdchar`, `ucdcharrrr2`; BO
   `BOChar`; AATF `aatfprochar`; plus `QA1215*` accounts for 12155.
   `[charmain-repo: intake/briefs/charmain.md:73-83]` `BOChar` is "a shared UAT
   account" whose role the 12131 spec switches and always restores.
   `[charmain-repo: intake/reports/charmain-12131-migration.md:32-35]`

### 2b. Azfar (QA) — `modefair/eauto-qa-azfar`, `automation/`

| File | What it covers | Status |
|---|---|---|
| `tests/staging/ucd/stms-wizard/ucd-stms-wizard.e2e.spec.ts` (4 tests) | STMS seller scan → JPJ transfer; thumbprint mismatch never unlocks Next | **migrated** 2026-09-21 as `UCD-STMS`, `@status draft` |
| `src/fixtures/mykad.ts` | MyKad emulator client | **merged** into the team fixture |
| `tests/staging/ucd/stms-jpj-check/ucd-stms-jpj-check.e2e.spec.ts` | "21 JPJ error-code cases, ~7% known flake" | deferred |
| `tests/staging/ucd/stms-payment/ucd-stms-payment.e2e.spec.ts` (P4) | RHB failure codes at STMS payment; "the success code still completes a transfer" | deferred |
| 8 probes in `tests/_explore/` | APT map / trigger, eSTM wizard dump, eSTM VEL000069E diverts to insurance, insurance module map, MyKad emulator, RHB DP branches, RHB failure codes | deferred |
| `src/fixtures/esim.ts` | JPJ / RHB simulator client | deferred |

Sources: `[charmain-repo: intake/reports/azfar.md:27-37]`
`[charmain-repo: intake/reports/azfar-migration.md:11-16, 42-53]`. His
knowledge base is out of the inventory's scope; our copy is
`_reference/codebases/eauto-qa-azfar`.

### 2c. Faizuddin (us) — `faizuddin-03/personal-dashboard`

| Source | Report | Status in the team repo | Matches this repo? |
|---|---|---|---|
| `scripts/eauto-insurance` (1 spec: `tests/insurance-checker.spec.ts`, "eAuto Insurance Quote Checker") | `faizuddin-insurance.md`, `-migration.md` | **done** — migrated 2026-09-23 to `tools/insurance-quote-checker/` | Yes for logic. Checked 2026-10-27 by diff: `pages/*.ts`, `utils/batch.ts`, `data/types.ts` identical; `utils/excel.ts`, `data/config.ts`, the spec differ in comments only (ours mention the dashboard `/api/insurance/check` route). **Difference that matters:** the team copy removed the hard-coded fallback BO login; ours still has it at `scripts/eauto-insurance/data/users.ts:14-15`. |

1. Decision trail: "row 1 → drop; **reversed** the same day at the human's
   request — 'this is a tool other QA can use' — and migrated as a standalone
   tool instead of a spec." `[charmain-repo: intake/reports/faizuddin-insurance-migration.md:3]`
2. Changed in the move: "`data/users.ts` ... removed the hardcoded fallback BO
   username/password. `getUser('bo')` now throws a clear error naming the
   missing env var". `[charmain-repo: intake/reports/faizuddin-insurance-migration.md:13]`
3. Not copied: `input-vehicles.xlsx`, `output-results.xlsx` (run artefacts).
   `[charmain-repo: intake/reports/faizuddin-insurance-migration.md:19]`
4. The registry mentions a `faizuddin-edereg` source in the same repo ("Same
   source repo as faizuddin-edereg"), but it has **no** entry and no report.
   `[charmain-repo: intake/sources.yaml:56]` Presumably `scripts/eauto-edereg-precheck`
   `[unconfirmed]`. Our eDereg automation is therefore not in the team repo, and
   the registry's claim that `backoffice-audit` is "THE ONLY AATF AUTOMATION ON THE
   TEAM" (`sources.yaml:140`) does not count it. Conflict noted in `flow-edereg.md`.
5. Nothing else of ours (eSTM, eSIM, quotation reminder, 12107, 12153, 12257,
   JomCheck, service-hub) is registered as of commit `0ab45d1`.

### 2d. The shared legacy repo — `eautoAutomation-Playwright` (branch `staging/sit2`)

Owner: team (no single author). Status `registered`.
`[charmain-repo: intake/sources.yaml:28-36]`

1. Size: 239 spec files, 211 describes, 1,152 tests; 84 production, 140
   staging, 15 unknown; P1 166, P2 13, P3 8, untagged 52.
   `[charmain-repo: intake/reports/legacy-shared.md:10-18]`
2. Coverage by folder (spec counts, from the JSON):
   a. UCD eSTM E2E — 90 `ESTMUCDREG_*` + EAINT-5339 (8), EAINT-4323 (3), EAINT-4285 (1).
   b. UCD STMS E2E — 14 `STMSUCDREG_*` + EAINT-5147 (8) + EAINT-5431 (3) + Dermalog (1); UCD to UCD EAINT-5431 (3).
   c. Production BO search-and-filter — Account Management 9, Insurance 6, JPJ Reports 7, Settings 9, Settings Hub Admin 11, Support Tool 14, Transaction Relevant 8, eAuto Plus 2, Onboarding 1, Proforma Invoice 1.
   d. Production UCD 8, UCD AATF 2, JPJ Hasil 5, Login 1.
   e. Load tests — BO 8, UCD 5, UCD-AATF 1, JPJ Hasil 1.
   f. Staging BO — Reports 3 (incl. `SstPaymentReportJomCheck`), Support Tool 3, Onboarding 2; Update Password 1.
3. Login helpers used: `boLogin()` 185, `ucdE2ELogin()` 50,
   `ucdElkmPermE2ELogin()` 24, `ucdEvocPermE2ELogin()` 17,
   `ucdNoPermE2ELogin()` 14, `ucdLogin()` 12, `jpjLogin()` 6, `ucdSsmLogin()` 4,
   `aatfLogin()` 3, `boFinanceLogin()` 3, `ucdSsmEstmLogin()` 1.
   `[charmain-repo: intake/reports/legacy-shared.md:945-955]`
4. 202 specs collide on 18 destinations, so every spec needs a screen folder
   decided before it moves. `[charmain-repo: intake/reports/legacy-shared.md:269]`

## 3. Charmain's decision table — verbatim

`[charmain-repo: intake/reports/charmain-decisions.md:1-54]`

> # Decisions — charmain
>
> The one numbered decision table for `charmain-12054`, `charmain-11982` and
> `charmain-12131` (`intake/reports/charmain-*.md`), plus the other eAuto folders
> on the same PC that are not registered yet (EAINT-104, EAINT-12155,
> EAINT-12175, Shopping Cart, the Backoffice audit engine, MacroKiosk fixtures,
> EAINT-639).
>
> Rows 1, 2, 3, 7, 8 and 10 are answered. Rows 4, 5, 6 and 9 wait on the QA
> group chat: tools, knowledge, probes and evidence recorders.
>
> Where a row says **re-author**, nothing reaches `tests/` before the subject has
> a ledger signed on `./bin/review s` and a signed assertion block per case.
>
> ## The table
>
> Written 2 October 2026. "Tier A / B / C / D" refer to the push list the QA
> kept locally: A regression specs, B tools, C knowledge, D Claude skills.
>
> | # | Item | Verdict | Needs the chat? | Why |
> |---|---|---|---|---|
> | 1 | EAINT-11982 specs (Tier A, 21 `extend-*` files, JS) | **re-author** into a module subject, `@status draft` until signed | no, but Q4 sets the cost | All three CRs are Done, so a ticket ledger would retire on signing. 288 `.goto()` calls in 19 of 21 files break "log in and click". It needs a JS-to-TS rewrite and a ledger it has never had |
> | 2 | EAINT-12131 specs (Tier A, 2 files, JS) | **re-author**, same lane as row 1 | no, but Q4 sets the cost | 35 `.goto()` calls in both files. The authz spec is read-only `func` and the easiest first file |
> | 3 | EAINT-12054 specs (Tier A, 4 TS files) | **re-author, not keep-as-is.** The ledger is written: `UCD-STMS-BULK-PAYMENT`, pushed 2026-10-02 | no | Its Playwright projects `A_BYPASS` / `B_NO_BYPASS` / `C_COMPANY_OFF` do not exist here, so the specs would skip and report green. Map A and B to personas. C is a BackOffice setting. `04-regression` has 5 `TODO(capture)` markers. `scenario-registry.spec.ts` is replaced by the ledger: drop it |
> | 4 | Tools (Tier B, 8 rows, ~100 files) | **ask.** Proposed: in, under `tools/<name>/` | **yes** — May said no internal tools, but the repo took `tools/insurance-quote-checker` and PRs #10 and #11 | Tier B row 1 (STMS SSM fixtures) blocks 6 of the bulk payment ledger's entries |
> | 5 | Knowledge (Tier C, ~20 docs + memory notes) | **ask.** Proposed: in, per skill Step 2b | **yes** — same question as row 4 | The board now has a Knowledge page with its own export prompt, which suggests the answer is yes |
> | 6 | Probes and recon scripts (39 in the three sources) | **ask** | **yes** — `tests/_explore/` exists but `docs/layout.md` does not mention it | Azfar's 8 probes are stuck on the same question |
> | 7 | Ledger material: EAINT-104 (143 scenarios in `data/crs/EAINT-104.json`, 120 of them with a filmed case in `cases.ts`) and EAINT-12155 `scenarios.js` (157 numbered, 128 in scope) | **ledger, not spec.** Each goes to `test-scenarios/` under its module | no | They are data tables, already shaped like ledger entries. EAINT-12155 is Done. EAINT-104 is still awaiting production deployment, but `scripts/subjects.py` takes only 4 to 6 digit ticket ids, so `EAINT-104` cannot be a ticket subject and goes to a module either way |
> | 8 | Skills (Tier D) | **take the Tier D verdicts.** Never `eauto-credentials` | no, except the three "ask" skills | `ba-walkthrough-script`, `dev-patch-request` and `report-bug` are QA process. Ask about them with row 4 |
> | 9 | Evidence recorders (Tier B rows 2 and 8, the EAINT-104 driver) | **ask.** Proposed: `tools/evidence-recorder/` | **yes** — the repo already ships the skill, but the chat never said yes to the code | The skill on `main` refers to code that is not in the repo |
> | 10 | Never push, and out entirely | **settled.** Delete from the copy, never from the original | no | Seven credential files, auth states, 87 `.bak` copies, and run artefacts. Non-eAuto folders stay out |
>
> Counts in Tier A above are static greps and run high. The inventory parse on
> `consolidate-charmain` gives 27 spec files and 155 live tests across the three
> sources .
>
> ## Ledgers written for the answered rows
>
> All on `consolidate-charmain`, 2 October 2026. Every source scenario id is
> traced to an entry, an *Also assert*, a question or *Not this module*. None has
> been through `scenario-reviewer` or `./bin/review s` yet.
>
> | Row | Source | Subjects | Entries |
> |---|---|---|---|
> | 3 | EAINT-12054 (167) | `UCD-STMS-BULK-PAYMENT` | 40 |
> | 1 | EAINT-11982 (68, 79 rows) | `BO-APPLICATION-EXTEND-BUTTON`, `BO-APPLICATION-EXTEND` | 16 + 27 |
> | 2 | EAINT-12131 (40) | `BO-SERVICE-HUB-BDP-SI` | 34 |
> | 7 | EAINT-12155 (157, 128 in scope) | `UCD-USER-PASSWORD`, `BO-USER-PASSWORD`, `AATF-USER-PASSWORD` | 24 + 39 + 11 |
> | 7 | EAINT-104 (143) | `UCD-STMS-LKM-REFUND`, `BO-LKM-REFUND` | 38 + 40 |
>
> SRDs that name staff logins, phone numbers or personal email addresses are
> cited by their location in the QA's CR folder and are not in
> `docs/source-material/`: EAINT-11982, EAINT-11868, EAINT-12131, EAINT-104,
> EAINT-10093 and EAINT-10168.

### 3a. Later answers (EAINT-12131, 2026-10-13) — verbatim

1. "Decision table answered 2026-10-13: `1-2 drop, 3 rewrite, 4 keep`."
   `[charmain-repo: intake/reports/charmain-12131-migration.md:4]`
2. Dropped: `00-bo-role-recon.spec.js` (recon, hard-skipped) and
   `20-tc-evidence.spec.js` ("Per-CR evidence recorder, 4,293 lines. Produces
   sign-off video, not coverage."). Decided by Charmain, 2026-10-13.
   `[charmain-repo: intake/reports/charmain-12131-migration.md:13-14]`
3. Role switch: "**keep the role leg, and home it at `src/auth/`**" — the spec
   carries `@destructive`. `[charmain-repo: intake/reports/charmain-12131-migration.md:41-42]`
4. Still blocked: "So `keep-as-is` is not available for this row, and
   recommending it was a mistake." Options A rewrite / B land in `tools/` / C
   defer; "One assertion plan unblocks rows 3 and 4 together."
   `[charmain-repo: intake/reports/charmain-12131-migration.md:67-78]`

### 3b. Azfar's answers (2026-09-21)

"Two decision-table rows answered by the repo owner this session; everything
else in `intake/reports/azfar.md` stays `decisions-pending`, untouched." The two
rows: the STMS wizard spec (keep-as-is, draft) and `src/fixtures/mykad.ts`
(merge). `[charmain-repo: intake/reports/azfar-migration.md:4-6]`
`[charmain-repo: intake/sources.yaml:46]`

### 3c. Charmain's own do-not-migrate list — verbatim rows

`[charmain-repo: intake/briefs/charmain.md:176-187]`

| File or folder | Why it stays out |
|---|---|
| Every `*-evidence.spec.*` and `record.spec.js` | Evidence recorders, not test cases. They produce video for sign-off |
| `eaint-12054` `00-*` probes and recon (32 files) | Exploration, written to find out how a screen behaves. They assert almost nothing |
| `eaint-12155` probe files (14) | Same. Averages one test and one assertion each |
| `eaint-12155/tests/tools/*-contract.spec.js` | Contract tests for my own recorder, not for eAuto |
| `eaint-104/automation/*.py` | Document and fixture builders. Useful, but they build PDFs, not tests |
| `tools/lhdn-einvoice` | One file survived the evidence cull. Not worth a row |

"Candidates for `tools/` rather than `tests/` ...: `shopping-cart-si-bdp/lib`,
`backoffice-audit/src/engine`, `tools/macrokiosk-fixtures`, `eaint-639`."

## 4. What we can reuse (ranked by value to this repo)

| # | Item | Owner | Why it helps us | Where the facts went |
|---|---|---|---|---|
| 1 | `tools/macrokiosk-fixtures` flows: `eauto-estm-create`, `eauto-insurance-create`, `eauto-stms-create`, listings, `cron-forecast`, `macrokiosk-prepare`, `_lib/thumbprint.js`, `_lib/cibo.js` | Charmain | "probably the single most reusable thing here because every QA needs eSTM and insurance transactions to exist before testing anything" `[charmain-repo: intake/sources.yaml:151]`. Compare with our `scripts/eauto-estm`, `scripts/eauto-quotation-reminder` before copying anything (rule: copy working flows step for step). | flow-estm.md, eauto-insurance.md, flow-secarang-insurance.md |
| 2 | EAINT-11982 Extend suite (22 files, separated by boundaries, concurrency, lifecycle, audit, API, roles) | Charmain | "EAINT-11982 is the strongest single contribution" `[charmain-repo: intake/briefs/charmain.md:200]`. Direct regression base for EAINT-11868 (future #23). | cr-ledger.md |
| 3 | 12054 data tools: `fresh-ssm-no` (unique ROC / New ROC per pool slot, LLP varies both), `set-esim-response` / `set-rhb-response` (patch + revert), `expire-ssm`, `pay-transaction`, `prep-rob` / `prep-roc` / `prep-llp`, `bo-set-bypass`, `capture-mykad-ws`, `connect-vpn` | Charmain | Same problems our eSIM tool, onboarding fake-data rule and SSM tickets (12121 / 12230, future #11/#12) face. | cr-ledger.md |
| 4 | Shopping Cart SI/BDP lib (`harness`, `si-flow`, `bdp-flow`, `pricing-flow`, `cross-check`, `email-contracts`, `mailtrap`, `rules`, `report-flow`) and 247 scenario scripts | Charmain | Scenario catalogue for 12123 / 12124 / 12087 / 12099 / 12333 (future #13-15, #19, #21). Our `tests/service-hub` (15 spec files) is the benchmark suite; use hers as a coverage checklist, not code. | flow-device-purchase.md |
| 5 | `backoffice-audit` (11 modules incl. AATF first-time login, AATF user account, dereg company account, eSTM user permission 1 and 2 layer, UCD insurance user permission) | Charmain | Two-browser race harness for audit-trail CRs; AATF / Dereg modules relevant to EAINT-12348 PBT as eDereg users (future #24). | flow-edereg.md, flow-estm.md, eauto-insurance.md |
| 6 | `tools/payment-breakdown-report` (PDF + XLSX + enquiry comparison, `lib/vehicleType.js`) | Charmain | Fee / price CRs need report cross-checks. | flow-payments-fees.md |
| 7 | `tools/compare-text-2` (Figma API vs live page text) | Charmain | Wording CRs (EAINT-10108 email wording, EAINT-12253 popup text). Token must be rotated before use: "its config.json carried a 45-character Figma token ... the token must be rotated" `[charmain-repo: intake/sources.yaml:195]` | — |
| 8 | EAINT-12155 policy contract and clipboard probes | Charmain | Ready-made case list for EAINT-12125 / 12228 (future #16/#17). | cr-ledger.md |
| 9 | EAINT-104 retest / verify scripts | Charmain | LKM refund child-bug retests; base for EAINT-12431 and LKM Refund Phase 2 (future #1, #8). | cr-ledger.md |
| 10 | EAINT-639 Python report verifier | Charmain | Only JPJ monthly report checker on the team. | cr-ledger.md |
| 11 | Azfar's `stms-jpj-check` (21 JPJ error codes) and `stms-payment` (RHB codes) | Azfar | Error-code matrices for STMS. | cr-ledger.md (pointer) |
| 12 | Legacy `ESTMUCDREG_*` names (90 eSTM E2E scenarios) | Team | Complete failure-point taxonomy for eSTM add-ons. | flow-estm.md |

Do **not** reuse: evidence recorders, recon probes, `bo-audit-v1`,
`files-compare`, anything holding credentials. Charmain's sources had their
credentials replaced by `process.env` reads "before its first commit"
`[charmain-repo: intake/sources.yaml:66]`; still check every file by eye.

## 5. Open points at last sight (2026-10-13)

1. Rows 4, 5, 6, 9 of the decision table wait on the QA group chat.
   `[charmain-repo: intake/reports/charmain-decisions.md:9-10]`
2. `test-scenarios/bo-service-hub-bdp-si/` has a ledger and no
   `.assertions.yaml`, which blocks 12131 rows 3 and 4.
   `[charmain-repo: intake/reports/charmain-12131-migration.md:76-78]`
3. Legacy repo: registered only, no decisions. Azfar: 9 rows plus his knowledge
   base still pending.
4. Count mismatch inside the source: 12131 is "40 live tests" in the registry,
   79 in the brief, 42 test titles in the JSON.
   `[charmain-repo: intake/sources.yaml:86]` `[charmain-repo: intake/briefs/charmain.md:98]`
