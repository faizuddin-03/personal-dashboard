# EAINT-12123 — study (2026-10-26)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-BackOffice] Differentiate Reference Number for Multiple Records under Same SR in Biometric Device Purchase & Software Installation Listing"
2. **Jira status:** **Code Review** (Task). Updated 2026-09-18 17:35.
3. **Priority:** Medium.
4. **Fix version:** "[QA]Ready for Testing Tickets" (placeholder version, release date 2026-11-02). Labels: 260727-260731, July2026, ProductBacklog, eAuto.
5. **QA (Jira cf[10041]):** **empty**. Miro "- QA:" blank.
6. **BA:** Batrisyia Hasanah Binti Nursyamsi (Jira reporter; SRD uploader). Miro "- BA:" blank. Her tickets moved to other BAs late Sept 2026 `[knowledge/people-and-roles.md:37]`.
7. **Dev:** Wong Zhan Choon (Jira assignee "zhan.choon"). `[Teams EAINT-12123, 2026-09-07 11:37, dev lead]` "Wong Zhan Choon, can help on this?"
8. **Deployment date (Miro):** column **"READY FOR TESTING TICKETS"** — **no date**.
9. **Test env:** not stated (Miro "- Test Env:" blank; Jira none).

## Sources read

1. Jira EAINT-12123 via Atlassian MCP, 2026-10-26: description, 5 attachments, 0 comments, 0 sub-tasks, **0 issue links**, 0 remote links.
2. **SRD not retrieved — `SRD_EAINT-12123_V1.1_Differentiate_Reference_Number_20260911.pdf`** (Jira attachment id 156610, 178,332 bytes, 2026-09-11; docx id 156611). The MCP cannot download binaries. No local copy in repo, inbox, or OneDrive. **Drop it into this folder.**
   1. Older attachments: V0.1 docx (20260904), V1.0 docx + pdf (20260904).
   2. Jira revision table: "11.09.2026 (Fri) | 1.1 | Updated Section 2.2.3 Affected Pages / Added Sections 2.2.7 to 2.2.8".
3. Miro capture lines 425-461 (card in `EAINT-12123-miro-card.md`).
4. Teams `_reference/teams/EAINT-12123-ServiceHub-Differentiate-Reference-Number.md` (captured 2026-10-16; chat 2026-09-03 to 2026-09-11).
5. `knowledge/eauto-service-hub.md` (§Reference numbers, §BO listing rules), `knowledge/flow-service-hub.md`, `knowledge/flow-device-purchase.md`, `knowledge/teams-decisions-by-ticket.md`.

## What changes

1. **Portal:** BackOffice. **Module:** "Biometric Device Purchase & Software Installation Listing". `[Jira]`
2. **What (Jira, verbatim):** "Each record under the same running number should be suffixed with a 2-digit running number to differentiate them, e.g. SR67000001-01, SR67000001-02, SR67000001-03, SR67000001-04"
3. **Why (Jira, verbatim):** "when one running number/reference number (e.g. SR67000001) actually consists of multiple records (e.g. 4 installation records), the listing only shows one single reference number for all of them, with no way to differentiate between the records"
4. **Also (Jira Additional Note, verbatim):** "The differentiated suffix must also be reflected on the Software Installation/Biometric Device Purchase Details page for an individual record (e.g. SR67000021-01), consistent with the suffix shown in the Listing."
5. **Affected pages (Miro card, verbatim, BackOffice):** "Service Request Listing Page", "Export Excel file", "Reference No search field", "Service Request Transaction Details Page", "Appointment Calendar > Add Appointment", "Appointment Calendar / Installation Failed > Reschedule Appointment". SRD v1.1 §2.2.3 not read — confirm this list against it.

## New vs existing behaviour

1. **Existing:** SR reference format `SR{Year}{Month}{6_digits_running_no}`, e.g. SR67000001; live SR69001391, SR69001395. `[knowledge/eauto-service-hub.md §Reference numbers, from SRD EAINT-10960 v1.2]`
2. **Existing:** BO listing has **one row per appointment/record**; several rows can share one SR. `[inference from Jira "the listing only shows one single reference number for all of them"]`
3. **New:** each row gets "-01", "-02"... suffix; same suffix on the details page.
4. **Existing BO page object** accepts `/^SR[A-Za-z]*\d+$/` — **will not match a "-01" suffix**. `[knowledge/eauto-service-hub.md:251-252, tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:274-277]` Automation will need updating `[inference]`.

