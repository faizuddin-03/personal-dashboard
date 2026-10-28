# EAINT-9860 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study. Nothing in `knowledge/`, `lib/` or `app/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.md`. First study used the copy captured 27/10/2026, 7:04:37 pm. **Re-read in full on the recapture "27/10/2026, 7:51:15 pm"** (copy line 1), all 31 sheets. The older copy was overwritten, so no file-to-file diff was possible. Cell text only; colours (e.g. the "ORANGE rows = CRITICAL" marking) are not in the copy.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-9860/EAINT-9860-jira.md` (27/10/2026, 7:00:34 pm).
3. **Knowledge:** `knowledge/flow-wholesale.md`, `knowledge/flow-emove.md` (grep), `knowledge/cr-test-scenario-catalogue.md` row 127, `knowledge/flow-apt.md` and `knowledge/flow-payments-fees.md` (grep only). Re-checked on the update: `flow-wholesale.md` lines 42, 59-60, 79, 297 and 312 still read as cited in §7.
4. **lib/ticketStudies.ts:** 4 "Wholesale" matches. No EAINT-9860 study entry found by grep.
5. **Not read:** the 3 Jira attachments ("[Wholesale] Requirement Refinement-20260421.pdf", "[Wholesale] Requirement Refinement-20260430.pdf", "meeting-minutes.md"). They are not saved in the repo. No SRD was available.
6. `_reference/tickets/EAINT-9860/` did not exist before this file.

## 1. Header

1. **Ticket:** EAINT-9860, "Summary: Wholesale", "Type: Epic · Status: To Do · Priority: Medium" (Jira capture, line 5-6). **Fix version:** "S30.2-20260610🌚 (2026-06-10)". **QA field:** "Maisarah Nuraliyaa Binti Masrom, Nicholas Lim". Description empty, 0 comments.
2. **Module / portals:** eAuto **Wholesale** (Wholesale 2.0). Covers the **WhatsApp chatbot**, **Wholesale Back Office** (`stage-ws.eauto.my/bo`), **UCD portal** (Wholesale Transaction Listing, Wholesale Permission, Wholesale STMS), **eAuto BO** (Alternative Vehicle Maintenance), logistics QR scanning and emails.
3. **Workbook:** "EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.xlsx", library "eAuto - CR Test Scenarios", modified 19/08/2026, 4:07:57 pm. Editor per catalogue: Amirul Azfar (`knowledge/cr-test-scenario-catalogue.md` row 127).
4. **Nature:** an **umbrella workbook**, not one CR. It holds one sheet per Wholesale sub-ticket plus the original chatbot suite. Sub-tickets with sheets: **EAINT-11999, 11949, 11860 & 11862, 11987, 11890, 11872, 11885, 11731, 11877, 11857, 11876, 11824**. At least one sub-ticket sits under a **different epic**: "EAINT-11890 (Task, Epic EAINT-11851 Wholesale 2.0)" (EAINT-11890 R2). The Wholesale 2.0 sheets may belong to EAINT-11851, not EAINT-9860 [unconfirmed].
5. **Sheets (31):** 📋 Summary; Ticket Status; EAINT-11999; EAINT-11949; EAINT-11860 & EAINT-11862; EAINT-11987; EAINT-11890; EAINT-11872; EAINT-11885; EAINT-11731; EAINT-11877; EAINT-11857; EAINT-11876; EAINT-11824; 10 June 2026 Scope; Failed Payment; Cancel Transaction; 🔍 View Listing; ➕ Add Listing; ❌ Withdraw Listing; 💰 Change Price; 🛒 Buyer Search; 💬 Buyer Enquiry-Offer; 💳 Buyer Booking-Pay; ⚠️ Cross-Role Edge Cases; ⚠️ Race Conditions; 🔐 Multi-SubUser Dealer; 📊 Search & Recommend; 💬 Negotiation Flow; 🔒 Security & Access.
6. **Scenario count (rows with a scenario id, my count):** about **680**. The catalogue gives "683".
7. **Result counts (my count from the Result/Status columns):**
   1. **EAINT-11999** (50): **40 PASS**, **8 blank** (TCM-P2, P3, P5, P7, P8, S5, E1, E4), 2 other (TCM-P6 "CANNOT ADD NEW VEHICLE IN INVENTORY"; TCM-S3 "Tested with TCM-P4").
   2. **EAINT-11949** (5): 5 PASS.
   3. **EAINT-11860 & 11862** (63): 63 PASS.
   4. **EAINT-11987** (17): 17 PASS. Section "4. BACKOFFICE PERMISSION CONTROL" (R23) has a heading but **no rows**.
   5. **EAINT-11890** (28): **26 PASS**, **2 DEPRIO** (TC-07, TC-11).
   6. **EAINT-11872** (30): 30 PASS.
   7. **EAINT-11885** (9): 9 PASS (Photo and PDF columns).
   8. **EAINT-11731** (70 ids): all PASS.
   9. **EAINT-11877 sheet** (2): 1 PASS, 1 "N/A" ("To be tested by dev as confirmed").
   10. **EAINT-11857** (7): all filled cells PASS.
   11. **EAINT-11876** (4): 4 PASS.
   12. **EAINT-11824** (164): **LOG_FEE_TS1-TS140 PASS**; **LOG_FEE_TS141-TS164 no result**. TS38-TS74 have only the "New Transaction" column filled.
   13. **10 June 2026 Scope** (37): 34 "Pass" (REQ_TS29 is "Pass (Except 'Refunded' records)"), REQ_TS12 "On Hold", REQ_TS14 "Requirements not confirmed", REQ_TS18 "On Hold".
   14. **Failed Payment** (5): 5 PASS.
   15. **Cancel Transaction** (21): 21 PASS in "Retest Result (8/6/2026)".
   16. **Original chatbot suite** (13 sheets, 136 rows): **46 PASS**, **4 FAIL** (AL-TC-008, WD-TC-001, CP-TC-006, BS-TC-006), **4 IN PROGRESS** (AL-TC-011, CP-TC-001, BS-TC-004, BS-TC-008), **82 blank**. Booking-Pay, Cross-Role, Race Conditions, Multi-SubUser, Negotiation and Security sheets are **entirely blank**.
