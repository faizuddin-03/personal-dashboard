# EAINT-11977 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study. Nothing
in `knowledge/` or `lib/` was changed.

## Sources read

0. **Re-study (2026-10-27, second run):** text copy
   `_reference/sharepoint/qa-team-ts/EAINT-11977 - [eAuto-UCD] To change control sequence to amend date July 2026 and hide Tokio Marine (car).md`.
   Read still returns "File does not exist"; content was read in full through Grep instead.
   It holds a title line "text copy (27/10/2026, 8:26:39 pm)", then "## Sheet: 11977" (line 5)
   and "## Sheet: 12020" (line 8), with **no rows** under either sheet.
1. **Text copy named in the first run:** `_reference/sharepoint/qa-team-ts/EAINT-11977 & EAINT-12020.md`.
   **Could not be read.** Glob lists the file, but Read returns "File does not exist"
   (tried both path styles). A Grep on it in the second run also returned no lines.
   Cause [unconfirmed]: a special character in the file name.
2. **Used instead:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-11977_&_EAINT-12020.xlsx.txt`,
   a text dump of the same workbook. Locations below are given as **"text line N"**
   of that file. The catalogue cites the same rows as `Sheet1!R6-R9`, so
   **sheet row ≈ text line − 2** for the scenario rows [unconfirmed].
3. **Second workbook:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-11977_-_eAuto-UCD_To_change_control_sequence_to_amend_date_July_2026_and_hide_Tokio_.txt`.
   Two sheets, **"11977"** and **"12020"**, both **empty**.
4. **Raw xlsx** at `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-11977 & EAINT-12020.xlsx`:
   not opened (text dump used).
5. **Not present:** `_reference/tickets/EAINT-11977/` (no files before this study),
   `_reference/tickets/Studying/EAINT-11977/`, any entry in `lib/ticketStudies.ts`.
6. **Knowledge checked:** `knowledge/cr-test-scenario-catalogue.md` (rows 025, 026),
   `knowledge/business-rules-from-test-scenarios.md` §6.1, `knowledge/eauto-insurance.md`
   "Quote sequence", `knowledge/releases.md` line 30, `knowledge/flow-zurich-takaful.md`,
   `knowledge/flow-insurance-purchase.md`.
7. **SRD:** cited as "EAINT-11977_SRD_v1.0_20260724" (text line 5). No SRD file in the repo. Not read.

## 1. Header

1. **Tickets:** "EAINT-11977 (Control Sequence + Hide TM Car) & EAINT-12020 (Enable Usage Code AA — Motorcycle)" (text line 5).
2. **Module / portal:** "Module: Insurance | Portal: UCD / eAuto" (text line 5).
3. **Workbook:** "EAINT-11977 & EAINT-12020.xlsx", library "eAuto - CR Test Scenarios", modified 10/08/2026 2:13:49 pm.
4. **Sheet:** one — **"Sheet1"**, with two sections: **"Connect to e-Sim"** (text line 6) and **"Connect to Insurance API"** (text line 12).
5. **Title:** "eAuto UCD — Insurer Control Sequence Amendment (Jul 2026) & Hide Tokio Marine (Car) — Test Cases" (text line 4).
6. **Scenarios:** **7** — 11977_TS1 to 11977_TS7.
7. **Results:** **7 Pass, 0 Fail.** The Insurance API section has a blank header where "Test Result" sits (text line 13), but each row holds "Pass".
8. **Testers (QA column):** "Mai" (TS1, TS3), "Aliah" (TS2, TS4). TS5–TS7 QA column is blank.
9. **Environment:** "Environment: TBC" (text line 5).
10. **Dates:** none in the sheet. SRD dated 20260724 by its name. Catalogue lists owner as one QA engineer, 2026-08-10 (file modified date).
11. **Deployment:** "S32.1-20260803" with "EAINT-11977 and 2 more" `[knowledge/releases.md line 30]`.
12. **Twin workbook (the one named in the second-run brief):** "EAINT-11977 - [eAuto-UCD] To change control sequence to amend date July 2026 and hide Tokio Marine (car).xlsx", library "eAuto - CR Test Scenarios", modified 24/07/2026, 3:43:32 pm. Sheets **"11977"** and **"12020"**, both **empty** — 0 scenarios, no results, no tester, no dates (catalogue row 026: "Empty workbook (2 blank sheets)").
13. **Which workbook holds the scenarios:** only "EAINT-11977 & EAINT-12020.xlsx". All of sections 2–6 below come from that workbook, not the twin.

