# EAINT-12386 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-UCD] JomCheck: Remove Special Character from Chassis No & Auto-Resubmit on Empty Report"
2. **Jira status:** **REQ REFINEMENT IN PROGRESS -EAUTO** (Task). Updated "2026-10-26T15:21:35.855+0800".
3. **Priority:** Medium.
4. **Fix version:** **none** ("—"). Labels: 260921-260925, ProductBacklog, September2026.
5. **QA (Jira cf[10041]):** **blank** ("—").
6. **BA:** Chee Mei Jia — Jira assignee + reporter, SRD author ("Revised By", SRD §1.3), opened the CR group (`[from Teams EAINT-12386, 2026-10-12 15:34]` "we will use this CR group for ... EAINT-12386").
7. **Dev:** Goh Kai Jiaeh (KJ) — `[from Teams EAINT-12386, 2026-10-13 09:35]` "Hi Mei Jia, i will take a look this." BA re-checked on 2026-10-23 08:39: "just to check that this ticket now still under u ya?" — no direct answer in the export.
8. **Deployment date:** **none.** Jira "Exp. Deploy Date (cf 10087)", "ETA for Testing (cf 10057)" and "[QA] Est Man-day (cf 10081)" all "—".
9. **Test env:** **not stated** in Jira, SRD or Teams.
10. **Links / sub-tasks / parent / comments:** none (0 comments).
11. **SRD stage:** latest is **v0.4, "26.10.2026 (Monday)"** (SRD header "Latest Revision Date"). Still a draft — SRD §1.3: "until it reaches Version 1.0, at which point it is finalized". Not baselined.
12. **Source tickets (SRD §1.5):** "EAUTO-1067 — JOMCHECK ENHANCEMENT" (Source ticket) and "CCB-987" (Cross-department ticket).
13. **Requirement IDs:** **EAINT-12386-REQ-001 to REQ-006** (SRD §2.2.4–§2.2.6).

## Changes since last study (2026-10-27)

1. **Status:** **no change** — still "REQ REFINEMENT IN PROGRESS -EAUTO". Jira "Updated" is the same "2026-10-26T15:21:35.855+0800" as the earlier capture.
2. **Fix version:** **no change** — still "—".
3. **Description:** **no change** — General Information rows 1–6 and SRD table rows 1–4 are word for word the same.
4. **New comments:** **none** — "## Comments (0)".
5. **New attachments:** **none** — same four SRD .docx files (v0.1–v0.4), same sizes and upload times.
6. **Teams:** **no new messages** — export still ends at 2026-10-26 15:22.
7. **What did change — the SRD is now readable.** Text copies `SRD_EAINT-12386_v0.X_YYYYMMDD-text.md` exist for all four versions. The earlier study was built from Jira and Teams only. This study now reads **SRD v0.4 in full**, and these earlier points were wrong or open and are now fixed:
   1. **Strip is in the backend, not on screen.** SRD REQ-002 c: "Value displayed on the UCD screen remains as keyed in, including the special characters. Trimming is not visible to UCD."
   2. **Field limit stays 30.** SRD REQ-001 New Expected a: "Field accepts alphanumeric and special characters, with a maximum of 30 characters." The 17 limit is a **backend check after trimming**, not a field limit (REQ-003).
   3. **All special characters go**, including `-`. SRD REQ-002 a: "Backend removes all special characters from the Chassis No before submitting the request to JomCheck."
   4. **Error message known:** "Invalid Chassis Number." (REQ-003, REQ-004).
   5. **Cron numbers known (but pending):** REQ-005 c: "Cron job retries the request every 1 minute, up to a maximum of 5 attempts. Interval and number of attempts are pending confirmation with developer."
   6. **End state after all retries known:** REQ-005 d: "When the report is still empty after the maximum number of attempts, system performs no further action. Refund is handled manually by Ops team."
   7. **New requirement found:** REQ-006 — a note on the JomCheck payment done page: "Please try again to download report 10 mins later."
   8. **Old reports untouched:** REQ-002 Example 3: "JomCheck report purchased before deployment ⏎ a. Report remains as purchased, with no resubmission and no change." (⏎ = line break in the copy).