8. **Summary sheet is stale and garbled.** It says "GRAND TOTAL | 89" (📋 Summary R14). Rows R11-R14 repeat one number across every column ("R11 | 6 | 6 | 6 ..."). It does not list the sub-ticket sheets.
9. **Testers named in the sheet:** "Nick", "Azfar", "Mai", "TY", "Huixin", "Faiz" (e.g. EAINT-11987 QA column; 10 June 2026 Scope last column; Ticket Status R6-R9). **Faiz** owns REQ_TS20 (10 June 2026 Scope R21) and left a remark on AL-TC-012 (➕ Add Listing R16).
10. **Dates in the sheet:** "May 2026 / v3.0 FINAL" (📋 Summary R2); "(17/7/2026)" (EAINT-11987 R1); "Prepared: | 7/21/2026" (EAINT-11890 R6); "6 JULY 2026 - Changes" (EAINT-11731 R98); "Retest Result (8/6/2026)" (Cancel Transaction R2); "8/6/2026 (To-do)" (10 June 2026 Scope R1). EAINT-11999 ran around 2026-08-03 ("dateFrom=2026-07-04 (today-30)", R2) [unconfirmed].
11. **Ticket Status sheet** lists 12 rows (R2-R13): 11884, 11872, 11890, 11997, 11998, 11999, "12000 - ESTM & Sourcing flow", "12000 - Manual Refire", 12001, 12002, 12004, 12109. Only **11872, 11890 and 11999** have their own sheet. Status cells are stale: 11999 reads "On Staging | Pending" (R7) although its sheet has 40 PASS.

## Changes since last study (2026-10-27)

1. **Workbook file:** SharePoint modified date is **unchanged**, "19/08/2026, 4:07:57 pm", the same as the first study. Only the text copy was recaptured ("27/10/2026, 7:51:15 pm", copy line 1; first study used 7:04:37 pm).
2. **New scenarios:** **none**. Same 31 sheets in the same order, same scenario ids on every sheet.
3. **Removed scenarios:** **none**.
4. **Changed scenarios:** **none found**. Every expected result and remark quoted in §3 and §4 still reads the same in the recapture.
5. **Result changes:** **none**. Recount matches §1 item 7 on every sheet:
   1. EAINT-11999: 40 PASS, 8 blank, TCM-P6 "CANNOT ADD NEW VEHICLE IN INVENTORY", TCM-S3 "Tested with TCM-P4".
   2. EAINT-11824: LOG_FEE_TS1-TS140 PASS; TS141-TS164 still **no result**; TS38-TS74 still "New Transaction" only.
   3. 10 June 2026 Scope: REQ_TS12 "On Hold", REQ_TS14 "Requirements not confirmed", REQ_TS18 "On Hold", REQ_TS29 "Pass (Except 'Refunded' records)".
   4. Original chatbot suite: 46 PASS, 4 FAIL, 4 IN PROGRESS, 82 blank.
6. **Limit of this check:** the first text copy no longer exists, so this is a check against what this study recorded, not a cell-by-cell diff. A change in a cell the study never quoted (e.g. step wording) would not show here [unconfirmed that nothing else changed].
7. **Fixes to this study** (errors in the first version, not workbook changes):
   1. **CANCEL_TS21 expected result was wrong.** "Deal auto cancelled" is the "Cancelled By" cell. The Expected Result is "- Seller unable to relist ⏎ - Refund to buyer" (Cancel Transaction R23). Fixed in §3l, §4 and Knowledge candidate 10.
   2. **Epic link added:** EAINT-11890 R2 names "Epic EAINT-11851 Wholesale 2.0" (§1 item 4).
   3. **Ticket Status sheet** contents added (§1 item 11, §6 item 15).
   4. **CANCEL_TS8 retest failure** added to §6 item 13; the first version named only CANCEL_TS2.

## 2. What the ticket changed, as the TS shows it

1. **EAINT-9860 is the Wholesale epic.** The TS shows the whole Wholesale marketplace: WhatsApp buy/sell bot, payment, eAuto Digits ownership transfer, logistics and BO tools.
2. **Base launch (10 June 2026 scope):** STMS lock per UCD, cancellation across WhatsApp/UCD/BO, QR code, JomCheck, RHB payment, EV cars, eVOC upload, logistic fee, 2-layer approval, BO listings and e-Invoice (10 June 2026 Scope R2-R38).
3. **EAINT-11999:** new **BO Marketing tab** with filters, KPI strip, drill-down and **Re-fire** (EAINT-11999 R2-R52).
4. **EAINT-11949:** "Remove logistic v1 flow & Security fixes" (EAINT-11949 R1).
5. **EAINT-11860 & 11862:** "System Auto-Recommendation / UCD Profile & eSTM Recommendation Tiers Handling Enhancement" (R1). Adds BO **Alternative Vehicle Maintenance** page, edit modal and **Audit Log**.
6. **EAINT-11987:** "STMS Recommendation Message Enhancement" (R1). STMS message routing by role.
7. **EAINT-11890:** "Chatbot: List Vehicle by Uploading Photo with Car Plate Number" (R1).
8. **EAINT-11872:** "[eAuto-Wholesale 2.0] eSTM Recommendation Message Enhancement" (R1). New UCD Wholesale landing page and **Wholesale Permission** page.
9. **EAINT-11885:** "Chatbot Enhancement - Update Photo & PDF Handling" (R1). Photo caps.
10. **EAINT-11731:** new logistics flow: daily cron email, seller email, logistics email with **Delivery Orders** (WSS/WSB), QR scan flow (R1-R113).
11. **EAINT-11877:** "Chatbot Enhancement - Only proceed checking before payment" (R1). JPJ enquiry XML at Pay Now.
12. **EAINT-11857:** "Wholesale Listing - Vehicle Photos support PDF format" (R1).
13. **EAINT-11876:** "Phone Number displaying on Payment Page car images URL" (R1).
14. **EAINT-11824:** "Logistic Fee Update" (R1). Full region price matrix.

## 3. Scenarios, grouped

### 3a. EAINT-11999 — BO Marketing tab

