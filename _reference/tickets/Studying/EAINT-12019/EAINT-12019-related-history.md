<!-- Written 2026-10-27 by Scribe (pipeline history step). Read only from the repo: knowledge/, _reference/sharepoint/,
     _reference/teams/, lib/eautoFlows/. No Jira, SharePoint, Teams or web access used.
     Updated 2026-10-27 (second pass): Wholesale v3 workbook converted to a text copy and read; quotes for EAINT-11731,
     EAINT-11824, EAINT-11949 are now verbatim from the sheet. See "Changes 2026-10-27".
     Updated 2026-10-27 (third pass): Ticket brief + Estimated testing effort added; SRD v0.8 now read by Scout, so
     eMOVE-vs-Wholesale differences are marked; EAINT-12412 kept (SST Payment Report / invoice pattern); new
     candidate list checked; Jira man-day field fetched for comparables. -->

# EAINT-12019 — related history (2026-10-27)

## Ticket brief

1. **High-level scope:**
   1. **Entry + vehicle search:** Logistics tile, landing, search gate (approved STMS / UCD to UCD / eSTM, dealer is buyer or seller, no open eMOVE), Wholesale conflict both ways.
   2. **Create request wizard:** Step 1 Pick-Up / Drop-Off fields for the 4 service combinations, hubs, address check.
   3. **Charges + payment:** 4 distance tiers, RM200 per Door-to-Door leg, eAuto Fee / SST 0.00, stale price refresh; RHB OK / Failed / no response, Retry, Resubmit, Reset Payment; Invoice + e-Invoice after OK only.
   4. **Delivery Order + emails:** Pick-Up / Drop-Off DO PDFs ("EM…P" / "EM…D"), QR, arrangement and failure emails; no DO when payment is Pending / Failed.
   5. **Logistics Driver pages:** Pick-Up then Drop-Off scan, vehicle number match, 12 photos, failure report with evidence and driver details.
   6. **Listings + details on UCD and BO:** filters, columns, status combinations, Cancel, Re-arrange, Special Remark, photos (BO only); 45-day expiry cron.
   7. **Reports:** SST Payment Report (eMOVE), Revenue CSV product type "EMOVE".
   8. **Regression (manual):** Wholesale DO + QR scan, Wholesale blocked by open eMOVE, shared charges matrix and Logistics Pricing History.
2. **Estimated testing time:** **13 man-days** (range **10–16**), confidence **low**, `[unconfirmed]`. No official figure: Jira "[QA] Est Man-day (cf 10081): —" `[EAINT-12019-jira.md item 7]`; Miro mandays blank `[EAINT-12019-study.md "QA scope" item 1]`. Detail in "Estimated testing effort".
3. **Modules / pages to cover:**
   1. **eMOVE (UCD):** Home / Logistics Landing, Logistics Transaction Listing, Create Logistics Request (Wizard), Transaction Details — new pages.
   2. **eMOVE (BO):** eMOVE Transaction Listing, Transaction Details, SST Payment Report (eMOVE) — new pages.
   3. **Logistics Driver:** Pick-Up & Drop-Off Scan — new pages.
   4. **Logistics Hub (BO):** Logistics Charges Matrix Setup, Hub Management, Logistics Pricing History — regression, shared with Wholesale (REQ-098, 163, 164).
   5. **Wholesale (UCD / BO / chatbot):** Wholesale Transaction Listing, DO + QR scan — regression, shared DO / QR and reverse conflict check (REQ-051).
   6. **STMS / UCD to UCD / eSTM (UCD):** approved transactions — source data for the entry gate.
   7. **BO Revenue Report CSV:** "EMOVE" product type — regression.

## Changes 2026-10-27

1. **Faizuddin's reply, item 1:** "can you try get it yourself". Converted the Wholesale v3 workbook with `scripts/pipeline/lib/xlsx-text.mjs`. Text copy: `_reference/sharepoint/qa-team-ts/EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.md` (944 lines, "text copy (27/10/2026, 3:56:32 pm)").
2. Replaced the second-hand quotes for **EAINT-11731, 11824, 11949** with verbatim sheet rows. Corrected TS ids: **EM_DO_TS1–TS21** (Buyer DO) is separate from **EM_DN_TS1–TS21** (Seller Dispatch Note); **LOG_FEE** runs **TS1–TS164**, not TS1–TS11; **LGF_TS2–TS5** added.
3. Added two more sheets from the same workbook: **"10 June 2026 Scope"** and **"Failed Payment"**.
4. Added past QA-Issue keys from the workbook: **EAINT-11608, 11621, 11635, 11638, 11639**.
5. **Faizuddin's reply, item 2:** "nope. so assume no test script. i think this was before the automation initiative". **EAINT-12119** is now recorded as **no test script**.
6. **Third pass:** added "Ticket brief" and "Estimated testing effort"; kept **EAINT-12412** (SST Payment Report + Invoice / e-Invoice pattern); added SRD v0.8 differences to "Reusable scenarios" and "Known traps"; Finance removed from the Header (out of scope per SRD §2.1.2 row 1); new linked tickets **EAINT-638** and **EAINT-2450** checked — no past QA Team TS found.

