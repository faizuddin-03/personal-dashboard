# EAINT-12339 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Study only; no other file changed.

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12339 - [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0.md` (text copy dated "27/10/2026, 6:50:26 pm"; cell text only, no formatting or images).
2. **Session handoff:** `_reference/tickets/EAINT-12339/Session-Handoff-2026-10-05-EAINT-12339.md`.
3. **Flow file:** `knowledge/flow-jomcheck.md` §1–§4, §7o, §7p, §7s, the page-object table near line 1911.
4. **Index check:** grep of `knowledge/` for EAINT-12339 (15 files hit); `lib/ticketStudies.ts` has only a "related" mention at line 1235, no study entry.
5. **Not read:** the `.docx` SRDs, `.xlsx` workbooks, `.pdf` files and mock-up HTML in `_reference/tickets/EAINT-12339/`. The SRD content used here comes second-hand from `flow-jomcheck.md`.
6. **Not present:** `_reference/tickets/Studying/EAINT-12339/` does not exist.

## 1. Header

1. **Ticket:** EAINT-12339 — "[eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0".
2. **Module / portals:** JomCheck. Sections cover **UCD**, **BackOffice**, **Service Portal**, **Wholesale**, **API**, **Regression**, **Production**.
3. **Workbook:** "EAINT-12339 - [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 05/10/2026, 3:31:01 pm.
4. **Sheets:** "Test Scenarios", "Field Reference", "Change Log".
5. **Scenarios:** **46** (12339_TS01–12339_TS46), in 9 sections A–I.
6. **Results:** **45 Pass**. **1 blank**: TS34 has no "API Tested On", "QA" or "Test Result", and Remarks reads "No need to do for audit log" (Test Scenarios R41).
7. **Tester:** "Faiz" in the QA column of every scored row. The tester is Faizuddin, so this is his own sheet, not another engineer's.
8. **Dates in the sheet:** Change Log entries dated "04.10.2026" and "05.10.2026". TS46 title: "Production verification after deployment on 05.10.2026 (night session)" (R58).
9. **Columns:** "TS No. | Test Objective | Test Steps | Expected Result | API Tested On | QA | Test Result | Remarks | Field Reference" (R2).

## 2. What the ticket changed, as the TS shows it

1. **Three columns re-sourced, labels kept.** Field Reference R3–R5: Mileage → **MileageRange** (Odometer Reading), ClaimType → **ClaimsType** (Type of Claim), ApprovedParts → **TotalPartsChanged** (Total No. of Parts Approved for Change). Position "Unchanged" for all three.
2. **Exact values became bands.** MileageRange: "Old field returned an exact figure; new field returns a 10,000km range (e.g. "40,001 to 50,000 km")" (Field Reference R3). TotalPartsChanged: "Old field was an exact count; new field is a 10-part-step range (e.g. "1 to 10 parts")" (R5).
3. **Claim type became a code.** "Old field was free text; new field is a numeric ICAP code, mapped to a description (e.g. code 11 → "Windscreen (WS)")" (Field Reference R4).
4. **Two new BackOffice columns.** **Possible Total Loss** "between "Total Loss History (Actual)" and "Total Loss History (BER)"" and **Possible BER** "between "Total Loss History (BER)" and "Make/Brand"", both "Displays "Yes"/"No"" (Field Reference R6–R7).
5. **Listing grows to 29 columns.** "Jomcheck Report Listing displays 29 columns" and "Existing 27 columns keep their label and position" (Test Scenarios R22, TS17).
6. **Severity grows to 6 bands.** TS26 lists "LOW / MEDIUM / HIGH / SEVERE / CRITICAL / CATASTROPHIC" (R31). Service Portal export: "Count(s) of Incidents Severity Scale carries all 6 counters" (R46, TS37).
7. **Pre-push transactions are frozen.** Old rows keep stored values and show "N/A" in the two new columns (R35, TS29).
8. **Deprecated fields stay in the API.** "ClaimType, ApprovedParts and Mileage remain in the API response for backward compatibility but always return "N/A" (null for Mileage) — eAuto no longer reads them." (Field Reference R11).
9. **Unchanged surfaces:** UCD purchase flow, price prompt, layout (TS04); Service Portal gets no new BO columns (TS39).

## 3. Scenarios, grouped

### A. UCD — JomCheck purchase & report

1. **TS01** — UCD buys by Vehicle No., downloads PDF, BO listing shows the 5 fields. Expected: "3 re-sourced columns (labels unchanged) and 2 new columns displayed for the transaction". eSim. Pass.
2. **TS02** — PDF vs BO listing on the real API. Expected: "No field in the Report PDF displays "N/A" or blank caused by the deprecated fields (ClaimType, ApprovedParts, Mileage)". JomCheck API. Pass.
3. **TS03** — Buy by **Chassis No.**; same 5 columns as by Vehicle No. eSim. Pass.
4. **TS04** — Purchase flow, price prompt, e-Invoice/Report buttons unchanged. Expected prompt: "Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." eSim. Pass.
5. **TS05** — Pre-push transaction's Report button. Expected: "Report content is identical to the copy saved before the push (not regenerated from API v2.0)". eSim. Pass.

### B. BackOffice — JomCheck Report Listing (new transactions)

1. **TS06** — 1 claim: single-line values; "Odometer Reading = MileageRange; Type of Claim = ClaimsType description per SRD 2.2.5; Total No. of Parts Approved for Change = TotalPartsChanged". Pass.
2. **TS07** — 2+ claims: "1 line per claim, numbered 1., 2. ...". Pass.
3. **TS08** — Mileage bands: "9,999km & 10,000km displays "0 to 10,000 km"", "10,001km displays "10,001 to 20,000 km"". Pass.
4. **TS09** — Mileage extremes: "300,000km displays "290,001 to 300,000 km"", "300,001km displays "More than 300,000 km"", "Null displays "Not Specified"". Pass.
5. **TS10** — Parts bands: "10 parts displays "1 to 10 parts"", "11 & 20 parts displays "11 to 20 parts"", "21 parts displays "21 to 30 parts"". Pass.
6. **TS11** — Parts extremes: "100 parts displays "91 to 100 parts"", "101 parts displays "More than 100 parts"", "Blank displays "No information available."". Pass.
7. **TS12** — Type of Claim: "Code 11 displays "Windscreen (WS)" - exact text including the code in brackets", "ClaimsType null displays "-"". Pass.
8. **TS13** — One ATL claim + one CTL claim → both new columns "Yes", "Both columns display a single value (not numbered per claim)". Pass.
9. **TS14** — No qualifying claim → both "No". Pass.
10. **TS15** — Empty ClaimList: "Type of Claim column shows "-""; PDF shows "Advisory message shown under RESEARCHED INFORMATION instead of claim rows"; other columns "expected display to be confirmed". Pass.
11. **TS16** — Windscreen + blank Sum Insured → Severity "NOT RELEVANT / NO SUM INSURED PROVIDED", shown in full. Pass.
12. **TS17** — 29 columns in documented order; labels "are not renamed". Pass.
13. **TS18** — No "N/A" or empty cell in the 3 re-sourced columns, listing and export. Pass.
14. **TS19** — Multi-claim: same claim on the same numbered line across 5 columns. Pass.
15. **TS20** — 3 claims, middle uncoded → lines 1 and 3 "Windscreen (WS)", "Line 2 (Claim 2) : '-'". Pass.
16. **TS21** — Every ICAP code 1–19, 30, 31 maps to the exact SRD 2.2.5 text. Pass.
17. **TS22** — ATL only → Possible Total Loss "Yes", Possible BER "No". Pass.
18. **TS23** — CTL only → Possible Total Loss "No", Possible BER "Yes". Pass.
19. **TS24** — Flags come from the vehicle level: "Possible Total Loss = "Yes" (follows the vehicle-level flag)" while the only claim is false. Pass.
20. **TS25** — Unchanged columns vs raw API response (prices, Total Loss History, State, Severity). JomCheck API. Pass.
21. **TS26** — All 6 Severity values pass through "without error". Pass.

### C. BackOffice — listing, existing / pre-push transactions

1. **TS27** — Pre-push, 1 claim: values = stored values "(no change)". Pass.
2. **TS28** — Pre-push, 2+ claims: stored values, "1 line per claim". Pass.
3. **TS29** — Pre-push: Possible Total Loss and Possible BER "Value: N/A". Pass.
4. **TS30** — Old vs new transaction: every column matches except the 5 affected ones. Pass.
5. **TS31** — Old failed transaction stays "Payment OK, Tx Failed, no report" after a new buy on the same vehicle. Pass. Remarks: "NH4566".

### D. BackOffice — listing export

1. **TS32** — Export matches listing; "Export has 29 columns in the same order as the listing"; header suffixes "(UPDATED)"/"(NEW)" "to confirm". Pass.
2. **TS33** — Range values "display as text", not converted by Excel. Pass.
3. **TS34** — Export recorded in the audit log. **Not run**: "No need to do for audit log".
4. **TS35** — Pre-push export = listing, "N/A" for new columns, "Multi-claim cells keep the numbered display in a single cell". Pass.

### E. BackOffice — JomCheck Transaction Details

1. **TS36** — BO Details Page PDF vs listing on the real API. JomCheck API. Pass.

### F. Service Portal — JomCheck Report Listing

1. **TS37** — Export + bulk download: "all 6 counters", "No Possible Total Loss or Possible BER column in the export file". Pass.
2. **TS38** — Superadmin (eAuto Sdn Bhd) sees "all 6 counters with the correct counts". Pass.
3. **TS39** — No Possible Total Loss/BER, Type of Claim, Odometer Reading or Parts columns; "Total Loss History displays as it does today (unchanged)". Pass.

### G. Wholesale — JomCheck purchase & report

1. **TS40** — New Wholesale buy: report via Chatbot reflects v2.0; UCD and BO show new values. Pass.
2. **TS41** — Wholesale paid before push: "OLD Jomcheck report format shown, unaffected by enhancement". Pass.
3. **TS42** — Wholesale paid after push: "NEW Jomcheck report reflects API v2.0 fields". Pass.

### H. API testing

1. **TS43** — Raw response from dev has all 7 new fields; "ClaimsType is returned as an integer"; "Deprecated fields are still present: ClaimType = "N/A", ApprovedParts = "N/A", Mileage = null"; V2.0 Search endpoint; "BasicInfo returns RetailPrice and TradePrice". JomCheck API. Pass.

### I. Regression

1. **TS44** — Second buy after changing eSim values: "Report listing always matches the latest Jomcheck record, not a stale cached copy". Pass.
2. **TS45** — BO filters: "Only one filter is active at a time"; "No-match search shows "0 record(s) in total"". Pass.
3. **TS46** — Production check on 05.10.2026 night: UCD PDF clean, BO 29 columns, export = listing, Service Portal 6 counters, pre-push row keeps "N/A". Pass.

## 4. Business rules and system behaviour the TS reveals

1. **eSim PDF is a dummy.** "If connected to eSim, the PDF report will be a dummy. To check if details reflected correctly, cross check the Report Listing with the details in eSim" (Test Scenarios R3, Golden Rule 1).
2. **API PDF is real.** "If connected to API, the PDF report will contain actual details. Can cross check with the Report Listing" (R3, Golden Rule 2).
3. **API results are random.** "Results returned from API is random and cannot be pre-determined" (R3, Golden Rule 3).
4. **API daily limit.** "API has a limit of 20 reports per day" (R3, Golden Rule 4). TS46 repeats it for production: "(counts toward the 20 reports/day limit)" (R58).
5. **Price unchanged.** "Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." (R8, TS04).
6. **Mileage bands are inclusive at the top.** "9,999km & 10,000km displays "0 to 10,000 km"" (R13, TS08); "300,000km displays "290,001 to 300,000 km"" (R14, TS09).
7. **Mileage extremes.** "300,001km displays "More than 300,000 km"" and "Null displays "Not Specified"" (R14, TS09).
8. **Parts bands.** "10 parts displays "1 to 10 parts"", "21 parts displays "21 to 30 parts"" (R15, TS10); "101 parts displays "More than 100 parts"", "Blank displays "No information available."" (R16, TS11).
9. **Type of Claim keeps the code in brackets.** "Code 11 displays "Windscreen (WS)" - exact text including the code in brackets, not "Windscreen"" (R17, TS12). Null → "-" (R17).
10. **ICAP list has no codes 20–29.** TS21 lists codes 1–19 then "30 Unspecified (Possible 3rd Party Claim)" and "31 Unspecified (Possible 3rd Party Claim)" (R26).
11. **New columns are single-value per vehicle.** "Both columns display a single value (not numbered per claim)" (R18, TS13).
12. **eAuto reads the vehicle-level flag, not the claims.** "Possible Total Loss = "Yes" (follows the vehicle-level flag)" with the only claim set false (R29, TS24).
13. **Claim-level flags are hidden.** "API response only (TS43) — not displayed on the listing" (Field Reference R8–R9).
14. **Severity for windscreen / no sum insured.** "Value: "NOT RELEVANT / NO SUM INSURED PROVIDED", shown in full" (R21, TS16).
15. **State in Malaysia is hard-coded.** "State in Malaysia = "-" (hard-coded, even though v2.0 returns RepairState)" (R30, TS25).
16. **Price fields after v2.0.** "Avg. Market Value / Avg. Retail Price = BasicInfo.RetailPrice" and "Approx. New Car Price / Recommended Trade Price = BasicInfo.TradePrice" (R30, TS25).
17. **Pre-push reports are not regenerated.** "Report content is identical to the copy saved before the push (not regenerated from API v2.0)" (R9, TS05).
18. **Pre-push rows show N/A in new columns.** "Possible Total Loss = "N/A" and Possible BER = "N/A", same as the listing" (R42, TS35).
19. **Multi-claim export layout.** "Multi-claim cells keep the numbered display in a single cell" (R42, TS35).
20. **Export ranges stay text.** "Exported range values (e.g. "1 to 10 parts", "40,001 to 50,000 km") display as text" (R40, TS33).
21. **Service Portal gets only Severity.** "Excel -> No Possible Total Loss or Possible BER column in the export file" (R46, TS37); "Type of Claim, Odometer Reading and Total No. of Parts Approved columns are not displayed" (R48, TS39).
22. **Failed transaction shape.** "still shows Payment OK, Tx Failed, no report" (R37, TS31).
23. **BO filters are exclusive.** "Only one filter is active at a time" (R57, TS45).
24. **Empty ClaimList on the PDF.** "Advisory message shown under RESEARCHED INFORMATION instead of claim rows" (R20, TS15).
25. **Production timing.** "Both eAuto and ezAuto v2.0 deployments completed (ezAuto completes at 11:30pm)" (R58, TS46).

## 5. Test data, environments, accounts, setup

1. **Data source per row:** "API Tested On" = "eSim" for 41 rows, "JomCheck API" for TS02, TS25, TS36, TS43; blank for TS34.
2. **API rows need staging switched to the real API.** Section H banner: "ENSURE STAGING IS CONNECTED TO JOMCHECK API" (R53). TS25 and TS43 also need the "raw API response obtained from dev" (R30, R54).
3. **eSim controls claim data:** mileage, parts, ClaimsType, Severity, Sum Insured, claim- and vehicle-level flags. TS21: "use more than one vehicle if eSim limits the number of claims" (R26). TS24 needs eSim to set vehicle flags "independently of the claim-level flags" (R29).
4. **Pre-push data:** TS05, TS27–TS31, TS35, TS41 need transactions made before the CR push. TS05 also needs "A copy of its report downloaded before the push (saved as evidence)" (R9).
5. **Named record:** TS31 Remarks "NH4566" (R37). Per the handoff, NH4566 belonged to another UCD company and the run that used it failed; the final TS31 was rebuilt on eSim Result = Failed.
6. **Accounts:** UCD, BackOffice, Service Portal "eAuto Sdn Bhd (superadmin) account" (R47), Wholesale Chatbot. **No credentials in the sheet.**
7. **Production:** TS46 buys 1 real report in production (R58).

## 6. Gaps or risks a regression should still cover

1. **TS34 audit log never run.** "No need to do for audit log" (R41). Export audit trail is untested.
2. **TS15 has an open expected result yet is Pass.** "expected display to be confirmed" (R20). Empty-ClaimList display of 4 columns is unsettled.
3. **TS32 header suffix left open.** "(mockup shows "(UPDATED)"/"(NEW)" suffixes and colour fills - to confirm)" (R39). The handoff says live export had plain labels [unconfirmed against a saved export].
4. **TS45 sheet text differs from the automation.** Sheet: "No-match search shows "0 record(s) in total"" (R57). `knowledge/flow-jomcheck.md` (page-object table, ~line 1911) asserts "No records found. Please ensure there are existing JomCheck report purchase records." The handoff says Faizuddin corrected it on 2026-10-05 09:48. The SharePoint sheet (modified 3:31 pm that day) still has the old text.
5. **TS37–TS39 sheet differs from the automation.** Change Log R2–R4 removed "AND shared to the credit company" from the preconditions. The handoff (item 3) says the automation was rebuilt the same day as buy-and-share with "X STAR TECHNOLOGY MALAYSIA SDN BHD". The sheet does not record the share step.
6. **TS46 data source looks wrong.** "API Tested On" = "eSim" for a production check (R58). Production cannot use eSim [unconfirmed: likely a copy-down error].
7. **TS02 / TS36 crosscheck assumption.** Handoff item 1: the real PDF prints the raw ICAP code under "Filing Category", the listing prints the description. Both marked Pass in the sheet; the parked automation fix was not applied as of the handoff.
8. **Claim line order.** `flow-jomcheck.md` §7p: eSim does not keep claim order. TS19/TS20 depend on line alignment, not order. Regression should check alignment, not position.
9. **Wholesale (TS40–TS42) is manual only.** Chatbot flow; no automation.
10. **Real-API banding not proven.** TS08–TS11 run on eSim, so they prove eAuto shows what it is sent. Real ezAuto banding is only seen through TS02/TS36/TS43 [unconfirmed: the flow file calls these "pass-through checks" (§7o)].
11. **Live-API cost.** 20 reports/day shared across testers; API rows must be planned.

### Changes vs existing knowledge

1. **Closes a gap.** `flow-jomcheck.md` §7s item 1: "The pasted version is not saved in the repo as a file." The SharePoint text copy now exists at `_reference/sharepoint/qa-team-ts/`.
2. **Confirms §7s.** Change Log R9: "Deleted TS40, TS41, TS42 (Service Portal counter scenarios requiring credit company sharing). Renumbered following scenarios: TS43–TS49 -> TS40–TS46."
3. **Contradiction, TS45:** see Gap 4.
4. **Contradiction, TS37–TS39 preconditions:** see Gap 5. `flow-jomcheck.md` §7u describes the share flow; the official sheet does not.
5. **Severity "-" vs NOT RELEVANT:** §7p says a blank eSim Severity shows "-". TS16 sets the exact text. No conflict, but blank Severity display is not covered by any TS.

## Knowledge candidates

1. **Official 46-row sheet now has a text copy.** Add to `knowledge/flow-jomcheck.md` §7s: the 2026-10-05 sheet is on SharePoint "eAuto - CR Test Scenarios", modified "05/10/2026, 3:31:01 pm", text copy at `_reference/sharepoint/qa-team-ts/EAINT-12339 - ….md`. Source: that file, header line 1.
2. **Final result.** 45 Pass, TS34 not run, Remarks "No need to do for audit log". Source: Test Scenarios R41. Upgrades the handoff's "ts34 deprio, all the other passed" from verbal to recorded.
3. **TS45 wording mismatch.** Sheet still reads "No-match search shows "0 record(s) in total"" (R57). Automation uses the corrected text. Flag in §7q/§7s so nobody "fixes" the automation back to the sheet.
4. **TS37–TS39 share step is not in the official sheet.** Change Log R2–R4 removed it 04.10.2026. Flag next to §7u.
5. **State in Malaysia is hard-coded "-".** "State in Malaysia = "-" (hard-coded, even though v2.0 returns RepairState)" (Test Scenarios R30, TS25). Candidate for `knowledge/flow-jomcheck.md` and `knowledge/business-rules-from-test-scenarios.md`.
6. **Price field mapping on v2.0.** "Avg. Market Value / Avg. Retail Price = BasicInfo.RetailPrice"; "Approx. New Car Price / Recommended Trade Price = BasicInfo.TradePrice" (R30, TS25).
7. **Empty ClaimList PDF.** "Advisory message shown under RESEARCHED INFORMATION instead of claim rows" (R20, TS15). Expected display of the other 4 columns still open.
8. **Golden Rules for any JomCheck testing.** Four rules verbatim from Test Scenarios R3 (eSim PDF dummy, API PDF real, API random, 20/day). Check against `flow-jomcheck.md` (the section near line 266 already covers JomCheck-wide rules) and add any missing.
9. **Pre-push reports not regenerated.** "Report content is identical to the copy saved before the push (not regenerated from API v2.0)" (R9, TS05).
10. **`lib/ticketStudies.ts` still has no EAINT-12339 entry.** Candidate settled decisions: 46 rows; TS40–TS42 (old) deleted; TS34 not run; production check 05.10.2026 night passed. Source: this sheet + the 2026-10-05 handoff.
