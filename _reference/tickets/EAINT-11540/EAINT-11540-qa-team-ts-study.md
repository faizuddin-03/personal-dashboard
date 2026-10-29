# EAINT-11540 — QA Team test script study (2026-10-27)

Written unattended by the SharePoint Scribe. Read-only study; nothing in `knowledge/` was changed.

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-11540 - [eAuto-UCD] Add NRIC 12-digit validation to Get Free Quote.md` (captured 27/10/2026, 8:08:03 pm). Cell text only; formatting and images not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-11540/EAINT-11540-jira.md` (27/10/2026, 5:26:54 pm).
3. **Knowledge:** `knowledge/teams-decisions-by-ticket.md` (EAINT-11540 section), `knowledge/cr-test-scenario-catalogue.md` row 015, `knowledge/business-rules-from-test-scenarios.md` §6.3, `knowledge/eauto-insurance.md`, `knowledge/flow-quotation-reminder.md` §5c, `knowledge/releases.md`, `knowledge/environments-history.md`, `knowledge/cr-ledger.md`.
4. **`lib/ticketStudies.ts`:** no EAINT-11540 entry.
5. **Not read:** the SRD. The Jira capture lists `EAINT11540_SRD_V1.1_20260805.docx` / `.pdf` as attachments, but no local copy exists in `_reference/tickets/EAINT-11540/` or `_reference/tickets/Studying/EAINT-11540/`. SRD section 2.2.4 wording is therefore not quoted here.
6. **Not read:** the two Figma mockups linked in the Jira description.

## 1. Header

1. **Ticket:** EAINT-11540 — "⚪[eAuto-UCD] Add NRIC 12-digit validation to Get Free Quote" (Jira, Summary).
2. **Type / status:** "Task · **Status:** Done · **Priority:** Medium" (Jira capture, line 6).
3. **Module / portal:** **UCD Portal → Insurance → Get A Free Quote** form.
4. **Workbook:** "EAINT-11540 - [eAuto-UCD] Add NRIC 12-digit validation to Get Free Quote.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 10/08/2026, 2:13:14 pm.
5. **Sheets:** one — **Sheet1**.
6. **Scenarios:** **13** (11540_TS_01 to 11540_TS_13, rows R4–R16).
7. **Results:** **13 Pass, 0 Fail** (column "Pass/Fail", R4–R16).
8. **Tester:** "Maisarah" in column "QA" on every row. The catalogue lists the last **editor** as a different person (`cr-test-scenario-catalogue.md` row 015); that is the file editor, not the tester.
9. **Dates in the sheet:** none. From Jira: "ETA for Testing (cf 10057): 2026-08-05", "Exp. Deploy Date (cf 10087): 2026-08-07", fix version "S32.3-20260807🌞 (2026-08-07)".
10. **Deployed:** Jira comment, 2026-08-07T12:50 — "We have deployed this ticket to prod on 7 August 2026 (Fri)."

## 2. What the ticket changed (as the TS shows it)

1. The **IC Number** field on Get A Free Quote (Individual) now enforces **exactly 12 digits**.
2. It **blocks non-digits as typed** and **caps input at 12 digits**.
3. It checks the **month and day** parts of the IC and rejects impossible values with "Invalid IC Number".
4. The **Company Reg. Number** path is unchanged; TS_09–TS_13 are regression only (Sheet1, R23: "Regression for company flow - existing behaviour still working (mandatory, allow 12 alphanumeric, allow special characters)").
5. Jira history confirms the month/day check came late: SRD "V1.1 | - Added IC Number format validation (month & day) requirement in section 2.2.4" dated "05.08.2026 (Wed)" (Jira description, revision table row 4).

## 3. Scenarios

### A. Individual — IC Number (new behaviour)

1. **11540_TS_01** — IC left blank → "Field background turns red with error message "This field is required"".
2. **11540_TS_02** — 11 digits (`03021714100`) → "Field background turns red with error message "IC number should be made up of 12 numerical characters"".
3. **11540_TS_03** — exactly 12 digits (`030217141005`) → "Able to proceed with insurance quotation generation".
4. **11540_TS_04** — 13 digits (`0302171410055`) → "Field will only accept up to 12 digits. Unable to input more than 12 digits".
5. **11540_TS_05** — invalid month (`039917141005`, month 99) → "Will show error message "Invalid IC Number"".
6. **11540_TS_06** — invalid day (`030299141005`, day 99) → "Will show error message "Invalid IC Number"".
7. **11540_TS_07** — letters / specials only (`abcd!@#$`) → "Characters are auto-cleared as typed".
8. **11540_TS_08** — mixed (`03ag02io!@`) → "Alphabetic characters are auto-cleared, leaving only numeric digits".

### B. Company — Company Reg. Number (regression)

1. **11540_TS_09** — blank → "Will show error message "This field is required."".
2. **11540_TS_10** — 12 characters (`202343558199`) → "Able to proceed with Company - Get A Free Quote".
3. **11540_TS_11** — 13 characters (`2022455722033`) → "Able to proceed with Company - Get A Free Quote".
4. **11540_TS_12** — specials (`043-!#@sdas`) → "Able to input special characters".
5. **11540_TS_13** — lower-case (`asdfqwer`) → "The letters will automatically be capitalized".

## 4. Business rules and system behaviour

