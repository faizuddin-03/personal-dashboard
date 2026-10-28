# EAINT-12087 — study (2026-10-26)

## Header

1. **Title (verbatim, Jira):** "🟣[eAuto-Backend] Build Cronjob to Auto-Expire Software Installation Slot After 60 days"
2. **Jira status:** **Code Review** (Task). Updated 2026-10-19 10:57.
3. **Priority:** Medium.
4. **Fix version:** "[QA]Ready for Testing Tickets" (placeholder, release date 2026-11-02). Labels: 260727-260731, July2026, ProductBacklog.
5. **QA (Jira cf[10041]):** **Charmain Ea Chiang** (Senior QA). Miro "- QA:" blank.
6. **BA:** Batrisyia Hasanah Binti Nursyamsi (Jira reporter; Miro "- BA: Batrisyia").
7. **Dev:** Jira assignee "zhan.choon" (Wong Zhan Choon).
8. **Deployment date (Miro):** column **"READY FOR TESTING TICKETS"** — **no date**.
9. **Test env:** not stated (Miro "- Test Env:" blank, "- Test Env Point to: -").

## Sources read

1. Jira EAINT-12087 via Atlassian MCP, 2026-10-26: description, **0 attachments**, 0 comments, 0 sub-tasks, links "relates to" EAINT-10960 and EAINT-11880 (both Done, High), 0 remote links.
2. **SRD: none attached** to this ticket. Jira description is the only ticket-level source. The 2-month expiry rule lives in SRD EAINT-10960 v1.2 (see below).
3. Miro capture lines 404-423 (card in `EAINT-12087-miro-card.md`).
4. Teams: **no export** for EAINT-12087 in `_reference/teams/` (2026-10-16 sweep). No mention in `knowledge/teams-decisions-by-ticket.md`.
5. `knowledge/eauto-service-hub.md` §Service Request status lifecycle; `knowledge/flow-device-purchase.md` item 6; `lib/eautoFlows/modules/service-hub.ts:129-135`; `knowledge/flow-service-hub.md:733`.

## What changes

1. **Portal (Jira):** "eAuto". **Module:** "Backend - Software Installation Slot Expiry Cronjob".
2. **What (Jira, verbatim):** "Build a cronjob to auto-expire installation payment/slot transactions where the UCD has made payment but did not proceed with the paid/free installation slot within 60 days of payment."
3. **Why (Jira, verbatim):** "No cronjob currently exists to auto-expire installation slot transactions when the UCD does not proceed with the paid/free slot after payment. Such transactions remain unresolved indefinitely."
4. **Example (Jira, verbatim):** "Payment made on 27.07.2026 → slot valid until 25.09.2026 → cronjob runs on 26.09.2026 and marks the transaction as expired."

## New vs existing behaviour

1. **Existing per SRD 10960:** "Expired when no installation (free or paid) is claimed within 2 months of purchase (buy 6 July → expire 7 September); enforced by a **daily cron** that flips installation and transaction records; applies to SI and BDP." `[knowledge/eauto-service-hub.md:328-330, from SRD EAINT-10960 v1.2 §2.3.2.2 #2.6 v]`
2. **Existing per Teams:** "The free software installation appointment is valid for **2 months** from purchase." `[knowledge/flow-device-purchase.md:36, from Teams EAINT-12099 group, 2026-07-20 16:34, dev]`
3. **Code reading (flows study):** "Daily at 01:00 Asia/Kuala_Lumpur (property cron.time.servicehubappointmentexpired; toggle cron.task.servicehubappointmentexpired.enabled). Job class ServiceHubAppointmentExpiredJob in eauto-cron." / "it expires any still-open (NEW or PENDING) appointment whose date has passed, and force-expires any Paid transaction that never booked a slot within 2 months." `[lib/eautoFlows/modules/service-hub.ts:131-133; source tagged ask(...), i.e. from a code question, unverified against staging]`
4. **New (Jira):** 60 days from **payment date**; expire on day 61.
5. Statuses: Tx Status / Installation Status value **Expired** (black); terminal. `[knowledge/eauto-service-hub.md:328-341]`

## QA scope (Miro card)