1. **TCF-01** default state: "504 vehicles at baseline; 20 rows shown (default page size); sort defaults to 'Latest activity'; Date From auto-resolves to today-30 days" (R2). PASS.
2. **TCF-02 to TCF-04** Flow = profiling / sourcing / estm_restock: every row's flow badge matches (R3-R5). PASS.
3. **TCF-05 to TCF-08** Outcome = sent / capped / skipped_dedup / suppressed_no_stock (R6-R9). PASS.
4. **TCF-09** Outcome = deal: "empty-state message 'No marketed vehicles match these filters.' shown, not a blank table" (R10). PASS.
5. **TCF-10** Status = ACTIVE: every row has "an ENABLED '⟳ Re-fire' button" (R11). PASS.
6. **TCF-11 / TCF-12** Status groups "Any pending" / "Any closed" (R12-R13). PASS.
7. **TCF-13 / TCF-14** Vehicle No. and Company ID filters (R14-R15). PASS.
8. **TCF-15 / TCF-16** date range; default 30 days with a finding that "Date To remains blank" (R16-R17). PASS.
9. **TCF-17 to TCF-19** sort Latest activity / Most marketed / Outcome (R18-R20). PASS.
10. **TCF-20** no match → empty-state message (R21). PASS.
11. **TCF-21 / TCF-22** 2- and 3-filter combos (R22-R23). PASS.
12. **TCF-23 to TCF-25** rows per page 50/100/200; paging keeps filters (R24-R26). PASS.
13. **TCS-01 to TCS-05** KPI checks: Messages sent 139 recomputed; Not delivered "failed=838, capped=5, suppressed=225, already-contacted=12" sum 1080; rate denominators; Led to deal 0; KPI is filter-scoped "139 -> 118" (R27-R31). PASS.
14. **TCM-00** smoke check of mock console and settings page (R34). PASS.
15. **TCM-P1** listing live → dealer "Flow = profiling ⏎   Outcome = sent" (R35). PASS.
16. **TCM-P2** same dealer twice a day → "capped, reason = daily_cap" (R36). Blank.
17. **TCM-P3** more matches than slots → "capped, reason = max_notify" (R37). Blank.
18. **TCM-P4** buyer already sourced → "skipped_dedup (reason 'already_contacted')" (R38). PASS.
19. **TCM-P5** shared phone → "skipped_dedup, reason = recipients_already_contacted" (R39). Blank; may be BLOCKED.
20. **TCM-P6** waiting buyer → "Flow = SOURCING (not profiling), trigger 'waiting_buyers_notify'" (R40). Result "CANNOT ADD NEW VEHICLE IN INVENTORY".
21. **TCM-P7** dealer busy → "outcome = sent with trigger = deferred_broadcast" (R41). Blank.
22. **TCM-P8** UCD-blocked dealer "appears NOWHERE in the Marketing list" (R42). Blank. Flagged as a finding to raise.
23. **TCM-S1** buyer search matches live listing → "Flow = sourcing, trigger = SOURCING_SEARCH, Outcome = sent" (R43). PASS.
24. **TCM-S2** car in nobody's inventory → "NO row appears on the Marketing tab for this search" (R44). PASS.
25. **TCM-S3** car held by another UCD → "Up to 3 linked rows from ONE buyer action" (R45). "Tested with TCM-P4".
26. **TCM-S4** vague search → "Bot will not delivers anything to anyone and will not be displayed in the Marketing tab" (R46). PASS.
27. **TCM-S5** same pitch twice → "skipped_dedup (cooldown)" (R47). Blank.
28. **TCM-S6** UCD-blocked seller → expected now reads "Bot will not delivers anything to anyone and will not be displayed in the Marketing tab" (R48). PASS. Title still says "UCD-blocked seller DOES show as 'failed'".
29. **TCM-E1** eSTM restock, no stock → "suppressed_no_stock" (R49). Blank.
30. **TCM-E2** eSTM restock with matches → "Outcome = sent" (R50). PASS.
31. **TCM-E3** 'ask' variant (R51). PASS.
32. **TCM-E4** undeliverable ask → "Outcome = failed" (R52). Blank.
33. **TCM-E5** 24-hour window closed → "skipped_undeliverable" (R53). PASS.

### 3b. EAINT-11949 — remove logistic v1

1. **11949_E2E_TS1 / TS2** accept / reject vehicle: "Ensure end to end flow only require QR validation by Logistic team from Delivery Order email" (R4-R5). PASS.
2. **11949_E2E_TS3 / TS4** cancel by buyer / seller before full payment: correct refund and message (R6-R7). PASS.
3. **11949_BO_TS1** "Ensure old QR buttons not available on details page" (R9). PASS.

### 3c. EAINT-11860 & 11862 — Alternative Vehicle Maintenance (BO)

1. **TC01** default: "510 records"; "50 rows on page 1" (R4). PASS.
2. **TC02 to TC10** single filters: Status Active/Inactive, Brand (incl. "LAND ROVER" URL-encoded), Model exact/partial/case-insensitive/no match, Source AI/USER (R5-R13). PASS.
3. **TC11 to TC20** 2-, 3- and 4-filter combos (R14-R23). PASS.
4. **TC21** contradictory brand + model → zero results (R24). PASS.
5. **TC22** Reset clears all filters (R25). PASS.
6. **TC23** filter kept across pages (R26). PASS.
7. **TC24** "Input trimmed server-side" (R27). PASS.
8. **TC25 / TC26** derived count checks (R28-R29). PASS.
9. **TC27 to TC32** paging: 11 pages, remainder 10, jumps, Prev, no duplicates, filter kept (R30-R35). PASS.
10. **TC33 to TC35** Inactive + Brand/Model/Source with seed "FOTON VIEW" (R36-R38). PASS.
11. **TCM01** save with no change: empty delete/add arrays (R41). PASS.
12. **TCM02** add alternative → "USER source chip and 'by <user>' meta" (R42). PASS.
13. **TCM03** Add blocked unless Brand and Model both filled (R43). PASS.
14. **TCM04 / TCM05** set Inactive / Active (R44-R45). PASS.
15. **TCM06** tick + Delete selected + Save (R46). PASS.
16. **TCM07** Cancel discards all pending edits (R47). PASS.
17. **TCM08** deleted alternative "is not recommended as top 1 option from the new eSTM Recommendation Message" (R50). Manual, PASS.
18. **TCM09** added alternative "APPEARS in the eSTM Recommendation Message" (R51). Manual, PASS.
19. **TCA01 / TCA02** empty dates → alerts "Please select Log Date From and Log Date To" / "Please select Log Date From" (R56-R57). PASS.
20. **TCA03** From filled, To empty → "No validation alert is shown (documented gap...)" (R58). PASS.
21. **TCA04 to TCA07** username only, no match "No records found.", date only, both (R59-R62). PASS.
22. **TCA08** From auto-sets To with a 30-day max (R63). PASS.
23. **TCA09 / TCA10** friendly action labels; description "OLD -> NEW" (R64-R65). PASS.
24. **TCA11 to TCA15** 4 accounts, each entry logged and filtered to its own user; all visible unfiltered (R66-R70). PASS.
25. **TCA16 to TCA19** two tabs: unsaved edits not logged; saved edits logged; stale-tab status is last-write-wins (R71-R74). PASS.

### 3d. EAINT-11987 — STMS recommendation message routing

