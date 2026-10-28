# EAINT-9615 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9615 - [eAuto-BackOffice] To include Tokio Marine Motorbike Category in Insurance Quote Enquiries Listing.md` — header "text copy (27/10/2026, 8:19:43 pm)", "Cell text only, row by row; formatting and images are not kept." Rows R1–R11 read in full.
2. **Second text copy:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-9615_-_eAuto-BackOffice_To_include_Tokio_Marine_Motorbike_Category_in_Insurance_Quot.txt` — same content, matches row for row.
3. **Workbook** `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-9615 - ….xlsx` exists locally; not opened (text copy is the brief). Cell colours, images and hidden sheets **not checked**.
4. **Ticket folders:** `_reference/tickets/EAINT-9615/` held no files before this study; `_reference/tickets/Studying/EAINT-9615/` does not exist. **No SRD, no Jira text, no Teams notes** read.
5. **lib/ticketStudies.ts:** no entry for EAINT-9615.
6. **knowledge/:** `cr-test-scenario-catalogue.md` (row 106), `business-rules-from-test-scenarios.md` (§6.4 item 5, items 8–9), `people-and-roles.md` line 73, `flow-eauto-insurance-enquiry.md`, `flow-zurich-takaful.md` §4b item 6, `flow-bo-shell.md` line 146.

## 1. Header

1. **Ticket:** EAINT-9615.
2. **Module / portal:** eAuto **BackOffice** — Insurance Quote Enquiries **Listing** (plus Export Excel). Data is created from BO **Insurance Quote Enquiry** and from a **UCD eSTM → insurance** journey.
3. **Workbook:** "EAINT-9615 - [eAuto-BackOffice] To include Tokio Marine Motorbike Category in Insurance Quote Enquiries Listing.xlsx", library "eAuto - CR Test Scenarios", modified 30/07/2026, 12:38:38 pm.
4. **Sheets:** 1 — "Test Scenario".
5. **Columns:** "TS No. | Pre-condition | Test Scenario & Steps | Expected Result | QA | Test Result (P/F)" (Test Scenario, R1).
6. **Scenarios:** 10 rows (R2–R11). Only **4 carry a TS No.** (R2–R5); R6–R11 have no id.
7. **Results:** **4 PASS** (R2–R5, QA "Aliah"). **6 blank** (R6–R11: no QA, no result).
8. **Tester:** "Aliah" (QA column, R2–R5). Catalogue names the file author as "Aliah Maisarah Binti Mohamadiah", date "2026-07-30" (`knowledge/cr-test-scenario-catalogue.md` row 106).
9. **Test dates:** none written in the sheet.
10. **ID mismatch:** ids read "9610_TS01" … "9610_TS04" (R2–R5) — **9610, not 9615**. Likely copied from another ticket's sheet [unconfirmed].

## 2. What the ticket changed, as the TS shows it

1. The BO **Insurance Quote Enquiries Listing** gets a new insurer column **"Tokio Marine Motorbike (Bike)"** in two column groups:
   1. "-- Insurance Quote --" group: column **19** (R2).
   2. "-- Insurance Premium --" group: column **26** (R2).
2. The same column order must hold in the **Export Excel** file (R3).
3. Records from **bike** vehicle numbers must fill the new columns, whether the quote came from the BO Insurance Quote Enquiry (R4–R7) or a UCD eSTM insurance step (R8–R11) [unconfirmed — the expected result only says "displayed correctly in the columns"].

## 3. Scenarios

### A. Column layout (no new data)

1. **9610_TS01 (R2)** — login "kmcheach", open listing, set date From & To, Search. Expected: "Ensure the correct columns are displayed following the sequence: 1. # 2. UCD Company Name … 30. Quote Status" (full list in §4). **PASS.**
2. **9610_TS02 (R3)** — "5. Click on the Export Excel hyperlink." Expected: same 30-column sequence. **PASS.**

### B. Bike quote from BO Insurance Quote Enquiry

3. **9610_TS03 (R4)** — "-- connecting to e-sim --"; Insurance Quote Enquiry → "Search for valid Bike vehicle number" → "Click the Show Result button" → listing → Search. Expected: "Ensure the records are displayed correctly in the columns following the sequence: …". **PASS.**
4. **9610_TS04 (R5)** — "7. Click on the Export Excel hyperlink." Same expected. **PASS.**
5. **(no id) (R6)** — as R4 but "-- connecting to insurance API --". Same expected. **Not run / not recorded.**
6. **(no id) (R7)** — Export Excel after R6. **Not recorded.**

### C. Bike quote from UCD eSTM

7. **(no id) (R8)** — "-- connecting to e-sim --"; "1. Login as UCD 2. Create a new eSTM transaction using Bike vehicle number 3. Proceed to insurance 4. Ensure there are quotes results showing 5. Login as kmcheah" → listing → Search. Same expected. **Not recorded.**
8. **(no id) (R9)** — "9. Click on the Export Excel hyperlink." **Not recorded.**
9. **(no id) (R10)** — as R8 but "-- connecting to insurance API --". **Not recorded.**
10. **(no id) (R11)** — Export Excel after R10. **Not recorded.**

## 4. Business rules and system behaviour

1. **Full column order** (Test Scenario, R2, Expected Result, verbatim): "1. # 2. UCD Company Name 3. UCD User Name 4. Created Date 5. Insured ID 6. Vehicle No. 7. Vehicle Make 8. Vehicle Model 9. Variant (Series) 10. Vehicle Manufacturing Year 11. Inquiry Source 12. Remarks -- Insurance Quote -- 13. RHB 14. Takaful-CO 15. Takaful-TF 16. Chubb 17. Lonpac 18. Tokio Marine 19. Tokio Marine Motorbike (Bike) -- Insurance Premium -- 20. RHB 21. Takaful-CO 22. Takaful-TF 23. Chubb 24. Lonpac 25. Tokio Marine 26. Tokio Marine Motorbike (Bike) -- Select Insurance (Step 3) 27. Sum Insured 28. Total Premium 29. Insurance Company 30. Quote Status".
2. **Three column groups** after the vehicle block: "-- Insurance Quote --", "-- Insurance Premium --", "-- Select Insurance (Step 3)" (R2). Step 3 group = what the UCD picked: "Sum Insured", "Total Premium", "Insurance Company", "Quote Status".
3. **Tokio Marine car and bike are separate columns:** "18. Tokio Marine 19. Tokio Marine Motorbike (Bike)" (R2).
4. **Takaful is split in two:** "Takaful-CO" and "Takaful-TF" (R2) — likely Comprehensive and Third Party Fire & Theft [unconfirmed]; matches the `.Takaful-TF` class in `flow-insurance-purchase.md` line 307.
5. **Export matches screen:** the Export Excel expected result repeats the same 30-column order (R3, R5, R7, R9, R11).
6. **Listing needs a date range:** "Select valid date From & To" then "Click on the Search button" (R2).
7. **Two data sources feed the listing:** BO Insurance Quote Enquiry ("Click the Show Result button", R4) and UCD eSTM "Proceed to insurance" (R8). An "11. Inquiry Source" column exists (R2), likely telling these apart [unconfirmed].
8. **Two quote back-ends:** each data scenario has an "-- connecting to e-sim --" and a "-- connecting to insurance API --" variant (R4/R6, R8/R10). Only the eSIM variants were recorded as run.

## 5. Test data, environments, accounts, setup

1. **BO login:** "kmcheach" (R2) and "kmcheah" (R8, R10) — **spelling differs**; one is a typo [unconfirmed which]. No passwords in the sheet.
2. **UCD login:** "Login as UCD" (R8) — no account named.
3. **Vehicle:** "valid Bike vehicle number" (R4, R8) — none named.
4. **Simulator:** eSIM ("-- connecting to e-sim --", R4, R8). Bike set-up levers per `flow-zurich-takaful.md` §4c item 2: "Motorbike = Usage AA, Body MSL" `[miro outline]`.
5. **Environment:** not written in the sheet.
6. **Credentials:** none present.

## 6. Gaps and risks for regression

1. **6 of 10 rows never recorded** — all "insurance API" rows (R6, R7, R10, R11) and the UCD eSTM e-sim rows (R8, R9). The UCD-sourced bike quote path has **no recorded pass**.
2. **No value check.** Expected results only say "displayed correctly in the columns"; no premium amount, no check that a **car** record leaves "Tokio Marine Motorbike (Bike)" empty or that a bike record leaves "Tokio Marine" (car) empty.
3. **No negative or mixed-category case** — car, EV, or bike with Tokio Marine declined / no quote.
4. **Zurich not in the column list.** `flow-zurich-takaful.md` §4b item 6 says "**Motorbike = Zurich Comp/TPFT + Tokio Marine**" for BO Insurance Quote Enquiry `[miro outline]`. If Zurich (8606/8608) goes live, this 30-column order will change — the R2 list is **stale after Zurich** [unconfirmed].
5. **Tokio Marine car hidden from July 2026** (`business-rules-from-test-scenarios.md` §6.4 item 9, from TS #025 EAINT-11977/12020). The "18. Tokio Marine" / "25. Tokio Marine" car columns may now stay empty for new car quotes — regression should not read an empty car column as a fail [unconfirmed].
6. **Step 3 group untested for bikes** — no row drives a bike to Step 3 and checks "29. Insurance Company" reads Tokio Marine Motorbike.
7. **Date range** — none of the rows test a range over one month; the one-month rule (`quirks.md`) is untested here.

## Contradictions / additions vs knowledge/

1. **flow-bo-shell.md line 146:** "Insurance Quote Enquiry | `/<env>/view/insurance/insurance-quote-enquiry` | no flow doc yet". This TS adds a **separate Listing page** ("Insurance Quote Enquiries Listing") with Export Excel; no URL or DOM is recorded anywhere.
2. **flow-eauto-insurance-enquiry.md** covers the BO enquiry form only, not the listing. This TS is the only written source of the listing's columns.
3. **No contradiction** with `business-rules-from-test-scenarios.md` §6.4 item 5 — it already quotes R2 columns 1–12. It truncates at "then the insurer columns"; full list is in §4 item 1 above.

## Knowledge candidates

1. **BO Insurance Quote Enquiries Listing — full 30-column order** for screen and Export Excel (verbatim §4 item 1). Target: `flow-eauto-insurance-enquiry.md`, new "BackOffice — Insurance Quote Enquiries Listing" section. Source: `[from SharePoint TS #106 EAINT-9615, sheet Test Scenario, rows 2-3]`.
2. **Listing is fed by two sources** — BO Insurance Quote Enquiry "Show Result" and UCD eSTM "Proceed to insurance". Source: `[… rows 4, 8]`. Mark the "Inquiry Source" meaning `[unconfirmed]`.
3. **Tokio Marine car and "Tokio Marine Motorbike (Bike)" are separate insurer columns**; Takaful split "Takaful-CO" / "Takaful-TF". Source: `[… row 2]`.
4. **Each quote scenario has an e-sim and an insurance-API variant**; only e-sim ones were passed in this TS. Source: `[… rows 4-11]`.
5. **TS id prefix "9610_" on a 9615 workbook** — note in `cr-test-scenario-catalogue.md` row 106 so a grep for "9610" is not mistaken for EAINT-9610. Source: `[… rows 2-5]`.
6. **Catalogue row 106 count** says "Test Scenario:4 | 4"; the sheet has **10 scenario rows**, 4 with ids. Consider correcting. Source: `[… rows 2-11]`.
