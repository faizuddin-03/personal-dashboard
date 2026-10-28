# EAINT-12429 — related history (2026-10-27)

## Ticket brief

Same content as `data/pipeline/work/EAINT-12429/brief.json` (written 2026-10-27).

1. **High-level scope:**
   1. **Keyword capture:** public posts with purchase phrases ("just bought my car", "new vehicle", "my new ride") become leads; posts without them do not.
   2. **Image capture:** public posts with a vehicle photo become leads; non-vehicle photos do not.
   3. **Public only:** private / friends-only posts are never captured.
   4. **Per platform:** repeat for each platform confirmed in scope (Facebook, Instagram, TikTok, X — "where permitted").
   5. **Lead record:** the lead shows where the SRD says, with the right fields, and no duplicate for the same post [unconfirmed — destination not named].
   6. **Downstream renewal:** a lead saved as a Secarang customer is picked up by the Macrokiosk renewal reminder; opted-out numbers are skipped [unconfirmed].
   7. **Regression:** Secarang quote / renewal purchase and the existing renewal reminder still work.
2. **Estimated testing time:** **5 man-days** (range **4-6**), confidence **low** [unconfirmed]. **No official figure:** Jira "[QA] Est Man-day (cf 10081):** —" (`EAINT-12429-jira.md` line 11); no Miro card found. CR is "On hold" (Jira Description row 6).
3. **Modules / pages to cover:**
   1. **Social Media (Facebook / Instagram / TikTok / X):** public and private test posts — the ticket's capture source.
   2. **CIBO:** Customer Relationship Management (CRM) → Customer Details; Macrokiosk Template Management; Transaction Management — where leads and renewal reminders show [unconfirmed until the SRD names the page].
   3. **Macrokiosk (WhatsApp):** renewal reminder / **Renew Insurance** message with [Pay Now] — downstream of captured leads [unconfirmed].
   4. **Secarang website:** Homepage quote → purchase; Macrokiosk renewal path **Step 2 - All Quotation Page** and **Step 4 - Payment Confirmation Page** — regression (updated 2026-10-28 from Miro `uXjVJ5lCjy4=` frame 29).

## Header

1. **Module / portal:** **Secarang Social Media → renewal leads.** "Affected Portal | Social Media", "Affected Module | Insurance" (`EAINT-12429-jira.md`, Description rows 1-2). Change = capture **leads** from public posts "so Secarang can collect more leads and increase renewal cover notes" (row 3).
2. **No past ticket touches social media.** Grep "tiktok|facebook|instagram|social media|image recognition" over `_reference/sharepoint/`: **0 hits** in any TS text copy.
3. **Nearest existing flow = Secarang Macrokiosk renewal reminder.** It already works with **customer records ("leads") drawn from 3 sources** and sends renewal WhatsApp messages. A social-media lead would most likely feed this flow [unconfirmed — the ticket names no destination].
   1. **Update 2026-10-27 (Scout reply, EAINT-12218 SRD v1.1 read):** the reminder has **3 fixed sources** and **no rule for adding a 4th**.
      1. REQ-003 "Customer Source and Eligibility" (§2.2.4, p.16): "Customer records are drawn from 3 sources: eSTM with insurance, eSTM without insurance, and Secarang." (`_reference/tickets/Studying/EAINT-12218/EAINT-12218_SRD_v1.1_20260903-text.md` line 297).
      2. Assumption #4 (§2.1.1, p.9): "A customer is held under 1 source only, so no customer is sent more than 1 message on the same date." (same file line 160).
      3. Out-of-Scope #5 (§2.1.2, p.10): "Changes to customer registration logic in eSTM and Secarang" (same file line 179).
      4. **So:** a social-media lead gets a renewal reminder **only if it is first saved as a Secarang customer record with a policy expiry date** [unconfirmed]. A separate social-media source would need a **new CR** on the 12218 structure [unconfirmed].