## Sources read

1. `_reference/tickets/Studying/EAINT-12386/EAINT-12386-jira.md` — Jira capture 27/10/2026 8:15:44 pm: fields, description, 0 comments, attachment list.
2. **SRD text copies** (toolbox conversions; images not kept):
   1. `SRD_EAINT-12386_v0.4_20261026-text.md` — **read in full.** Header "Version 0.4", "26.10.2026 (Monday)". **All requirements below come from this.**
   2. `SRD_EAINT-12386_v0.1_20261009-text.md`, `..._v0.2_20261022-text.md`, `..._v0.3_20261023-text.md` — not read line by line; their changes are taken from the v0.4 revision history (§1.3) and the Appendix change log.
   3. The four `.docx` originals — not opened directly (text copies used). SRD images (if any) **not read**: "images not kept".
3. `_reference/tickets/Studying/EAINT-12386/EAINT-12386-related-history.md` — past tickets (6475, 9203, 8638, 10937, 12339, 12412), reusable scenarios, traps, eSim check.
4. `_reference/teams/EAINT-12386-JomCheck-Chassis-Special-Chars.md` — CR group chat, 2026-10-12 to 2026-10-26 15:22. Images in it ([attachment/image], [image]) were not captured — not read.
5. `_reference/teams/_chat-list.md` — lists the CR group.
6. `knowledge/README.md`, `knowledge/flow-jomcheck.md` (§1, §4, §5a, §7o, §9g, status rule item 12), `knowledge/esim.md`, `knowledge/cr-ledger.md` (lines 40, 839, 887, 1019), `knowledge/teams-decisions-by-ticket.md` line 258–259.
7. `lib/ticketStudies.ts` — EAINT-12386 appears only as a "related" key of EAINT-12412 (line 1235). No own study entry.
8. `_reference/tickets/EAINT-12386/` — **does not exist.** No HTML captures, no TS, no handoff.

## What changes

1. **Portal:** "1. UCD ⏎ 2. Cron Job" `[SRD §2.2.1 row 2]`. **Module:** "JomCheck" `[§2.2.1 row 3]`.
2. **Overview (verbatim, SRD §2.1 row 2.1.1):** "Allow UCD to key in Chassis No as printed in the VOC. System removes special characters at backend before submitting the Chassis No to JomCheck."
3. **Key value (verbatim, §2.1 row 2.1.2):** "Reduce number of empty and failed JomCheck reports, which reduces number of refund transactions."
4. **External rule (verbatim, §2.1.1 Assumption 1):** "JomCheck precheck API accepts alphanumeric only, with a maximum of 17 characters, as advised by ezAuto."
5. **Affected pages (verbatim, §2.2.3):**
   1. "UCD — JomCheck" — "Chassis No input at frontend, backend trimming, length validation before payment and submission to JomCheck."
   2. "UCD — JomCheck Payment Done" — "Note displayed to UCD when the report returned by JomCheck is empty."
   3. "Cron Job — JomCheck" — "Resubmission to JomCheck when an empty report code is received, excluding Invalid Chassis Number cases."
6. **Terms (SRD §1.4):** "JomCheck Precheck API" = "JomCheck API called before payment to check the Chassis No or Vehicle No. Also referred to as enquiry API." "JomCheck Submission API" = "JomCheck API called to request the report after payment is made."

## Requirements (SRD v0.4)

1. **REQ-001 — Chassis No field (frontend unchanged).**
   1. "Frontend handling remains as it is today. Field accepts alphanumeric and special characters, with a maximum of 30 characters." "Field is mandatory." "No trimming is done at frontend."
   2. Acceptance: "JTD-12345-678901234" → "Value is accepted in the field with no error displayed."; blank → "System blocks the search and the field is flagged as mandatory."; over 30 → "Field stops further input at 30 characters, following existing handling."
