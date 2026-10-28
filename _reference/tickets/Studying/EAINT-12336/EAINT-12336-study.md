# EAINT-12336 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-UCD & BackOffice] To Reconcile Onboarding Payment Transactions from Fiuu Payment Gateway"
2. **Jira status:** **To Do** (Task). Created 2026-09-11 10:25. Updated 2026-09-15 16:21.
3. **Priority:** Medium.
4. **Fix version:** **none.** Labels: "260907-260911", "ProductBacklog", "September2026".
5. **QA (Jira cf[10041]):** **blank.**
6. **BA:** Lim Yi Link — Jira assignee **and** reporter [Jira assignee is the BA, not the dev].
7. **Dev:** **not named** anywhere in the material.
8. **Exp. Deploy Date / ETA for Testing / [QA] Est Man-day:** all **blank**.
9. **Test env:** **not stated.**
10. **Links / sub-tasks / parent:** none. **Comments:** 0. **Attachments:** none listed — **no SRD**.
11. **Source ticket:** "EAUTO-1057 (Enhancement Request Form V1, 11.09.2026)" `[Jira description, row 6]`.
12. **CR Teams group:** created 2026-10-19; Faizuddin is a member (see Teams below).
13. **Last Jira capture:** "27/10/2026, 8:03:37 pm" `[EAINT-12336-jira.md:1]`.

## Changes since last study (2026-10-27)

Compared: previous capture (2026-10-27 17:32) vs current capture "27/10/2026, 8:03:37 pm".

1. **Status:** no change — "To Do" `[EAINT-12336-jira.md:6]`.
2. **Fix version:** no change — "—" `[EAINT-12336-jira.md:8]`.
3. **Description:** no change — rows 1–6 match the study word for word.
4. **New comments:** none — "## Comments (0)" `[EAINT-12336-jira.md:27]`.
5. **New attachments:** none — attachment list still empty. **Still no SRD.**
6. **Other fields:** no change. "**Updated:** 2026-09-15T16:21:59.280+0800" `[EAINT-12336-jira.md:10]` — Jira itself records **no edit since 2026-09-15**. The re-study trigger is [unconfirmed: likely a capture-time difference only].
7. **New local file (not Jira):** `EAINT-12336-related-history.md` now sits in the study folder. Read and added to Sources read; it adds context only and makes no part of this study wrong.
8. **Repo search:** no new hits in `_reference/teams/`, `knowledge/` or `lib/ticketStudies.ts`.

## Sources read

1. `_reference/tickets/Studying/EAINT-12336/EAINT-12336-jira.md` — Jira capture "27/10/2026, 8:03:37 pm": fields, description, 0 comments, empty attachment list.
2. `_reference/tickets/Studying/EAINT-12336/EAINT-12336-related-history.md` — past-ticket study (10168, 12055, 12113, 12153, 12257). No SRD, image, mock-up or `-text.md` copy exists in the folder.
3. `_reference/tickets/EAINT-12336/` — **does not exist.**
4. `_reference/teams/` — no file named for 12336. One hit: `_reference/teams/eAuto-Secarang-Main-Group.md:419`. The dedicated CR group chat is **not exported**.
5. `knowledge/` — grep "EAINT-12336" = **0 hits.** Context read: `knowledge/README.md`, `knowledge/eauto-payments.md` §"UCD onboarding payment", `knowledge/flow-payment-channels.md` §9, `knowledge/flow-ucd-onboarding.md`, `knowledge/flow-bo-shell.md` §"Reconciliation Summary Listing", `knowledge/business-rules-from-test-scenarios.md` §11.
6. `lib/ticketStudies.ts` — **no entry** for 12336.
7. Also found: `lib/eautoFlows/modules/onboarding.ts:816, 852` (one-line mentions); `_reference/tickets/Studying/EAINT-12097/EAINT-12097-study.md:118` (same Teams line).
8. **Not read:** source ticket **EAUTO-1057** (Enhancement Request Form) — not in the repo.

## What changes

1. **Portals (verbatim, Jira description row 1):** "eAuto – Used Car Dealer Portal (Web app)", "eAuto – Used Car Dealer Portal (Mobile app)", "eAuto – Back Office User Portal".
2. **Modules (verbatim, row 2):** "Pre-application", "Onboarding", "Back Office", "UCD Portal".
3. **Request (verbatim, row 3):** "Onboarding Reconciliation – Fiuu Payment Gateway. Reconcile all payment transactions for onboarding, covering both pre-application and application."
4. **Why — existing issue (verbatim, row 4):** "Onboarding payment is collected through the Fiuu payment gateway, which differs from the current payment flow." / "Fiuu transactions fall under the "Other" category and are not reconciled in the Reconcile Summary listing." / "Reconciliation is performed manually."
5. **Expected new handling (verbatim, row 5):**
   1. "The system shall match records with Transaction Status "Approved" and Registration Fee "OK" against the transaction list from the Fiuu listing."
   2. "The Fiuu transaction listing shall be downloaded from Fiuu's merchant portal. The Transaction ID is available in the Excel file downloaded from that portal."
   3. "Reconciliation shall be performed on the same page as the current reconciliation."
