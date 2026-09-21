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

| File | Covers |
|---|---|
| [eauto-portals.md](eauto-portals.md) | Portals, roles, environments, URL structure, login behaviour |
| [cibo.md](cibo.md) | **CIBO** — a separate system from eAuto and Secarang, sharing insurance transaction data with both |
| [eauto-service-hub.md](eauto-service-hub.md) | Service Hub business rules — slot capacity, calendar window, reschedule, pricing |
| [eauto-payments.md](eauto-payments.md) | FPX rails, sandbox status codes, the gateway automation chain |
| [esim.md](esim.md) | **eSIM** — the eAuto Simulator: how responses are steered by vehicle prefix, its UI conventions, and the eSTM tables. A separate app with its own login and VPN requirement |
| [eauto-insurance.md](eauto-insurance.md) | Insurance products, eligibility rules, test-data rules per system — **reference only, underwriting changes** |
| [test-scripts.md](test-scripts.md) | Where test scope comes from (the BA testing plan), and how the team's Excel test scripts are named, structured and sized |
| [test-design-techniques.md](test-design-techniques.md) | Black-box test design techniques (EP/BVA, decision tables, state tables) and the specific scenario shape each one needs — apply only when suitable, don't force |
| [data-verification-standard.md](data-verification-standard.md) | **The data verification standard** — how any check that compares observed vs expected data is built: emails, portal pages, PDFs, exports, and comparisons across several sources at once |
| [automation-playbook.md](automation-playbook.md) | How a Playwright spec is built here, and how the dashboard runs it |
| [automation-testing.md](automation-testing.md) | How the **Automation Testing** dashboard section is organised — that section only |
| [quirks.md](quirks.md) | Traps that have already cost debugging time |

Module **flow** documents are flat files named `flow-<module>.md`. They record how
a module actually works — steps, URLs, the real DOM handles, branches and traps —
so the next automation in that module starts from a written flow instead of
rediscovery. Keeping them flat is required: `app/api/knowledge/route.ts` lists bare
`.md` filenames and ignores subdirectories.

**[flows.md](flows.md) is the standard for writing one** — the required sections,
the rule that DOM handles are recorded verbatim, and the index of which modules are
covered and which still aren't. Read it before starting a new flow document.

| Flow file | Covers |
|---|---|
| [flows.md](flows.md) | **How to write a flow document** — required sections, provenance rules, and which modules still have none |
| [flow-ucd-shell.md](flow-ucd-shell.md) | **The UCD portal shell** — home tiles, header nav, the startup popup chain (and how to suppress it), the listing/search pattern, duplicate-id traps. Applies to every UCD page |
| [flow-estm.md](flow-estm.md) | **eSTM (eSerahan) creation** — the core transaction most other flows depend on, including the staging URL bypass for the biometric gate, plus the eSTM home/listing/details DOM |
| [flow-insurance-purchase.md](flow-insurance-purchase.md) | **UCD insurance quotation → purchase** — quote cards, optional coverage, payment, and the listing/details records; 6 surfaces with cross-page verification |
| [flow-edereg.md](flow-edereg.md) | **eDereg (AATF)** Pre-Checking gate (EAINT-9306) — validation rule, response codes, expiry/cronjob rules, multi-user races, UI locations, URL map, DOM handles. **Happy path confirmed live end-to-end 2026-08-24** — the reference flow for automating any other AATF Deregistration/MyKad-auth screen |
| [flow-ucd-company-listing.md](flow-ucd-company-listing.md) | **Manage Company Accounts search** — ROC/New ROC/TIN fields, AND-only search semantics, empty-vs-populated `<tbody>` as the presence signal. Backs the Company Details Checker (EAINT-12153 sub-function) |
| [mykad-emulator.md](mykad-emulator.md) | **MyKad/thumbprint auth bypass** — the local emulator at `localhost:7878`, distinct from eSIM. Every dead end and fix from getting it working live, confirmed 2026-08-24 |
| [flow-association-payment-listing.md](flow-association-payment-listing.md) | **Association Payment Listing (BackOffice)** — brand-new module, EAINT-12028. Sourced from the mockup HTML only (not live yet) — Summary/Details pages, the Drafter→Reviewer→Approver workflow DOM, KIV/Reject branching, signature + payment-date modals, Payment Request generation |
| [flow-ucd-onboarding.md](flow-ucd-onboarding.md) | **Dealer onboarding: Pre-application → Application → Registered** — the 11 phases, the two independent status fields, the SSM live-lookup trap that rules out 3 of 5 business types, the reCAPTCHA gate, the unique-data scheme, and what one fixture costs. Distilled from Charmain's observed-run reference pack. Where EAINT-12257's DuitNow QR attaches |
| [flow-device-purchase.md](flow-device-purchase.md) | **Biometric Device Purchase — serial capture & DO generation (BackOffice)** — EAINT-12167 (Device SN input, 40-device order cap, locked-SN-typo resolution) and EAINT-12166 (DO generation, snapshot rule), SRD + Teams-derived, no live build confirmed yet |

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