2. **REQ-002 — backend strip.**
   1. "Backend removes all special characters from the Chassis No before submitting the request to JomCheck." "Only alphanumeric characters are submitted to JomCheck."
   2. "Trimming applies to both the JomCheck precheck API call and the submission API call."
   3. Acceptance Example 1: "Backend submits JTD12345678901234 to JomCheck precheck API." "Screen continues to display JTD-12345-678901234."
   4. Example 4: "Backend trimming applies to every new search."
3. **REQ-003 — backend length check before payment.**
   1. "Backend counts the Chassis No after all special characters are trimmed." "Check is done before UCD is allowed to proceed to payment."
   2. "17 characters or fewer: backend submits the Chassis No to JomCheck precheck API and UCD proceeds to payment."
   3. "More than 17 characters: backend does not submit to JomCheck precheck API, displays the message below, and UCD is unable to proceed to payment." Error Message: "Invalid Chassis Number."
   4. Example 2: "JTD-123456-7890123456 becomes JTD1234567890123456 (19 characters)" → "Invalid Chassis Number." displayed.
4. **REQ-004 — "Invalid Chassis No." from JomCheck still blocks.**
   1. "Existing blocking behaviour is retained after this enhancement."
   2. "When JomCheck precheck API returns "Invalid Chassis No.", system displays the message below and UCD is unable to proceed to payment." Error Message: "Invalid Chassis Number."
   3. "Precheck with Chassis No does not return report availability, but it does return whether the Chassis No is invalid."
5. **REQ-005 — cron resubmit on empty report.**
   1. "Cron job applies only to empty reports that are not caused by the Invalid Chassis Number validation in EAINT-12386-REQ-003 and EAINT-12386-REQ-004."
   2. "Cron job picks up the empty report code and resubmits the request to JomCheck to obtain the report."
   3. "Cron job retries the request every 1 minute, up to a maximum of 5 attempts. Interval and number of attempts are pending confirmation with developer."
   4. "When the report is still empty after the maximum number of attempts, system performs no further action. Refund is handled manually by Ops team."
   5. Acceptance: Invalid Chassis No. → "No resubmission is triggered."; valid report → "No resubmission is triggered."; still empty after 5 → "System performs no further action." / "Ops team handles the refund manually."
6. **REQ-006 — note on JomCheck payment done page.**
   1. "When the report returned by JomCheck is empty, system displays a note on the JomCheck payment done page." "Note is displayed together with the existing payment done content."
   2. Note Content: "Please try again to download report 10 mins later."
   3. Not empty → "No note is displayed and the report is available for download."
7. **Scenario Matrix (SRD §2.2.4.1)** — 7 rows. Key ones:
   1. Row 5: "Chassis No is 17 characters or fewer after backend trim but not found by JomCheck precheck API" → "Yes, alphanumeric only" → "Invalid Chassis Number."
   2. Row 6: blank → "No" → "Field is flagged as mandatory" — "Frontend mandatory check runs before backend trim and submission."
   3. Row 7: "UCD keys in more than 30 characters at the field" → "No" → "None".
8. **SRD history (§1.3), short:** v0.2 error message + cron scope + matrix; v0.3 "Updated special character trimming to backend handling before payment", "Updated Chassis No field maximum length to 30 characters", payment-done note, cron retry; v0.4 Invalid Chassis No. handling, precheck references, "Confirmed trimming applies to precheck and submission API".

## New vs existing behaviour

1. **Existing chassis input (EAINT-6475):** `[knowledge/flow-jomcheck.md §5a item 1.2, from SharePoint TS #050, sheet Functional TS, rows 19-22]` "System auto removes special characters (except for * / -)"; lowercase to uppercase; "System blocks further input after 30 characters".
   1. **Screen: unchanged.** SRD REQ-001: "Frontend handling remains as it is today." So `*`, `/`, `-` stay visible in the box, and other characters are still stripped on screen as today [unconfirmed — the SRD says "alphanumeric and special characters" without listing which].
   2. **Backend: new.** All special characters removed before both APIs (REQ-002).
   3. **30 vs 17 settled:** field stays 30 (REQ-001); 17 is checked after trim in the backend (REQ-003). The ezAuto rule matches `[knowledge/flow-jomcheck.md §7o, "Input limits (p.8)"]` "Chassis No only allowed alphanumeric characters and not more than 17 characters".