1. **Empty IC:** "Field background turns red with error message "This field is required"" (Sheet1, R4).
2. **Short IC:** "IC number should be made up of 12 numerical characters" (Sheet1, R5).
3. **Max length:** "Field will only accept up to 12 digits. Unable to input more than 12 digits" (Sheet1, R7). The field blocks input; it does not show an error.
4. **Month/day check:** "Will show error message "Invalid IC Number"" (Sheet1, R8 month, R9 day).
5. **Scope of the date check:** Teams decision — "We'll follow Secarang's behavior, validate month and day only. Error wording: Invalid IC Number" (`knowledge/teams-decisions-by-ticket.md`, from Teams EAINT-11540, 2026-08-05 10:49, BA). This answers the sheet's open note: "Double check the scope for the invalid 12 digits only, or invalid IC also" / "To Clarify with BA" (Sheet1, R22).
6. **Non-digits:** "Characters are auto-cleared as typed" (Sheet1, R10); tester remark: "To include special characters also - should have the same expected results" (Sheet1, R10, Remarks).
7. **Mixed input:** "Alphabetic characters are auto-cleared, leaving only numeric digits" (Sheet1, R11).
8. **Company Reg. Number is not limited to 12:** TS_11 with 13 characters → "Able to proceed with Company - Get A Free Quote" (Sheet1, R14).
9. **Company Reg. Number accepts specials and upper-cases letters:** "Able to input special characters" (Sheet1, R15); "The letters will automatically be capitalized" (Sheet1, R16).
10. **Before this ticket** eAuto had no IC validation: "eAuto had no IC validation before this ticket. It now follows Secarang and validates the month and day only." (`knowledge/teams-decisions-by-ticket.md`, EAINT-11540 item 1).
11. **Same input, two modes** [unconfirmed]: automation uses one locator `#buyerRefIdCompanyROC` for "IC / ROC" (`knowledge/flow-quotation-reminder.md` §5c). The IC and Company Reg. Number rules likely live on the same input and switch with the Individual/Company choice.

## 5. Test data, environments, accounts, setup

1. **IC values:** `03021714100` (11), `030217141005` (valid 12), `0302171410055` (13), `039917141005` (bad month), `030299141005` (bad day), `abcd!@#$`, `03ag02io!@` (Sheet1, R5–R11, column "Example").
2. **Company Reg. Number values:** blank, `202343558199`, `2022455722033`, `043-!#@sdas`, `asdfqwer` (Sheet1, R12–R16).
3. **Environment:** not named in the sheet. Teams/knowledge: 7 Aug deployment items including 11540 tested on "uat4 (+ Secarang /ia)" from 2026-08-05 (`knowledge/environments-history.md`, line 57).
4. **Accounts:** none named. **No credentials present** in the sheet.
5. **Setup:** "Fill other mandatory fields" (every IC row) — vehicle number and other fields not specified.

## 6. Gaps and risks for regression

1. **Date edge cases untested:** day 31 in a 30-day month, 29/30 Feb, leap years, month `00`, day `00`. TS uses only 99 for month and day.
2. **Error clearing:** no row checks the red background and message clear once the IC is corrected.
3. **Paste:** no row pastes a 13-digit or mixed value; "auto-cleared as typed" may not cover paste [unconfirmed].
4. **Switching mode:** no row switches Individual ↔ Company after typing; the shared input [unconfirmed] could carry the 12-digit cap into Company or the reverse.
5. **Place-of-birth digits (positions 7–8):** not validated per the Teams decision; a regression should not expect an error there.
6. **Other entry points:** the eSTM banner route skips the Get Free Quote form (`knowledge/flow-estm.md` line 838). No row covers whether IC is validated anywhere else in insurance.
7. **Secarang parity:** rule is "follow Secarang's behavior", but no row compares the two portals.
8. **Sheet quality:** TS_07 step says "abcdefghijkl" while Example is `abcd!@#$`; TS_11 step 3 reads "Input 13 characters in" with the field name missing; TS_10 says "12 alphanumeric" but uses digits only; TS_08 expected mentions only alphabetic clearing although input includes `!@`.
9. **Rows R17–R21 empty** — no hidden scenarios; R22–R23 are notes.

## 7. Contradictions / changes against knowledge/

1. **No contradiction.** `business-rules-from-test-scenarios.md` §6.3 item 1 matches this TS.
2. **Minor citation drift:** §6.3 cites Company Reg. No as "rows 12-16"; the catalogue row 015 cites "Sheet1!R13-R16". The blank-field rule is R12, so 12–16 is correct.
3. **Gap:** `knowledge/eauto-insurance.md` "Quotation inputs and price re-check" lists Chubb TIN and price re-check but not the IC validation rule.
4. **Gap:** no `flow-*` file documents the Get Free Quote form's validation messages; `flow-quotation-reminder.md` §5c lists the locators only.

## Knowledge candidates

1. **`knowledge/eauto-insurance.md` — Quotation inputs:** add "Get Free Quote IC (EAINT-11540, prod 2026-08-07): blank "This field is required"; under 12 digits "IC number should be made up of 12 numerical characters"; bad month or day "Invalid IC Number"; non-digits cleared as typed; input capped at 12." Source: SharePoint TS EAINT-11540, Sheet1, R4–R11; Jira comment 2026-08-07T12:50.
2. **Same file:** "Company Reg. Number on Get Free Quote: mandatory, more than 12 characters accepted, special characters accepted, letters auto-capitalised." Source: Sheet1, R12–R16.
3. **`knowledge/flow-quotation-reminder.md` §5c or a Get Free Quote flow file:** note that IC validation fires on "Show My Result" (`#to-show-result`), so automation must use a valid 12-digit IC with a real month/day. Source: Sheet1, R4–R9 steps "Click "Show My Result"". [unconfirmed that `#buyerRefIdCompanyROC` is the validated field.]
4. **`knowledge/teams-decisions-by-ticket.md` EAINT-11540:** add that the SRD V1.1 (05.08.2026) added the month/day check in "section 2.2.4". Source: Jira description, revision table row 4.