## Header

1. **Module / portal:** **eMOVE** standalone logistics — **UCD Portal**, **BackOffice**, **Logistics Driver** pages `[SRD v0.8 §2.2.1 row 2, via EAINT-12019-study.md Header item 14]`.
2. **Past tickets kept:** **7** — EAINT-11731, EAINT-11824, EAINT-11949 (sheets of one Wholesale workbook), EAINT-12119, EAINT-12403, EAINT-12412, EAINT-12378.
3. **Own official TS:** **none** in the QA Team folder. Elf draft: `data/pipeline/work/EAINT-12019/scenarios.md` (42 TS, 12019_TS01–TS42).
4. **Dropped (name-only match):**
   1. **EAINT-9805** (mobile app STMS), **EAINT-1245** (JomCheck listing), **EAINT-10937** (JomCheck Service Portal), **EAINT-9715** (AATF payment reports), **EAINT-9951** (HP record listing), **EAINT-11934** (CIBO listing), **EAINT-12055** (reconciliation listing), **EAINT-8699 / 9103** (Service Portal UI), **EAINT-9944** (thumbprint list) — no eMOVE, logistics, DO or Interstate content.
   2. **EAINT-8826**, **EAINT-8766**, **EAINT-11855** — BO Reset Payment / Cancel on STMS, eSTM, APT. Per-user permission grants (e.g. "8826_TS1 | To grant access to reset payment for STMS transaction in Backoffice | eautochinwei" `[EAINT-8826 text copy, R3]`). eMOVE has no permission gate: "Every BackOffice user can cancel a transaction. No additional permission is applied." `[SRD v0.8 REQ-116, via study §L item 3]`.
5. **Linked tickets with no past QA Team TS:** **EAINT-638** (45-day housekeeping cron) and **EAINT-2450** (e-Invoice LHDN Response Status) — no text copy or catalogue row mentions them `[grep of _reference/sharepoint/, 2026-10-27]`.
6. **Earlier TS studies:** `_reference/tickets/EAINT-9805/EAINT-9805-qa-team-ts-study.md` exists (mobile STMS) — not related.

## Related past tickets

1. **EAINT-11731** — "To implement new Logistics Flow" (Wholesale, Done).
   1. **Workbook:** `_reference/sharepoint/eauto-cr-test-scenarios/eAuto Wholesale Test Scenarios COMPLETE v3.xlsx`, sheet "EAINT-11731" (71 TS rows). SharePoint: "1. eAuto Project/eAuto - CR Test Scenarios/EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.xlsx" `[cr-test-scenario-catalogue.md #127, lines 300, 464]`. **Text copy (2026-10-27):** `_reference/sharepoint/qa-team-ts/EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.md`.
   2. **Why related:** eMOVE **reuses its QR and Delivery Order flow**: "the QR and Delivery Order use the existing flow and template / there are no changes on QR and delivery order in this ticket" `[Teams EAINT-12019, 2026-09-15 14:21, BA]`. SRD: "eMOVE Delivery Order follows the format delivered under this ticket." `[SRD v0.8 §1.5 row 5]`. eMOVE has its own DO numbers and email subject (REQ-166).
2. **EAINT-11824** — "Logistics Pricing - Matrix" (Closed 2026-08-07).
   1. **Workbook:** same Wholesale v3 workbook, sheet "EAINT-11824" (164 TS rows, LOG_FEE_TS1–TS164) `[catalogue #127; text copy]`.
   2. **Why related:** linked ticket; Door-to-Door / Hub-to-Hub fee matrix — eMOVE has the same two "Transfer options" `[Jira EAINT-12019 description row 6]`.
3. **EAINT-11949** — Logistic v1 removal and security fixes (Wholesale).
   1. **Workbook:** same Wholesale v3 workbook, sheet "EAINT-11949" (5 TS rows) `[catalogue #127]`.
   2. **Why related:** sets the current rule for **QR validation from the Delivery Order email**, the flow eMOVE reuses.
4. **EAINT-12119** — "Logistics: Interstate Price Tier for Logistics Delivery (Wholesale and Standalone Service)" (Done 2026-10-13).
   1. **Workbook:** **none — no test script.** Faizuddin, 2026-10-27: "nope. so assume no test script. i think this was before the automation initiative". Testing was by another QA `[Teams EAINT-12119, 2026-09-21 18:17]`.
   2. **Why related:** linked; title names "Standalone Service"; SRD v0.5 of EAINT-12019 "Added Sections 2.2.15 and 2.2.16 from … EAINT-12119" `[Jira SRD table v0.5]`. Built the BO **Logistics Charges Matrix Setup** and **Hub Management** pages `[Teams EAINT-12119, 2026-09-14 10:03, dev]`.