4. **Past tickets kept:** **7**, by **flow** (renewal leads / renewal reminder / opt-out / renewal purchase / reminder to non-buyers / Macrokiosk Pay Now renewal), not by page. (Was 5; EAINT-11864 added 2026-10-27; EAINT-8669 added 2026-10-28 from the Miro board.)
5. **Own official TS:** **none** in the QA Team folder (`fetch.mjs ts` searched synced eAuto CR, Secarang & CIBO CR and eAuto CR snapshots).
6. **Real Jira links:** **none** ("**Links:** —", `EAINT-12429-jira.md` line 12). EAINT-12217 / 12218 / 12443 / 12528 come from the Scout study, not from Jira links.
7. **Sibling EAINT-12528** (video auto-posting) is not a past ticket; its own history file covers cron-posting patterns (`_reference/tickets/Studying/EAINT-12528/EAINT-12528-related-history.md`). Not repeated here.
8. **Dropped from Node's ranking (name-only matches):**
   1. **EAINT-8536** — WhatsApp alert on **failed cover note** to one internal number; event alert, not lead capture.
   2. **EAINT-9024, EAINT-8786, EAINT-8331/8334/7199 ("Remove Discount Line"), EAINT-12107** — Secarang insurer sequence, PDS, discount line, Fiuu payment. No lead or renewal logic.
   3. **EAINT-9641, EAINT-11925, EAINT-9560, EAINT-10082** — eAuto insurance API, campaign popups, UCD commission message. Not Secarang leads.
   4. **Added 2026-10-27 (second ranking):**
      1. **EAINT-9611** — "To call API and policy inception date and premium updated before payment": eAuto UCD price / date re-check before payment (`_reference/tickets/EAINT-9611/EAINT-9611-qa-team-ts-study.md` §1). No lead or renewal logic.
      2. **EAINT-9615** — "To include Tokio Marine Motorbike Category in Insurance Quote Enquiries Listing": one new insurer column on the eAuto BO listing (`_reference/tickets/EAINT-9615/EAINT-9615-qa-team-ts-study.md` §2). Name match only.

## Related past tickets

1. **EAINT-12218** — "⚪[Secarang-Macrokiosk Template] Split Renewal Reminder into 9 Templates by Source and Reminder Point" (Done, fix version "S34.1-20261001 🌞").
   1. **Workbook:** **none** in the QA Team TS folders (`fetch.mjs ts EAINT-12218`: "No workbook matches"). Only production-regression evidence files exist (SharePoint `20261001 - 1st October Morning Deployment Items/EAINT-12218 - Macrokiosk WhatsApp Message Template/`, `library-listing-2026-10-16.json` lines 10590-10626).
   2. **Why related:** defines the **lead sources** for renewal reminders: "Customer records are drawn from eSTM with insurance, eSTM without insurance, and Secarang." (`EAINT-12218-jira.md`, Description row 6). Miro planning card used the older title "Enhance WhatsApp Blast Distribution Based on **Lead Age Ratio** (50:30:20)" (`miro-eauto-qa-resource-planning-full-2026-10-26-part2.md` line 78). Social-media leads would be a 4th source [unconfirmed].
   3. **Update 2026-10-27:** SRD v1.1 fixes the structure at 3 sources × 3 reminder points. REQ-001 (§2.2.4, p.14): "9 Macrokiosk renewal reminder templates are used in total, grouped into 3 sets of 3. Each template is used by 1 source at 1 reminder point." No 4th source exists; a lead reaches the reminder only as a **Secarang** record [unconfirmed].
2. **EAINT-12217** — "⚪[Secarang-Macrokiosk Template] Add "Opt-Out" Button to WhatsApp Message and Skip Sending to Opted-Out Recipients" (Done, S34.1-20261001).
   1. **Workbook:** none in QA Team folders.
   2. **Why related:** any lead contacted by WhatsApp must respect opt-out. Scout study "Suggested test focus" #7 already flags it.