2. **Existing invalid chassis handling (EAINT-12339 hotfix):**
   1. `[Teams, 2026-10-23 10:45, dev]` "Previously if system received Invalid Chassis No. response from Jomcheck enquiry API, system still allow UCD to make payment and purchase report. However, jomcheck get report API will also returned Invalid Chassis No. response."
   2. `[Teams, 2026-10-23 10:46, dev]` "After hotfix, if system detects Invalid Chassis No. response from Jomcheck enquiry API, system will block UCD directly."
   3. SRD now writes this down: §2.2.2 row 1 item 6 "System detects the "Invalid Chassis No." response from JomCheck precheck API and blocks UCD directly from proceeding to payment." Kept by REQ-004.
   4. **Message wording:** JomCheck returns "Invalid Chassis No."; screen shows **"Invalid Chassis Number."** (REQ-004). The message shown today after the hotfix is not in the repo [unconfirmed whether it already reads "Invalid Chassis Number."].
3. **Existing empty report:** transaction ends **Failed**. `[knowledge/flow-jomcheck.md, status rule item 12, from system chatbot 2026-10-19]` "**Failed** (empty report, JomCheck API timeout, or fund transfer failed)". UCD then asks for a refund (SRD REQ-005 Existing).
   1. After this ticket: cron retries up to 5 times; if still empty, "system performs no further action" and Ops refunds manually.
   2. The SRD does not say the **status** during retries or after a successful retry (Pending / Failed / Approved) [unconfirmed].
4. **Existing manual recovery:** BO "Resubmit" on a Failed row (`knowledge/flow-jomcheck.md §9g`); UCD does not see Resubmit when "Payment OK + Tx Failed" `[§5a item 3.1, from SharePoint TS #093, row 8]`. The SRD does not mention BO Resubmit [unconfirmed how they interact].
5. **Existing Failed has no e-Invoice** `[knowledge/flow-jomcheck.md item 11]`. SRD is silent on documents after a cron recovery [unconfirmed].
6. **Payment done page:** new note (REQ-006). No existing knowledge/ entry describes this page's content [unconfirmed].

## Open questions / risks for testing

1. **SRD still draft (v0.4).** Cron interval and attempts are written as "pending confirmation with developer" (REQ-005 c). BA also asked `[Teams, 2026-10-26 15:22]` "regarding the cronjob part, need advise yaa." — no reply in the export.
2. **"Empty report code" value** — not in the SRD. Needed to know what the cron picks up and how to cause it.
3. **eSim cannot make an empty report today.** JomCheck Report `Result` is only "Success" / "Failed" `[related-history "Follow-up 2026-10-27" item 2.1, from _reference/html/esim/jomcheck-report-edit-2026-10-05.html lines 96-99]`. Testing REQ-005 / REQ-006 needs a new eSim option, a known code, or a dev trigger.
4. **Status during and after retries** — not in the SRD (Pending, Failed, then Approved?).
5. **"Download report again later"** — REQ-006 tells UCD to retry in "10 mins", but the cron runs "every 1 minute, up to a maximum of 5 attempts" (~5 minutes). Where UCD downloads it from after recovery is not stated [unconfirmed].
6. **What is stored and shown** in UCD / BO listings, Transaction Details and the report PDF: typed value with `-` or the trimmed one. REQ-002 only covers "Value displayed on the UCD screen". Affects BO filter `#chassisNo` (exact match, `flow-jomcheck.md §5a item 2.3`) and Service Portal search ("Only exact match search is allowed" `[related-history, Known traps 2]`).
7. **Payment reference / RHB ID** uses "ONLY the first 8 alphanumeric characters" of the chassis `[related-history, 6475_E2E_TS01 R7]` — check it with a chassis typed with `-`.
8. **Charging and documents:** no double charge on a cron resubmit; Invoice / e-Invoice once only (RM18 + RM2 per EAINT-12412). SRD is silent [unconfirmed].
9. **Vehicle-number path** — SRD only names Chassis No for trim (§2.2.4 title "Search by Chassis No"). REQ-005 does not limit the cron to chassis purchases [unconfirmed whether vehicle-number empty reports are retried].
10. **Wholesale** buys JomCheck too (chatbot; manual only). Not in SRD scope [unconfirmed].
11. **Cron trigger** — eAuto cron runs on an interval and can't be fired on demand (testing sets it every 30 minutes) `[memory: eauto-cronjob-interval-not-on-demand]`. A 1-minute JomCheck retry may be a different job [unconfirmed].
12. **QA owner, env, deploy date** — all blank.
13. **Dev ownership** — BA asked 2026-10-23 08:39 if it is still with KJ; dev answered the technical part only.