5. **EAINT-12403** — "[eAuto-UCD] STMS & APT Increase eAuto Service Charge for Car & Commercial Car (Effective 02.10.2026)".
   1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12403 - [eAuto-UCD] STMS & APT Increase eAuto Service Charge for Car & Commercial Car (Effective 02.10.2026).md`.
   2. **Why related:** latest past TS that drives a **UCD to UCD Interstate** transaction to **Approved** — the eMOVE entry gate precondition.
6. **EAINT-12412** — "🔴[eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge" (Done, Faizuddin was QA).
   1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12412 - [eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge.md`.
   2. **Why related:** same **pages pattern**, not same module. eMOVE adds "SST Payment Report (eMOVE)", a "copy of the SST reports already used by the other modules" `[SRD v0.8 REQ-162]`; 12412 tested SST Payment Report (JomCheck), Invoice / e-Invoice and the LHDN e-Invoice.
7. **EAINT-12378** — Wholesale Logistics Full Payment: RHB "RE" error code (To Do).
   1. **Workbook:** none.
   2. **Why related:** linked; scope widened to "Reset payment" for logistics payment `[Teams EAINT-12119, 2026-10-07 10:35, BA]`. Same RHB payment risks for eMOVE `[unconfirmed]`.

## What was tested before

All quotes in items 1–3 are verbatim from the text copy `EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.md` (2026-10-27). Every row quoted is **PASS** unless stated.

1. **EAINT-11731 (sheet "EAINT-11731"):**
   1. **Section "Email to Logistics Partner & Delivery Order Generation" (R18):**
      1. **EM_LOGISTICS_TS1** (R20) — "a) Email sent to logistics after eAuto Digits proceed to accept & do thumbprint after seller transferred ownership successfully". Expected "From: wholesale@eauto.my ⏎ To: wholesale@eauto.my ⏎ CC: mytriodistribution@gmail.com ⏎ ⏎ Subject: [Wholesale Logistic] Arrangement - {deal ID} - {vehicle number}". Remark "Retest - 6Jul_TS2".
      2. **EM_LOGISTICS_TS2** (R21) — "b) Attachments in email" → "Seller = Delivery Order Seller Copy (WSS).pdf ⏎ - Buyer = Delivery Order Buyer Copy (WSB).pdf".
      3. **EM_LOGISTICS_TS3 / TS4** (R22–R23) — "Fields population (Seller Dispatch Note)" / "(Buyer Delivery Order) - Verify details captured precisely from vehicle listing and payment page input" → "Pick Up Details" / "Drop Off Details" + "Vehicle Details".
      4. **EM_LOGISTICS_TS5** (R24) — "Error handling - Delivery Order failed to generate > Email to IT" → "Alert sent to IT team".
      5. **EM_LOGISTICS_TS6** (R25) — "Error handling - Delivery Order email failed to sent" → "Alert sent to IT team".
   2. **Section "Logistics Arrangement Flow" (R29):**
      1. **LGF_TS1** (R31–R37) — E2E: "5) Logistic scan Seller's QR code on UCD view via Wholesale Transaction Listing ⏎ 6) Logistic scan Dispatch Note (Seller) QR code" → "QR code matches successfully"; "7) Logistic enter Vehicle Number & upload 12 photos" → "Logistic Status should update to Delivery Arranged"; "10) Logistic enter Vehicle Number & upload 12 photos" → "Logistic Status should update to Delivered"; "11) Buyer accept eAuto Digits's ownership transfer" → "Tx Status should update to Completed".
      2. **LGF_TS2 / LGF_TS3** (R38–R39) — "Logistic input incorrect/not matching vehicle number" → "Not allowed to proceed with photos upload".
      3. **LGF_TS4 / LGF_TS5** (R40–R41) — "Error handling - Photo(s) failed to upload (Seller)" / "(Buyer)" → "Not allowed to proceed with next step and allow to retry upload".
   3. **Section "Dispatch Note Display Details" (R45), EM_DN_TS1–TS21 (R47–R68):**
      1. **EM_DN_TS1** — "Should start with prefix WSS<8 digits>". **EM_DN_TS2** — "Format: DD Mmmm YYYY e.g 10 June 2026.". **EM_DN_TS3** "Lorry number" — "No value (blank)". **EM_DN_TS4** — "Door-to-Door / Hub-to-Hub".
      2. **EM_DN_TS5–TS15** — Make, Model, Variant, Year, Colour, Transmission, Chassis, Engine, Reg No., Mileage, Fuel → "Prepopulated values based on vehicle listing by Seller".
      3. **EM_DN_TS17** — "Vehicle Photo Checklist" → "Unticked by default" with 12 items "1. Front … 12. Engine Start (no photo)".
      4. **EM_DN_TS18** "Pick Up details" → "Prepopulated values based on input by Buyer". **EM_DN_TS19** "Logistic driver acknowledgement" → "No value (blank)". **EM_DN_TS20** "Logistics verification QR code" → "Fixed generated QR". **EM_DN_TS21** "Documents prepared by Legal" → "eAUTO DIGIT MARKETPLACE: DISPATCH NOTE …".
   4. **Section "Delivery Order Display Details" (R72), EM_DO_TS1–TS21 (R74–R94):** same fields as EM_DN; **EM_DO_TS1** → "Should start with prefix WSB<8 digits>"; **EM_DO_TS18** "Drop Off details" → "Prepopulated values based on input by Seller"; **EM_DO_TS21** → "eAUTO DIGIT MARKETPLACE: DELIVERY ORDER …".
   5. **Section "6 JULY 2026 - Changes" (R98):**
      1. **11731_6JUL_TS1** (R100) — "Logistic Details - Step 2 UCD - Pick Up" → "Default date set as the next date".
      2. **11731_6JUL_TS2** (R101) — email subject changed to "[Wholesale Logistic] Arrangement - {WSS Transaction Number / WSB Transaction Number} - {vehicle number}".
      3. **11731_6JUL_TS4** (R103) — "Hide Reject button" → "The “Reject Vehicle” button is no longer displayed once 24 hours have ⏎ passed(based on logistics status updated to "Delivered")". Remark "Dev patched to 2026-07-06 14:43:43.0".
      4. **11731_6JUL_TS5** (R104) — checklist item "6. Below (Nenas)"; remark "New changes: Below -> Below ⏎ (Nenas)".
      5. **11731_6JUL_TS6** (R105) — "Buyer A -> Cancel after full payment ⏎ Buyer B -> Make full payment" → "Logistic able to scan QR, fill in vehicle number and upload photos".
   6. **Section "Existing Transactions - Old Logistic Flow" (R108), 11731_EXS_TS1–TS4 (R110–R113)** — old transactions keep "'Show QR'", "'To Receive'" and "Final Logistic QR".
