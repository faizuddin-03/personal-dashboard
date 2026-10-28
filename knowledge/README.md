# QA Knowledge Base

Durable facts about the systems we test, kept as files in the repo so an AI
assistant can read them at the start of a task instead of rediscovering them by
grepping the test suite every time.

**Standing rule — ignore WA Blaster and WA Blaster Beta entirely.** Per
Faizuddin, 2026-09-03: do not read, edit, migrate, refactor, or otherwise touch
`scripts/_archive/WA-Blaster`, `scripts/WA-Blaster-Beta`, `app/wa-blaster*`, or
`app/api/wa-blaster*` — and do not surface them in suggestions, sweeps, or
"still to do" lists — unless he explicitly says otherwise in that session. This
overrides any general instruction to be thorough or to cover every page; WA
Blaster is out of scope by default, not an oversight to flag.

This is deliberately **not** the same store as the dashboard's QA Flow
Knowledge Base (`localStorage` key `qa_flow_knowledge`, see `lib/knowledgeBase.ts`).
That one is browser-local and feeds the in-app AI study prompts; it cannot be
read from outside the browser. This one is for the coding assistant and for you
in the editor. They can hold overlapping facts; neither syncs to the other.

## Index

### System and module knowledge

| File | Covers |
|---|---|
| [eauto-portals.md](eauto-portals.md) | Portals, roles, environments, URL structure, login behaviour |
| [cibo.md](cibo.md) | **CIBO** — a separate system from eAuto and Secarang, sharing insurance transaction data with both |
| [eauto-service-hub.md](eauto-service-hub.md) | Service Hub business rules — slot capacity, calendar window, reschedule, pricing |
| [eauto-payments.md](eauto-payments.md) | FPX rails, sandbox status codes, the gateway automation chain; EAINT-12107 ShopeePay/GrabPay (Fiuu) agreed scope and ownership trail; EAINT-12327 CIBO Payment Mode column format (both in release S34.X-20261020/21) |
| [esim.md](esim.md) | **eSIM** — the eAuto Simulator: how responses are steered by vehicle prefix, its UI conventions, and the eSTM tables; full page/URL map of all 31 entity pages, every captured edit-form id, the JomCheck Report form incl. claim records, and the `scripts/eauto-esim` code map. A separate app with its own login and VPN requirement |
| [eauto-insurance.md](eauto-insurance.md) | Insurance products, eligibility rules, test-data rules per system; EAINT-11864 business rules, step-3 persistence, PENDING-not-DRAFT, cron window — **reference only, underwriting changes** |
| [jpj-xml-log.md](jpj-xml-log.md) | **JPJ XML Log** — the BO log pages (APT/STMS/ESTM/Deregistration/eDereg Pre-Checking/BMK), their shared search form and duplicate-id trap, and the QA "Code Splitter" workbook's per-module field order for decoding the `~`-delimited Request/Response Data |
| [mailtrap.md](mailtrap.md) | **Mailtrap sandbox 2581833** — web-UI reader via the signed-in `modefair.com` Chrome profile (the working method; cannot run on GitHub Actions) vs the reference REST CLI, how emails are matched, the SI/BDP contracts verbatim, the quotation-reminder contract draft, constraints |
| [mykad-emulator.md](mykad-emulator.md) | **MyKad/thumbprint auth bypass** — the local emulator at `localhost:7878`, distinct from eSIM. Every dead end and fix from getting it working live, confirmed 2026-08-24 |

### Testing practice and automation

| File | Covers |
|---|---|
| [test-scripts.md](test-scripts.md) | Where test scope comes from (the BA testing plan), and how the team's Excel test scripts are named, structured and sized |
| [test-design-techniques.md](test-design-techniques.md) | Black-box test design techniques (EP/BVA, decision tables, state tables) and the specific scenario shape each one needs — apply only when suitable, don't force |
| [data-verification-standard.md](data-verification-standard.md) | **The data verification standard** — how any check that compares observed vs expected data is built: emails, portal pages, PDFs, exports, and comparisons across several sources at once |
| [automation-playbook.md](automation-playbook.md) | How a Playwright spec is built here, and how the dashboard runs it |
| [automation-testing.md](automation-testing.md) | How the **Automation Testing** dashboard section is organised — that section only. Standing rules include: number fields are plain text, digits only; act on the page only the way a person can (never inject a value, with the list of scripts that still do); test-data setups fill a pool and the record is chosen on the TS row; queue, layout and per-TS evidence |
| [quirks.md](quirks.md) | Traps that have already cost debugging time |
| [eod-update.md](eod-update.md) | **EOD update template** — the default format for the Teams end-of-day message (bold header, numbered tickets, JIRA link, Status sub-points, optional Pass Only progress) and how to deliver it copy-ready |