## Suggested test focus

1. **Frontend (REQ-001), UCD JomCheck by chassis (`#chassisNoRadio`, `#vehicleChassisNo`):**
   1. "JTD-12345-678901234" accepted, no error, shown as typed.
   2. Blank → mandatory flag, no precheck.
   3. 31st character blocked.
   4. Regression of today's on-screen strip (Chinese characters, lowercase → uppercase, `~ < ] = !`).
2. **Backend trim + length (REQ-002, REQ-003), from Scenario Matrix rows 1–7:**
   1. With `-`, 17 after trim → proceeds to payment; report returned.
   2. No special characters, 17 → proceeds.
   3. With `-`, 19 after trim ("JTD-123456-7890123456") → "Invalid Chassis Number.", no payment.
   4. No special characters, 18+ → "Invalid Chassis Number.".
   5. Mix of `-`, `*`, `/`, space → all removed in the payload [check via dev log or eSim enquiry record, unconfirmed how].
   6. Report PDF and listings: which chassis value is stored.
3. **JomCheck invalid response (REQ-004):** 17 or fewer after trim but not found → "Invalid Chassis Number.", no payment, no cron.
4. **Cron (REQ-005):**
   1. Empty report → retried → report retrieved; status and documents correct.
   2. Still empty after 5 attempts → no further action; row left for Ops refund.
   3. Invalid Chassis No. and valid report → no resubmit.
   4. Pre-deployment Failed rows → untouched (REQ-002 Example 3).
5. **Payment done note (REQ-006):** empty → note "Please try again to download report 10 mins later." shown with the existing content; not empty → no note.
6. **Regression:** vehicle-number purchase; price "RM20.00 + 8% Service Tax" prompt `[related-history, Reusable 12]`; invoice split (EAINT-12412); API v2.0 fields (EAINT-12339); BO Resubmit visibility (EAINT-9203); Service Portal chassis search (EAINT-10937).
7. **Automation reuse:** `scripts/eauto-jomcheck` (`UcdJomCheckPurchasePage.submitChassisNo()`, BO `searchByChassisNo()`, eSim `EsimJomCheckPage`). Chassis counter `HXA##J##C##K##MTA` is 17 alphanumeric; a "with `-`" variant is needed. eSim chassis lookup keys on `Cn Start With` — a typed `-` should not matter if the backend trims first [unconfirmed].

## Dependencies / related tickets

1. **EAINT-12339** (JomCheck API v2.0, Done, S34.4-20261005) — source of the "Invalid Chassis No." block (REQ-004 "Existing").
2. **EAINT-12412** (invoice split RM18 + RM2) — documents on any cron-recovered transaction.
3. **EAINT-6475** (chassis search, current strip rule), **EAINT-9203** (Resubmit visibility), **EAINT-8638** (BO listing search rules), **EAINT-10937** (Service Portal search, past JomCheck cronjob TS). Detail in `EAINT-12386-related-history.md`.
4. **EAUTO-1067**, **CCB-987** — source / cross-department tickets (SRD §1.5). Not in repo.

## Teams decisions (verbatim)

Source: `_reference/teams/EAINT-12386-JomCheck-Chassis-Special-Chars.md` (captured 2026-10-16 and 2026-10-26). No new messages since.