2. **EAINT-11824 (sheet "EAINT-11824", "Logistic Fee Update"):**
   1. Column header (R2): "Expected Price (Hub-to-Hub) ⏎ Note: Door-to-Door + RM200". Result columns (R3): "New Transaction | Existing Transaction".
   2. **LOG_FEE_TS1–TS164** (R5–R185) — one row per From → To pair, grouped by region: "KV > OS (SOUTHERN)", "OS > KV (SOUTHERN)", "SOUTHERN", "KV > OS (NORTHERN)", … "EAST COAST > EAST COAST".
   3. Examples: **LOG_FEE_TS1** (R5) "Klang Valley Hub | Seremban | 250 | PASS | PASS"; **LOG_FEE_TS9** (R13) "Klang Valley Hub | Segamat | 550 | PASS | PASS"; **LOG_FEE_TS19** (R25) "Seremban | Melaka | 220 | PASS | PASS".
   4. **LOG_FEE_TS163** (R184) "Temerloh | Temerloh | 400" and **LOG_FEE_TS164** (R185) "Kuala Terengganu | Kuala Terengganu | 400" — **no result recorded**.
3. **EAINT-11949 (sheet "EAINT-11949", "Remove logistic v1 flow & Security fixes"):**
   1. **11949_E2E_TS1** (R4) — "End to end - Happy flow > Chatbot to Logistic to Accept Vehicle completed successfully" → "Ensure end to end flow only require QR validation by Logistic team from Delivery Order email".
   2. **11949_E2E_TS2** (R5) — "… to Reject Vehicle completed successfully" → same expected.
   3. **11949_E2E_TS3 / TS4** (R6–R7) — "Cancel transaction by Buyer" / "by Seller before full payment" → "Ensure able to cancel transaction and initiate correct refund & cancellation message to respective buyer/seller".
   4. **11949_BO_TS1** (R9) — "Wholesale Transaction Details page > Old (v1) QR buttons" → "Ensure old QR buttons not available on details page".
4. **Same workbook, other sheets touching logistics:**
   1. **"10 June 2026 Scope" REQ_TS6** (R7) — "QR code" Pass; note "1. One device scan for both seller (UCD) & logistic (BO - Pickup QR) ⏎ 2. Same device scan for both buyer (UCD) & logistic (BO - Dropoff QR)"; link "EAINT-11608".
   2. **"10 June 2026 Scope" REQ_TS11** (R12) — "Logistic fee update" Pass; "EAINT-11621 ⏎ - Based on BA, service tax will be 8% but the fee should be RM0.00 until Production until further notice."
   3. **"10 June 2026 Scope" REQ_TS23** (R24) — "Failed payment - Whatsapp, Logistic, Full Payment, & STMS" Pass; "Update (29/5/26): Logic pass but display need to standardize".
   4. **"10 June 2026 Scope" REQ_TS26** (R27) — "Logistic Status Mapping" Pass.
   5. **"Failed Payment" FAILED_PY_TS2 / TS3** (R4–R5) — failed processing fee / full payment → "Payment Details (Logistic) = Failed".
5. **EAINT-12119 (no test script, per Faizuddin 2026-10-27; scope from Teams):**
   1. BO screens named for test: "1. Home menu › Logistics Hub module / 2. Logistics Charges Matrix Setup — the price table / 3. Change History — below that table / 4. Hub Management — the 20-hub list / 5. Hub add/edit form — address + Google Maps accept. Existing (must not break): 6. Wholesale Transaction Listing — the logistics fee column / 7. Reset Payment Report" `[Teams EAINT-12119, 2026-09-14 10:03, dev]`.
   2. Interstate tiers: "Up to 250: base 300. 251-400: base 450. 401-600: base 650. Over 600: base 1,000." `[knowledge/flow-wholesale.md line 173]`