1. **Est. mandays:** "3 days for 1 QA" = base "2 days" + buffer "1 day". Scope "(Manual + Automation Testing)".
2. **Card note (verbatim):** "Refer to previous TS drafted in miro".
3. **Related Miro board** `[inference]`: the Shopping Cart board used for EAINT-10960 / 12167 — `_reference/miro-links.txt` line "2026-10-23 | EAINT-12167, EAINT-10960 (Shopping Cart) | ... | https://miro.com/app/board/uXjVHAd4xoA=/". `lib/eautoFlows/modules/service-hub.ts:12` names it "[eAuto - UCD & BackOffice] Shopping Cart" and cites it for this cronjob. Not opened. No board in `miro-links.txt` names EAINT-12087 directly.
4. Check points `[inference]`: day 60 not expired / day 61 expired; free slot vs paid slot; SI vs BDP (free installation); partial use (some slots booked); UCD listing + BO listing status; filter by Expired; no actions on Expired record.

## Affected regression areas

1. UCD Service Request listing / details Tx Status. `knowledge/flow-service-hub.md`.
2. BO Biometric Device Purchase & Software Installation Listing (Installation Status filter "Expired"); Appointment Calendar Add Appointment on an expired reference (`#ac-add-refno` → text `/expired|invalid|not found/i`). `[knowledge/flow-service-hub.md:547]`
3. BO concurrency dialog "Unable to proceed. This Service Request has been completed, failed, expired or cancelled." `[knowledge/flow-service-hub.md:357]`
4. UCD Payment Report (payment-report event republished per expiry). `[lib/eautoFlows/modules/service-hub.ts:133]`

## Test data / env needs

1. **Dev patch of payment date** (or cron trigger) — 60 real days is not feasible. Past practice: "SC_APBO_TS06/7 (expired-transaction adds) are excluded — their precondition requires a dev to manually patch a transaction to Expired". `[tests/service-hub/specs/add-appointment-bo.spec.ts:27-28]`
2. SI and BDP Service Requests with unclaimed free / paid slots.
3. Cron run time (01:00 MYT per code note) — confirm on staging.
4. Env not named.

## Dependencies / related tickets

1. **EAINT-10960** "Shopping Cart - To Create Software Installation Module" (Done) — "relates to".
2. **EAINT-11880** "Shopping Cart - To Create Biometric Device Purchase Module" (Done) — "relates to".
3. EAINT-12099 group (Teams source of the 2-month validity).

## Teams decisions (verbatim)

1. **None found** for EAINT-12087 in `_reference/teams/` (export ends 2026-10-16).
2. Related, from another group: `[Teams EAINT-12099 group, 2026-07-20 16:34, dev]` — free installation "valid for 2 months from purchase" (quoted as summarised in `knowledge/flow-device-purchase.md:36`; raw export not in repo).

## Open questions / conflicts

1. **Does the cron already exist?** Jira: "No cronjob currently exists". SRD 10960 + code note: a daily cron already expires after 2 months. Is 12087 new, or a change to the existing job?
2. **60 days vs 2 months:** Jira "60 days of payment" (27.07 → valid to 25.09, expire 26.09) vs SRD 10960 "2 months of purchase (buy 6 July → expire 7 September)". Which rule and which boundary date?
3. **Jira example arithmetic:** 27.07.2026 + 60 days = **25.09.2026**, so "valid until 25.09" means day 60 is the last valid day and day 61 (26.09) expires `[inference]`. Confirm the boundary.
4. **Scope:** title says Software Installation slot; does it cover the free installation that comes with BDP? SRD 10960 says "applies to SI and BDP".
5. **Partial use:** SR with several slots, some booked — whole SR expired or only unbooked slots?
6. **Previous TS "in miro"** — which board/frame? Not named on the card.
7. **No SRD** for this ticket — confirm with BA that Jira description is the full spec.
8. Env + deployment date blank.

## Existing repo knowledge / automation to reuse

1. `knowledge/eauto-service-hub.md`, `knowledge/flow-service-hub.md`, `knowledge/flow-device-purchase.md`.
2. Automation benchmark: `app/eauto/12166` + `tests/service-hub` (UCD + BO page objects, `specs/add-appointment-bo.spec.ts` expired cases excluded today).
3. `lib/eautoFlows/modules/service-hub.ts` cronjob entry (`/eauto/flows` page).