1. **TS_STMS_MR_001** Decision Maker only → "Payment Approval message only" (R4). PASS.
2. **TS_STMS_MR_002 / 003** Decision Maker who is also Main / Sub UCD with Wholesale permission → both messages (R5-R6). PASS.
3. **TS_STMS_MR_004** Sub UCD not appointed → no STMS message (R7). PASS.
4. **TS_STMS_MR_005** "Main User always receives the STMS Message — this is mandatory and cannot be disabled." (R8). PASS.
5. **TS_STMS_MR_006 to 009** Sub User ticked / unticked / not in list / re-added (R9-R12). PASS.
6. **TS_STMS_RO_001** non-beta company "not auto-enrolled" (R14). PASS.
7. **TS_ESTMREG_MR_001 to 007** same routing re-checked for eSTM (R16-R22). PASS. Column "Regress Post Shopping Cart Removal (P/F)" also PASS on most.

### 3e. EAINT-11890 — list vehicle by plate photo (chatbot)

1. **TC-01 / TC-02** already listed → "Looks like your listing for {vehicle_no} is already live. Did you want to update the asking price? 💰"; decline leaves listing unchanged (R10-R11). PASS.
2. **TC-03 to TC-05** available to list → Yes lists it, No cancels, fuzzy replies are discovery (R13-R15). PASS.
3. **TC-06** not in STMS → "Please complete the STMS process for it first" (R17). PASS.
4. **TC-07** resend after STMS done (R18). **DEPRIO**.
5. **TC-08** plate not detected → fallback "Sorry, I couldn't clearly detect the vehicle number from this photo..." and typing the plate works (R20). PASS.
6. **TC-09, TC-10, TC-12** blurry, angled, partial plate (R21-R22, R24). PASS.
7. **TC-11** non-standard plate (R23). **DEPRIO**.
8. **TC-13, 13a, 13b, 13c** several plates in one photo → bot asks which car (R25-R28). PASS.
9. **TC-13d** single plate photo is saved as one exterior photo; bot asks "only 3 MORE" (R29). PASS.
10. **TC-13e** 4-5 photos together → straight to image analysis (R30). PASS.
11. **TC-14** screenshot accepted if valid UCD vehicle (R31). PASS.
12. **TC-15** other dealer's plate → must not list or disclose (R32). PASS.
13. **TC-16 to TC-18** repeat photo, handwritten plate (rejected), several photos in one session (R33-R35). PASS.
14. **TC-19 / TC-20** no vehicle / non-image file (R36-R37). PASS.
15. **TC-21 to TC-23** regression of other chatbot flows; listing shows in BO; WhatsApp/eSTM side effects (R39-R41). PASS.

### 3f. EAINT-11872 — Wholesale landing + Permission page + eSTM routing

1. **11872_TS_WM_001 to 005** WHOLESALE button opens landing with "'Wholesale Transaction Listing' (left) and 'Wholesale Permission' (right)"; module hidden for Sub User without permission (R4-R8). PASS.
2. **11872_TS_WP_001 to 012** Permission page: Main User own row "'Receive' and is disabled/non-editable"; toggle "Click To Activate" / "Click To Inactivate"; Save Changes / Discard Changes; unsaved toggles not kept; Sub User with permission is read-only; Sub User without permission blocked (R10-R21). PASS.
3. **TS_MR_001 to 010** eSTM routing by role; "No eSTM message is sent — the message is only triggered when both conditions are met simultaneously" (R23-R32). PASS.
4. **TS_MT_001 / 002** Payment Approval and eSTM templates unchanged (R34-R35). PASS.
5. **TS_RO_001** non-beta company not auto-enrolled (R37). PASS.

### 3g. EAINT-11885 — photo caps

1. **11885_CB_PHOTO_TS1 to TS7** listing cap 10 on staging; extras dropped; wrong-car and wrong-colour photos rejected and not counted; existing photos count toward cap (R5-R11). PASS.
2. **11885_CB_PHOTO_TS8** over 50 photos a day → daily limit message (R13). PASS.
3. **11885_CB_PHOTO_TS9** additional (interior) photo no longer checked against the vehicle (R15). PASS.

### 3h. EAINT-11731 — logistics flow, emails, Delivery Orders

1. **DCJ_TS1 to TS3** daily cron email "[Wholesale] Pending seller thumbprint – {date}" to operation@eauto.my; none if empty; failed run logged (R3-R5). PASS.
2. **EM_SELL_TS1 to TS4** seller email "[Wholesale] Action required – create transaction for {vehicle number}"; none on failed payment; sent once with two tabs; failure alerts IT (R11-R14). PASS.
3. **EM_LOGISTICS_TS1 to TS6** logistics email with two PDFs, field checks, IT alerts on failure (R20-R25). PASS.
4. **LGF_TS1** end-to-end: full payment → seller transfer → eAuto Digits accept → QR scans → "Delivery Arranged" → "Delivered" → "Tx Status should update to Completed" (R31-R37). PASS.
5. **LGF_TS2 / TS3** wrong vehicle number → "Not allowed to proceed with photos upload" (R38-R39). PASS.
6. **LGF_TS4 / TS5** photo upload failure → retry allowed (R40-R41). PASS.
7. **EM_DN_TS1 to TS21** Dispatch Note (Seller) fields: number "WSS<8 digits>", date format, blank lorry number, service type, prefilled vehicle fields, 12-item photo checklist, QR, legal text (R47-R68). PASS.
8. **EM_DO_TS1 to TS21** Delivery Order (Buyer) fields, same pattern with "WSB<8 digits>" (R74-R94). PASS.
9. **11731_6JUL_TS1 to TS6** 6 July changes: pick-up default next day, email subject change, signature block, Reject button hidden after 24 h, "Below (Nenas)", relist after cancel (R100-R105). PASS.
10. **11731_EXS_TS1 to TS4** existing transactions stay on the old logistic flow (R110-R113). PASS.

### 3i. EAINT-11877, 11857, 11876

1. **11876_TS1** (sheet EAINT-11877) Pay Now JPJ enquiry XML carries seller and eAuto Digit fields (EAINT-11877 R3). PASS.
2. **11876_TS2** (sheet EAINT-11877) blocked by vehicle validation: "To be tested by dev as confirmed" (R4). N/A.
3. **11857_TS1 to TS5** PDF photos: correct/wrong vehicle, two PDFs, more than 10 images → "only take the first 10 image" (EAINT-11857 R4-R8). PASS.
4. **11857_TS6 / TS7** eVOC in two PDFs (R9-R10). PASS.
5. **11876_TS1 to TS4** photo URLs on listing, payment page, UCD details, BO details "Should not expose UCD's phone number in URL" (EAINT-11876 R3-R6). PASS.

### 3j. EAINT-11824 — logistic fee matrix