6. **EAINT-12403 (sheet with "CR Test Scenarios - UCD to UCD (Standard & Interstate) Price Change", R31 banner):**
   1. **12403_UTU_E2E2** (R33) — "UCD to UCD Interstate"; expected: "Tx Status = Approved … Ensure in details page, the following buttons available … [e-Invoice] (or [Invoice] if the company TIN is invalid) … [Slip Pengesahan] … [JPJ Official Receipt] once JPJ has emailed it … Ensure UCD A's Interstate listing shows Buyer Auth time and Tx Status = Approved." Result "PASS".
   2. **12403_UTU_DEP1** (R34–R35) — "Interstate across the push": "Ensure Tx Status = Interstate New, UCD B sees "TO THUMB IN BY <created + 48 h>" with View / To Accept." Result "PASS".
   3. **12403_UTU_PAY2** (R38–R39) — "Interstate Payment Reset (preprod1)": steps "UCD A > UCD TO UCD > INTERSTATE > create to UCD B … → Interstate New … UCD B > STMS Transaction Listing > To Accept > Step 3 > Step 4 > Step 5 > pay → fails".
7. **EAINT-12412 (text copy, all rows "Pass" where shown):**
   1. **12412_TS01** (R4) — "Verify a new JomCheck transaction from UCD shows the fee in 2 lines on the invoice and e-Invoice".
   2. **12412_TS05** (R9) — "Verify the BackOffice invoice and e-Invoice match the UCD copies for the same transaction".
   3. **12412_TS06** (R10) — "Verify the SST Payment Report shows the same amounts for the new transaction"; steps "Login to BackOffice as Finance ⏎ 2. Go to SST Payment Report (JomCheck) ⏎ 3. Under Transaction Type, tick JomCheck ⏎ 4. Click [Generate]".
   4. **12412_TS07** (R12) — "Verify the e-Invoice submitted to LHDN carries the 2 lines"; step "Login to MyInvois sandbox".
   5. **12412_TS10** (R17) — "Verify the finance reports still show one row per JomCheck transaction with the same totals".
   6. **12412_TS12** (R19) — "Verify invoices of other products keep their current layout".

## Reusable scenarios

SRD v0.8 differences are taken from `EAINT-12019-study.md` (Scout read the SRD in full).

1. **Driver Pick-Up / Drop-Off scan** ← **EAINT-11731 LGF_TS1** (happy path), **LGF_TS2 / TS3** (wrong vehicle number), **LGF_TS4 / TS5** (photo upload failure + retry). eMOVE statuses differ: "In Transit" after Pick-Up, "Delivered" after Drop-Off (REQ-176 / 181); "12 photos are uploaded regardless of the Engine Start (no photo) label" (REQ-175); Drop-Off blocked before Pick-Up (REQ-172).
2. **DO fields** ← **EM_DN_TS1–TS21** (Pick-Up copy) and **EM_DO_TS1–TS21** (Drop-Off copy). eMOVE changes: numbers "EM690000025P" / "EM690000025D" (REQ-166), not "WSS<8 digits>" / "WSB<8 digits>"; dates "DD-MM-YYYY" (REQ-168), not "DD Mmmm YYYY"; Variant, Transmission, Mileage, Fuel Type "Left blank for the Logistics Driver to complete by hand" (REQ-168), not prefilled.
3. **Logistics email + failure alerts** ← **EM_LOGISTICS_TS1–TS6**, **11731_6JUL_TS2**. eMOVE subject "[eMOVE Logistic] Arrangement - [Pick-Up DO Number] / [Drop-Off DO Number] - [Vehicle Number]" (§2.2.16); failure sender "imonitor@eauto.my" (REQ-166).
4. **QR validation; cancel before payment** ← **11949_E2E_TS1–TS4**, **11949_BO_TS1**. eMOVE QR: "static, never expires, and the 2 codes are different." (REQ-169). Whether QR scan ships in this phase is still open (REQ-172).
5. **Fee** ← **EAINT-11824 LOG_FEE_TS1–TS164** (layout only: From / To / expected price, New vs Existing Transaction) and **EAINT-12119** tiers. eMOVE rule: "Logistics Fee is the tier price for the measured distance." (REQ-093); "RM200.00 per Door-to-Door leg. Hub carries no charge." (REQ-095). The 11824 per-town prices are **not** eMOVE expected values.
6. **BO Charges Matrix Setup validations** ← **EAINT-12119** final wording table W1–W5 `[Teams EAINT-12119, 2026-10-01 09:49, dev]`, e.g. "Ops price must be at least the base rate of RM 300.00." and "Reason / Remarks is required to save a rate change." Plus "'Maximum rate is RM 10,000.00.'" `[2026-10-01 09:58]`.
7. **Price changed at payment** ← **EAINT-12119** (Wholesale popup "Previously RM 500.00. Now RM 600.00. Your payment was not taken. Click OK to reload and view the updated pricing." `[Teams EAINT-12119, 2026-10-01 09:49, W5]`). eMOVE uses its own popup: "The logistics price has been updated. The charges shown have been refreshed. Please review the new amount before continuing." (REQ-076).
8. **East Malaysia / address block** ← **EAINT-12119** ("State is Sabah, Sarawak or Labuan? Shows "Logistics service is not available…"" `[Teams EAINT-12119, 2026-10-05 10:34, dev]`). eMOVE hides those states instead: "Exclude Sabah, Sarawak and Labuan from the listing." (REQ-035/043); address fail popup "We could not find the address. Please check and try again, or contact support at 03-27798899." (REQ-052).
9. **Entry gate setup: completed Interstate** ← **12403_UTU_E2E2** (drive to Tx Status Approved). Any approved STMS or eSTM also qualifies (REQ-003 / 030).
10. **Failed RHB payment setup** ← **12403_UTU_PAY2** (eSIM RHB Transfer IF on a QA prefix). eMOVE expects "Failed (IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI.)" in Payment History (REQ-089).
11. **Wholesale regression** (DO generation + QR scan) ← **LGF_TS1–TS5, EM_DN, EM_DO, EM_LOGISTICS, 11949_E2E_TS1–TS2** — manual only (Wholesale is chatbot-driven).
12. **Pick-Up date** ← **11731_6JUL_TS1** ("Default date set as the next date"). eMOVE: "Future dates only." "Maximum 30 days ahead of today." "Typing is not allowed." (REQ-041).
13. **Failed payment shows on the logistics line** ← **FAILED_PY_TS2 / TS3** ("Payment Details (Logistic) = Failed").
14. **SST Payment Report (eMOVE)** ← **12412_TS06** "Verify the SST Payment Report shows the same amounts for the new transaction" `[EAINT-12412 text copy, R10]`. eMOVE eAuto Fee and SST are 0.00 in this phase (REQ-073 / 074).
15. **Invoice + e-Invoice after payment** ← **12412_TS01** "…shows the fee in 2 lines on the invoice and e-Invoice" (R4), **12412_TS05** "Verify the BackOffice invoice and e-Invoice match the UCD copies for the same transaction" (R9), **12412_TS07** "Verify the e-Invoice submitted to LHDN carries the 2 lines" (R12). Adapt to eMOVE: none when payment Failed or Pending (REQ-107).
16. **Revenue CSV** ← **12412_TS10** "Verify the finance reports still show one row per JomCheck transaction with the same totals" (R17). eMOVE: product type "EMOVE" (REQ-162).
17. **Other products unchanged** ← **12412_TS12** "Verify invoices of other products keep their current layout" (R19).