## QA scope (Miro card)

1. **Est. mandays:** "3 days (1 QA)" = base "2 days" + buffer "1 day". Scope "(Automation + Manual Testing)".
2. **Transaction Type (verbatim):**
   1. "Software Installation ONLY" — "1 installation", "more than 1 installation"
   2. "Biometric Device Purchase ONLY" — "1 device", "more than 1 device"
   3. "Biometric Device Purchase + Software Installation" — "1 device + 1 installation", "more than 1 device + more than 1 installation"
3. **Affected pages:** six BO pages listed above (listing, Export, Reference No search, details, Add Appointment, Reschedule Appointment).
4. **Check points** `[inference]`: suffix format with 1 record (does a single record get "-01"?), ordering of suffixes, search by base SR vs suffixed SR, Export column value, Calendar dialogs' Reference No search.

## Affected regression areas

1. BO listing filters + Export (`Biometric_Device_Installation_List_YYYYMMDD.xlsx`). `[knowledge/eauto-service-hub.md §BO listing rules]`
2. BO Appointment Calendar: Add Appointment reference search (`#ac-add-refno`), Reschedule dialog "Reference No.". `[knowledge/flow-service-hub.md:394, :547]`
3. BO SR Details page: DO / serial no. (EAINT-12166 / 12167). `knowledge/flow-device-purchase.md`.
4. **UCD side** — not named in Jira or Miro. Does the UCD Service Request listing / details change? `[open]`
5. RHB payment reference `SR{YYYYMMDD}{6}-{Company ID}` — should stay unchanged `[inference]`.
6. EAINT-11913 "Reference No. excludes the transaction id". `[knowledge/flow-service-hub.md:757]`

## Test data / env needs

1. Service Requests of each type in the Miro matrix: SI x1, SI >1, BDP x1, BDP >1, BDP+SI 1+1, BDP+SI >1+>1. Create via existing UCD automation (memory rule "automation creates its own data").
2. A record in **Installation Failed** state for Reschedule.
3. Env not named.

## Dependencies / related tickets

1. No Jira links. Related modules: EAINT-10960 (SI module, Done), EAINT-11880 (BDP module, Done), EAINT-12166 / 12167 (DO, serial no.), EAINT-11913 (Reference No.), EAINT-12124 (BDP email — same release column).

## Teams decisions (verbatim)

Source: `_reference/teams/EAINT-12123-ServiceHub-Differentiate-Reference-Number.md` (export ends 2026-10-16).

1. `[2026-09-04 15:21, BA]` "I've uploaded SRD V0.1 and V1.0 in Jira. Let me know if have any feedbacks ya / (16:57) To update, Ops given greenlight for SRD V1.0 ya"
2. `[2026-09-08 12:03, dev]` "ETA to be done development by Friday with code review ya"
3. `[2026-09-11 15:47, BA]` "I've uploaded SRD V1.1 in Jira ya / (15:58) To update, Ops given greenlight for SRD V1.1 ya"
4. No test-env or deployment decision in Teams.

## Open questions / conflicts

1. **SRD V1.1 not read** — §2.2.3 Affected Pages + new §2.2.7-2.2.8 unknown. Miro page list may differ.
2. **Single record:** does an SR with only 1 record show "SR...-01" or plain "SR..."? Miro tests "1 installation" / "1 device" but Jira only defines multi-record.
3. **Miro vs Jira scope:** Jira names Listing + Details only; Miro adds Export, Reference No search, Add Appointment, Reschedule. Confirm in SRD V1.1.
4. **UCD portal** impact not stated.
5. **Search behaviour:** does searching "SR67000001" return all "-NN" rows, and does "SR67000001-02" return one?
6. **BDP + SI combination:** are device rows and installation rows numbered in one sequence or separately?
7. **QA owner, env, deployment date** — all blank.

## Existing repo knowledge / automation to reuse

1. `knowledge/eauto-service-hub.md`, `knowledge/flow-service-hub.md` (BO selectors, Calendar dialogs), `knowledge/flow-device-purchase.md`.
2. Automation benchmark: `app/eauto/12166` + `tests/service-hub` (BO page objects: `tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts`, `AppointmentCalendarPage.ts`; specs `add-appointment-bo.spec.ts`, `reschedule-handling.spec.ts`).
3. BO listing capture: `_reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html`.
4. `lib/eautoFlows/modules/service-hub.ts` (flows page data).