1. `[2026-10-12 15:36, BA]` "just to share that SRD v0.1 available ya."
2. `[2026-10-13 09:35, dev]` "Hi Mei Jia, i will take a look this."
3. `[2026-10-23 08:37, BA]` "hiii Everyone, SRD v0.2 & SRD v0.3 available now ya"
4. `[2026-10-23 10:45, dev]` "Previously if system received Invalid Chassis No. response from Jomcheck enquiry API, system still allow UCD to make payment and purchase report. However, jomcheck get report API will also returned Invalid Chassis No. response."
5. `[2026-10-23 10:46, dev]` "After hotfix, if system detects Invalid Chassis No. response from Jomcheck enquiry API, system will block UCD directly."
6. `[2026-10-26 14:12, dev]` "not exactly. For chassis number their API still doesn't have precheck but somehow they will check this Invalid format."
7. `[2026-10-26 14:55, BA]` "okkies, which mean is we anyhow also will try to send to their JomCheck enquiry API to do checking, right? / bcz by right the precheck just for vehicle number, our syste, regardless of vehicle number or chassis number will still send out precheck API, thats why we able to get the message "Invalid Chassis Number", right?" — no reply in the export. SRD v0.4 §2.2.2 items 7–8 now state the answer as the BA understood it.
8. `[2026-10-26 15:22, BA]` "Goh Kai Jiaeh, SRD v0.4 is ready ya. can take a look and let me know if there is anything wrong ya"
9. `[2026-10-26 15:22, BA]` "regarding the cronjob part, need advise yaa."

## Where this ticket changes or contradicts knowledge/

1. `knowledge/flow-jomcheck.md §5a item 1.2` — "System auto removes special characters (except for * / -)" stays true **on screen**; after deployment the backend also removes `*`, `/`, `-` and the rest before the API calls (REQ-002). The 30-char limit stays (REQ-001).
2. `knowledge/flow-jomcheck.md` status rule item 12 — "Failed (empty report ...)". After this ticket an empty report is retried by cron up to 5 times before Ops refunds (REQ-005).
3. `knowledge/flow-jomcheck.md §4` lineage table — EAINT-12386 is not a row yet.
4. `knowledge/flow-jomcheck.md §7o` — "Not covered by the spec" for the empty case; this ticket adds handling for it.
5. `knowledge/teams-decisions-by-ticket.md` line 258 — lists the ticket as "SRD stage only" with one line; the 2026-10-23 / 26 messages are missing.

## Knowledge candidates

1. **EAINT-12339 enquiry hotfix:** "After hotfix, if system detects Invalid Chassis No. response from Jomcheck enquiry API, system will block UCD directly." `[from Teams EAINT-12386, 2026-10-23 10:46, dev]` and SRD §2.2.2 row 1 item 6 → `knowledge/flow-jomcheck.md` §1 / §4.
2. **Before the hotfix:** UCD could pay for an invalid chassis and the get-report API also returned Invalid Chassis No. `[from Teams EAINT-12386, 2026-10-23 10:45, dev]`.
3. **Precheck by chassis:** "JomCheck precheck API returns whether a report is available only when the enquiry is made with Vehicle No. Report availability is not returned when the enquiry is made with Chassis No." and "When precheck is done with Chassis No, JomCheck precheck API is still able to return whether the Chassis No is invalid." `[SRD v0.4 §2.2.2 row 1 items 7–8]`.
4. **API names:** "JomCheck Precheck API ... Also referred to as enquiry API."; "JomCheck Submission API ... called to request the report after payment is made." `[SRD v0.4 §1.4 rows 5–6]`.
5. **Root cause of many empty reports:** "User keys in 21 characters including "-". System responds with empty report." `[Jira EAINT-12386 description, row 4]`.
6. **Lineage row** for `flow-jomcheck.md §4`: EAINT-12386 | UCD & Cron Job | backend strip of chassis special characters, 17-char check after trim, cron retry on empty report, payment done note | REQ REFINEMENT, SRD v0.4 draft 2026-10-26, no fix version. `[from Jira capture 2026-10-27 + SRD v0.4]`
7. **Source tickets:** EAUTO-1067 "JOMCHECK ENHANCEMENT", CCB-987 `[SRD v0.4 §1.5]`.
8. **teams-decisions-by-ticket.md** update with Teams items 3–9 above.