## Known traps

1. **Interstate needs the vehicle held by UCD A:** "UCD A: AZFARAZO (must hold the vehicle)" `[EAINT-12403 text copy, R33 / R38]`.
2. **48-hour accept window:** "UCD B sees "TO THUMB IN BY <created + 48 h>"" `[EAINT-12403, R34]`.
3. **RHB failure is set per eSIM prefix:** "RHB Transfer is IF by default: switch it to OK only to pay, then back to IF" `[EAINT-12403, R38]`.
4. **Forcing a failed logistics payment:** "pls use eauto sim rhb transfer / and be careful not mess up with other QA" `[Teams EAINT-12119, 2026-09-21 11:14, dev]`.
5. **Old flat fee = bug:** "Think when test nvr put 400 / So if got 400 mean bug ady" `[Teams EAINT-12119, 2026-09-23 17:50, dev]`.
6. **Stale price on screen:** "after you update in backoffice, the website wont update update, it need to know price change from server / that why i said need to click pay" `[Teams EAINT-12119, 2026-09-25 11:59, dev]`.
7. **Request Approval cooldown:** "for the request approval failed, need to wait 1 mins / coz you just request, cannot request again in one min" `[Teams EAINT-12119, 2026-10-08 11:26, dev]`.
8. **Distance source fallback:** "i will impl with google api first, if google failed, fall back to open street map" `[Teams EAINT-12119, 2026-09-08 17:26, dev]`.
9. **Loose address check:** "So "Kota Kinabalu, Sabah" with state Selangor passes." `[Teams EAINT-12119, 2026-10-05 10:34, dev]` — later changed: "ok, then i add check the coor return ba, if east Malaysia then reject" `[2026-10-05 10:42]`.
10. **Hub-to-Hub skips address checks:** "1. Hub to Hub? If yes, skip every check below." `[Teams EAINT-12119, 2026-10-05 10:34, dev]`.
11. **Production fee was zero:** "Based on BA, service tax will be 8% but the fee should be RM0.00 until Production until further notice." `[Wholesale v3 text copy, sheet "10 June 2026 Scope", R12 REQ_TS11]`. May be outdated after EAINT-12119 `[unconfirmed]`.
12. **Driver pages need no login:** "The driver pages are public and use a token, not a login." and "QR-A and QR-B must pair within 5 minutes." `[wholesale.ts line 159 — source is Ask eAuto (code reading), not a TS]`.
13. **eMOVE payee differs from Wholesale:** "emove payment will go to eAuto Sdn Bhd ya. / for wholesale part will go to eAuto Digits" `[Teams EAINT-12019, 2026-10-14 18:27, BA]`.
14. **Shared staging console:** "looks like the WhatsApp console for staging is down." `[Teams EAINT-12119, 2026-09-30 16:44, QA]` — Wholesale regression only.
15. **QR test needs one device:** "One device scan for both seller (UCD) & logistic (BO - Pickup QR) ⏎ 2. Same device scan for both buyer (UCD) & logistic (BO - Dropoff QR)" `[Wholesale v3, sheet "10 June 2026 Scope", R7 REQ_TS6]`.
16. **Logistics email CC goes outside eAuto:** "CC: mytriodistribution@gmail.com" `[Wholesale v3, sheet "EAINT-11731", R20 EM_LOGISTICS_TS1]`. Check eMOVE test emails do not reach the real vendor `[unconfirmed]`.
17. **Time-based rows need a dev patch:** "Dev patched to 2026-07-06 14:43:43.0" for the 24-hour Reject rule `[Wholesale v3, sheet "EAINT-11731", R103 11731_6JUL_TS4]`.
18. **Old transactions keep the old flow:** 11731_EXS_TS1–TS4 expect "Transaction should be old logistic flow" `[Wholesale v3, sheet "EAINT-11731", R110–R113]`. eMOVE shares DO + QR — check existing Wholesale transactions in regression `[unconfirmed]`.
19. **Two fee rows never got a result:** LOG_FEE_TS163 and TS164 (same-town delivery, "400") `[Wholesale v3, sheet "EAINT-11824", R184–R185]`. eMOVE same-hub rule: "charged at the lowest tier of the charges table, with no Door-to-Door charge" (REQ-050).
20. **Hub-to-Hub vs Door-to-Door direction:** 11824 header "Expected Price (Hub-to-Hub) ⏎ Note: Door-to-Door + RM200" `[Wholesale v3, sheet "EAINT-11824", R2]` vs eMOVE "Door-to-Door adds RM200.00 per leg." (REQ-034). Do not copy 11824 prices as expected values `[unconfirmed]` which reading 11824 meant.
21. **Wholesale DO values do not carry over:** past TS expected "WSS<8 digits>", "DD Mmmm YYYY" and prefilled Variant / Transmission / Mileage / Fuel `[Wholesale v3, sheet "EAINT-11731", R47–R61]`. eMOVE SRD changes all three (REQ-166, 168).

