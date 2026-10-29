# EAINT-12339 — automation vs TS audit (2026-10-01)

Read-only audit. No automation code was changed and no test was run.

Sources checked:
- the renumbered TS workbook, `(Azila review, renumbered).xlsx`, all sheets
- SRD v1.0 (`SRD_EAINT-12339_v1.0_20260929.docx`)
- the mockups
- `knowledge/flow-jomcheck.md` §6–§7m and `knowledge/esim.md`
- the captured HTML
- `scripts/eauto-jomcheck` and `app/eauto/jomcheck`

TS numbers are the NEW (renumbered) ones.

## Verdict summary

| Verdict | Count | TS |
|---|---|---|
| Satisfies | 8 | TS13, TS14, TS17, TS21, TS22, TS23, TS29, TS33 |
| Partial | 19 | TS01, TS02, TS03, TS04, TS06, TS07, TS12, TS15, TS18, TS19, TS20, TS24, TS25, TS26, TS28, TS30, TS32, TS35, TS36 |
| Does not satisfy | 6 | TS08, TS09, TS10, TS11, TS16, TS46 |
| Not built | 16 | TS05, TS27, TS31, TS34, TS37–TS45, TS47, TS48, TS49 |

## High-impact defects (can give a false Pass)

1. **TS08–TS11 check their own input.** The workbook steps set raw mileage and part counts (9,999 / 10,000 / 10,001 km, blank). The code instead types the band text into eSim and asserts that same text back (`esim-claim-boundaries.spec.ts:144-156`, `169-181`, `189-203`, `211-223`). The workbook marks these rows "ON HOLD - OQ-01", OQ-01 Open. The spec header calls OQ-01 "RESOLVED, 2026-10-04", a date after today.
2. **TS16 set-up is wrong.** The workbook says "Sum Insured left blank" and expects "'NOT RELEVANT / NO SUM INSURED PROVIDED', shown in full". eSim has no Sum Insured field, so the code leaves Severity blank. SRD 2.2.2 #3 says Severity "is passed through without mapping", so eAuto cannot produce that text from a blank. The assertion is also `toContain` after `toUpperCase()` (`:320-325`), not an exact match.
3. **TS46 checks only for non-blank values** (`ucd-purchase-to-bo-listing.spec.ts:188-196`). The integer ClaimsType, the deprecated fields ("N/A"/null), the V2.0 endpoint and RetailPrice/TradePrice (expected results 2–4) are not checked. A value of "N/A" passes.
4. **TS01 and TS03 assert nothing on the 5 fields.** The values are only logged (`ucd-purchase-flow-checks.spec.ts:78-89`, `273-282`).
5. **`utils/pdfCrosscheck.ts` has weak checks**, used by TS02, TS25 and TS36:
   1. Listing values of "N/A" or "NULL" are skipped (`isMeaningful`, line 23).
   2. The `BER:\s*<value>` regex has no word boundary. "CHASSIS NUMBER: NOT AVAILABLE" in the PDF satisfies `BER: NO`, and `ACTUAL: NO` matches "NO RECORD FOUND" by prefix.
   3. A "-" line is checked as `pdfText.includes('-')`, which always passes.
6. **TS26 and TS19 compare Severity without case** (`toUpperCase()`). SRD Example 1 expects "CATASTROPHIC" exactly.
7. **TS30 item 1 is replaced by something weaker.** The workbook says "All unaffected columns match between existing and new transactions". The code checks only non-blank, plus listing = export for each transaction on its own. Type of Claim uses `toContain('Own Damage')` (`esim-listing-export.spec.ts:90`), not "Own Damage (OD)".
8. **TS18 is looser than the workbook.** Odometer and Parts accept "-" (`ucd-purchase-to-bo-listing.spec.ts:115,117`). Type of Claim accepts any text ending in `(CAPS)` instead of the SRD 2.2.5 list.

## Medium