1. **LOG_FEE_TS1 to TS18** Klang Valley Hub ↔ Southern towns, both ways: Seremban 250, Melaka 300, Kulai/Johor Bahru/Muar 400, Batu Pahat/Kluang 450, Pasir Gudang 500, Segamat 550 (R5-R23). PASS.
2. **LOG_FEE_TS19 to TS90** Southern ↔ Southern pairs, e.g. Seremban → Melaka 220, Kulai → Johor Bahru 200 (R25-R96). PASS.
3. **LOG_FEE_TS91 to TS100** KV ↔ Northern: Ipoh 300, Sitiawan 350, Penang 400, Bayan Lepas 450, Alor Setar 500 (R98-R108). PASS.
4. **LOG_FEE_TS101 to TS120** Northern ↔ Northern, e.g. Penang ↔ Bayan Lepas 180 (R110-R129). PASS.
5. **LOG_FEE_TS121 to TS128** KV ↔ East Coast: Temerloh 400, Kuantan 550, Kuala Terengganu 750, Kota Bharu 950 (R131-R139). PASS.
6. **LOG_FEE_TS129 to TS140** East Coast ↔ East Coast (R141-R152). PASS.
7. **LOG_FEE_TS141 to TS158** cross-region = sum of both KV legs, e.g. "250 + 300 = 550" Seremban → Ipoh (R154-R176). **No result.**
8. **LOG_FEE_TS159 to TS164** same town to same town = "400" (R178-R185). **No result.**

### 3k. 10 June 2026 Scope (launch checklist)

1. **REQ_TS1 to TS11** general: STMS lock, unlock on cancel, message trigger, cancellation, sub-users, QR, JomCheck, RHB, EV, eVOC, logistic fee (R2-R12). Pass.
2. **REQ_TS12** car masking (R13). **On Hold**.
3. **REQ_TS13 to TS19** UCD: buyer reject after delivery, eAuto Digits return to seller (**not ready**), eSTM blocked after processing fee, permission, 2-layer approval, document buttons (**On Hold**), Step 2 (R14-R20).
4. **REQ_TS20 to TS32** BO: details page, document buttons, reconciliation, failed payment, e-Invoice, logistic status mapping, direct URL access, listings search and filter (R21-R33). Pass; REQ_TS29 except "Refunded".
5. **REQ_TS33 to TS37** Firefox reject applet, different IC handling, final negotiated price in WhatsApp, cancellation revamp, approval for full payment (R34-R38). Pass.

### 3l. Failed Payment and Cancel Transaction

1. **FAILED_PY_TS1 to TS5** buyer/seller processing fee, full payment, STMS legs failed → matching "Payment Details (...) = Failed" (Failed Payment R3-R7). PASS.
2. **CANCEL_TS1 to TS6** UCD cancel by buyer/seller at each payment stage (Cancel Transaction R3-R8). PASS.
3. **CANCEL_TS7 to TS12** WhatsApp cancel: mostly "CANNOT CANCEL VIA WHATSAPP AFTER PAYMENT MADE" (R9-R14). PASS.
4. **CANCEL_TS13 to TS20** BO cancel with Delist Yes/No and Refund options (R15-R22). PASS.
5. **CANCEL_TS21** buyer paid, seller did not within 20 min; cancelled by "Deal auto cancelled" → "- Seller unable to relist ⏎ - Refund to buyer" (R23). Result cell blank; "Retest Result (8/6/2026)" PASS. CANCEL_TS19 and TS20 are the same (PASS in retest only).

### 3m. Original chatbot suite (v3, May 2026)

1. **VL-TC-001 to 010** View Listing: show listings, informal phrasing, empty state, unregistered number, other seller's plate, 12 listings, PENDING label (🔍 View Listing R4-R17). 8 PASS, 2 blank.
2. **AL-TC-001 to 014** Add Listing: full flow, second car, edit before live, invalid plate, duplicate plate, under 4 photos (**FAIL**, EAINT-11375), low price warning, timeout (blank), PDF (**IN PROGRESS**), No at confirm, plate with space, one-message details (➕ Add Listing R4-R19).
3. **WD-TC-001 to 010** Withdraw: full flow (**FAIL**, EAINT-11367), relist, reasons, invalid plate, No, double withdraw, blank reason (❌ Withdraw Listing R4-R15).
4. **CP-TC-001 to 010** Change Price: core (**IN PROGRESS**), "11K" shorthand, repeat changes, withdrawn car, zero/negative (**FAIL**, EAINT-11377), text, No, commas, very high (💰 Change Price R4-R15).
5. **BS-TC-001 to 012** Buyer Search: make/year, step-by-step, one-shot, multiple cards (**IN PROGRESS**), photo request, no match (**FAIL**), unknown make, future year (**IN PROGRESS**), unregistered (blank), on-hand car, PENDING hidden, two buyers (🛒 Buyer Search R4-R17).
6. **BE-TC-001 to 008** Enquiry/Offer: offer, question, JomCheck link, withdrawn car, low offer, reserved car, concurrent withdrawal, concurrent offers (💬 Buyer Enquiry-Offer R4-R13). 2 PASS, 6 blank.
7. **BP-TC-001 to 010** Booking/Pay (💳 Buyer Booking-Pay R4-R15). All blank. BP-TC-004 "On hold".
8. **CR-TC-001 to 015** Cross-role (⚠️ Cross-Role Edge Cases R4-R21). All blank. CR-TC-001 "On hold".
9. **RC-TC-001 to 010** Race conditions incl. load tests (⚠️ Race Conditions R4-R13). All blank.
10. **DLR-TC-001 to 007** Multi-SubUser dealer (🔐 Multi-SubUser Dealer R4-R10). All blank.
11. **SR-TC-001 to 010** Search & Recommend: colour/year match, radius expansion (PASS), distance ranking (PASS), typos (📊 Search & Recommend R4-R17).
12. **NEG-TC-001 to 010** Negotiation (💬 Negotiation Flow R4-R23). All blank.
13. **SEC-TC-001 to 010** Security: role, self-booking, isolation, rate limits, masking, session TTL (🔒 Security & Access R4-R18). All blank.

## 4. Business rules and system behaviour the TS reveals

### Marketing tab (EAINT-11999)