6. **Readiness caveat (verbatim, row 6):** "Integration readiness with Fiuu is not yet confirmed:" / "The integrating partner has not confirmed the technical feasibility of this integration." / "It has not been confirmed with the integrating partner whether a new API specification document or Integration Design Document (IDD) is required."

## Requirements

1. **No SRD exists.** The Jira description rows 3–6 are the only requirements.
2. **R1 — match rule:** onboarding record with "Transaction Status "Approved"" **and** "Registration Fee "OK"" is matched against the Fiuu listing. `[row 5]`
3. **R2 — source file:** Fiuu listing = Excel downloaded from **Fiuu merchant portal**; key = **Transaction ID**. `[row 5]`
4. **R3 — location:** "same page as the current reconciliation". `[row 5]` Which BO page is meant is not named [unconfirmed: likely the eAuto Reconciliation Summary Listing, per row 4 "Reconcile Summary listing"].
5. **R4 — scope:** both **pre-application** (RM 108) and **application** (RM 990) payments. `[row 3; amounts from knowledge/eauto-payments.md §"UCD onboarding payment"]`
6. **Not stated:** how the Fiuu file gets into eAuto (manual upload vs API), schedule, what happens on mismatch, which columns show, role/permission, UCD-side change.

## New vs existing behaviour