## Changes since last study (2026-10-27)

1. **New scenarios:** none. The twin workbook still has no rows on sheet "11977" or "12020".
2. **Removed scenarios:** none.
3. **Changed scenarios:** none.
4. **Result changes:** none. The twin records no results; the 7 Pass in the "&" workbook are unchanged (that workbook was not re-supplied this run).
5. **Modified date:** the brief gives "24/07/2026, 3:43:32 pm" for the twin. This is **earlier** than the "&" workbook's 10/08/2026 date, and matches catalogue row 026 ("2026-07-24"). The "changed on SharePoint" flag likely reflects a re-sync, not new content [unconfirmed].
6. **Fixed in this study:** header item 12 now carries the twin's library, modified date and sheet names; "Sources read" now records the second-run text copy.

## 2. What the ticket changed (as the TS shows it)

1. **Car: Tokio Marine hidden.** Every car scenario expects "Tokio Marine - Hidden" (text lines 8, 9, 14, 15).
2. **Control sequence amended for July 2026** — different insurer sets for **East Coast** and **West Coast** UCDs (text lines 8, 9).
3. **Motorcycle (EAINT-12020): usage code AA enabled.** Bike scenarios set "Usage code = AA, Body Type = MSL" and expect "Tokio Marine (✔)" (text lines 11, 16).
4. **X-Star hire purchase** still gets the full set minus Tokio Marine (text line 10).

## 3. Scenarios

### A. Connect to e-Sim (text lines 7–11)

1. **11977_TS1** — **Car, East Coast**, eSTM (MyKad) → Approved → redirect to Insurance Step 1 → buy. Insurer column: "1. Chubb ( X ) 2. Takaful > Comprehensive (✔) 3. Takaful > TPFT (✔) 4. Lonpac ( X ) 5. Tokio Marine (X)". Expected: "1. Takaful > Comprehensive 2. Takaful > TPFT 3. Tokio Marine - Hidden". **Pass** (text line 8).
2. **11977_TS2** — **Car, West Coast**, eSTM (MyPR). Insurer column: "1. Chubb (✔) 2. Takaful > Comprehensive ( X ) 3. Takaful > TPFT( X ) 4. Lonpac ( X ) 5. Tokio Marine (X )". Expected: "1. Chubb 2. Tokio Marine - Hidden". **Pass** (text line 9).
3. **11977_TS3** — **Car, East/West Coast, X-Star HP**, 69E path (1st JPJ Enquiry success, then "JPJ Enquiry = Failed (VEL000069E)" at Step 5 → redirect to insurance → buy → complete eSTM). Expected: "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT) 4. Lonpac Tokio Marine — hidden". **Pass** (text line 10).
4. **11977_TS4** — **Bike, East/West Coast**, eSIM "Usage code = AA, Body Type = MSL", eSTM (MyKad) → buy. Expected: "1.Tokio Marine (✔)". **Pass** (text line 11).

### B. Connect to Insurance API (text lines 13–16)

