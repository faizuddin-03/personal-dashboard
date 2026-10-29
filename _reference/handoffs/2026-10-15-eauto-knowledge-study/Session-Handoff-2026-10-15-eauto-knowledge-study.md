# Session handoff — 2026-10-15/16 (eAuto knowledge-base study, no single ticket)

Scratch note for resuming later. Not part of the knowledge base.

## What this session was
Faizuddin, 2026-10-15: *"study everything about eauto … put it in the knowledge
base in a detailed manner"*, then *"study all of the previous sharepoint CR test
scenarios, teams chat, everything. use multiple agents"*. Run as parallel
sub-agents (Opus from mid-session), paused twice on usage limits.

## Status as of 2026-10-16: STUDY AND MERGE COMPLETE, NOT COMMITTED
1. 22 existing knowledge files changed (+5,356 / −201 lines), 21 new knowledge
   files, `lib/ticketStudies.ts` updated (12153, 12257, 12107). Knowledge base now
   ~25,000 lines, 43 files. Every file has a README index row; no broken links;
   flows.md indexes all 17 flow files.
2. New knowledge files: flow-secarang-insurance, flow-cibo, cr-ledger, releases,
   flow-quotation-reminder, mailtrap, flow-service-hub, flow-payment-channels,
   jpj-xml-log, flow-bo-shell, flow-service-portal-shell,
   cr-test-scenario-catalogue, business-rules-from-test-scenarios,
   qa-process-from-notion-export, environments-history, teams-decisions-by-ticket,
   qa-team-process, people-and-roles (+ the 3 that were untracked before:
   flow-eauto-insurance-enquiry, flow-jomcheck, and others from prior sessions).
3. Raw material saved: `_reference/sharepoint/` (140 CR TS workbooks + listing,
   18 MB, **gitignored** 2026-10-16 because workbooks hold test passwords);
   `_reference/teams/` (46 chat files, 664 KB, passwords redacted, **still
   tracked** — user has not decided whether to ignore it).
4. All addenda applied by four merge agents. Copies remain in `addenda/` here.
5. Typecheck: `lib/ticketStudies.ts` clean; 35 pre-existing errors elsewhere
   (app/jira/[key]/page.tsx, components/AdfRenderer.tsx, components/IssueDrawer.tsx,
   tests/service-hub/scripts/debug-reschedule.ts), untouched by this work.

## User decisions recorded 2026-10-16
1. Campaign popups and their order are not fixed (season/celebration). Memory:
   `campaign-popup-order-not-fixed`.
2. EAINT-8606.xlsx misnaming: ignore, team renames later.
3. JomCheck Resubmit v1 vs v2 (EAINT-9203): not a conflict, v1 title typo.
4. `_reference/sharepoint/` added to .gitignore.

## Still open — needs Faizuddin
1. **Prices:** log in to staging/eauto in Chrome (BO, and UCD if possible), then
   say "prices ready". The agent cannot type passwords. It will read the BO
   reconciliation report and STMS/APT/eSTM listing and update
   business-rules-from-test-scenarios.md §1 and §11. Note: logged-out staging
   /eauto/home/ redirects to the PRODUCTION login (www.eauto.my).
2. **Teams folder:** gitignore `_reference/teams/` or not.
3. **Timesheet:** May Chin, 2026-10-05 17:59: "starting from today no need to fill
   in the CapacityTracker timesheet ady ya." Still true? (memory capacitytrack-setup
   flagged).
4. **BO menu visibility:** EAINT-10038 says six pages are Super-Admin-only; the
   Hub Admin capture shows them all.
5. **Mailtrap:** which insurance emails go to the real address instead.
6. **BoldPay = Makrokiosk** (from EAINT-11541) — confirm with Lim Yi Link; also
   12107 SRD (card + FPX only) vs 12327 (BoldPay modes for Secarang).
7. **Leave notice:** Notion 2 weeks vs Kasturi 2026-04-15 "at least 1 month".
8. **EAINT-11540 IC check:** 12-digit only (Faiz DM 08-04) vs month+day
   (Batrisyia 08-05).
9. **JomCheck 12339:** did "all the other passed" (10-05) include the TS31
   variant; did TS27/TS31 use the Find-data finder.
10. **Code changes proposed, not applied:** quotation-reminder (DRAFT→PENDING in
    utils/paths.ts + nightly spec; TS03/TS04 insurer labels; .env.example; stale
    comments; mailtrap selectors; eauto-e2e swallowed wait); `.env.example` for
    eauto-edereg-precheck (6 vs ~35 vars) and eauto-esim; `DPC_OWNER_EMAIL`
    default is @modefair.com though Dereg bans it; onboarding env defaults (uat1
    in TestScriptTab.tsx, sit3 in eauto-payment-channels config) vs staging/obs.
11. **_reference/ header fixes (owner only):** `ucd-home-hub-admin.html` is
    actually the BO home; two eSIM dereg captures cite non-existent flow-esim.md;
    `_reference/html/README.md` misses ~35 captures and has a listing.do route
    error.
12. **Not reached in Teams:** ~60 chats (most DMs; CR groups 12131, 12113,
    12079/12168, 12126, 11757, 12216, 12132, 12442, 12217/12218, 8669; older
    eAuto QAs/Main history). Notion zip (3 GB) read via PDF snapshots only.

## Contradictions recorded in the files (tagged [unconfirmed], both sources)
Same-day reschedule outcome; DO number format; booking start date; payment
confirm copy; CIBO date-range limit; 12327 export column position; quotation
reminder sheet vs automation; 12412 line names; 21 Sept env; 12166/12167 TS
counts; Pre-Checking decoder receiptNo/eftReferenceNo possibly swapped;
eDereg "Active" status; Decision Maker special characters; SSM document per role.

## Next step
Review `git diff knowledge/` and commit when satisfied. Then the open items above.