## Past QA-Issues mentioned

1. **EAINT-12453** and **EAINT-12454** — bugs on EAINT-12119: "the bugs you checked ytd, can update status if you fixed them EAINT-12454 EAINT-12453" / "ya fixed pls retest" `[Teams EAINT-12119, 2026-10-08 11:05]`. Content not in the repo.
2. **EAINT-12378** — "re handling and reset payment for full vehicle and wholesale stms … this is the ticket but only mentioned RE handling" `[Teams EAINT-12119, 2026-10-05 08:40, dev]`. To Do.
3. **Defect found during 12119 testing (no key given):** "when the Tier 2 logistics price is changed in BO (RM560), it's not updated on the "Complete Payment" page" `[Teams EAINT-12119, 2026-09-25 11:50, QA]`. Dev: stale-UI by design (trap 6).
4. **EAINT-12403 Interstate rows read:** no QA-Issue key in the rows quoted.
5. **Wholesale v3 workbook (read 2026-10-27), logistics rows only:**
   1. **EAINT-11608** — linked on "10 June 2026 Scope" R7 REQ_TS6 "QR code" (Pass).
   2. **EAINT-11621** — linked on "10 June 2026 Scope" R12 REQ_TS11 "Logistic fee update" (Pass).
   3. **EAINT-11635**, **EAINT-11638**, **EAINT-11639** — linked on "10 June 2026 Scope" R24 REQ_TS23 "Failed payment - Whatsapp, Logistic, Full Payment, & STMS": "EAINT-11638 > Fixed (3/6/26) ⏎ … EAINT-11639 > Fixed (3/6/26)".
   4. Sheets "EAINT-11731", "EAINT-11824", "EAINT-11949": **no FAIL result and no EAINT key** in any row.
6. **EAINT-12412:** no QA-Issue key in the rows quoted.

## Estimated testing effort

`[unconfirmed]` — the official figure lives in the QA Portal, which agents do not open.

1. **Comparable tickets** (TS count from the text copies; man-day from Jira captures of 27/10/2026 ~7:00 pm):

| Ticket | What | TS count | "[QA] Est Man-day (cf 10081)" |
|---|---|---|---|
| EAINT-11731 | Wholesale logistics flow + DO | 71 rows `[catalogue #127]` | "—" `[EAINT-11731-jira.md item 7]` |
| EAINT-11824 | Logistics pricing matrix | 164 (LOG_FEE_TS1–TS164) | "—" `[EAINT-11824-jira.md item 7]` |
| EAINT-11949 | Logistic v1 removal | 5 | "—" `[EAINT-11949-jira.md item 7]` |
| EAINT-12119 | Interstate price tier | none (no test script) | "—" `[EAINT-12119-jira.md item 7]` |
| EAINT-12403 | STMS / APT fee change | 45 unique TS ids | "3" `[EAINT-12403-jira.md item 7]` |
| EAINT-12412 | JomCheck invoice split | 12 (12412_TS01–TS12) | "2" `[EAINT-12412-jira.md item 7]` |

   1. **EAINT-12019 itself:** Jira "[QA] Est Man-day (cf 10081): —" `[EAINT-12019-jira.md item 7]`; Miro "mandays blank" `[EAINT-12019-study.md "QA scope" item 1]`.