### CR history, catalogues and team process

| File | Covers |
|---|---|
| [cr-ledger.md](cr-ledger.md) | **CR ledger** — one section per Jira ticket the repo knows about: durable outcome, settled decisions, SRD version trail, test script and evidence location, automation, related bugs, release, QA/dev PIC. The agreed exception to the "no sprint state" rule |
| [releases.md](releases.md) | **Releases and deployments, chronological** — date, Jira fix version, tickets, env used, who tested; companion to cr-ledger.md |
| [cr-test-scenario-catalogue.md](cr-test-scenario-catalogue.md) | **CR test-scenario catalogue** — one row per CR test-scenario workbook in the QA Team SharePoint library (140 workbooks, eAuto + Secarang/CIBO), grouped by module, with editor, date, sheets, environment named and key rules; local copies under `_reference/sharepoint/` |
| [business-rules-from-test-scenarios.md](business-rules-from-test-scenarios.md) | Module-by-module business rules, validations, messages, file formats and fees stated in those workbooks, with sheet/row provenance and a contradictions list |
| [qa-process-from-notion-export.md](qa-process-from-notion-export.md) | QA process facts from the QA Team Notion export (accounts, test emails, browsers, regression checklists, SIT) |
| [qa-team-process.md](qa-team-process.md) | **QA team working rules from Teams** — QA Portal, timesheet, estimates, EAINT-148, staging etiquette, deployment support, leave, AI/automation; adds only what qa-process-from-notion-export.md lacks and flags where newer Teams posts disagree |
| [production-regression-scope.md](production-regression-scope.md) | **Production regression scope** — what QA may and may not do in production after a deployment: pre-deployment accounts and approvals, hard limits, stop points per module, the standard regression block and its history, verification patterns by CR type, existing-data and next-day monitoring, wording templates, and a 2025-2026 precedent index of CR keys. From the 149-sheet Deployment Checklist workbook |
| [teams-decisions-by-ticket.md](teams-decisions-by-ticket.md) | **Teams decisions by ticket** — per-ticket decisions and rules from the Teams CR groups that cr-ledger.md lacks (Part A: tickets with no ledger section; Part B: Teams-only facts for tickets that have one) |
| [environments-history.md](environments-history.md) | **Staging environment history, from Teams** — branch inventory, removals, external connections (JPJ/RHB/JomCheck staging), merge-down practice, rules for claiming and sharing environments. Dated observations, never a per-rule env |
| [charmain-qa-repo.md](charmain-qa-repo.md) | **Charmain's QA repo (`eauto_qa_gpt`, branch consolidate-charmain, 0ab45d1, 2026-10-13)** — read-only clone at `_reference/codebases/eauto-qa-charmain`: folder map, the two-human-gate workflow (intake → ledger → assertion plan → spec → run → triage → evidence), 17 numbered QA principles, ledger/provenance/assertion formats, verbatim lessons, its 8 Claude agents and 8 skills, CLI tools, what we can reuse, and conflicts with our rules |
| [script-inventory-team.md](script-inventory-team.md) | **Who has which automation scripts (from Charmain's repo intake reports, 2026-10-27)** — per-colleague sources (Charmain 16, Azfar, shared legacy `eautoAutomation-Playwright` 239 specs), status and migration decisions verbatim, reusable items ranked, and which colleague suites cover the 25 future tickets |
| [people-and-roles.md](people-and-roles.md) | **People and roles** — who is who across QA, BA/SA, dev, Ops and management on eAuto / Secarang / CIBO, with join/departure/handover dates; from Teams, roles change often |

Module **flow** documents are flat files named `flow-<module>.md`. They record how
a module actually works — steps, URLs, the real DOM handles, branches and traps —
so the next automation in that module starts from a written flow instead of
rediscovery. Keeping them flat is required: `app/api/knowledge/route.ts` lists bare
`.md` filenames and ignores subdirectories.

**[flows.md](flows.md) is the standard for writing one** — the required sections,
the rule that DOM handles are recorded verbatim, and the index of which modules are
covered and which still aren't. Read it before starting a new flow document.

Source note (2026-10-23): a read-only copy of colleague Azfar's QA repo is at `_reference/codebases/eauto-qa-azfar`. It is the main source for areas Faizuddin worked little on (STMS, UCD to UCD, APT, BMK, SSM, e-Invoice, fees); precedence rules in `_reference/inbox/eauto-flows-run/09-taxonomy.md`.

### Flow documents

| Flow file | Covers |
|---|---|
| [flows.md](flows.md) | **How to write a flow document** — required sections, provenance rules, and which modules still have none |
| [flow-stms.md](flow-stms.md) | **STMS (temporary ownership transfer), bulk, SSM permission, BO support actions, Transfer History** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-ucd-to-ucd.md](flow-ucd-to-ucd.md) | **UCD to UCD transfers (Standard, Interstate)** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-apt.md](flow-apt.md) | **APT (Automatic Permanent Transfer)** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-stms-addons.md](flow-stms-addons.md) | **STMS Step 5 add-ons: LKM Refund and Insurance Cancellation** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-bmk.md](flow-bmk.md) | **BMK purchase (6 steps)** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-ssm.md](flow-ssm.md) | **SSM document purchase and permissions** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-wholesale.md](flow-wholesale.md) | **Wholesale 2.0 (chatbot, Hybrid Assist, logistics, eMOVE, payment) - manual testing only** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-company-profile-einvoice.md](flow-company-profile-einvoice.md) | **Company / Business Profile Update and e-Invoice / invoices** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-payments-fees.md](flow-payments-fees.md) | **Payments and fees: fee/price changes, RHB direct debit, failed-payment reset** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-platform.md](flow-platform.md) | **Platform: login/password, MyKad/browser, JPJ submission, notifications, mobile app** - built 2026-10-23 for /eauto/flows from Azfar repo, Ask eAuto, Jira, Miro, TS; data mirror lib/eautoFlows/modules/ |
| [flow-mobile-app.md](flow-mobile-app.md) | **eAuto mobile app testing** — Play Store tester setup, evidence, Dermalog (USB) vs Iris (Bluetooth) support matrix, Phase 2 interruption rules, Phase 6 device plan. Built 2026-10-28 |
| [flow-ucd-shell.md](flow-ucd-shell.md) | **The UCD portal shell** — home tiles, header nav, the startup popup chain (and how to suppress it), the listing/search pattern, duplicate-id traps. Applies to every UCD page |
| [flow-bo-shell.md](flow-bo-shell.md) | **The BackOffice portal shell** — login/landing/logout, the complete Hub Admin menu tree (12 categories, every href, which flow doc covers each), header + pending counter, role-filtered Menu dropdown, listing/search/export/datepicker variants, traps (native logout confirm, duplicate menu labels). Find any BO page by name here |
| [flow-service-portal-shell.md](flow-service-portal-shell.md) | **The Service Portal (bank/credit company) shell** — `/bank/login/` form (`name`/`pass`), `/credit/home/` menu, header, JomCheck Report Listing pattern, datepicker onSelect trap, the verbatim one-month error, `/banker/logout.do` |
| [flow-estm.md](flow-estm.md) | **eSTM (eSerahan) creation** — the core transaction most other flows depend on, including the staging URL bypass for the biometric gate, plus the eSTM home/listing/details DOM; code map of `scripts/eauto-estm` (env vars, handles with file:line, PROGRESS keys) and the step-5 add-on enquiry contract |
| [flow-insurance-purchase.md](flow-insurance-purchase.md) | **UCD insurance quotation → purchase** — quote cards, optional coverage, payment, and the listing/details records; 6 surfaces with cross-page verification |
| [flow-quotation-reminder.md](flow-quotation-reminder.md) | **Quotation reminder email (EAINT-11864)** — the hourly 07:00–23:00 cron rule, the five entry points (Get Free Quote, eSTM untick, details-page banner, 69E, email link), how `scripts/eauto-quotation-reminder` drives eSTM → quote → abandon → inbox, verbatim DOM, config knobs, safety switches, traps, and why the suite is paused |
| [flow-eauto-insurance-enquiry.md](flow-eauto-insurance-enquiry.md) | **Insurance enquiry/listing/report/dashboard navigation** — BackOffice Insurance Transaction Listing, UCD Transaction Listing & Report, and the separate Insurance Dashboard portal (`/motorInsurance/login/`, its own login) including the Pemaju Payment Report and Agency Performance chart. Sourced from a code-reading chatbot, 2026-09-25 — navigation only, not yet live-verified |
| [flow-zurich-takaful.md](flow-zurich-takaful.md) | **Zurich Takaful onboarding — EAINT-8606 (eAuto) + EAINT-8608 (Secarang)**, manual-tested, paused in Testing In 1st Env. SRD V1.2 rules (sequence, cover types, TPFT eligibility, optional coverage), July post-SRD changes, Miro TS catalogue with pass marks (COM/TPFT/EXT/SC_E2E), test-data levers (69E, ZA/ZB, IF). Miro tables not yet read |
| [flow-secarang-insurance.md](flow-secarang-insurance.md) | **Secarang car insurance purchase (B2C, no user login)** — quote → add-ons → confirm → Fiuu payment → success/failed, from `scripts/secarang-insurance` (FPX, runs green) and `scripts/eauto-12107` (GrabPay/card, unconfirmed selectors); no live Secarang HTML captured |
| [flow-secarang-social-media.md](flow-secarang-social-media.md) | **Secarang Social Media** — cron auto-posts caption + video to Facebook, Instagram, TikTok (EAINT-12528), "every 2 - 3 days"; how to test a cron that cannot be triggered. **Draft from Jira only, no SRD** |
| [flow-cibo.md](flow-cibo.md) | **CIBO page-by-page flow** — portal shell, Transaction Management, Payment Management, Payment Report, as established by EAINT-12058/12151/12327/12107. Mockup-sourced only: no live CIBO page captured, no page object |
| [flow-edereg.md](flow-edereg.md) | **eDereg (AATF)** Pre-Checking gate (EAINT-9306) — validation rule, response codes, expiry/cronjob rules, multi-user races, UI locations, URL map, DOM handles. **Happy path confirmed live end-to-end 2026-08-24** — the reference flow for automating any other AATF Deregistration/MyKad-auth screen. Back-Office side (listings, JPJ XML Log pages) added 2026-10-15 |
| [flow-jomcheck.md](flow-jomcheck.md) | **JomCheck module** — the CR lineage (EAINT-10089/10937/11175 permission & sharing, EAINT-12339 API v2.0 upgrade, EAINT-12412 invoice/e-Invoice split into RM18 + RM2 lines), the 3 Service Portal surfaces easy to conflate, and the permission-gate chain from UCD share checkbox to BackOffice account permission; SRD REQ-001–011 map, 29-column BO listing, ICAP table, page-object/selector map, spec→TS map, BO Resubmit location |
| [flow-ucd-company-listing.md](flow-ucd-company-listing.md) | **Manage Company Accounts search** — ROC/New ROC/TIN fields, AND-only search semantics, empty-vs-populated `<tbody>` as the presence signal. Backs the Company Details Checker (EAINT-12153 sub-function) |
| [flow-ucd-onboarding.md](flow-ucd-onboarding.md) | **Dealer onboarding: Pre-application → Application → Registered** — the 11 phases, the two independent status fields, the SSM live-lookup trap that rules out 3 of 5 business types, the reCAPTCHA gate, the unique-data scheme, and what one fixture costs. Distilled from Charmain's observed-run reference pack. Where EAINT-12257's DuitNow QR attaches |
| [flow-payment-channels.md](flow-payment-channels.md) | **UCD onboarding payment channels** — the RM 108 / RM 990 payment steps, the Card / FPX Business / FPX Personal tiles and the planned DuitNow QR tile, the Fiuu popup + bank simulator driver, success/failure pages, EAINT-12153's B2B Pending Approval pages (mockup DOM), EAINT-12414's two defects, env vars and safety switches of `scripts/eauto-duitnow-qr` and the `scripts/eauto-payment-channels` skeleton |
| [flow-service-hub.md](flow-service-hub.md) | **Service Hub** — Software Installation, Biometric Device Purchase, appointments, reschedule, BO calendar: entry points, URLs, DOM, branches, data arrangement, traps, distilled from `tests/service-hub` + SRDs EAINT-10960/11880 + live captures. Business rules stay in eauto-service-hub.md |
| [flow-device-purchase.md](flow-device-purchase.md) | **Biometric Device Purchase — serial capture & DO generation (BackOffice)** — EAINT-12167 (Device SN input, 40-device order cap, locked-SN-typo resolution) and EAINT-12166 (DO generation, snapshot rule), SRD + Teams-derived, no live build confirmed yet |
| [flow-association-payment-listing.md](flow-association-payment-listing.md) | **Association Payment Listing (BackOffice)** — brand-new module, EAINT-12028. Sourced from the mockup HTML only (not live yet) — Summary/Details pages, the Drafter→Reviewer→Approver workflow DOM, KIV/Reject branching, signature + payment-date modals, Payment Request generation |
| [flow-inventory-control.md](flow-inventory-control.md) | **Shopping Cart Inventory Control (BackOffice)** — EAINT-12099 + EAINT-12635 leftovers: Stock In / Stock Out scanning, Inventory Control Report, Dashboard (Safe Level %), low-stock email, UCD available stock. **Draft 2026-10-26, not walked live**; SRD v1.1 not in repo; low-stock email time conflict 08:00 (Teams) vs 6:00 AM (Miro) |
| [flow-emove.md](flow-emove.md) | **eMOVE standalone logistics (UCD)** — EAINT-12019: entry gate (Interstate UCD to UCD / approved eSTM), request, fee, payment to eAuto Sdn Bhd, driver QR, BO listing, Finance vendor payment. **Draft 2026-10-26, not walked live**; SRD v0.8 draft not in repo |
| [flow-application-reactivation.md](flow-application-reactivation.md) | **Application reminder emails, expiry extension, link reactivation** — EAINT-11868 (+ EAINT-11982 Extend): 5 reminder emails with subjects, Extend rules, RM108 reactivation, new PA record, SSM refresh. **Draft 2026-10-26, not walked live**; from SRD v1.4 text copy |
| [flow-browser-reminder.md](flow-browser-reminder.md) | **Firefox to Chrome browser reminder** — EAINT-12253 last-step popup across 9 transaction types + EAINT-12180 homepage announcement: last step per module, DOM, SRD-vs-build differences (Firefox < 37 only, after payment, re-shows on F5 per EAINT-12574). **Draft 2026-10-26, not walked live by us** |