1. **Existing:** Fiuu onboarding payments sit under "Other" and are **not reconciled**; Finance reconciles by hand. `[Jira row 4]`
2. **Existing reconciliation** is RHB-based: "Finance uploads the RHB file to Synology; auto-reconciliation runs at 10am and 12pm" `[knowledge/business-rules-from-test-scenarios.md §11 #3, from SharePoint TS #008 EAINT-10168]`. Matched pair key today = "Payment Ref No." `[knowledge/flow-bo-shell.md §Reconciliation Summary Listing, SRD EAINT-12055 Assumption 1]`.
3. **New:** a **second source** (Fiuu Excel) and a **different key** (Fiuu **Transaction ID**) on the same page. `[Jira row 5]`
4. **Contradicts / extends knowledge:**
   1. `knowledge/business-rules-from-test-scenarios.md §11 #2` lists reconciled modules "STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM, eVOC, JomCheck, Insurance, Wholesale-STMS" — **onboarding is absent**; this ticket adds it.
   2. The **"Other" category** is not documented in `knowledge/`. RHB Ref 2 has an "OTH" code `[knowledge/eauto-payments.md §References #1]` — link to Jira's "Other" is [unconfirmed].
   3. `knowledge/flow-payment-channels.md §9 #5`: pre-application listing "has no payment column" and shows only paid records. The Jira match rule names "Registration Fee "OK"" — that column exists on the **Application** listing only (§9 #4). How pre-application records satisfy "Registration Fee OK" is unclear.
   4. `knowledge/flow-payment-channels.md §9 #1`: a Fiuu retry reuses the payment reference "with a new transaction id". So one onboarding payment can have **several Fiuu Transaction IDs** (failed + successful) `[unconfirmed: code analysis, 2026-10-22]`.

## Teams decisions (verbatim)

1. `[_reference/teams/eAuto-Secarang-Main-Group.md:419, 2026-10-19 16:07, Mei Jia Chee]` "Will create 2 new CR groups: / EAINT-12336 🔴[eAuto-UCD & BackOffice] To Reconcile Onboarding Payment Transactions from Fiuu Payment Gateway / EAINT-12097 ⚪[eAuto-UCD] Chubb - Mandatory UBO Capture Before Policy Inception with Front-End CTOS/B360 Display / As of now, will include the following team members into each CR Teams group: / … Muhammad Faizuddin Bin Bidi …"
2. **No decisions recorded.** The CR group chat is not exported to `_reference/teams/`.

## Dependencies / related tickets

1. **EAUTO-1057** — source Enhancement Request Form, 11.09.2026. `[Jira row 6]`
2. **Onboarding payment tickets** (from `lib/eautoFlows/modules/onboarding.ts:848-852`): EAINT-12153 (FPX B2B), EAINT-12257 (DuitNow QR), EAINT-12259 (Card), EAINT-12414, EAINT-12588. Every channel these add = a Fiuu transaction to reconcile [unconfirmed].
3. **Reconciliation prior art:** EAINT-10168 (Recon Summary Report), EAINT-11883, EAINT-11887 (Insurance user view), EAINT-12055 (matched-pair exclusion), EAINT-12113 (Approved Date listing). `[knowledge/business-rules-from-test-scenarios.md §11]`
4. **Fiuu external dependency:** partner feasibility + possible API spec / IDD not confirmed. `[Jira row 6]`

## Open questions / risks for testing

1. **No SRD.** Ticket is To Do, ProductBacklog, no fix version, no QA, no dev. Do not draft TS until an SRD is attached.
2. **Feasibility unconfirmed** — the whole design may change once Fiuu answers (file upload vs API). `[Jira row 6]`
3. **Which page:** "same page as the current reconciliation" — Reconciliation Summary Listing, Summary Report, or eAuto Plus report? `knowledge/flow-bo-shell.md:269-274` lists three recon pages.
4. **How the Fiuu Excel enters eAuto:** BO upload, Synology like RHB, or Fiuu API? Not stated.
5. **Match key:** Fiuu **Transaction ID** vs eAuto onboarding **Payment ID** (`P…` / `A…`). Which eAuto field holds the Fiuu Transaction ID? Retries create new transaction ids (see New vs existing #4.4).
6. **Pre-application:** has no "Registration Fee" column; what "Registration Fee OK" means for the RM 108 leg is unclear.
7. **"Transaction Status Approved"** — which status field? `knowledge/flow-ucd-onboarding.md` describes "two independent status fields"; Approved may mean BO approval, not payment [unconfirmed].
8. **Timing:** approved records vs payment date — same cross-day / cross-month rules as EAINT-12055? Weekend rule?
9. **Mismatch handling:** listed as discrepancy? JPJ Hasil does not apply to onboarding — what replaces it on Summary?
10. **B2B pending payments** (EAINT-12153) and **DuitNow QR** — included? A B2B payment can approve days later.
11. **Two Fiuu merchant accounts** (Secarang vs eAuto) `[knowledge/eauto-payments.md:178]` — the file must come from the eAuto account; risk of mixing.
12. **Mobile app** named in Affected Portal — what changes on the UCD side (web or mobile) is not stated.
13. **Test data:** need a Fiuu merchant-portal Excel export from **sandbox**. Access to the sandbox merchant portal is not recorded in `knowledge/`.
14. **Existing records:** retroactive matching on deploy (like EAINT-12055)? Not stated.
15. **Fixed dropdown regression row:** EAINT-10168 A&FERSL-TS19 expects the Transaction Type dropdown "contains exactly" 13 options `[EAINT-12336-related-history.md, Known traps #7]`. An onboarding type would break that row unless it is updated.

## Suggested test focus

1. **Match:** Approved + Registration Fee OK record with its Transaction ID in the Fiuu file → matched / not listed as discrepancy.
2. **No match cases:** record missing from Fiuu file; Fiuu row with no eAuto record; same ID different amount; Registration Fee Failed / Pending UCD; not Approved.
3. **Both legs:** pre-application RM 108 and application RM 990, separately and for the same dealer.
4. **Every channel:** Card, FPX Personal, FPX Business (B2B pending → approved), DuitNow QR.
5. **Retry:** failed then successful payment — only the successful Transaction ID matches.
6. **Dates:** cross-day, cross-month, weekend; filter rules ("Please select both Payment Date (From) and Payment Date (To)").
7. **Category:** onboarding no longer under "Other"; correct type label and filter.
8. **Regression:** existing RHB reconciliation for all 13 modules unchanged; 10am / 12pm runs; EAINT-12055 pair exclusion; Insurance-user view (EAINT-11887).
9. **Roles:** Finance / Hub Admin with and without permission.
10. **Automation reuse:** onboarding fixtures + Fiuu simulator driver in `scripts/eauto-duitnow-qr` and `scripts/eauto-payment-channels` (`knowledge/flow-payment-channels.md`) to create paid records.

## Knowledge candidates

1. **Onboarding (Fiuu) payments are not reconciled today**; they fall under "Other" in the Reconcile Summary listing and Finance reconciles them by hand. Source: Jira EAINT-12336 description row 4 (captured 2026-10-27). Target: `knowledge/business-rules-from-test-scenarios.md §11` or `knowledge/flow-payment-channels.md`.
2. **Planned onboarding recon key = Fiuu Transaction ID** from the Fiuu merchant-portal Excel; match on "Transaction Status "Approved" and Registration Fee "OK"". Source: Jira EAINT-12336 description row 5. Tag [planned, no SRD].
3. **EAINT-12336 CR Teams group** created 2026-10-19 16:07 by Mei Jia Chee; Faizuddin is a member. Source: `_reference/teams/eAuto-Secarang-Main-Group.md:419`. Target: `knowledge/teams-decisions-by-ticket.md`.
