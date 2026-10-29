# EAINT-12219 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12219- 🔴[eAuto-BackOffice] Replace sample of RHB Offer Letter with New Version for all Business Type in Application/EAINT-12219_Test_Scenarios_ eAuto - BO - Replace sample of RHB Offer Letter with New Version for all Business Type in Application.md` (text copy dated 27/10/2026, 6:46:39 pm). Cell text only; formatting, colours and images not available.
2. **Ticket folders:** `_reference/tickets/EAINT-12219/` held no files before this study. `_reference/tickets/Studying/EAINT-12219/` does not exist.
3. **lib/ticketStudies.ts:** no entry for EAINT-12219.
4. **knowledge/:** `flow-ucd-onboarding.md` (§ item 9 and 10, lines 424-446), `business-rules-from-test-scenarios.md` (§12 items 8-9), `teams-decisions-by-ticket.md` (line 193-194), `releases.md` (line 35), `cr-test-scenario-catalogue.md` (rows 037), `cr-ledger.md` (line 1011), `people-and-roles.md` (line 19).
5. **Not read:** the Jira ticket, the SRD and the evidence files. No live access in this unattended run.

## 1. Header

1. **Ticket:** EAINT-12219, "🔴[eAuto-BackOffice] Replace sample of RHB Offer Letter with New Version for all Business Type in Application" (Summary!R4).
2. **Type / priority:** "Enhancement / Medium" (Summary!R7).
3. **Portal / module:** "Potential UCD > Application" (Summary!R8); "Application Form > Sample Document in Email Template" (Summary!R9). The title tag says BackOffice; the sheet says UCD Application.
4. **Workbook:** `EAINT-12219_Test_Scenarios_ eAuto - BO - Replace sample of RHB Offer Letter with New Version for all Business Type in Application.xlsx`, library "eAuto - CR Test Scenarios", modified 16/10/2026, 5:04:51 pm.
5. **Sheets:** `Summary`, `Test Scenarios`.
6. **Scenarios:** "Total Test Scenarios | 6" (Summary!R13). Title row says "Test Scenarios (Reduced Scope)" (Summary!R1).
7. **Results (Status column):** **3 Pass** (TS-01, TS-02, TS-03), **3 Not Run** (TS-04, TS-05, TS-06).
8. **Testing scope:** "Manual" (Summary!R10).
9. **People / date:** Developer "Goh Kai Jiaeh" (Summary!R14); QA "Azila" (Summary!R15); Date "20 Aug 2026" (Summary!R16). The `Tested By` and `Tested Date` columns are empty on every row.
10. **Deployment:** same-day patch on 2026-08-20 per `knowledge/teams-decisions-by-ticket.md:194` and `knowledge/releases.md:35`.

## 2. What the ticket changed (as the TS shows it)

1. The **RHB Offer Letter sample PDF** attached to the onboarding email is replaced with a **new version**, per business type.
2. **New signatory:** "The document is signed by MUHAMAD YAZRI BIN YAAKUP" (Summary!R29, V2).
3. **Old signatory removed:** "The old signatory ZURI AZWAN JAAPAR does NOT appear anywhere in the document" (Summary!R31, V4).
4. **Checklist section** must be present: "The CHECKLIST SECTION is present and fully legible (not cut off, not blank)" (Summary!R30, V3).
5. **Two files** cover five business types (Summary!R20-R24):
   1. Sdn Bhd / ROC → "S1.1 RHB Sdn Bhd OL with BOD Reso Reflex Cash Management Application.pdf"
   2. ROB, LLP, Business Trading (Sabah), Business Trading (Sarawak) → "S1.1 RHB Enterprise OL with Checklist.pdf"
6. **Scope:** "New Transaction only (Existing Transaction EXCLUDED)" (Summary!R11).

## 3. Scenarios

### A. Per business type (Functional, High)

Every row uses the same steps: create pre-application → "Pre-Application Status = APPROVED" → UCD submits via Application Link → Assignee "Submit for Approval" → Approver "Approved" → open Mailtrap email → apply V1-V4. Shared expected lines: "Application reaches status Approved without error." / "Email is received in Mailtrap for this application." / "PDF opens without error." / V1-V4 PASS.

1. **TS-01** — Sdn Bhd / ROC. Expected "Sample document = S1.1 RHB Sdn Bhd OL with BOD Reso Reflex Cash Management Application.pdf" (Test Scenarios!R2). **Pass**.
2. **TS-02** — ROB. Expected "Sample document = S1.1 RHB Enterprise OL with Checklist.pdf" (Test Scenarios!R3). **Pass**.
3. **TS-03** — LLP. Expected "Sample document = S1.1 RHB Enterprise OL with Checklist.pdf" (Test Scenarios!R4). **Pass**.
4. **TS-04** — Business Trading (Sabah). Expected "Sample document = S1.1 RHB Enterprise OL with Checklist.pdf" (Test Scenarios!R5). **Not Run**.
5. **TS-05** — Business Trading (Sarawak). Expected "Sample document = S1.1 RHB Enterprise OL with Checklist.pdf" (Test Scenarios!R6). **Not Run**.