3. **EAINT-12443** — "⚪[Secarang-CIBO] New Module Macrokiosk - Opt Out Listing to Upload Boldpass Report and Mark Phone Numbers as Opted Out" (status "REQ REFINEMENT IN PROGRESS -EAUTO").
   1. **Workbook:** none (not tested yet).
   2. **Why related:** same opt-out data that a social-media lead list must be filtered against [unconfirmed]; in refinement at the same time as 12429.
4. **EAINT-8147** — "[CIBO] To update reminder to renew insurance from Secarang Whatsapp Message template ; include UCD name" (Jira status "Ready For Development").
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8147 - CIBO to Update WhatsApp Message Reminder Template.md` (fetched 2026-10-27).
   2. **Why related:** the **renewal reminder message** sent to a known customer from **CIBO > CRM**; the end of the "lead → renewal" chain.
5. **EAINT-9062** — "[Secarang-Lonpac] Enhancement on Vehicle details API - Policy Renewal Enhancement – 14-Day Grace Period After Expiry" (Done, S23.1-20251104).
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9062 - [Secarang-Lonpac] Enhancement on Vehicle details API - Policy Renewal Enhancement – 14-Day Grace Period After Expiry.md`.
   2. **Why related:** **renewal eligibility window** on Secarang. Decides whether a captured lead can actually buy a renewal cover note. Weak link — regression only [unconfirmed].