1. **Default window:** "Date From auto-resolves to today-30 days and is shown in the field (not filtered silently) - matches REQ-009. FINDING: Date To remains blank in this state" (EAINT-11999 R17).
2. **Re-fire invariant:** "confirms REQ-016's own stated invariant that the Active filter set is exactly the re-fireable set" (EAINT-11999 R11).
3. **Pending statuses:** "NEW, PENDING_PHOTO_PRICE, PENDING_PRICE, PENDING_PHOTO, PENDING_MILEAGE, PENDING_PHOTO_MILEAGE, PENDING_PRICE_MILEAGE, PENDING_PHOTO_PRICE_MILEAGE, PENDING_VEHICLE_INFO, PENDING_CONFIRMATION" (EAINT-11999 R12).
4. **KPI is filter-scoped:** "Messages-sent KPI changes from 139 (baseline) to 118 (flow=sourcing)" (EAINT-11999 R31).
5. **Cap settings:** "'acquirer_broadcast_max_notify' and ⏎    'acquirer_broadcast_max_per_company_per_day'" with defaults "(expected: max_notify=5, max_per_company_per_day=2)" (EAINT-11999 R34).
6. **Day boundary:** "the day resets at MIDNIGHT MALAYSIA TIME (not UTC)" (EAINT-11999 R36).
7. **Two capped reasons:** "both show as 'capped' on the tab, so check the reason text to tell them apart" (EAINT-11999 R37).
8. **Sourcing rule:** "a sourcing search belongs on the Marketing tab only when the car is NOT YET LISTED but IS in another UCD's inventory" (EAINT-11999 R44).
9. **'failed' cannot be filtered:** "do NOT try to filter Outcome = failed - 'failed' is not one of the ⏎    filter's choices (known gap, intake finding F14)" (EAINT-11999 R48, R52).
10. **'failed' is rare:** "this is one of only two places in the whole system that writes 'failed'" (EAINT-11999 R52).
11. **Deferred send gap:** "Known gap: if that deferred send FAILS, no row is written at all" (EAINT-11999 R41).
12. **24-hour window:** "chatting as that dealer at any point before the test reopens their window and this case will not reproduce" (EAINT-11999 R53).

### Alternative Vehicle Maintenance (EAINT-11860 & 11862)

1. **Add needs both fields:** "Add is silently blocked client-side until both fields are filled" (R43).
2. **Save payload:** "Save payload {status:'INACTIVE', delete_alt_ids:[], add_alternatives:[]}" (R44).
3. **Audit log date rule:** "Log Date To auto-populates; its datepicker has a maxDate constraint enforcing the 30-day window" (R63).
4. **Audit log validation gap:** "No validation alert is shown (documented gap in the client-side validation); the request fires anyway with date_to=''" (R58).
5. **Only saves are logged:** "proving only persisted Saves are logged, not merely opening/editing the modal" (R71).
6. **Concurrency:** "add_alternatives/delete_alt_ids as diffs, so eautosoyeng's concurrent addition survives ... the status field is sent as a full value, so kmcheah's later save wins for status (last-write-wins)" (R72).
7. **Paging is 0-indexed in the URL:** "Page-2 URL keeps status=ACTIVE (page=1, 0-indexed)" (R26).

### Recommendation message routing (EAINT-11987, EAINT-11872)

1. **Main User mandatory:** "Main User always receives the eSTM Recommendation Message — this is mandatory and cannot be disabled." (EAINT-11872 R27).
2. **Decision Maker:** "holding Wholesale permission as Main UCD overrides the plain Decision Maker default" (EAINT-11987 R5).
3. **Trigger needs both:** "the message is only triggered when both conditions are met simultaneously" (EAINT-11872 R32).
4. **Permission page edit rights:** "Sub User can view the Sub User list and settings, but all controls are disabled (read-only)" (EAINT-11872 R15).
5. **Simulator caveat:** "simulator will render differently. need to copy message and paste on whatsapp to verify rendering of template" (EAINT-11872 R34).
6. **Permission before and after beta:** "If NO permission: ⏎ - Beta: Hide wholesale module ⏎ - After Beta: Display, but show error message when attempt to access module" (10 June 2026 Scope R17).

### Chatbot listing and photos (EAINT-11890, 11885, 11857)

1. **Multi-plate photo:** "bot asks the user to confirm which car to start listing (does not silently pick one, does not list both automatically)" (EAINT-11890 R25), "Confirmed with Zoe (2026-07-22, see team chat)".
2. **Plate photo counts as exterior:** "the bot SAVES this single photo as one of the exterior photos" (EAINT-11890 R29).
3. **Inventory source:** "inventory data is retrieving from prod db" (EAINT-11890 R18, remark).
4. **Photo caps:** sheet headings "Listing Photo Cap (Staging = 10)" (EAINT-11885 R4) and "Total Photo Cap Per User Per day (Staging = 50)" (R12).
5. **Rejected photos:** "photos 1–5 are rejected (retained with status REJECTED) and do NOT count toward the cap" (EAINT-11885 R7).
6. **Interior photos unchecked:** "Bot no longer validates whether the additional (interior) photo matches the correct vehicle." (EAINT-11885 R15).
7. **PDF limit:** "Image analysis should only take the first 10 image to analyze." (EAINT-11857 R8).
8. **Min photos:** "Bot: 'Please send at least 4 photos (front, rear, both sides).'" (➕ Add Listing R12).
9. **Unregistered number message:** "'You and/or this phone number do not currently have access to buy/sell this vehicle in the eAuto Wholesale Marketplace. Please contact the eAuto Support team for further assistance.'" (🔍 View Listing R10).
10. **Not-your-plate message:** "'We couldn't find <Plate> in your dealer inventory. Please make sure the vehicle is registered in STMS under your account. 🚗'" (🔍 View Listing R12).
11. **"No" at listing confirm (current copy):** "Faiz: Latest reply is \"No problem - what would you like to change for your 1996 Volvo 850 WEL8373? You can send the updated price, mileage, variant, transmission, or colour in one message 👍\"" (➕ Add Listing R16).
12. **Price warnings removed:** "Dev removed the warning and recommendations for beta testing round" (💰 Change Price R15).

### Logistics, emails, documents (EAINT-11731, 11949)

