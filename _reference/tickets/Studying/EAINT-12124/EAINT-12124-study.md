# EAINT-12124 — study (2026-10-26)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-Service Hub] Create Email Notification with CC to Support for Biometric Device Purchase"
2. **Jira status:** **Code Review** (Task). Updated 2026-10-22 20:06.
3. **Priority:** Medium.
4. **Fix version:** "[QA]Ready for Testing Tickets" (placeholder, release date 2026-11-02). Labels: 260727-260731, July2026, ProductBacklog, eAuto.
5. **QA (Jira cf[10041]):** **empty**. Miro "- QA:" blank.
6. **BA:** Batrisyia Hasanah Binti Nursyamsi (reporter, SRD uploader). Taken over after 2026-09-22 — `[Teams 2026-09-22 14:25, BA Lim Yi Link]` "SA will answer your questions once get feedback from Ops". Miro "- BA:" blank.
7. **Dev:** Kasheng Liew (Jira assignee "Shane"). `[Teams 2026-09-10 10:59, dev lead]` "Kasheng Liew, can study first"
8. **Deployment date (Miro):** column **"READY FOR TESTING TICKETS"** — **no date**.
9. **Test env:** not stated (Miro "- Test Env:" blank, "- Test Env Point to: -").

## Sources read

1. Jira EAINT-12124 via Atlassian MCP, 2026-10-26: description, 3 attachments, 0 comments, 0 sub-tasks, **0 issue links**, 0 remote links.
2. **SRD not retrieved — `SRD_EAINT-12124_V1.0_Email_BDP_20260911.pdf`** (Jira attachment id 156569, 216,542 bytes, 2026-09-11; docx id 156570). MCP cannot download binaries; no local copy in repo, inbox, or OneDrive. **Drop it into this folder.** Older: V0.1 docx (20260907).
3. Miro capture lines 463-490 (card in `EAINT-12124-miro-card.md`).
4. Teams `_reference/teams/EAINT-12124-ServiceHub-BDP-Email-CC-Support.md` (captured 2026-10-16; chat 2026-09-07 to 2026-10-05).
5. `knowledge/eauto-service-hub.md` §Emails, `knowledge/flow-device-purchase.md` item 7, `knowledge/mailtrap.md`, `lib/eautoFlows/modules/service-hub.ts`.

## What changes

1. **Portal (Jira):** "eAuto Backend". **Module:** "Service Hub - Biometric Device Purchase".
2. **What (Jira, verbatim):** "Create an email notification for Biometric Device Purchase, sent from support@eauto.my, with CC to support@eauto.my. If Software Installation is purchased together with Biometric Device Purchase, send 1 combined email instead of separate emails (Software Installation itself has no change)."
3. **Why (Jira):** "No email notification currently exists for Biometric Device Purchase"
4. **Reschedule rule (Jira, verbatim):** "If Software Installation is subsequently rescheduled, only the existing Software Installation Rescheduled email is sent; Biometric Device Purchase details are not repeated and no new combined email is triggered."
5. **Unchanged (Jira Additional Note, verbatim):** "The existing standalone Software Installation Confirmation and Software Installation Rescheduled email templates are not changed under this enhancement. They continue to be sent as-is."

## New vs existing behaviour

1. **Existing:** SI emails only — Confirmation subject "eAuto: Your Software Installation Appointment is Confirmed — [UCD Company Name]" and Rescheduled. Sender support@eauto.my. `[knowledge/eauto-service-hub.md §Emails, from SRD EAINT-10960 v1.2 §2.3.2.1 #7-#8]`
2. **Existing (prod code note):** "only the appointment booked or rescheduled email fires ... A payment success email (SERVICE_HUB_PAYMENT_SUCCESS) exists on both ends but the publishing call is commented out in production." `[lib/eautoFlows/modules/service-hub.ts:125]`
3. **Existing defect:** dash in reschedule subject shows as "?" (Mailtrap 2026-07-15). `[knowledge/flow-service-hub.md:755]`
4. **New:** BDP email (CC support@eauto.my); BDP + SI → one combined email.
5. **New (Teams):** Paid Amount = total paid; free installation = "-". See Teams below.