Ticket-level studies (scope, SRD requirements, decisions, open questions) live
separately in `lib/ticketStudies.ts` and render at `/jira/studies`.

## The one rule: every fact carries its provenance

A fact without a source is worse than no fact — it gets quoted back as
established truth months after it stopped being true. Tag every line:

- `[verified: <path> · <symbol or rule>]` — read directly out of this repo.
- `[verified live: <env>, <YYYY-MM-DD>]` — confirmed against the running system.
  Only use this when a code comment or commit records the live check; don't
  invent the date.
- `[from ticket <KEY>]` — established during a ticket study, with the requestor.
- `[from QA team, <YYYY-MM-DD>]` — told to us by the team, not yet checked against
  code or the running system. Carries the date because it ages.
- `[from SharePoint TS #NNN <ticket>, sheet <s>, row <n>]` — stated in a past CR
  test-scenario workbook; `#NNN` is the number in
  [cr-test-scenario-catalogue.md](cr-test-scenario-catalogue.md). A tested
  expectation, `[from QA team]`-grade, not verified system behaviour.
- `[from Notion export, <page>]` — from the QA Team Notion export; see
  [qa-process-from-notion-export.md](qa-process-from-notion-export.md).
- `[from Teams <chat>, <YYYY-MM-DD HH:MM>, <person>]` — stated in a Teams message;
  raw chats are under `_reference/teams/`.
- `[unconfirmed]` — believed but not proven. **Must be re-verified before it
  drives a decision.**

If a fact turns out wrong, delete it or move it to `[unconfirmed]` in the same
commit that fixes the code. A stale entry is a bug.

## When something contradicts a fact in here

Don't silently follow the file, and don't silently rewrite it. Say what the file
claims, what the new source (the system, an SRD, a requestor) says, and **ask
whether to update the entry** — then make the change in the same task if the answer
is yes. This matters most where the underlying rules are known to move, such as
insurance underwriting; see the warning at the top of
[eauto-insurance.md](eauto-insurance.md).

## Scope

Only facts that are still true months from now: portals, business rules,
integrations, selectors that reflect real app structure, environment quirks.

Not here: current ticket scope, sprint state, "currently being deployed", or
anything the code already says plainly. If a file is the authority on
something (e.g. `ENV.slotCapacity`), the entry should point at it rather than
duplicate its value, so the two can't drift apart.

## Maintaining it

Append at the end of a study or an automation task, then review the diff.
Facts learned but not written down are lost — the whole point of this
directory is that the next session starts where the last one ended.