6. **EAINT-11864** — "[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase" (Done, fix version "S32.8-20260820🌞"). Added 2026-10-27.
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase.md`; study `_reference/tickets/EAINT-11864/EAINT-11864-qa-team-ts-study.md`.
   2. **Why related:** **pattern only** — a cron picks up people who did not buy and sends a reminder to convert them. Same shape as lead → renewal cover note. Different portal (eAuto UCD, email), so **not** a page match.
7. **EAINT-8669** — "⚪PaymentMacrokiosk Business Messaging for Insurance business - Pay Now, Pay Later & Successful " (Done, fix version "S30.9-20260630 🌚"). Added 2026-10-28.
   1. **Workbook:** **none** in QA Team folders. TS live on Miro board **eAuto - Macrokiosk** (`uXjVJ5lCjy4=`), captured `_reference/miro/uXjVJ5lCjy4=-2026-10-28.md`. QA field: "Charmain Ea Chiang, Muhammad Faizuddin Bin Bidi, Siti Nur Azila" (`EAINT-8669-jira.md` line 7).
   2. **Why related:** this **is** the renewal flow a lead must reach: cron picks up an existing customer record → WhatsApp "Renew Insurance" → [Pay Now] → Secarang Step 4 → payment → cover note. Covers all 3 record sources (Secarang, eAuto Insurance, eAuto eSTM).
   3. **Correction:** the board holds **EAINT-8669 / EAINT-9064 / EAINT-11759 / EAINT-9117** TS, **not** EAINT-12217 / EAINT-12218 TS as guessed on 2026-10-27.

## What was tested before

1. **EAINT-12218** (no TS workbook; evidence file names only):
   1. "TS1 - CIBO Macrokiosk Template Management.png" (`library-listing-2026-10-16.json` line 10597).
   2. "TS2 - Macrokiosk Cronjob Pickup Transaction.png" (line 10590).
   3. "TS3 - Macrokiosk Cronjob Running.png" (line 10611).
   4. Miro scope: "WhatsApp Template Set A - 7 days before expiry (9am) Set B - 14 days before expiry (12pm) Set C - 30 days before expiry (9pm) CIBO > Macrokiosk Template Management (new module) E2E flow test scenarios Functional test on the settings Auto disable and enable according to MK status" (`miro-...-part2.md` line 78).
2. **EAINT-12217** (no TS workbook):
   1. Miro scope: "Transaction Type Secarang Insurance eAuto Insurance eAuto eSTM Transaction Functional Test on the Opt-Out keyword Automation scipt (tbc, not sure can test using WA) Drop the phone no directly after user opt out" (`miro-...-part2.md` line 70).
3. **EAINT-8147** (sheet "EAINT-8331, 8334 & 7199"):
   1. CIBO_WAMSG_TS1 (R10) — "New Transaction - Secarang ⏎ (Homepage)", Private VN, Tokio Marine; expected "Ensure WhatsApp Message sent is showing correctly: ⏎ Dear {owner_name}, ...".
   2. CIBO_WAMSG_TS2 (R11) — Secarang, Company VN, Takaful; expected "Dear {company_name}, ...".
   3. CIBO_WAMSG_TS3 (R14) — eAuto, Individual VN, Takaful; expected adds "...since your purchase from {ucd_company}".
   4. CIBO_WAMSG_TS4 (R15) — eAuto, Company VN, Chubb.
   5. Unnumbered P3 rows R9, R12, R13, R16 — same flow, other insurers.
   6. Entry step in all rows: "Go to CIBO > Customer Relationship Management (CRM) ⏎ 7. In Customer Details page, click [📞Send quotation link] button" (R10).
4. **EAINT-9062** (sheet "EAINT-9062"):
   1. 9062_TS1 (R2) — "Policy expired and is still within 14-day renewal period" → "Able to purchase Lonpac insurance".
   2. 9062_TS2 (R3) — "Policy expired and is more than 14-day renewal period" → "Unable to purchase Lonpac insurance".
   3. 9062_TS3 / TS4 (R4-R5) — "within 60 days before expiry date" → able; "more than 60 days" → unable.
   4. 9062_TS5 (R6) — eAuto portal case.
5. **EAINT-11864** (sheet "11864"; 17 Pass per `EAINT-11864-qa-team-ts-study.md` §1 item 6):
   1. 11864_TS01 (R2) — reminder timing: "if transaction is on 10:59am, email must be sent on 11:00am" (study §3.A item 1).
   2. 11864_TS03 (R4) — second cron run: "After second cronjob runs, no email should be sent again" (per `EAINT-12528-related-history.md` § What was tested before 1.2).
   3. 11864_TS13 (R14) — go-live cutoff: "No email is sent for the quotations that are generated before the go live time" (same source 1.4).
   4. 11864_RG_TS01-04 (sheet "Regression") — "Regression on Insurance Purchase Flow".
6. **EAINT-8669** (Miro `uXjVJ5lCjy4=-2026-10-28.md`, frame 29; added 2026-10-28):
   1. **Size:** "Total Test Scenario as of 10/05/2026: 261" (frame 12, line 25); "Total Test Scenario as of 12/06/2026: 39" (frame 11, line 22).
   2. **Three record sources, three TS sets:** **SECPN_** (Secarang Insurance), **eAIPN_** (eAuto Insurance), **eSTMPN_** (eAuto eSTM), each with Active and Expired (**_EXP_**) branches (frame 29 lines 53, 99, 148).
   3. **SECPN_TS1 — Pay Now happy path, same insurer + add-ons** (line 61): "Existing Secarang trx with Takaful (Comprehensive) + add-ons > Able to get ALL quotations > Trigger MKWA API, send "Renew Insurance" ... > Click [Pay Now] > Redirect to Secarang Step 4 > Proceed to complete the trx, Tx Status = Insurance created".
   4. **SECPN_TS14 / TS15 — no quotation, no message** (line 84): "CJ pickup the trx but no insurance quotation available > Should NOT trigger MKWA API".
   5. **SECPN_TS18 / TS19 — vehicle error, no message** (line 88): "CJ pickup the trx but vehicle details NOT match > Should NOT trigger MKWA API" / "car plate NOT exist".
   6. **SECPN_TS20 — refer risk, no message** (line 90): "CJ pickup the trx but ALL insurance hit refer risk error > Should NOT trigger MKWA API".
   7. **SECPN_EXP_TS1 — expired Pay Now link** (line 62): "Click [Pay Now] > Payment link expired > Redirect to Secarang Step 2".
   8. **eSTMPN_TS1 — eSTM record, no past insurance** (line 156): "Existing eAuto eSTM trx > Able to get ALL quotations > Trigger MKWA API, send "Renew Insurance" with Takaful (Comprehensive) + default add-ons".
   9. **Cron pickup rules** (frame 30, line 190): "Whether pickup the trx? / (30 / 14 / 7 and new insurance payment != failed / OK)" and "Transaction Payment = Failed / OK on 30 days, wont pickup on 14 / 7 days".
   10. **Not captured:** the board's **25 tables** (1969 table cells) — the capture keeps text, stickies and shapes only (file header line 6). CIBO functional and Pay Later TS may sit there [unconfirmed].

## Reusable scenarios

1. **Lead pickup as Secarang source** — adapt **12218 TS2** ("Macrokiosk Cronjob Pickup Transaction"). **Update 2026-10-27:** 12218 SRD v1.1 has no 4th source (REQ-003), so check a captured lead is picked up **under the Secarang template set**, **only on the exact reminder point** ("A customer is included in a run only where the policy expiry date falls exactly on the reminder point for that run.", REQ-003), and **only once per date** (Assumption #4) [unconfirmed until the 12429 SRD names the destination].
2. **Opt-out skip** — adapt **12217** "Drop the phone no directly after user opt out": an opted-out number captured again from a social post must **not** be messaged [unconfirmed].
3. **Lead record in CIBO** — adapt **8147 CIBO_WAMSG_TS1-TS4** entry "CIBO > Customer Relationship Management (CRM) ⏎ ... Customer Details page": verify where the captured lead shows and what fields it holds, once the SRD names the page.
4. **Private vs company** — reuse the **8147 TS1 vs TS2** split (owner_name vs company_name) if leads carry a name.
5. **Renewal eligibility** — reuse **9062_TS1-TS4** as regression: a lead whose policy is outside the renewal window cannot be sold a renewal.
6. **Template status / pause** — adapt **12218 TS1** ("CIBO Macrokiosk Template Management") only if a new template is added for social-media leads [unconfirmed].
7. **No duplicate on second scan** — adapt **11864_TS03 — second cron run sends nothing again**: the same post scanned twice gives one lead (added 2026-10-27) [unconfirmed rule].
8. **Go-live cutoff** — adapt **11864_TS13 — no email for quotations before go-live**: posts made before go-live are not captured, if the SRD sets a cutoff (added 2026-10-27) [unconfirmed].
9. **Lead → renewal purchase E2E** — adapt **SECPN_TS1 — Pay Now happy path** and **eSTMPN_TS1 — eSTM record with default add-ons**: a captured lead gets "Renew Insurance", clicks [Pay Now], pays, and the cover note is created (added 2026-10-28) [unconfirmed until the 12429 SRD says leads enter this flow].
10. **No message when the lead cannot be quoted** — reuse **SECPN_TS14 — no quotation**, **SECPN_TS18 / TS19 — vehicle details not match / car plate not exist**, **SECPN_TS20 — refer risk**: a lead with a bad plate or no quote gets no WhatsApp (added 2026-10-28). Matters because a social post gives no verified plate or IC [unconfirmed].

## Known traps

1. **Meta template approval delay.** "Dev side's ETA need additional 3 days buffer to send the template to Meta for approval before QA can test" (`miro-...-part2.md` line 69). Applies if leads get a new WhatsApp template.
2. **Macrokiosk staging access is limited and paid.** "BA need to let Macrokiosk side know how long we need the access for our testing purpose, so need to share the QA testing effort to MJ" (`miro-...-part2.md` line 72). Also: "Do not ask for a Macrokiosk staging-access extension until the deploy date is fixed; check for extra fees first." (`knowledge/teams-decisions-by-ticket.md` § EAINT-11759 item 4).
3. **Templates can be paused by Meta.** "Template content was revised to remove promotional words after Meta paused it." (`knowledge/flow-secarang-insurance.md` § Additions 2026-10-23, citing EAINT-12168). Lead-marketing wording carries the same risk [unconfirmed].
4. **WhatsApp opt-out is hard to automate.** "Automation scipt (tbc, not sure can test using WA)" (`miro-...-part2.md` line 70).
5. **Production check not possible.** "Unable to test in production as QA is unable to get the insurance quotation from Macrokiosk" (`knowledge/production-regression-scope.md` line 179, Deployment Checklist 20261001(AM) R46). 12217 prod check = "No" (same file line 850).
6. **Date patching for renewal tests.** "Ask dev to patch Creation Date?" (8147 sheet, R9-R16 step 5). Expiry-based pickups need dev patching.
7. **Free-text opt-outs are patched by hand** until 12443 ships: "until then patched manually" (`knowledge/flow-secarang-insurance.md` § Additions, citing EAINT-12443).
8. **Messaging must be enabled.** "Note: ensure messagebird is enabled" (8147 sheet, R9-R16 Pre-Requisite).
9. **Lead without a policy expiry date never gets a reminder** (added 2026-10-27). 12218 SRD Assumption #6 (§2.1.1, p.9): "Customer records from all 3 sources carry a reliable policy expiry date." (`EAINT-12218_SRD_v1.1_20260903-text.md` line 162). A social post gives no expiry date, so test data must supply one [unconfirmed].
10. **Cron cannot be triggered on demand** (added 2026-10-27). Rule on file: "can't trigger; testing sets it to every 30 mins from the hour" [answered by Faizuddin, memory "eAuto cron: interval, not on demand"]. If lead capture runs on a cron, plan waits around that interval [unconfirmed — 12429 names no trigger].
11. **Message trigger limit** (added 2026-10-28). "MacroKiosk Trigger Limit: Max. 3 times" (Miro `uXjVJ5lCjy4=`, frame **MacroKiosk High Level Test Plan**, line 17).
12. **A lead needs owner ID + plate to renew** (added 2026-10-28). Identity check before payment: "Individual / - IC (first 6 digits) / - IC (last 6 digits) / Company / - Old BRN (last 6 digits) / - New BRN (first 6 digits) / - New BRN (last 6 digits)" (frame 17, line 32). A social post gives neither, so test data must supply both [unconfirmed].
13. **eSIM levers for cron negatives** (added 2026-10-28): "XG for vehicle details not found / - MD for TokioMarine refer risk / - XF for Lonpac refer risk / - XH for both refer risk" (frame 22, line 40).
14. **Cron bugs already found on this flow** (EAINT-8669 sub-tasks, `EAINT-8669-jira.md` line 13): "EAINT-11715 [Secarang - Cronjob] Picks up transactions older than 1 year (2024 transaction picked up in 2026)"; "EAINT-11504 [Secarang - Cronjob] WhatsApp Renewal Reminder Triggered for Non-Car Vehicle Types (e.g. Motorcycle), Should Only Trigger for Car Transactions". Same checks apply to social leads (age, car only) [unconfirmed].

## Past QA-Issues mentioned

1. **EAINT-12390** — "[Secarang - Macrokiosk Flow] Renewal Reminder - eSTM transaction shows an expiry date in the past" (`EAINT-12218-jira.md` line 13, Sub-tasks).
2. **EAINT-12392** — "[Secarang - Macrokiosk Flow] Renewal Reminder - Date format and opt-out line do not match the SRD, in all 3 message sets" (same line).
3. **EAINT-12410** — "[Secarang - CIBO] Macrokiosk Template Management - Template rows show in the wrong order in all 3 cron job groups" (same line).
4. **EAINT-12413** — "[Secarang - Macrokiosk Flow] Template Paused - Notification email does not go to the recipients in the SRD" (same line).
5. **EAINT-12199** — "[eAuto - Insurance] Mailtrap not receiving email after cronjob runs" (under EAINT-11864 — quotation reminder email; `EAINT-11864-jira.md` line 13, Sub-tasks). Added 2026-10-27.
6. **EAINT-12213** — "[eAuto - Insurance] Email is generated for insurance that does not have eSTM" (same source). Added 2026-10-27.
7. **EAINT-12217, 12443, 8147, 9062:** no QA-Issue keys in sheets or Jira sub-tasks.
8. **EAINT-8669 — Macrokiosk Pay Now / Pay Later:** **107 sub-tasks** (`EAINT-8669-jira.md` line 13; added 2026-10-28). Cron / lead-pickup ones:
   1. "EAINT-11569 [Secarang - Cronjob] Subsequent WhatsApp renewal triggers (14/7 day) not firing after first 30-day message when transaction has no Payment = OK".
   2. "EAINT-11570 [Secarang - Cronjob] WhatsApp not triggered when ANY single insurance API hits refer risk — should fire as long as at least one insurer has valid quotation".
   3. "EAINT-11651 [Secarang - Cronjob] Still picks up transactions after Payment = OK".
   4. "EAINT-11712 [Secarang - Cronjob] Normal + retry cronjob still pick up transactions with prior vehicle details error".
   5. "EAINT-11722 [Secarang - Cronjob] Only sends 1 WhatsApp per day for same transaction (should be 3x per day)".
   6. "EAINT-11512 [S][Secarang - Cronjob] Test Data Blocker - Secarang & eAuto Transactions Shared to Dev Hit Refer Risk, Unable to Send WhatsApp via MacroKiosk API".
   7. Also EAINT-11504 and EAINT-11715 (Known traps #14).

## Estimated testing effort (Faizuddin, 2026-10-27)

1. **Comparable tickets:**

| Ticket | TS count (text copy) | [QA] Est Man-day (cf 10081) | Source |
|---|---|---|---|
| EAINT-12218 | no workbook; **3** evidence TS (TS1-TS3) | **6** | `_reference/tickets/Studying/EAINT-12218/EAINT-12218-jira.md` line 11, "[QA] Est Man-day (cf 10081):** 6"; Miro "Est. Testing Mandays: 5 days (1 QA) Base Testing Time: 3 days Buffer (Req Change + Bug Fix + Retest Bug): 2 days" (`miro-...-part2.md` line 78) |
| EAINT-12217 | no workbook | **3** | `EAINT-12217-jira.md` line 11; Miro "Est. Testing Mandays: 2 days (1 QA)" (`miro-...-part2.md` line 70) |
| EAINT-8147 | **4** numbered (CIBO_WAMSG_TS1-TS4) + 4 unnumbered = **8** rows | **—** | `EAINT-8147-jira.md` line 11 |
| EAINT-9062 | **5** (9062_TS1-TS5) | **—** | `EAINT-9062-jira.md` line 11 |
| EAINT-12443 | none (in refinement) | **—** | `EAINT-12443-jira.md` line 11 |
| EAINT-8669 | Miro "Total Test Scenario as of 10/05/2026: 261" | **—** | `_reference/tickets/Studying/EAINT-8669/EAINT-8669-jira.md` line 11; Miro `uXjVJ5lCjy4=-2026-10-28.md` line 25. Full new payment flow, far larger than 12429; size reference only (added 2026-10-28) |
| EAINT-11864 | 13 TS + 4 regression = **17** | **2.5** | `_reference/tickets/Studying/EAINT-11864/EAINT-11864-jira.md` line 11, "[QA] Est Man-day (cf 10081):** 2.5" (added 2026-10-27) |

   1. EAINT-12429 own field: "[QA] Est Man-day (cf 10081):** —" (`EAINT-12429-jira.md` line 11).
   2. Scout study quotes **no** manday figure (no SRD, no Miro card found).
2. **Expected TS count for EAINT-12429:** **12-20** [unconfirmed]. Why: keyword match + no-match, image match + non-vehicle image, public vs private, × each platform in scope (up to 4), plus duplicate, lead record, opt-out skip and renewal regression. Larger than 12217 (one rule), close to 12218 (multi-source pipeline).
3. **Estimate in man-days:** **5** (range 4-6) [unconfirmed].
   1. **TS drafting:** 1.0 — no SRD yet; rules must be pinned down first.
   2. **Test execution:** 2.5 — needs test social accounts and public posts on each platform, plus checks in CIBO / Macrokiosk.
   3. **Retest / QA-Issue buffer:** 1.5 — 12218 needed 4 QA-Issues and Miro buffer of 2 days; AI image results have no pass threshold.
   4. **Automation build:** 0 — external platforms + AI recognition + WhatsApp ("not sure can test using WA", 12217 Miro) [unconfirmed].
4. **Confidence:** **low**.
   1. Raises it: an SRD naming platforms, where leads land, lead fields, keyword list, image threshold and run trigger.
   2. Raises effort: all 4 platforms in scope, a new Meta-approved template, Macrokiosk access window, or a new CIBO listing.
   3. Lowers effort: scope cut to 1-2 platforms ("where permitted"), or CR dropped — it is "On hold" (Description row 6).
   4. Official figure lives in the QA Portal; not opened.

## Sources read

1. `_reference/tickets/Studying/EAINT-12429/EAINT-12429-study.md` (Scout study).
2. `_reference/tickets/Studying/EAINT-12429/EAINT-12429-jira.md`.
3. `_reference/tickets/Studying/EAINT-12528/EAINT-12528-related-history.md` (sibling; reused dropped-list reasoning).
4. `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8147 - CIBO to Update WhatsApp Message Reminder Template.md` (fetched 2026-10-27 via `fetch.mjs ts`).
5. `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9062 - ... 14-Day Grace Period After Expiry.md`.
6. `fetch.mjs ts` for EAINT-12218, EAINT-8669, EAINT-9064, "macrokiosk": **no workbook**.
7. Jira captures refreshed 2026-10-27 via `fetch.mjs issue`: EAINT-12218, EAINT-12217, EAINT-12443, EAINT-8147. EAINT-9062 capture 2026-10-27 5:24 pm (existing).
8. `_reference/miro/miro-eauto-qa-resource-planning-full-2026-10-26-part2.md` lines 69-72, 78, 537.
9. `_reference/sharepoint/library-listing-2026-10-16.json` (grep macrokiosk|renewal|lead).
10. `knowledge/flow-secarang-insurance.md` (§ Additions 2026-10-23, § Update 2026-10-27), `knowledge/production-regression-scope.md`, `knowledge/teams-decisions-by-ticket.md` § EAINT-11759, `knowledge/README.md`.
11. Greps over `_reference/sharepoint/` for social-media and lead words (0 relevant hits).
12. **Read 2026-10-28:** Miro board **eAuto - Macrokiosk** (`uXjVJ5lCjy4=`) → `_reference/miro/uXjVJ5lCjy4=-2026-10-28.md` (187 text items; 25 tables not captured). It holds EAINT-8669 / 9064 / 11759 / 9117 TS, not 12217 / 12218. (2026-10-27 line said not signed in; Faizuddin signed in 2026-10-28.)
13. **Corrected 2026-10-27:** TS studies now exist and were read: `_reference/tickets/EAINT-11864/EAINT-11864-qa-team-ts-study.md` (kept), `_reference/tickets/EAINT-9611/EAINT-9611-qa-team-ts-study.md` and `_reference/tickets/EAINT-9615/EAINT-9615-qa-team-ts-study.md` (dropped). Earlier line said none existed; they were written later the same day.14. **Added 2026-10-27:** Scout reply on EAINT-12218 sources; `_reference/tickets/Studying/EAINT-12218/EAINT-12218_SRD_v1.1_20260903-text.md` (lines 145, 160, 162, 179, 297 checked).
15. **Added 2026-10-27:** `_reference/tickets/Studying/EAINT-11864/EAINT-11864-jira.md` line 11; `data/pipeline/answers.json` (EAINT-12528 social-account answer: "2. ignore first. i will come back to this later", scope ticket:EAINT-12528 — not reused here).
16. **Added 2026-10-28:** `_reference/tickets/Studying/EAINT-8669/EAINT-8669-jira.md` (captured 28/10/2026 9:33 am, lines 7, 11, 13).