## QA scope (Miro card)

1. **Est. mandays:** "2 days (1 QA)" = base "1 days" + buffer "1 day". Scope "(Automation + Manual Testing)".
2. **Transaction Type (verbatim):** "Biometric Device Purchase", "Biometric Device Purchase + Software Installation (Free)", "Biometric Device Purchase + Software Installation (Add On)", "Software Installation".
3. **Test Scenarios (verbatim):** "E2E Happy Flow", "Payment = Failed".
4. Checks per email `[inference]`: sender, CC, subject, table rows, Paid Amount, free row "-", one combined email (not two), reschedule sends only SI Rescheduled, no email on Payment Failed (to confirm in SRD).

## Affected regression areas

1. Existing SI Confirmation + Rescheduled emails (unchanged per Jira). `knowledge/mailtrap.md` (SI/BDP email contract ~line 160).
2. BDP purchase flow + payment (RHB). `knowledge/flow-device-purchase.md`.
3. BO reschedule by CSE triggers Reschedule Email. `[knowledge/eauto-service-hub.md:442]`

## Test data / env needs

1. **Mailtrap** sandbox (staging mail sink, inbox 2581833) — search by recipient + subject + time window. `knowledge/mailtrap.md`.
2. UCD company able to buy BDP; add-on installation (Teams: "rm54 each").
3. **RHB failed payment** for "Payment = Failed".
4. Env not named.

## Dependencies / related tickets

1. No Jira links. Related: EAINT-11880 (BDP module, Done), EAINT-10960 (SI module, Done), EAINT-12123 (same Miro column; SR suffix could appear in email `[inference]`).

## Teams decisions (verbatim)

Source: `_reference/teams/EAINT-12124-ServiceHub-BDP-Email-CC-Support.md` (export ends 2026-10-16).

1. `[2026-09-11 11:40, BA]` "uploaded SRD V1.0 in Jira ya / (15:49) To update we received greenlight from Ops to proceed with this ya"
2. `[2026-09-22 14:30, dev]` question 1: "biometric device purchase table, the paid amount row. is this device only, or the total amount they paid? ... if someone buys 1 device at 850 plus 1 extra installation at 54, total paid is 904." Question 2: "every device comes with 1 free installation. for those rows do you want rm 0.00, or the word "free"?"
3. `[2026-09-28 08:01, dev lead]` "please go direct to Ops for clarification"
4. **Decision** `[2026-09-28 09:34, dev]` "clarified with Nuru, we will show total amount for Paid Amount and just '-' for free installation"
5. `[2026-10-05 10:57, dev]` "please note that the dev for this ticket is completed ya"

## Open questions / conflicts

1. **SRD V1.0 not read** — email subject, body, table layout, trigger point unknown.
2. **Teams decision vs SRD V1.0 (2026-09-11):** Paid Amount = total and free = "-" agreed **after** the SRD (2026-09-28). The dev's own example shows double counting if total is shown in the device table and RM54 again in the installation table (850 + 54 shown, 904 total → reads as 958). Confirm the SRD was revised or this Teams decision is the expected result.
3. **Combined email trigger:** on payment success or on appointment booking? Prod code note says payment-success email is commented out in production. `[lib/eautoFlows/modules/service-hub.ts:125]`
4. **"Payment = Failed"** (Miro): any email expected? Not stated in Jira.
5. **Standalone SI** (Miro lists it): regression only — Jira says "Software Installation itself has no change".
6. **"CC to support@eauto.my" while sender is also support@eauto.my** — confirm recipient is the UCD main user's email.
7. **QA owner, env, deployment date** — all blank.

## Existing repo knowledge / automation to reuse

1. `knowledge/mailtrap.md` (SI/BDP email contracts), `knowledge/eauto-service-hub.md` §Emails, `knowledge/flow-device-purchase.md`.
2. Mailtrap browser reader: `scripts/eauto-quotation-reminder/utils/mailtrap.ts`.
3. Automation benchmark: `app/eauto/12166` + `tests/service-hub` (`specs/create-bdp.spec.ts`, `specs/device-purchase-do-ts0*.spec.ts`; `specs/bo-calendar-limits.spec.ts` has email proxy checks).