1. **TS07 does not check numbering.** It checks only that a cell starts with "1." and has 2 entries. The split regex `/\n?\d+\.\s*/` (`BoJomCheckReportListingPage.ts:157`) makes the line break optional and ignores the "2.". The same weakness affects TS28 and TS35.
2. **TS19 and TS20 do not check every column line by line.** Date of Loss is checked for count only, and in TS19 so is Type of Claim, although specific values were set.
3. **TS24 covers only the Total Loss direction.** Not tested: vehicle-level BER = Yes, and vehicle No with claim Yes. Without that reverse case, an OR-roll-up bug would pass.
4. **TS15 item 2 (advisory text) is only logged.** `NO_CLAIM_HISTORY_TEXT` exists but is unused. Step 3 buys a second transaction instead of downloading the first one's report.
5. **TS12 and TS20 item 2 ("-" for null ClaimsType) assume** that an empty eSim field sends null. That is unverified, and the row is ON HOLD (OQ-04).
6. **TS01, TS02 and TS03 never open the UCD Transaction Details page.** The workbook and SRD 2.2.3 #4 say to download the report there. The code downloads from the purchase page instead.
7. **TS04 is incomplete.** The report download from Transaction Details is not done; `#to-print-report` is only checked as visible. The "listing filters/columns unchanged" check is missing.
8. **TS36 buys an extra report** that the workbook steps do not list, using 1 of the 20 API reports per day. The Enquiry search and the Listing search take row 0 independently.
9. **TS30 and TS32 never set the vehicle-level flags.** Possible Total Loss/BER therefore come from whatever eSim state another tester left behind. This breaks the "set eSim before every run" rule.

## Cross-cutting

1. **Row 0 is taken to be this run's row.** Most specs check `getResultCount() > 0` and then read row 0. Only TS18 pins its row by Transaction No. This is still listed as an open assumption in flow-jomcheck §7e.
2. **`useDbReport` is never set.** eSim's "Simulator Details Only (No Default)" stays at its default. knowledge/esim.md warns that blank fields may then fall back to default data. Every blank-field case and every exact claim count depends on this (inference).
3. **The real v2.0 deprecated-field shape is never set.** No test uses ClaimType = "N/A", ApprovedParts = "N/A", Mileage = null.
4. **Severity band edges (SRD REQ-006) are never tested.** eSim has no amount or sum-insured input. That is correct, because eAuto passes the value through, but no TS says so.
5. **ON HOLD rows produce pass/fail evidence** on assumed expected values: TS06 (OQ-13), TS08–TS11 (OQ-01), TS12 and TS20 (OQ-04).

## Evidence and dashboard bugs (not TS logic)

1. **Export file names are broken.** `BoJomCheckReportListingPage.ts:205` uses `label.replace(/[^w.-]+/g, '_')`, with the backslash missing before `w`. Every export file name becomes mostly underscores. The files collide, and none attaches to its TS card. The run route matches cards on `TS(\d+)`.
2. **Some evidence lines never show.** `parseDetails` (`app/api/eauto-jomcheck/run/route.ts:260`) keeps only DETAIL lines that have a string `value`. The listing-vs-export DETAIL lines in TS30, TS32 and TS35 have no `value`, so they are dropped.
3. **Dashboard summaries contradict the workbook:**
   1. TS13 says "roll up to Yes when ANY claim is Yes". Field Reference says "eAuto does not compute the roll-up".
   2. TS16 says "no severity". The workbook says no sum insured.
   3. TS19 lists 3 columns. The workbook lists 5.
   4. TS44 says "Chatbot-driven". The workbook step is UCD.
4. **Old numbers are left in names and comments:**
   1. Default vehicle nos `vehicleNoFor('0023'/'0025'/'0026')` in TS30, TS32 and TS33.
   2. `ServicePortalJomCheckListingPage.ts:6` says "TS26-TS39". The new numbers are TS37–TS42.
   3. `prePushTransaction.ts:2` says "TS27-TS30".
   4. `ucd-purchase-flow-checks.spec.ts:263-265` says there is no chassis counter. One now exists (§7l).
5. **The renumbered workbook has a leftover old number.** Field Reference row 1 says "all 7 fields are checked in the API response (TS42)". It should be TS46.

## Not built — status

1. **Blocked on data or an open question:**
   1. TS05: no report saved before the push.
   2. TS27: no 1-claim pre-push transaction.
   3. TS31: no pre-push failed transaction (OQ-03).
   4. TS34: audit log page unknown (OQ-15).
   5. TS43–TS45: Wholesale screens not captured.
   6. TS49: production run, by design.
2. **Could be built with existing page objects:**
   1. TS39.
   2. TS40–TS42, counts only; order is OQ-07.
   3. TS47: two purchases with different eSim values.
   4. TS48: needs one capture of the filter-greying DOM.
   5. TS37 and TS38 also need Service Portal and superadmin credentials, and the confirmed login URL.