1. **Cron schedule:** "Daily Cron Job Trigger = 8 AM" (EAINT-11731 R3) with remark "Staging set to every hour trigger on XX:00" (same row).
2. **Seller email:** "Subject: [Wholesale] Action required – create transaction for {vehicle number}" (EAINT-11731 R11). Sent "only once" with two tabs (R13).
3. **Logistics email (latest):** "To: wholesale@eauto.my ⏎ CC: mytriodistribution@gmail.com ⏎  ⏎ Subject: [Wholesale Logistic] Arrangement - {WSS Transaction Number / WSB Transaction Number} - {vehicle number}" (EAINT-11731 R101).
4. **PDF names:** "Seller = Delivery Order Seller Copy (WSS).pdf ⏎ - Buyer = Delivery Order Buyer Copy (WSB).pdf" (EAINT-11731 R21).
5. **Number prefixes:** "Should start with prefix WSS<8 digits>" (R47); "Should start with prefix WSB<8 digits>" (R74).
6. **Photo checklist item renamed:** "New changes: Below -> Below  ⏎ (Nenas)" (EAINT-11731 R104).
7. **Reject window:** "The “Reject Vehicle” button is no longer displayed once 24 hours have  ⏎ passed(based on logistics status updated to \"Delivered\")" (EAINT-11731 R103).
8. **Logistics scan:** "Logistic enter Vehicle Number & upload 12 photos | Logistic Status should update to Delivery Arranged" (R34); then "Delivered" (R36).
9. **Old flow kept for old deals:** "Should display Final Logistic QR at Step 6 for Buyer's STMS and should only update Tx Status = Approved once scanned Final Logistic QR" (EAINT-11731 R110).
10. **v1 removed:** "Ensure old QR buttons not available on details page" (EAINT-11949 R9).

### Fees, payment, cancellation

1. **Hub-to-Hub:** column header "Expected Price (Hub-to-Hub) ⏎ Note: Door-to-Door + RM200" (EAINT-11824 R2).
2. **Cross-region fee:** sum of two KV legs, e.g. "LOG_FEE_TS141 | Seremban | Ipoh | 250 + 300 = 550" (EAINT-11824 R154). Untested.
3. **Logistic fee tax:** "Based on BA, service tax will be 8% but the fee should be RM0.00 until Production until further notice." (10 June 2026 Scope R12).
4. **Invoices manual:** "Currently invoice will be manually issued by finance" (10 June 2026 Scope R19).
5. **One date filter at a time:** "Only allow one date filter selection at one time" (10 June 2026 Scope R33).
6. **eSTM blocked after processing fee:** "attempt to create estm with the same car plate no ⏎ - error message displayed" (10 June 2026 Scope R16).
7. **Failed seller fee also fails logistic:** "Payment Details (Seller Processing Fee) = Failed ⏎ Payment Details (Logistic) = Failed" (Failed Payment R4).
8. **Buyer cancels after processing fee:** "Vehicle will be relisted (ACTIVE) & other buyer able to source ⏎ - No refund" (Cancel Transaction R3).
9. **Seller cancels:** "Vehicle cannot be relisted ⏎ - No refund to seller ⏎ - Refund to buyer" (Cancel Transaction R4).
10. **After full payment:** "Both side unable to cancel on UCD ⏎ - Refund to buyer for full payment done manually by operation team" (Cancel Transaction R7).
11. **WhatsApp cancel:** "CANNOT CANCEL VIA WHATSAPP AFTER PAYMENT MADE" (Cancel Transaction R9).
12. **Auto-cancel:** "Buyer Pay ⏎ (Processing Fee) but Seller did not (expired after 20 min) | Deal auto cancelled | - Seller unable to relist ⏎ - Refund to buyer" (Cancel Transaction R23; columns Scenario | Cancelled By | Expected Result).
13. **Seller self-booking:** "Listing summary of seller do not contain any payment link" (🔒 Security & Access R5).

### Security

1. **No phone in photo URLs:** "Should not expose UCD's phone number in URL" (EAINT-11876 R3-R6).

## 5. Test data, environments, accounts, setup

1. **Environments named:**
   1. "eAuto Wholesale Backoffice staging (stage-ws.eauto.my/bo)" (EAINT-11999 R2).
   2. "eAuto SIT2 staging" (EAINT-11860 & 11862 R30 onward).
   3. "staging (env TBC) - NOT YET DEPLOYED TO PRODUCTION. Ticket status: Ready in 1st Env (as of 2026-07-21)." (EAINT-11890 R4).
   4. "Ready on SIT" for eVOC (10 June 2026 Scope R11). "RHB payment staging" (R9).
2. **Test tools:** mock WhatsApp console "<app-base>/eauto-ws-test" and settings page "<app-base>/bo-home/settings" (EAINT-11999 R34). Shortcut "POST /listings/{vehicle_no}/activate" (R35). API "GET /b/alt-vehicles" (EAINT-11860 & 11862 R36).
3. **Seed data:** "Seeded test company_account_id, e.g. 1100729 or 1100979 ⏎ (full list: docs/CLICKHOUSE_SEED_DATA.md in wholesale-backend, 112 seeded companies)" (EAINT-11999 R34).
4. **Records:** alt-vehicle id 510 "RENAULT FLUENCE" and id 509 "HONDA ACCORD" (EAINT-11860 & 11862 R41, R66). Non-beta company "Company ID = 1100314", "STMS = S674493494", "eSTM = E671941216" (EAINT-11987 R14; EAINT-11872 R37).
5. **Plates used:** BMH8398, BQS8547, JNM3114, WSS65000053, chatbot plates WNS9147, VDB2329, WVU2241, WUW663, DDM1847, VPT6284, WYT5677, WEL8373.
6. **Accounts:** BO usernames jasons, kmcheah, eautosoyeng, eautokelvin (EAINT-11860 & 11862 R66-R69). **Credentials present** in EAINT-11999 R34 and 10 June 2026 Scope R10. Not copied here.
7. **Dev help needed:** settings changes, DB checks for shared phones and UCD-ineligible companies, template failure, record date patching ("Dev patched to 2026-07-06 14:43:43.0", EAINT-11731 R103).

## 6. Gaps or risks a regression should still cover

