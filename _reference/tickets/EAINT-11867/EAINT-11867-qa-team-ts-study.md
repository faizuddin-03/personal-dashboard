# EAINT-11867 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy (this run):** `_reference/sharepoint/qa-team-ts/EAINT-11867 ⚪[eAuto-Insurance] To send WhatsApp Insurance video based on referred risk from June 2026.md` (text copy dated 27/10/2026, 8:32:31 pm; cell text only, no colours or images). Sheet "Sheet1", 12 scenarios.
2. **Earlier text of the same workbook:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-11867_eAuto-Insurance_To_send_WhatsApp_Insurance_video_based_on_referred_risk_from_J.txt`. Used to diff for "Changes since last study".
3. **Second workbook (fuller TS, same ticket):** `_reference/sharepoint/qa-team-ts/EAINT-11867_WhatsApp_Video_Test_Cases_Full (version 1).md` (text copy dated 27/10/2026, 8:24:53 pm). Not re-read this run; its content below is kept from the earlier study.
4. **Jira capture:** `_reference/tickets/Studying/EAINT-11867/EAINT-11867-jira.md` (27/10/2026, 5:29:35 pm).
5. **Knowledge:** `knowledge/eauto-insurance.md` (§ Insurance notifications, lines 242-252), `knowledge/business-rules-from-test-scenarios.md` (rows 494-502), `knowledge/cr-test-scenario-catalogue.md` (rows 105-106, 361-362), `knowledge/flow-cibo.md` (§4.7, gap 6), `knowledge/flow-bo-shell.md` (row 147).
6. **lib/ticketStudies.ts:** no EAINT-11867 entry (grep "11867" → no match).
7. **Not read:** the SRD (`SRD_EAINT-11867_..._v1.0_20260708.docx` / `.pdf`) and the videos `Car.mp4`, `Motor.mp4` are Jira attachments only; no copy exists in the repo. The `.xlsx` files under `_reference/sharepoint/eauto-cr-test-scenarios/` were not opened (no spreadsheet reader in this run); colours, cell fills and any hidden sheets are unknown. Nothing below is taken from the SRD.

## 1. Header

1. **Ticket:** EAINT-11867 — "⚪[eAuto-Insurance] To send WhatsApp Insurance video based on referred risk from June 2026" `[Jira capture, Summary]`.
2. **Jira state:** "Status: On Hold", "Assignee: Mong Guo Hao", "Reporter: Lim Yi Link", "QA (cf 10041): Teck Yung Chin", "ETA for Testing (cf 10057): 2026-07-22", labels "260629-260703, CIBO, EAUTO, July2026, ProductBacklog" `[Jira capture, fields 2-7]`.
3. **Module / portal:** eAuto Insurance back-end **cron job** that re-quotes referred-risk vehicles and sends a **WhatsApp video** to the UCD. Checked through **CIBO > Refer Risk Log**, **BO > Insurance Transaction Listing**, **BO > Insurance Quote Enquiry**, and dev request logs.
4. **Workbook A (subject of this run):** "EAINT-11867 ⚪[eAuto-Insurance] To send WhatsApp Insurance video based on referred risk from June 2026.xlsx", library "eAuto - CR Test Scenarios", modified 16/07/2026, 1:50:49 pm.
   1. **Sheet:** "Sheet1" — 12 scenarios (11867_TS01–TS12), rows R2–R13.
   2. **Columns:** "TS No. | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks" `[Sheet1, R1]`.
   3. **Results:** none. "QA", "Test Result" and "Remarks" are empty on every row.
   4. **Tester / dates:** none written in the sheet. The catalogue lists "Chin Teck Yung | 2026-07-16" `[knowledge/cr-test-scenario-catalogue.md, row 105]` — taken from SharePoint metadata, not the cells `[unconfirmed]`.
   5. **Style:** generic requirement-level checks ("Identify a Referred Risk Log record…", "Allow the re-quotation job/process to run"); no test data, no portal paths. Reads as an early draft written from the SRD `[unconfirmed]`.
5. **Workbook B (fuller TS):** "EAINT-11867_WhatsApp_Video_Test_Cases_Full (version 1).xlsx", library "eAuto - CR Test Scenarios", modified 27/07/2026, 5:22:20 pm.
   1. "Test Scenario v1" — 15 scenarios (11867_TS01–TS15) on 17 rows (TS01 and TS04 have a second row for the 2nd cron run), plus a 4-row summary matrix (R21–R25).
   2. "Test Scenario v2 @ 20260727" — the same 15 scenarios **renumbered**, plus the matrix and five bike notes (R29–R33).
   3. **Tester:** "Teck Yung" in the QA column on every row of both sheets.
   4. **Dates:** only the sheet name "@ 20260727". No execution dates in the cells.
6. **Results, Workbook B (per scenario id):**

| Sheet | Pass | In Progress | Pending | N/A | Fail |
|---|---|---|---|---|---|
| Test Scenario v1 | 7 (TS01, 02, 05, 06, 08, 13, 15) | 2 (TS04, 09) | 2 (TS03, 07) | 4 (TS10, 11, 12, 14) | 0 |
| Test Scenario v2 @ 20260727 | 0 | 0 | 11 (TS01–08, 10–12) | 4 (TS09, 13, 14, 15) | 0 |
| Sheet1 (Workbook A) | — | — | — | — | — (no results recorded) |

7. **Summary matrix result** (Workbook B, both sheets, R22–R25): three rows "Pass", the "WITHOUT Hitting Refer Risk" row "Pending".
8. **Reading of v2:** v2 resets all results to "Pending" — a **re-test round** after the cron criteria changed (see §2.4) `[unconfirmed]`.

## Changes since last study (2026-10-27)

1. **No cell-text change found in Workbook A.** All 12 rows (R2–R13) match the earlier text copy word for word; the only difference is line breaks (shown as "⏎" in the new copy).
2. **New / removed scenarios:** none. Still 11867_TS01–TS12.
3. **Result changes:** none. "QA", "Test Result" and "Remarks" were empty before and are empty now.
4. **Modified date unchanged:** SharePoint still shows 16/07/2026, 1:50:49 pm, the same date as `knowledge/cr-test-scenario-catalogue.md` row 105 ("2026-07-16"). If the workbook did change, it is in **formatting, colours or images**, which the text copy does not keep `[unconfirmed]`.
5. **Study corrections made this run:**
   1. Workbook A was listed only as a "companion … used for context only". It now has its own header (§1.4), scenarios (§3 E), rules (§4.14–4.18) and gaps (§6.10–6.13).
   2. "Sources read" now gives the text-copy date for Workbook A and states the `.xlsx` files were not opened.

## 2. What the ticket changed, as the TS shows it

1. A **cron job** looks at vehicles that **hit Referred Risk**, re-quotes them with the **other insurers**, and sends **one WhatsApp video** to the UCD when a quote comes back and nothing was bought.
2. Trigger criteria, v1 headers: "VN Hit Referred Risk" | "Have available quotation from other insurer" | "No Insurance Transaction Created with this VN" `[Test Scenario v1, R1–R2]`.
3. Video type by vehicle: "Whatsapp message contains Car Insurance Video" / "Whatsapp message contains Motor Insurance Video" `[Test Scenario v1, R3 / R7, Expected]`. Workbook A names the files: "The UCD receives the Car Insurance Video ⏎ (Car.mp4) via WhatsApp." `[Sheet1, R9]` and "(Motor.mp4)" `[Sheet1, R10]`.
4. **v2 change (2026-07-27)** — the criteria were narrowed:
   1. Column F: "VN Hit Referred Risk (for the month CJ runs)" `[Test Scenario v2, R1]`.
   2. Column H: "No Insurance Transaction Purchased for the UCD in 2026" `[Test Scenario v2, R2]` (v1: "No Insurance Transaction Created with this VN").
   3. Cell values change to "No Insurance Purchased before for the UCD" and "Have Insurance Purchased by this UCD" `[Test Scenario v2, R3 / R9]`.
   4. So the "already bought" check moved from **vehicle** to **UCD** `[unconfirmed — inferred from header wording only; test steps still say "ensure vehicle has NO insurance purchase"]`. Workbook A (16/07) still states the vehicle rule: "an existing insurance purchase record is found for the vehicle" `[Sheet1, R5]`.
5. Cut-off: records "ON/AFTER 1ST JUNE 2026" qualify; "BEFORE 1ST JUNE 2026" should not `[Workbook B, both sheets, Time Period column]`. Workbook A: "Record created before 01.06.2026 is excluded from re-quotation." `[Sheet1, R2]`.

## 3. Scenarios

Groups A–D are Workbook B (v2 numbering first; v1 id in brackets where different; expected results are "Ensure:" lists). Group E is Workbook A.

### A. Existing records, on/after 1 June 2026

1. **TS01** — CAR, Main UCD, hit referred risk, quote returned, nothing bought → "Whatsapp Message (Video) IS SENT to Main UCD"; "Only ONE whatsapp message is sent, even if more than ONE insurer has returned quotation". 2nd cron run → "Whatsapp Message (Video) NOT sent to Main UCD" and "NO quotation request in backend". v1: Pass; v2: Pending.
2. **TS02** — CAR, Sub UCD, no quote returned → "Whatsapp Message (Video) NOT sent to Sub UCD"; quote request still "sent to Insurers NOT in the Refer risk log". v1: Pass; v2: Pending.
3. **TS03** (P2) — BIKE, no quote returned → "Whatsapp Message (Video) NOT sent to Main UCD". v1: Pending; v2: Pending.
4. **TS04** — BIKE, quote returned → "Whatsapp Message (Video) IS SENT to SUB UCD"; "Motor Insurance Video"; 2nd cron → not sent again. v1: In Progress; v2: Pending.
5. **TS05** — hit referred risk, quote returned, **already bought** → "NOT sent to Main/Sub UCD"; "NO quotation request in backend". v1: Pass; v2: Pending.
6. **TS06** (P2) — **no** referred risk, already bought → not sent, no quote request. v1: Pass; v2: Pending.
7. **TS07** — **no** referred risk, nothing bought (any eSTM vehicle) → not sent, no quote request. v1: Pending; v2: Pending.
8. **TS08** [v1 TS13] — more than one other insurer quotes → "Only ONE Whatsapp Message (Video) IS SENT". v1: Pass; v2: Pending.
9. **TS09** [v1 TS14] — only the referred insurer could quote → not sent. **N/A** in both: "Not Applicable because when CJ re-quotation, it will not enquire the insurer that hit referred risk."
10. **TS10** [v1 TS15] — same VN hits referred risk several times, same UCD, same month → "Only ONE Whatsapp Message (Video) IS SENT". v1: Pass; v2: Pending.

### B. New transactions after deployment

1. **TS11** [v1 TS08] — CAR: new eSTM + eVOC to Approved, Insurance Step 1 hits referred risk, quit → "IS SENT to Main UCD", Car video. v1: Pass; v2: Pending.
2. **TS12** [v1 TS09] — MOTORBIKE: same path → "IS SENT to SUB UCD", Motor video. v1: In Progress; v2: Pending.

### C. Existing records, before 1 June 2026

1. **TS13** [v1 TS10] — hit referred risk, quote, nothing bought → "NOT sent", "NO quotation request in backend". **N/A** (deprioritised).
2. **TS14** [v1 TS11] (P2) — hit referred risk, already bought → not sent. **N/A**.
3. **TS15** [v1 TS12] (P2) — no referred risk, already bought → not sent. **N/A**.

### D. Summary matrix (R21–R25, both sheets)

1. Header note: "Mix and Match, as long as it's covered" `[R21]`; time period "Existing - as long as before deployment ⏎ New - as long as after deployment" `[R22]`.
2. Hit + quote + not bought → "To send WA video" — Pass `[R22]`.
3. Hit + no quote + not bought → "DO NOT send WA video" — Pass `[R23]`.
4. Hit + quote + bought → "DO NOT send WA video" — Pass `[R24]`.
5. No hit + quote + not bought → "DO NOT send WA video" — Pending `[R25]`.

### E. Workbook A — Sheet1 (no results recorded)

1. **TS01** `[R2]` — record created before 01.06.2026 → "Record created before 01.06.2026 is excluded from re-quotation." / "No quotation request is sent to other insurers." / "No WhatsApp message is sent to owners of the vehicle and vehicle number."
2. **TS02** `[R3]` — record on/after 01.06.2026 → "Record created on or after 01.06.2026 is included in the re-quotation process." / "WhatsApp message (Video) is sent to the owner of the particular vehicle and vehicle number."
3. **TS03** `[R4]` — quote request uses the stored VN → "contains the exact Vehicle Number stored in the ⏎ Referred Risk Log record."
4. **TS04** `[R5]` — vehicle already bought → "No WhatsApp message is sent for the record, since an existing insurance purchase record is found for the vehicle."
5. **TS05** `[R6]` — insurer list → "All available insurers except the original failed insurer receive a quotation request for the vehicle."
6. **TS06** `[R7]` — all insurers fail → "No WhatsApp message is sent for the record ⏎ when all insurers fail to return a quotation. No ⏎ further action is taken."
7. **TS07** `[R8]` — at least one quote → "A WhatsApp insurance video message is sent to ⏎ the UCD, since at least one insurer returned a ⏎ quotation."
8. **TS08** `[R9]` — Car → Car.mp4.
9. **TS09** `[R10]` — Motor → Motor.mp4.
10. **TS10** `[R11]` — Main UCD transaction → "delivered to the Main UCD tied to the transaction."
11. **TS11** `[R12]` — Sub UCD transaction → "delivered to the Sub UCD tied to the transaction."
12. **TS12** `[R13]` — many insurers quote → "Exactly one WhatsApp message is sent for the ⏎ record, regardless of the number of insurers that ⏎ returned a successful quotation."
13. **Mapping to Workbook B** `[unconfirmed]`: A-TS01 ≈ B-TS13; A-TS02/TS07 ≈ B-TS01; A-TS04 ≈ B-TS05; A-TS05 ≈ B-TS09 (N/A); A-TS06 ≈ B-TS02; A-TS08/09 ≈ B-TS11/12; A-TS12 ≈ B-TS08. A-TS03 (VN in payload) has **no** Workbook B equivalent.

## 4. Business rules and system behaviour

1. **One message per vehicle.** "Only ONE whatsapp message is sent, even if more than ONE insurer has returned quotation (Request log from dev)" `[Test Scenario v1, R3, Expected 4]`.
2. **No repeat on the next run.** "Ask dev to Trigger 2nd CRONJOB (For ensuring whatsapp message is not sent again after cronjob runs the 2nd time and onwards)" → "Whatsapp Message (Video) NOT sent to Main UCD" `[Test Scenario v1, R4]`.
3. **Referred insurer is skipped.** "Not Applicable because when CJ re-quotation, it will not enquire the insurer that hit referred risk." `[Test Scenario v1, R13, Remarks; Test Scenario v2, R13]`.
4. **Re-quote still happens when nothing comes back.** TS02 expects "Quotation request is sent to Insurers NOT in the Refer risk log" while "Whatsapp Message (Video) NOT sent" `[Test Scenario v1, R5, Expected]`.
5. **No re-quote when already bought or no referred risk.** "NO quotation request in backend (Request log from dev)" `[Test Scenario v1, R9 and R10, Expected 2]`.
6. **Acceptance criteria listed by the tester:** "VN re-quotable with >1 insurer (excl. referred insurer) → send 1 WA video ⏎ - VN re-quotable only with referred insurer → no WA video ⏎ - Same VN + UCD, multiple referred risks hits in same month → send 1 WA video only" `[Test Scenario v1, R3, Remarks]`.
7. **Known pre-June defect / limitation:** "Current behavior: May transactions (before 1 June) still send WhatsApp videos (should not) if dev side runs the June cronjob which picks up transactions in May." `[Test Scenario v1, R17, Remarks]`.
8. **Production schedule:** "In production, dev side will only run the cronjob for all transactions in June and subsequently for upcoming months, on a monthly basis, where transactions before June will never be picked up." `[Test Scenario v1, R17, Remarks]`. So it is a **monthly** cron, not the 30-minute interval in memory "eAuto cron: interval" `[unconfirmed — different job]`.
9. **Why pre-June cases are N/A:** "if the same company has May & June transactions, we cannot identify whether the WhatsApp was triggered by the May or June transaction." `[Test Scenario v1, R17, Remarks]`.
10. **Month patch needed in testing:** "To ask dev to patch to future MONTH before running cronjob." `[Test Scenario v1, R7, Remarks]`.
11. **No-hit scenario may be dropped:** "Mong said can scope down this scenario" `[Test Scenario v2, R25]`.
12. **Messaging provider:** "Estimated messagebird no > 2" `[Test Scenario v2, R22–R24]` — likely MessageBird sends the WhatsApp; meaning of "no > 2" unclear `[unconfirmed]`.
13. **Bike in staging:**
    1. "Currently TMIM hit referred risk in staging insurer API, no other quotation available to return for BIKE already" `[Test Scenario v2, R29]`.
    2. "YL confirmed with Shamini, if TMIM hit referred risk for Comprehensive, it's possible TPFT is still available, vice versa" `[Test Scenario v2, R30]`.
    3. "need to check with Dev if BIKE will do quotation inquiry other than TMIM insurer or not? eg: Takaful ⏎ Note: Zurich has BIKE but it's in staging only, not deployed to Prod yet" `[Test Scenario v2, R31]`.
    4. "to check with Dev how much is the effort to work on e-Sim to include this CR changes (so that can test BIKE hit referred risk for Comprehensive only but not TPFT)" `[Test Scenario v2, R32]`.
    5. "if effort too big, deprio testing motorbike" `[Test Scenario v2, R33]`.
14. **Eligibility is by Referred Risk Log creation date.** "Identify a Referred Risk Log record with creation ⏎ date before 01.06.2026." `[Sheet1, R2, Steps 1]`. Workbook B uses "Insurance Transactions ON/AFTER 1 June 2026" instead `[Test Scenario v2, R19]` — two different date fields `[unconfirmed which one the cron uses]`.
15. **Quote request carries the logged VN.** "The quotation request sent to other insurers ⏎ contains the exact Vehicle Number stored in the ⏎ Referred Risk Log record." `[Sheet1, R4]`.
16. **All insurers fail → stop.** "No ⏎ further action is taken." `[Sheet1, R7]`.
17. **Recipient follows the transaction's UCD.** "delivered to the Main UCD tied to the transaction" `[Sheet1, R11]`; "delivered to the Sub UCD tied to the transaction" `[Sheet1, R12]`.
18. **"Owner" wording.** TS01/TS02 say the message goes to "owners of the vehicle and vehicle number" `[Sheet1, R2]` / "the owner of the particular vehicle and vehicle number" `[Sheet1, R3]`, while TS07–TS12 say "the UCD". Taken to mean the UCD that owns the transaction `[unconfirmed]`.

## 5. Test data, environments, setup

1. **Environment:** not named in a column. R29 says "staging insurer API" `[Test Scenario v2, R29]`; testing was on **staging** `[unconfirmed for every row]`. Workbook A names no environment.
2. **Cron:** triggered by dev on request — "Ask dev to Trigger 1st CRONJOB." `[Workbook B, every scenario, last step]`. Results are checked in "Request log from dev". Workbook A only says "Allow the re-quotation job/process to run." `[Sheet1, R2, Steps 2]`.
3. **Companies:**
   1. "Can use this company > CTYTEST03 (Need to activate first)" `[Test Scenario v2, R3]`.
   2. "Can use this company > TYTESTBTSABAHFOREXPIRY003 (Need to activate first)" `[Test Scenario v2, R15–R16]`.
4. **WhatsApp numbers:** "Number is 0165502540" (Main UCD) `[Test Scenario v2, R3]`; "Number is 0163613086" (new Sub UCD — "Create Sub UCD") `[Test Scenario v2, R5]`.
5. **New UCD for no-hit case:** "Can test with Newly created UCD." `[Test Scenario v2, R11]`.
6. **New-transaction setup:** "Create new eSTM + eVOC Transaction and proceed until trx status = Approved ⏎ 2. Proceed to Insurance Page Step 1 & hit Referred Risk > Quit step page" `[Test Scenario v1, R15]`.
7. **Credentials:** none in either workbook.

## 6. Gaps and risks for regression

1. **No scenario has a v2 result.** All v2 rows are "Pending" or "N/A"; the UCD-level purchase rule (v2) was never shown passing in this workbook.
2. **Pre-June exclusion never proven** (TS13–TS15 N/A) and the sheet records the opposite behaviour when the June cron is run in testing (§4.7).
3. **Motorbike path weak:** TS03, TS04, TS12 never passed; staging has no second bike insurer (§4.13).
4. **Main vs Sub UCD wording conflicts** — the recipient rule is not clear from the sheet:
   1. TS01: column "CAR - MAIN UCD", 2nd row remark "Tested Using CAR - SUB UCD" `[Test Scenario v1, R4]`.
   2. TS02: column "CAR - SUB UCD", remark "Tested using CAR - MAIN UCD" `[Test Scenario v1, R5]`.
   3. TS03: column "MOTORBIKE - SUB UCD", step "by MAIN UCD", expected "NOT sent to Main UCD" `[Test Scenario v1, R6]`.
   4. TS04: column "MOTORBIKE - MAIN UCD", step "by SUB UCD", expected "IS SENT to SUB UCD" `[Test Scenario v1, R7]`.
   5. TS11 (v2): column "CAR - SUB UCD", expected "IS SENT to Main UCD" `[Test Scenario v2, R15]`.
   6. Regression should confirm the video goes to the **UCD who hit referred risk** (Main or Sub) — Workbook A says "delivered to the Sub UCD tied to the transaction" `[Sheet1, R12]`.
5. **Step text vs period:** TS15 (before-June case) step 2 reads "Search for vehicle number with Insurance Transactions ON/AFTER 1 June 2026" `[Test Scenario v2, R19]`.
6. **v2 steps not updated:** steps still check "ensure vehicle has NO insurance purchase" while the v2 criterion is per UCD `[Test Scenario v2, R3 step 4 vs R2 col H]`. Regression should test: **same VN, other UCD bought** vs **same UCD bought another VN**.
7. **Month boundary:** "for the month CJ runs" `[v2, R1]` — no scenario for a referred risk hit in the previous month, or for the same VN hit by **two different UCDs**.
8. **Video content not checked** beyond "contains Car/Motor Insurance Video"; no check of message text or failed delivery.
9. **Jira status "On Hold"** — deployment state unknown from the repo.
10. **Workbook A was never executed.** No QA name, result or remark on any row; it cannot be used as evidence of behaviour.
11. **Workbook A copy-paste objectives:** TS06, TS07 and TS08 reuse TS05's objective "Verify quotation requests are sent to all other available insurers, excluding the original failed insurer." `[Sheet1, R7–R9]`; TS11 and TS12 reuse "Verify the WhatsApp message is ⏎ delivered to the Main UCD associated ⏎ with the transaction." while testing a Sub UCD `[Sheet1, R12–R13]`.
12. **Workbook A TS06 contradicts itself:** step "Trigger re-quotation such that at least one insurer returns a successful quotation." vs expected "No WhatsApp message is sent for the record ⏎ when all insurers fail to return a quotation." `[Sheet1, R7]`. Regression should set up the **all-fail** case.
13. **VN-in-payload check (A-TS03) exists only in Workbook A** and needs dev request logs; Workbook B never covers it `[Sheet1, R4]`.

## Knowledge candidates

1. **Correct `knowledge/eauto-insurance.md` line 251–252** — it states "Only the originally referred insurer quoting → not sent" citing row 13, but that row is **N/A**: "Not Applicable because when CJ re-quotation, it will not enquire the insurer that hit referred risk." `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 13]`. Same fix in `knowledge/business-rules-from-test-scenarios.md` row 502.
2. **No repeat send:** a 2nd cron run sends no WhatsApp and no quote request for the same VN `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 4]`.
3. **Multiple hits, same VN + UCD + month → one video** `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 14]`.
4. **Cron cadence:** monthly in production, from June 2026 onward `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 17]`; in testing dev triggers it and may "patch to future MONTH" `[… row 7]`.
5. **Known defect:** a June cron run picks up May records and sends videos `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 17]`.
6. **v2 criteria (2026-07-27):** "VN Hit Referred Risk (for the month CJ runs)" and "No Insurance Transaction Purchased for the UCD in 2026" `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v2 @ 20260727, rows 1–2]`. This may supersede `knowledge/eauto-insurance.md` line 246 ("No WhatsApp when the vehicle already has a purchase", from TS #022 Sheet1 row 5) — the purchase check may now be per UCD `[unconfirmed]`.
7. **Staging bike limit:** "Currently TMIM hit referred risk in staging insurer API, no other quotation available to return for BIKE already" `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v2 @ 20260727, row 29]`; Comprehensive vs TPFT can differ `[… row 30]`. Candidate for `knowledge/eauto-insurance.md` or `knowledge/quirks.md`.
8. **Refer Risk Log location:** this TS uses "CIBO > Refer Risk Log" for searching by vehicle and UCD `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 3]`. Extends `knowledge/flow-cibo.md` gap 6 ("Only the Referred Risk Log export columns are known"); `knowledge/flow-bo-shell.md` also lists a BO "Refer Risk Log" at `/<env>/view/insurance/refer-risk-log` — two pages, same name `[unconfirmed whether they are the same data]`.
9. **Test companies:** CTYTEST03 and TYTESTBTSABAHFOREXPIRY003, both "Need to activate first" `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v2 @ 20260727, rows 3, 15]`.
10. **Catalogue fix:** `knowledge/cr-test-scenario-catalogue.md` row 106 lists env "production, staging"; the sheet only mentions prod in "not deployed to Prod yet" `[… row 31]` — testing env is staging only.
11. **Quote request uses the logged VN:** "The quotation request sent to other insurers ⏎ contains the exact Vehicle Number stored in the ⏎ Referred Risk Log record." `[from SharePoint TS #022 EAINT-11867, sheet Sheet1, row 4]`. Not yet in `knowledge/eauto-insurance.md`.
12. **Recipient = UCD tied to the transaction (Main or Sub):** `[from SharePoint TS #022 EAINT-11867, sheet Sheet1, rows 11–12]`. Not yet in `knowledge/eauto-insurance.md`.
13. **Catalogue note:** `knowledge/cr-test-scenario-catalogue.md` row 105 should say TS #022 has **no results recorded** (QA / Test Result / Remarks empty on all 12 rows) `[from SharePoint TS #022 EAINT-11867, sheet Sheet1, rows 2–13]`.