2. **Expected TS count:** **45–60**. Elf draft already has **42** (12019_TS01–TS42). SRD v0.8 has "188 requirements" over 3 portals, a new module, plus Wholesale regression — larger than 12403 (45 TS, a fee change) `[unconfirmed]`.
3. **Estimate: 13 man-days (range 10–16):**
   1. **TS drafting / review:** 2 (Elf draft exists; SRD contradictions to settle with the BA first).
   2. **Test execution:** 6 (UCD wizard + payments, BO listing / actions, driver pages on a phone, DO PDFs + emails, reports, 45-day expiry with a date patch).
   3. **Retest / QA-Issue buffer:** 2 (SRD v0.8 is a draft with 8 open items).
   4. **Automation build:** 3 — UCD + BO + driver pages only. Wholesale regression stays manual (chatbot-driven).
   5. Manual only (no automation): **10**.
4. **Confidence: low.** Raises with SRD v1.0 (no open items), the BA answer on the 8 contradictions, REQ-172 (QR scan in this phase or not), and a fix version / test env.

## Sources read

1. `_reference/tickets/Studying/EAINT-12019/EAINT-12019-study.md` (Scout study).
2. `knowledge/README.md`, `knowledge/flow-emove.md`, `knowledge/flow-wholesale.md` lines 155–204.
3. `knowledge/cr-test-scenario-catalogue.md` — §Wholesale (#001, #127), path table line 464.
4. `knowledge/business-rules-from-test-scenarios.md` §19 Wholesale.
5. `knowledge/teams-decisions-by-ticket.md` §EAINT-12019, §EAINT-12119.
6. `knowledge/cr-ledger.md` (grep for 11731 / 11824 / 12119 / 12378).
7. `lib/eautoFlows/modules/wholesale.ts` (TS ids LGF / EM_DN / EM_LOGISTICS / LOG_FEE).
8. `_reference/teams/EAINT-12119-Logistics-Interstate-Price-Tier.md` (full).
9. `_reference/sharepoint/qa-team-ts/EAINT-12403 - … (Effective 02.10.2026).md` — Interstate rows R31–R39 only.
10. `_reference/sharepoint/qa-team-ts/EAINT-9944 …/List of Modules and Pages that requires Thumbprint (UCD & AATF).md` — R13 only (dropped).
11. Grep of all `_reference/sharepoint/qa-team-ts/` text copies for "logistic", "emove", "delivery order", "interstate": no hit outside EAINT-12403 and EAINT-9944.
12. `_reference/sharepoint/library-listing-2026-10-16.json` (grep "wholesale", "logistic").
13. `_reference/codebases/eauto-qa-azfar/knowledge/` (grep): no logistics TS content.
14. **Read 2026-10-27:** `_reference/sharepoint/qa-team-ts/EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.md` — sheets "EAINT-11949", "EAINT-11731", "EAINT-11824", "Ticket Status", "10 June 2026 Scope" (logistics rows), "Failed Payment". Made by `node scripts/pipeline/lib/xlsx-text.mjs "Wholesale Test Scenarios COMPLETE v3"`.
15. `_reference/sharepoint/qa-team-ts/INDEX.md` — exists now; only row is EAINT-9805.
16. **Third pass (2026-10-27):** `EAINT-12019-study.md` (SRD v0.8 pass, 6:55 pm capture); `data/pipeline/work/EAINT-12019/scenarios.md`; `data/pipeline/answers.json`; text copies of EAINT-12412 (all TS rows), EAINT-8826 and EAINT-8766 (first TS rows); Jira captures via `fetch.mjs issue` for EAINT-11731, 11824, 11949, 12119, 12403, 12412, 9860; grep of `_reference/sharepoint/` for "housekeeping", "45 day", "EAINT-638", "EAINT-2450", "SST Payment Report", "Revenue Report".

## Knowledge candidates

1. **`knowledge/flow-wholesale.md` line 169** says "the fee is RM0.00 in production until notice" with source "[ts: EAINT-11824 LOG_FEE_TS1-TS11]". The rule is on sheet "10 June 2026 Scope" R12 REQ_TS11, and LOG_FEE runs TS1–TS164. `[source: Wholesale v3 text copy]`
2. **`lib/eautoFlows/modules/wholesale.ts` line 194** quotes EM_DN fields as "EM_DN_TS1-TS20"; sheet has EM_DN_TS1–TS21 plus a separate EM_DO_TS1–TS21 Buyer copy. `[source: Wholesale v3, sheet "EAINT-11731", R45–R94]`
3. **New past-TS text copy** for the catalogue: `_reference/sharepoint/qa-team-ts/EAINT-9860 - Wholesale/eAuto Wholesale Test Scenarios COMPLETE v3.md` (catalogue #127).