3. **Wrong reason on the dashboard:** TS44 is blocked by the lack of a known pre-push Wholesale transaction, not by the chatbot.

## Pre-push baseline risk

TS28, TS29, TS30 and TS35 all rest on one transaction, J690008380. Its "pre-push" status is inferred: the capture already shows the 29-column v2.0 layout. OQ-03 is still open. If that transaction turns out to be post-push data, all 4 checks lose their meaning.

## Fixes applied (2026-10-01, same day)

None of the fixes below has been run yet. They compile: `npx playwright test --list` lists all 34 tests, and `tsc` reports no errors.

1. **Export file names** (`BoJomCheckReportListingPage.ts:205`): `[^w.-]` changed to `[^\w.-]`.
2. **PDF Total Loss check** (`pdfCrosscheck.ts`): `BER:` and `ACTUAL:` now match whole words only. This affects TS02, TS25 and TS36.
3. **TS01 and TS03**: now assert the 5 fields. The 3 re-sourced columns must not be blank or "N/A". Possible Total Loss and Possible BER must be Yes or No.
4. **TS46**: the 3 columns must not be "N/A", and the 2 flags must be Yes or No.
5. **TS18**: Type of Claim must now be one of the exact SRD 2.2.5 descriptions, or "-". The list moved to `data/icapCodes.ts`, and TS21 now imports it from there.
6. **TS07**: each cell must be exactly 2 numbered lines, "1. …" then "2. …".
7. **TS19**: Type of Claim, Date of Loss and Severity are now checked line by line, with exact case.
8. **TS20**: Date of Loss is now checked line by line.
9. **TS26**: Severity is now an exact match, including case.
10. **TS30**: the vehicle-level flags are set to No and asserted. Type of Claim must be exactly "Own Damage (OD)".
11. **TS32**: the vehicle-level flags are set (Yes/No), and the listing values are tied to the eSim input.
12. **TS30, TS32 and TS35**: the DETAIL lines now include `value`, so the dashboard shows them.
13. **Comments**: old TS numbers corrected in 3 files, plus the stale chassis-counter comment.

**Watch on the first run:** the exact Date of Loss checks in TS19 and TS20 assume eAuto shows the typed eSim text ("01 Jan 2024") unchanged. That matches the captured listing format, but it has not been run yet.

**Not fixed, because each needs a decision:**
1. TS08–TS11 and TS16: how to test them when eSim takes only the band text.
2. TS24: adding the reverse flag cases.
3. TS30 item 1: what "match between transactions" means.
4. Identifying the row by Transaction No.
5. `useDbReport`.
6. TS18 accepting "-" for Odometer and Parts.
7. The dashboard summaries and `parseDetails` (the other terminal is editing that code).
8. The "TS42" text in the workbook (`_reference` is read-only).

## Round 2 (2026-10-01): Faizuddin's answers applied

1. **TS30 item 1 (answer 3):** the new JomCheck is bought on the same vehicle as the existing transaction (HXJ0001). The vehicle-detail columns must match; listing = export for both; there is one export for both rows.
2. **Row identity (answer 4):** every spec now finds its row by Transaction No., looked up from the purchase's transaction ID through the UCD listing.
   1. Covers TS01–TS04, TS06–TS26, TS30, TS32, TS33, TS18, TS25, TS36 and TS46.
   2. TS36's Enquiry is searched by Transaction No.
   3. TS04 opens UCD details from a search by Transaction No.
3. **eSim defaults (answer 5):** "Simulator Details Only (No Default)" is now set explicitly on every eSim run, and the snapshot/restore covers it. It is `Yes` for TS12, TS15 and TS20, `No` for the others.
4. **Workbook (answer 8):** the renumbered copy now has:
   1. TS30 steps, expected result and remarks updated.
   2. A No-Default note on TS12, TS15 and TS20.
   3. Field Reference "TS42" changed to "TS46".
   4. OQ-14 answered.
   5. Change Log rows #84–#89 added.
   The backup of the earlier version is in the session scratchpad only.

**Watch on the first run:**
1. Each purchase now opens the UCD Transaction Listing once to read its Transaction No.
2. With No Default = Yes, TS12, TS15 and TS20 send blank vehicle-detail fields. Confirm eAuto still completes the purchase.
3. TS30 assumes HXJ0001's vehicle details still come from the same eSim/default data as J690008380.