1. **Untested fee matrix:** LOG_FEE_TS141-TS164 (cross-region sums and same-town "400") have no result (EAINT-11824 R154-R185).
2. **Blank Marketing outcomes:** daily_cap, max_notify, shared phone, deferred send, UCD-blocked dealer, cooldown, suppressed_no_stock, failed ask (EAINT-11999 TCM-P2, P3, P5, P7, P8, S5, E1, E4).
3. **TCM-P8 finding not closed:** UCD-blocked dealer leaves no record on the tab (EAINT-11999 R42). No dev answer in the sheet.
4. **TCM-S6 expected was rewritten** to "will not be displayed" while the title still says "DOES show as 'failed'" (R48). The real rule is unclear [unconfirmed].
5. **Date To blank** on default Marketing window (EAINT-11999 R17). Open finding.
6. **Aggregate row mismatch:** "No specific vehicle" row shows 71 sent vs "~1185 raw entries" (EAINT-11999 R27). Open finding.
7. **Audit Log From-only search** fires with empty To (EAINT-11860 & 11862 R58). Documented gap.
8. **BO permission control** section for EAINT-11987 has no rows (R23).
9. **Chatbot core risk sheets blank:** booking/pay, cross-role, race conditions, multi-sub-user, negotiation, security. These are mostly the "🚨 CRITICAL" items (e.g. BP-TC-004 "MUST BLOCK — financial + legal risk", "On hold"). Wholesale chatbot TS are manual only.
10. **Open chatbot FAILs:** AL-TC-008 (EAINT-11375), WD-TC-001 (EAINT-11367), CP-TC-006 (EAINT-11377), BS-TC-006 ("Bot says will continue searching, and after that no more response").
11. **On hold / not ready launch items:** car masking (REQ_TS12), eAuto Digits return to seller (REQ_TS14), document buttons (REQ_TS18), Refunded filter on Refund Listing (REQ_TS29).
12. **DEPRIO plate cases:** TC-07 (re-check after STMS) and TC-11 (non-standard plate) (EAINT-11890 R18, R23).
13. **Cancel retests:** remarks record retest failures "8/6/2026 (Retest): FAILED - Listing need to show 'To Refund'" (EAINT-11711) and "9/6/2026 (Retest): FAILED - Car is not blacklist on the seller side" (EAINT-11726) on CANCEL_TS2 (R4). CANCEL_TS8 carries the same "8/6/2026 (Retest): FAILED - Listing need to show 'To Refund'" remark (R10). Both result columns read PASS. Final state unclear [unconfirmed].
14. **External email CC:** logistics email CC is an outside Gmail address (EAINT-11731 R20, R101). Check staging settings before triggering.
15. **Tickets with no TS sheet:** the Ticket Status sheet lists 11884, 11997, 11998, 12000 (two rows), 12001, 12002, 12004 and 12109 with no sheet of their own. 11998 and both 12000 rows read "Drafting Scenarios" (Ticket Status R6, R8, R9). Their TS may live in another workbook [unconfirmed].
16. **eSTM message on approval:** REQ_TS3 is "Pass" but its note says "eSTM not triggering whatsapp" (10 June 2026 Scope R4). Only the STMS trigger was confirmed in that row.

## 7. Where this TS changes or contradicts knowledge/

1. **Contradiction — Marketing Outcome filter.** `knowledge/flow-wholesale.md` line 297 lists "failed" among the Outcome filter values. The TS says "'failed' is not one of the ⏎    filter's choices (known gap, intake finding F14)" (EAINT-11999 R48, R52).
2. **Resolves an open conflict — cron time.** `flow-wholesale.md` line 79 flags 8 AM vs 1 PM / 2 PM runs as "Schedule is unclear". DCJ_TS1 remark says "Staging set to every hour trigger on XX:00" (EAINT-11731 R3). So 8 AM is the rule; staging runs hourly.
3. **Adds to fee table.** `flow-wholesale.md` line 169 lists only KV ↔ Southern prices. The TS also has Northern, East Coast, intra-region pairs and cross-region sums (EAINT-11824 R98-R185).
4. **Adds Marketing rules** not in flow-wholesale: cap setting keys and defaults, Malaysia-midnight reset, sourcing-row rule, deferred-send gap (EAINT-11999 R34-R53).
5. **Adds Alternative Vehicle Maintenance details:** save payload, Add validation, audit-log 30-day cap, last-write-wins (EAINT-11860 & 11862).
6. **Confirms** pending statuses (flow-wholesale line 29), photo caps (line 37), Main User mandatory routing (line 49), id mismatch "11876_TS1 inside the EAINT-11877" sheet (line 119).

## Knowledge candidates

1. **Marketing tab Outcome filter has no "failed" choice.** Source: "'failed' is not one of the ⏎    filter's choices (known gap, intake finding F14)" (EAINT-9860 v3, sheet EAINT-11999, R48 and R52). Fix `knowledge/flow-wholesale.md` line 297.
2. **Pending-thumbprint cron:** production 8 AM; staging hourly at XX:00. Source: "Daily Cron Job Trigger = 8 AM" and remark "Staging set to every hour trigger on XX:00" (sheet EAINT-11731, R3). Closes the conflict at flow-wholesale line 79.
3. **Marketing cap settings:** keys `acquirer_broadcast_max_notify` (default 5) and `acquirer_broadcast_max_per_company_per_day` (default 2), set at `<app-base>/bo-home/settings`; day resets at Malaysia midnight. Source: sheet EAINT-11999, R34 and R36.
4. **Marketing sourcing rule:** a sourcing search is recorded only when the car is not listed but is held in another UCD's inventory; one search can make up to 3 linked rows. Source: sheet EAINT-11999, R44-R45.
5. **Logistic fee matrix, full:** KV ↔ Northern (Ipoh 300, Sitiawan 350, Penang 400, Bayan Lepas 450, Alor Setar 500) and KV ↔ East Coast (Temerloh 400, Kuantan 550, Kuala Terengganu 750, Kota Bharu 950); cross-region = sum of both KV legs; same town = 400 (last two untested). Source: sheet EAINT-11824, R98-R185.
6. **Alternative Vehicle Maintenance audit log:** To date capped at From + 30 days; From-only search fires without alert; only saved edits are logged; status is last-write-wins, add/delete are diffs. Source: sheet EAINT-11860 & EAINT-11862, R58, R63, R71-R72.
7. **Wholesale chatbot inventory reads production data** on staging. Source: "inventory data is retrieving from prod db" (sheet EAINT-11890, R18). [unconfirmed beyond this remark]
8. **Mock WhatsApp console for Wholesale testing:** `<app-base>/eauto-ws-test`; seeded companies listed in `docs/CLICKHOUSE_SEED_DATA.md` in wholesale-backend (112 companies). Source: sheet EAINT-11999, R34.
9. **Reject Vehicle button hides 24 h after logistics status "Delivered".** Source: sheet EAINT-11731, R103.
10. **Wholesale cancel rules** (buyer cancel → relist, no refund; seller cancel → no relist, buyer refunded; no WhatsApp cancel after payment; 20-minute auto-cancel when seller does not pay → "- Seller unable to relist ⏎ - Refund to buyer"). Source: sheet Cancel Transaction, R3-R4, R9, R23. `flow-wholesale.md` lines 42 and 60 already match the auto-cancel rule; check the rest against its "Cancel, reject and refund" flow.
11. **Wholesale 2.0 epic:** EAINT-11890 is under "Epic EAINT-11851 Wholesale 2.0" (sheet EAINT-11890, R2). Worth recording in flow-wholesale.md so Wholesale 2.0 tickets are searched under EAINT-11851 as well as EAINT-9860.
12. **Workbook summary sheet is unreliable** ("GRAND TOTAL | 89", garbled rows R11-R14). Count from the sheets, not the summary. Source: sheet 📋 Summary, R11-R14.
