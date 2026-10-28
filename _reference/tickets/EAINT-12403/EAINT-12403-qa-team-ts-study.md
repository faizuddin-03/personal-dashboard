# EAINT-12403 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study. No knowledge/, lib/ or app/ file was changed.

## Sources read

1. **Workbook text copy (named source):** `_reference/sharepoint/qa-team-ts/EAINT-12403 - [eAuto-UCD] STMS & APT Increase eAuto Service Charge for Car & Commercial Car (Effective 02.10.2026).md` (text copy dated "27/10/2026, 6:52:25 pm"). The Read tool could not open this path (square brackets / `&` in the name). It was read through Grep instead: sheet list, row numbers (R1–R82) and spot-check strings confirmed.
2. **Same workbook, full cell text:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-12403_-_eAuto-UCD_STMS_&_APT_Increase_eAuto_Service_Charge_for_Car_&_Commercial_Car_.txt`. Same content, no row prefixes. Row numbers below come from the named copy (line N of the named copy = row N−3; checked at R14, R16, R19, R25, R46, R53, R58, R68, R72, R78, R80, R82).
3. **Teams capture:** `_reference/teams/EAINT-12403-STMS-APT-Service-Charge-Increase.md` (41 messages, 2026-09-24 to 2026-10-01).
4. **Knowledge:** `knowledge/README.md` index; grep of `knowledge/` for "12403" (flow-apt, flow-stms, flow-ucd-to-ucd, flow-payments-fees, business-rules-from-test-scenarios §1, cr-ledger, releases, teams-decisions-by-ticket, esim, environments-history).
5. **`lib/ticketStudies.ts`:** no entry for EAINT-12403.
6. **`_reference/tickets/EAINT-12403/` and `_reference/tickets/Studying/EAINT-12403/`:** did not exist before this study.
7. **Not read:** `_reference/codebases/eauto-qa-azfar/cr/EAINT-12403/00-input/SRD_EAINT-12403_v1.1_20260925.pdf` and `EAINT-12403_Test_Scenarios_v4.1.xlsx` (outside this study's scope; SRD wording below is only what the TS quotes).

## 1. Header

1. **Ticket:** EAINT-12403. R1: "Ticket(s): https://mfservices.atlassian.net/browse/EAINT-12403".
2. **Module / portal:** UCD portal — **STMS**, **UCD to UCD** (Standard + Interstate), **APT**; BackOffice for reset, reports and RHB payment checks; Wholesale display checks.
3. **Workbook:** "EAINT-12403 - [eAuto-UCD] STMS & APT Increase eAuto Service Charge for Car & Commercial Car (Effective 02.10.2026).xlsx", library "eAuto - CR Test Scenarios", modified 01/10/2026 11:53:10 am.
4. **Sheets:** one — **APT** (despite the name, it holds STMS, UCD to UCD and APT rows).
5. **Scenarios:** **45 unique TS IDs** (several split across a "Before" row and an "After" row).
6. **Results:** **38 PASS**, **7 Deprioritised**, **0 Fail**. Deprioritised: 12403_STMS_PRE1, 12403_CRN1, 12403_CRN2, 12403_CRN3, 12403_R3, 12403_R6, 12403_R7.
7. **Tester:** QA column = "Azfar" on every row except 12403_STMS_PRE1 (blank).
8. **Dates in the sheet:** "v4 (28.09.2026)" (R82); "Decided 24.09.2026 (QA)" (R19); "UI verified AFTER the change only (QA 28.09.2026)" (R30); "as advised by Dev (29.09.2026)" (R58); "No Wholesale transactions this cycle (confirmed by QA 2026-09-25)" (R75); BO exports "export-STMS-202609281518.csv, export-APT-202609281519.csv" (R14).
9. **Sign-off (Teams, not the sheet):** "QA has completed testing for EAINT-12403 on staging/preprod1 (eAuto) with no outstanding issues. It's ready for night deployment on 1 Oct (Thursday)." [Teams EAINT-12403, 2026-10-01 15:09, QA engineer (Azfar)]

## 2. What the ticket changed, as the TS shows it

1. **Objective:** "To update STMS (incl. UCD to UCD Standard & Interstate) and APT eAuto Service Fee from RM20 to RM25 (vehicle type Car and Commercial Car, all usage codes except AA)" (R4).
2. **Fee reference block** (R3–R6, column "Fee reference (SRD 2.2.2, rate card)"):
   1. "Car (usage codes AB to DK): eAuto RM20.00 -> RM25.00 | incl. 8% RM21.60 -> RM27.00"
   2. "STMS / UCD to UCD total: JPJ RM10.00 + RM27.00 = RM37.00 (was RM31.60) — every region"
   3. "APT total Semenanjung: JPJ RM100.00 + RM27.00 = RM127.00 (was RM121.60)"
   4. "APT total Sabah / Sarawak: JPJ RM40.00 + RM27.00 = RM67.00 (was RM61.60)"
   5. "APT exceptions (JPJ follows usage code): IA Sabah/Sarawak = RM127.00; BF & BJ Semenanjung = RM67.00"
   6. "NOT affected: usage code AA (STMS CAR RM11.80 total, APT RM5 fee) and every BIKE row (e.g. STMS AB BIKE RM26.20)"
   7. "Tiles (excl. 8%): STMS From RM30 -> RM35, UCD TO UCD RM30 -> RM35, APT RM120 -> RM125"
3. **Sources named:** "SRD: v1.1 (25.09.2026) | Source: EAUTO-1069 / CCB-990 | Reference: production rate card (eAuto transfercost table, 20.09.2026)" (R5).
4. **Go-live:** "Production: price update + reset 01.10.2026 (Thurs) from 11.30pm, effective 02.10.2026 (Fri)." (R6)
5. **Failed-payment reset** after the push: "Failed-payment reset: Failed / Failed on the UCD portal only, via BO Reset Payment after the price push — Pending and Wholesale excluded. Never use the bulk admin reset link." (R82)
6. **APT section reuse:** "APT section reused from EAINT-12289 with prices and TS No updated; PAY2, CRN2 and R2 changed, R4 removed (STMS is in scope)." (R82)

## 3. Scenarios

### 3a. Baseline before the price push

1. **12403_STMS_PRE1** — rate card compare + export the Failed reset population. Expected: "preprod1 rate card = production (CAR rows at RM20; AA CAR RM10 STMS / RM5 APT; BIKE rows unchanged) — if preprod1 differs, stop and ask Dev • Reset population exported". **Deprioritised** (rate card part needs Dev). (R14)

### 3b. UCD STMS price change

1. **12403_STMS_E2E1** — AE Car, Semenanjung, STMS Individual. Expected Step 5 "JPJ Fee = RM10.00 • eAuto Fee = RM25.00 • Service Tax 8% = RM2.00 • Total Amount Payable = RM37.00"; debit RM37.00; Approved; e-Invoice / Slip Pengesahan / JPJ Official Receipt. PASS. (R16)
2. **12403_STMS_E2E2** — BF Commercial Car, Sabah/Sarawak, STMS Company. Same RM37.00; "STMS JPJ is RM10 in all regions". PASS. (R17)
3. **12403_STMS_DEP1** — created before push, paid after. Before: "eAuto Fee = RM20.00 • Total Amount Payable = RM31.60" (R18). After Resubmit: "Total Amount Payable = RM37.00 • Amount actually debited = RM37.00" (R19). PASS.
4. **12403_STMS_PAY1** — AB Car, RHB IF fail before push, BO reset, repay. After: "Step 5: JPJ RM10.00, eAuto RM25.00, 8% RM2.00, Total RM37.00"; listed in BO Reset Payment Report. PASS. (R20–R21)
5. **12403_STMS_PAY2** — AA Motosikal fail → reset. Expected "Motosikal transaction IS reset but NOT repriced • Step 5 still JPJ RM1.00, eAuto RM5.00, 8% RM0.40, Total RM6.40 — NOT RM37.00". PASS. (R22–R23)
6. **12403_STMS_NEG1** — JPJ Enquiry Failed (4K HAK MILIK DITUNTUT), no payment. Expected "NOT reset"; "BO actions View | Cancel (no Reset)". PASS. (R24–R25)
7. **12403_STMS_NEG2** — Approved Car + Motosikal before push. Expected "No [Reset]; not in the Reset Payment Report • One debit each, no second debit". PASS. (R26–R27)
8. **12403_STMS_UNCH1** — AA Motosikal after push: Total RM6.40 unchanged. PASS. (R28)
9. **12403_STMS_UNCH2** — AB on body MSL (bike): "Total Amount Payable = RM26.20" unchanged. PASS. (R29)
10. **12403_STMS_DSP1** — Home tile "From RM35"; module page "Price from RM35* for each STMS Transfer"; eSERAHAN, BMK, JomCheck tiles unchanged. PASS. (R30)

### 3c. UCD to UCD (Standard and Interstate)

1. **12403_UTU_E2E1** — AD Car, Standard Single, company seller. RM37.00 + docs. PASS. (R32)
2. **12403_UTU_E2E2** — BJ Car, Sabah/Sarawak, Interstate. "UCD B (the buyer) pays"; RM37.00; "UCD A's Interstate listing shows Buyer Auth time and Tx Status = Approved". PASS. (R33)
3. **12403_UTU_DEP1** — Interstate created before push, accepted after within 48 h. Expected "Total Amount Payable = RM37.00". PASS. (R34–R35)
4. **12403_UTU_PAY1** — Standard failed before push, reset, repay at RM37.00. PASS. (R36–R37)
5. **12403_UTU_PAY2** — Interstate failed (RM31.60) → reset → "UCD B (buyer) is the one offered Resubmit"; RM37.00. PASS. (R38–R39)
6. **12403_UTU_DSP1** — tile "RM35 only"; page "RM35* only for each UCD to UCD Transfer". PASS. (R40)

### 3d. UCD APT price change (reused from EAINT-12289)

1. **12403_E2E1** — AB Car, Semenanjung, BO manual trigger 5.5 → 6.0. "Total APT amount = RM127.00". PASS. (R42)
2. **12403_E2E2** — AC Car, Sabah/Sarawak, fail then pay. "Total APT amount = RM67.00". PASS. (R43)
3. **12403_E2E3** — AD Car, Sabah/Sarawak, entry via eSTM VEL000392E. "Ensure the entry point does not affect the fee - the amount must match 12403_E2E2." PASS. (R44)
4. **12403_DEP1** — STMS approved before push, APT triggered after. "Total APT amount = RM127.00". PASS. (R45–R46)
5. **12403_APT_EXC1** — IA, Sabah/Sarawak. "Total APT amount = RM127.00 (NOT RM67.00)". PASS. (R47)
6. **12403_APT_COM1** — BF Commercial Car, Semenanjung. "JPJ Fee RM40.00 + eAuto Fee RM25.00 + Service Tax 8% RM2.00 = RM67.00 • RHB split debit: eAuto RM27.00 + JPJ RM40.00". PASS. (R48)

### 3e. Failed and Pending payment reset (APT)

1. **12403_PAY1** — APT Failed at "Stored eAuto Service Fee = RM21.60" → reset → "Payment = - • Tx Status = Pending" → RM127.00. PASS. (R50–R51)
2. **12403_PAY2** — APT left Pending before push. Expected "Ensure the Pending transaction is not reset by IT, and is charged the revised fee when it is paid"; RM67.00. PASS. (R52–R53)
3. **12403_PAY3** — AA APT Failed → reset, "eAuto Service Fee unchanged - NOT RM27.00". PASS. (R54–R55)
4. **12403_PAY4** — BO [Reset] in Action column. "[Reset] available in the Action column alongside [View] and [Cancel] for a Failed transaction"; RM127.00. PASS. (R56)

### 3f. Cronjob (Resubmit Failed APT, EAINT-8668) and APT display

1. **12403_CRN1** — cronjob resubmits Failed APT at RM127.00, no second debit. **Deprioritised**. (R58)
2. **12403_CRN2** — cronjob picks up Pending BF APT, RM67.00. **Deprioritised**. (R59)
3. **12403_CRN3** — cronjob sweeps a reset transaction, RM67.00. **Deprioritised** (Before half also marked Deprioritised though test data was recorded). (R60–R61)
4. **12403_DSP1** — APT tile "RM125 = JPJ RM100.00 + eAuto Service Fee RM25.00, excluding the 8% charge". PASS. (R62)
5. **12403_DSP2** — no pricing on APT Step 6, UCD details, BO details. PASS. (R63)

### 3g. Invoice, e-Invoice and reports

1. **12403_INV1** — DK Car APT invoice "Total = RM127.00 • LHDN Response Status = OK". PASS. (R65)
2. **12403_INV2** — APT paid before push keeps "RM21.60 … RM61.60". PASS. (R66–R67)
3. **12403_RPT1** — APT reports show both fee versions. PASS with caveat (see 6.4). (R68)
4. **12403_STMS_INV1** — STMS/UTU invoice line "Sistem Tukar Milik Sementara ("STMS") service charge" RM25.00 + SST RM2.00 = RM27.00. PASS. (R69)
5. **12403_STMS_INV2** — STMS/UTU paid before push keep "RM21.60 / RM31.60"; not reset; one debit only. PASS. (R70–R71)
6. **12403_STMS_RPT1** — STMS reports, both versions; AA and Bike unchanged. PASS with caveat. (R72)

### 3h. Regression

1. **12403_R1** — AA APT fee unchanged; JPJ RM100 / RM40 and 8% rate unchanged. PASS. (R74)
2. **12403_STMS_R2** — Wholesale STMS "eAuto Service Fee RM25.00 + 8% RM2.00 = RM27.00". PASS. (R75)
3. **12403_R2** — Wholesale APT included in seller booking fee, RM127.00. PASS. (R76)
4. **12403_R3** — APT 6.0 auto + cronjob, RM127.00. **Deprioritised**. (R77)
5. **12403_R5** — eSerahan fee unchanged. PASS. (R78)
6. **12403_R6** — AA APT 6.0 auto + cronjob, not repriced. **Deprioritised**. (R79)
7. **12403_R7** — Dev rate card diff: "only the 52 CAR rows at RM20 changed to RM25 (27 STMS + 25 APT)". **Deprioritised**. (R80)

## 4. Business rules and system behaviour the TS reveals

1. **Priced at payment, no date logic:** "Decided 24.09.2026 (QA): no date logic — a transaction is priced when it is paid." (sheet APT, R19, Remarks)
2. **APT fee read at APT payment, not carried from STMS:** "confirms the fee is read at APT payment time and not carried from the STMS transaction" (R46).
3. **Reset key is Payment status, not Tx status:** "the reset keys on Payment = Failed, not Tx Status = Failed" (R25).
4. **Reset result:** "BO > STMS Transaction > the same transaction shows Payment = -, Tx Status = Pending, no Reset link" (R21).
5. **Pending is excluded from the 12403 reset:** "REQ005 excludes Pending from the reset — changed from 12289 PAY2 (which reset it)." (R53, Remarks)
6. **AA reset but not repriced:** "Per REQ005 no failed payment transaction is excluded from the reset on the basis of its vehicle type, but per REQ008 usage code AA is excluded from the price increase." (R55)
7. **Interstate reset goes to the buyer:** "UCD B (buyer) is the one offered Resubmit" (R39).
8. **Interstate 48-hour window:** "Interstate has a 48 h acceptance window: if the reset transaction is no longer payable after 48 h, record it and ask the BA before raising." (R39, Remarks)
9. **Failed-payment actions:** "UCD actions View | Resubmit; BO actions View | Cancel | Reset" (R20). JPJ-enquiry-failed has "BO actions View | Cancel (no Reset)" (R24). Approved has "BO actions View only" (R26).
10. **RHB IF remark text:** "Remarks = IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI…" (R20).
11. **JPJ-enquiry-failed remark text:** "Remarks = JPJ Enquiry Failed : HAK MILIK DITUNTUT" (R24).
12. **STMS JPJ fee is flat:** "STMS JPJ is RM10 in all regions" (R17).
13. **APT JPJ follows usage code:** "Ensure the rate-card exception applies (JPJ follows the usage code, not only the region)" (R47).
14. **Tiles are labels, not the rate card:** "Tiles are hard-coded labels, not the rate card." (R30, Remarks)
15. **Documents keep the paid amount:** "Documents print the amount saved on the payment." (R71)
16. **BO shows stored amounts only:** "BackOffice shows stored amounts only (SRD Out-of-Scope #5)" (R69).
17. **Invoice fallback:** "[e-Invoice] (or [Invoice] if the company TIN is invalid)" (R16).
18. **Invoice wording same for STMS and UCD to UCD:** "same description for STMS and UCD to UCD, unchanged from before the push" (R69).
19. **Report date limit:** "The report only allows dates up to yesterday: run it the day after the push" (R68).
20. **Reconciliation needs a bank statement:** "The reconciliation listing needs an RHB bank statement uploaded for those dates" (R68).
21. **Company seller representative:** "Company representative: simulator default card (a UCD user's IC is refused)" (R17).
22. **Interstate seller must hold the vehicle:** "UCD A: AZFARAZO (must hold the vehicle)" (R33); R38 creates an Approved STMS first because "Interstate needs the vehicle held by UCD A".
23. **Cronjob criterion:** "A reset transaction sits at Payment = - and Tx Status = Pending, which matches the second cronjob criterion in EAINT-8668 (Payment = -, Tx Status = Pending)." (R61) — not executed (Deprioritised).
24. **APT region follows company mailing state:** setup lines say "company mailing state in BO = SABAH (switch back to JOHOR after)" (R43) and Remarks "company address SABAH at payment" (R43, R44, R47). [unconfirmed] that the APT JPJ region is taken from the UCD company's mailing state at payment, not from the vehicle.

## 5. Test data, environments, accounts, setup

1. **Environment:** "Test environment: staging/preprod1" (R3). Teams: "yup2 can use staging/preprod1, tgt with lkm refund" [Teams EAINT-12403, 2026-09-25 09:21].
2. **Test-data timing rule:** "Test data MUST be created BEFORE Dev pushes the new price on preprod1 - cannot be reproduced after" (R8).
3. **UCD accounts (usernames only, no passwords in the sheet):** "AZFARAZO" (buyer / UCD A), "faizuddin2 (FAIZUDDIN AUTO TEST 2, 030312-A)" (UCD B, R33), "Azfar1" (R38). No credentials present.
4. **Companies:** "QA SELLER 12403 SDN BHD, 540323-T" (eSIM seller, R17); "RICH BOYZ (1231165-A)" (UTU seller, R32); buyer "AZFARAZO (JM0570913-X)".
5. **eSIM prefixes (QA-owned for this ticket):** OE (AE), OL (BF), ON (AB), OQ (AB, RHB IF default), OR (AA+MSL, RHB IF default), YN (JPJ 4K), OC (AA+MSL), OD (AB+MSL), OJ (AD), OG (BJ), OI (AC), OV (AD, eSTM VEL000392E, SABAH), OM (IA), OT (AB, VEL000392E, SABAH), OF (DK). Rule: "eSIM: only use or create prefixes owned by QA for this ticket (VPN needed to create)." (R82)
6. **RHB IF toggling:** "RHB Transfer is IF by default: switch it to OK only to pay, then back to IF" (R20 and others).
7. **Wholesale:** R76 uses "STMS enquiry response 4Z" in eSIM to fold APT into the seller's booking fee.
8. **Transaction evidence:** every PASS row carries vehicle + transaction numbers in Remarks (for example "OE000002 / S694494154", R16; "ON000012 / A69347800", R42).
9. **Reset execution:** TS says "Dev applies the price push and the BO payment reset on preprod1" (R21). Teams: "can help change the price and run the reset for all transactions for STMS and APT for today's transactions?" [2026-09-28 17:07, QA engineer] and "done ya, can check" [2026-09-29 10:07, developer].

## 6. Gaps or risks a regression should still cover

1. **Cronjob paths never run for 12403:** CRN1, CRN2, CRN3, R3, R6 Deprioritised — "as advised by Dev (29.09.2026): APT cronjob already tested in EAINT-12289." The reset-then-cronjob sweep (CRN3) and AA via cronjob (R6) were not verified at RM25.
2. **Rate card never diffed:** R7 and PRE1 Deprioritised — "needs Dev's rate card export". The "52 CAR rows" claim is untested; BF/BJ/IA exceptions only spot-checked.
3. **Wholesale rows passed without Wholesale data:** STMS_R2 and R2 are PASS, but Remarks say "No Wholesale transactions this cycle (confirmed by QA 2026-09-25)." [unconfirmed] that these were run end to end; treat Wholesale STMS RM27.00 / APT RM127.00 as not proven.
4. **Reconciliation did not tie:** "Totals cannot tie on preprod1 (RHB holds 4 of 106 transactions)." (R68, R72) — marked PASS anyway.
5. **Before-state UI not checked:** tiles and module pages were "verified AFTER the change only" (R30, R40, R62).
6. **Interstate reset after 48 h:** R39 parks it as "ask the BA before raising" — behaviour unknown.
7. **Not covered by any row:** Android app tiles, eSTM payment reset (Teams mentions "reset STMS and ESTM payment" [2026-09-24 12:13, developer]), Commercial Car at BJ Semenanjung APT (RM67.00 exception named in R4 but only BF tested), branch-restricted users ("will affect all branch" [Teams 2026-09-28 11:49]).
8. **STMS_PAY1 / UTU_PAY1 usage-code fix:** "v4: usage code corrected AC → AB (OQ is AB)" (R21) and "AI → AB" (R37). Earlier copies of this workbook carry the wrong codes.

## 7. Where this TS agrees with or differs from knowledge/

1. **Agrees:** `knowledge/business-rules-from-test-scenarios.md` §1.1–§1.2, `flow-stms.md`, `flow-ucd-to-ucd.md`, `flow-payments-fees.md` already carry the RM37.00 / RM127.00 / RM67.00 values and the Failed-only reset rule, citing this workbook (#042).
2. **Differs — effective date:** `knowledge/cr-ledger.md:1020` and `knowledge/releases.md:46` say "effective 01.10.2026". Workbook title and R6 say "effective 02.10.2026 (Fri)", with the update "01.10.2026 (Thurs) from 11.30pm". The Teams chat title also says "(Effective 01.10.2026)".
3. **Differs — 12289 reset scope wording:** `knowledge/flow-apt.md:208` says "12289: all Failed, any vehicle type incl. Motosikal". This TS says 12289 also reset Pending: "changed from 12289 PAY2 (which reset it)" (R53). `business-rules-from-test-scenarios.md:84` ("All transactions except completed ones") matches the TS.
4. **Open item partly answered:** `knowledge/flow-payments-fees.md:207` lists the AA amount as "Still open". This TS states "AA CAR RM10 STMS / RM5 APT" (R14) and "usage code AA (STMS CAR RM11.80 total, APT RM5 fee)" (R4), and AA Motosikal STMS "JPJ RM1.00, eAuto RM5.00, 8% RM0.40, Total RM6.40" (R22). So AA CAR and AA BIKE STMS rows differ (RM10 vs RM5 eAuto). [unconfirmed] against the SRD.
5. **Wholesale caveat missing:** `knowledge/flow-stms.md:133` and `business-rules-from-test-scenarios.md:98` state "Wholesale STMS shows the same revised charge, RM27.00" without the R75 note that no Wholesale transactions ran this cycle.
6. **Not yet in `lib/ticketStudies.ts`:** no entry for EAINT-12403.

## Knowledge candidates

1. **Effective-date correction** for `knowledge/cr-ledger.md` and `knowledge/releases.md`: "Production: price update + reset 01.10.2026 (Thurs) from 11.30pm, effective 02.10.2026 (Fri)." [from SharePoint TS #042 EAINT-12403, sheet APT, row 6]
2. **12289 reset included Pending** — fix `knowledge/flow-apt.md:208`: "REQ005 excludes Pending from the reset — changed from 12289 PAY2 (which reset it)." [from SharePoint TS #042 EAINT-12403, sheet APT, row 53]
3. **AA CAR vs AA BIKE STMS fee** for `knowledge/flow-payments-fees.md:207`: "AA CAR RM10 STMS / RM5 APT" [sheet APT, row 14]; "usage code AA (STMS CAR RM11.80 total, APT RM5 fee)" [sheet APT, row 4]; AA Motosikal "JPJ RM1.00, eAuto RM5.00, 8% RM0.40, Total RM6.40" [sheet APT, row 22].
4. **Wholesale caveat** for `flow-stms.md` / business-rules §1.2.9: "No Wholesale transactions this cycle (confirmed by QA 2026-09-25)." [sheet APT, rows 75–76]
5. **Interstate reset → buyer resubmits** for `knowledge/flow-ucd-to-ucd.md`: "UCD B (buyer) is the one offered Resubmit" [sheet APT, row 39]; 48 h rule "if the reset transaction is no longer payable after 48 h, record it and ask the BA before raising." [sheet APT, row 39]
6. **Company seller representative** for `knowledge/flow-stms.md`: "Company representative: simulator default card (a UCD user's IC is refused)" [sheet APT, row 17].
7. **Report + reconciliation preconditions** for `knowledge/flow-payments-fees.md`: "The report only allows dates up to yesterday: run it the day after the push"; "The reconciliation listing needs an RHB bank statement uploaded for those dates" [sheet APT, row 68]; on preprod1 "Totals cannot tie … (RHB holds 4 of 106 transactions)" [sheet APT, rows 68, 72].
8. **Invoice fallback** for `knowledge/eauto-payments.md` or invoice notes: "[e-Invoice] (or [Invoice] if the company TIN is invalid)" [sheet APT, row 16].
9. **APT region from company mailing state** [unconfirmed] for `knowledge/flow-apt.md`: setup "company mailing state in BO = SABAH (switch back to JOHOR after)" [sheet APT, row 43]; Remarks "company address SABAH at payment" [rows 43, 44, 47]. Verify before promoting.
10. **Deprioritised coverage** for the 12403 entry in `knowledge/cr-ledger.md`: cronjob rows CRN1–CRN3, R3, R6 "Deprioritised — as advised by Dev (29.09.2026): APT cronjob already tested in EAINT-12289." [sheet APT, rows 58–61, 77, 79]; R7 "Deprioritised — needs Dev's rate card export." [row 80]
11. **`lib/ticketStudies.ts` entry** for EAINT-12403 is missing; candidate for a later session (not written here per scope).