### B. Template regression (Regression, High)

1. **TS-06** — "Verify the shared onboarding email template is not impacted by the document replacement". Expected "Email subject, body copy and footer are UNCHANGED." / "All OTHER sample documents in the template still resolve and open correctly, and are UNCHANGED." / "Document sequence numbering (S1.1, S1.2, ...) is not broken by the replacement." (Test Scenarios!R7). **Not Run**.

## 4. Business rules and system behaviour

1. **Trigger point:** the email with the sample is checked after "Approver proceeds to Approved" on the Application (Test Scenarios!R2, step 4). The email is reached through Mailtrap: "Verification Point | Mailtrap — onboarding email > sample document" (Summary!R12).
2. **Mapping by business type:** only Sdn Bhd / ROC gets the "BOD Reso Reflex Cash Management Application" file; all four other types share "S1.1 RHB Enterprise OL with Checklist.pdf" (Summary!R20-R24).
3. **Signatory change:** "MUHAMAD YAZRI BIN YAAKUP" replaces "ZURI AZWAN JAAPAR" (Summary!R29, R31).
4. **Same email holds other samples:** TS-06 step 4 says "Check EVERY OTHER sample document listed in the same email" (Test Scenarios!R7). The email carries a numbered set "S1.1, S1.2, ..." of sample documents.
5. **Existing transactions not tested:** "Existing Transaction EXCLUDED" (Summary!R11). Whether already-approved applications re-receive anything is not stated.
6. **Contradiction with later CR [unconfirmed]:** `knowledge/flow-ucd-onboarding.md:437-439` (from EAINT-12341, deployed 2026-10-07) records "The existing approved application email carrying the 3 RHB documents (Offer Letter, Direct Debit Application form, Board of Resolution) is no longer sent". If that is the same email this TS checks, the EAINT-12219 Offer Letter sample may no longer reach the UCD after 2026-10-07. Not verified.

## 5. Test data, environments, accounts, setup

1. **Environment:** not named in the sheet. Teams says "any staging" (`knowledge/teams-decisions-by-ticket.md:194`).
2. **Mailbox:** Mailtrap (Summary!R12).
3. **Roles used:** UCD (submits Application), Assignee (Submit for Approval), Approver (Approved) (Test Scenarios!R2).
4. **Data:** one new pre-application per business type, processed to APPROVED. No company names, BRNs or application numbers are recorded.
5. **Credentials:** none in the sheet.
6. **Evidence column:** empty in the text copy (images, if any, not kept).

## 6. Gaps and risks for regression

1. **Business Trading (Sabah) and (Sarawak) never run** (TS-04, TS-05 Not Run). These are the cheapest types to create (no eSIM needed, `knowledge/flow-ucd-onboarding.md:84`).
2. **Template regression never run** (TS-06 Not Run). Other S1.x samples, subject and footer were not compared.
3. **No tester or date per row.** Who ran the three passes is not recorded.
4. **Possible superseded email [unconfirmed]:** check whether EAINT-12341 removed the email that carried this sample (see §4 item 6). If so, regression for 12219 should target wherever the Offer Letter now lives, or be retired.
5. **Existing transactions excluded:** no check that pending/older applications approved after deploy get the new file.
6. **Title vs sheet portal mismatch:** title says "[eAuto-BackOffice]", sheet says "Potential UCD > Application". The file is presumably stored in BO email-template config [unconfirmed].

## Knowledge candidates

1. **Full business-type mapping (adds LLP and Business Trading rows missing from knowledge):** ROB, LLP, Business Trading (Sabah), Business Trading (Sarawak) all get "S1.1 RHB Enterprise OL with Checklist.pdf"; Sdn Bhd / ROC gets "S1.1 RHB Sdn Bhd OL with BOD Reso Reflex Cash Management Application.pdf". Source: SharePoint TS EAINT-12219, sheet Summary, rows 20-24. Target: `knowledge/flow-ucd-onboarding.md` item 10 and `knowledge/business-rules-from-test-scenarios.md` §12 item 9 (both list Sdn Bhd and ROB only).
2. **RHB Offer Letter signatory:** new "MUHAMAD YAZRI BIN YAAKUP"; old "ZURI AZWAN JAAPAR" must not appear. Source: sheet Summary, rows 29 and 31.
3. **Checklist section required** in the new Offer Letter: "present and fully legible (not cut off, not blank)". Source: sheet Summary, row 30.
4. **Scope note:** "New Transaction only (Existing Transaction EXCLUDED)". Source: sheet Summary, row 11.
5. **Execution status:** TS-01 to TS-03 Pass; TS-04, TS-05, TS-06 Not Run. Source: sheet Test Scenarios, rows 2-7, Status column. Target: `knowledge/cr-test-scenario-catalogue.md` row 037.
6. **Open question to verify [unconfirmed]:** whether EAINT-12341 (2026-10-07) removed the approved-application email that carried this Offer Letter sample. Source: `knowledge/flow-ucd-onboarding.md:437-439` vs this TS Summary!R12.