1. **11977_TS5** — **Car, East Coast**, HP "Carsome", data "SYC3710 MDN8586", 69E path. Expected: "1. Tokio Marine - Hidden". **Pass** (text line 14).
2. **11977_TS6** — **Car, West Coast**, data "WTA6988", plain eSTM → buy. Expected: "1. Tokio Marine - Hidden". **Pass** (text line 15).
3. **11977_TS7** — **Bike, East/West Coast**, data "QM2923C JNQ2205 QAB3709J", usage code AA / MSL. Expected: "1.Tokio Marine (✔)". **Pass** (text line 16).

## 4. Business rules and system behaviour

1. **Tokio Marine is hidden for cars** — "Tokio Marine - Hidden" (Sheet1, text lines 8, 9, 14, 15).
2. **Tokio Marine still shows for motorcycles** with usage code AA / body type MSL — "1.Tokio Marine (✔)" (Sheet1, text lines 11, 16).
3. **East Coast car (e-Sim)** gets **Takaful only** — Chubb, Lonpac and Tokio Marine marked "( X )" (Sheet1, text line 8).
4. **West Coast car (e-Sim)** gets **Chubb only** — Takaful Comprehensive, Takaful TPFT, Lonpac and Tokio Marine marked "( X )" (Sheet1, text line 9).
5. **X-Star HP** gets **Chubb, Takaful Comp, Takaful TPFT, Lonpac** on both coasts — "1. Chubb (✔) 2. Takaful > Comprehensive (✔) 3. Takaful > TPFT (✔) 4. Lonpac (✔) 5. Tokio Marine (X )" (Sheet1, text line 10).
6. **TPFT display condition** (remark on TS3, Sheet1, text line 10), verbatim:
   "TPFT condition: i. Vehicle year is more than 20 ii. Vehicle year is less than or equal 20, no quotation from all the insurers, no hak milik if got approved estm iii. Vehicle year is less than or equal 20, sum insured less than RM20K, no hak milik if got approved estm".
7. **69E path redirects to insurance** before eSTM completion: "Click [Make Payment] to proceed to Step 5, JPJ Enquiry = Failed (VEL000069E) 5. Redirect to Insurance Step 1 6. Proceed to purchase insurance … 7. Proceed to complete eSTM Transaction" (Sheet1, text line 10).
8. **Which insurers appear on e-Sim is set per vehicle by the e-Simulator** — this matches `knowledge/flow-insurance-purchase.md` (line 314–317). The e-Sim results (rules 3–4) may reflect the simulator setup, not the live control sequence [unconfirmed].

### Where this ticket touches existing knowledge

1. **Contradicts (supersedes) the May 2026 sequence** in `knowledge/flow-zurich-takaful.md` §3 (lines 73–76), which still ends every car sequence with "→ Tokio Marine". From the S32.1 deployment (2026-08-03), Tokio Marine car is hidden.
2. **Zurich is absent from this TS.** `flow-zurich-takaful.md` lists Zurich first or second for 13.05.2026; this TS lists only Chubb, Takaful, Lonpac, Tokio Marine. Whether "Takaful" here means Zurich Takaful or Syarikat Takaful Malaysia is **not stated** [unconfirmed].
3. **Motorcycle** in `flow-zurich-takaful.md` (line 77) is "Zurich (Comp) → Zurich (TP) → Tokio Marine (Comp) → Tokio Marine (TPFT)"; this TS checks only that Tokio Marine shows.
4. **TPFT condition (rule 6)** adds detail to `knowledge/eauto-insurance.md` line 170 ("TPFT hidden when the quote comes from the eSTM flow and isHakMilik == true") — both point at hak milik after approved eSTM.
5. **Already recorded:** `knowledge/business-rules-from-test-scenarios.md` §6.1 item 9 and catalogue row 025 hold the Tokio Marine car/bike rule. Rules 3–6 above are not yet recorded.

## 5. Test data, environments, accounts, setup

1. **Environment:** "TBC" (text line 5). Section names suggest two setups: **e-Sim** (simulated JPJ/insurer) and **live Insurance API** [unconfirmed].
2. **ID types:** MyKad (TS1, TS3–TS7), MyPR (TS2).
3. **Vehicle numbers (Insurance API section):** "SYC3710 MDN8586" (TS5), "WTA6988" (TS6), "QM2923C JNQ2205 QAB3709J" (TS7).
4. **eSIM settings:** "Set eSIM Usage code = AA, Body Type = MSL" (TS4, TS7). 69E code "VEL000069E" (TS3, TS5).
5. **Hire purchase:** "Xstar" (TS3, with "Create XStar Hire Purchase Record with Status = Active"); "Carsome" (TS5).
6. **UCD location:** East Coast / West Coast HQ. Accounts not named.
7. **Credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **No sequence order checked** — TS checks which insurers show, not the order. Regression should assert order per coast.
2. **Company category, Islamic HP, Get Free Quote** (with and without approved eSTM) — not covered. Earlier CRs give these their own rules (`knowledge/eauto-insurance.md` lines 192–203).
3. **Secarang** — not covered; earlier control-sequence CRs had a Secarang twin (EAINT-9024).
4. **BackOffice Insurance Quote Enquiry** — not checked for Tokio Marine car being hidden.
5. **TPFT condition** (rule 6) — written as a remark only; no scenario tests each branch (>20 years, no quotes, sum insured < RM20K).
6. **Sheet inconsistencies:**
   1. TS5 hire purchase column says "Carsome" but step 1 says "Create XStar Hire Purchase Record" (text line 14).
   2. TS3 expected "4. Lonpac Tokio Marine — hidden" merges two items; the insurer column marks Lonpac "(✔)" (text line 10).
   3. Step numbers skip "3." in TS1, TS2, TS4, TS6, TS7 and repeat "1." in TS4, TS7.
   4. TS5–TS7 have no QA name.
7. **Insurance API rows expect only "Tokio Marine - Hidden"** — other insurers on the live API are not recorded.
8. **Usage code AA for cars** — not tested; only bike body type MSL.

## Knowledge candidates

1. **East/West Coast car insurer set (e-Sim, July 2026):** East Coast = Takaful Comp + TPFT only; West Coast = Chubb only. Source: "1. Chubb ( X ) 2. Takaful > Comprehensive (✔) 3. Takaful > TPFT (✔) 4. Lonpac ( X ) 5. Tokio Marine (X)" and "1. Chubb (✔) 2. Takaful > Comprehensive ( X ) 3. Takaful > TPFT( X ) 4. Lonpac ( X ) 5. Tokio Marine (X )" `[SharePoint TS #025 EAINT-11977 & EAINT-12020, Sheet1, text lines 8–9]`. Target: `knowledge/eauto-insurance.md` "Quote sequence". Caveat: may be e-Sim setup [unconfirmed].
2. **X-Star HP insurer set (July 2026):** Chubb, Takaful Comp, Takaful TPFT, Lonpac; Tokio Marine hidden `[same, Sheet1, text line 10]`. Target: same section, X-Star item.
3. **TPFT display condition** — quote rule 6 verbatim `[same, Sheet1, text line 10, Remarks]`. Target: `knowledge/eauto-insurance.md` near line 170.
4. **Motorcycle usage code AA + body type MSL enabled (EAINT-12020); Tokio Marine shown** `[same, Sheet1, text lines 11, 16]`. Target: `knowledge/eauto-insurance.md`; also `knowledge/esim.md` as an eSIM setting.
5. **Supersede note on `knowledge/flow-zurich-takaful.md` §3:** car sequence ending "→ Tokio Marine" is outdated from S32.1-20260803 `[knowledge/releases.md line 30; this TS, Sheet1, text lines 8–15]`.
6. **Live-API test vehicles:** SYC3710, MDN8586 (East Coast car), WTA6988 (West Coast car), QM2923C, JNQ2205, QAB3709J (bike AA) `[same, Sheet1, text lines 14–16]`. Target: test-data notes, if such a file exists.
