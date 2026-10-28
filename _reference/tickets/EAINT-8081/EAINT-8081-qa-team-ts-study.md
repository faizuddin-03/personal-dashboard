# EAINT-8081 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8081 - [eAuto - UCD] To update Hotline to 03-27798899.md` (text dated "28/10/2026, 10:16:46 am"). The copy says: "Cell text only, row by row; formatting and images are not kept."
2. **Original workbook:** "EAINT-8081 - [eAuto - UCD] To update Hotline to 03-27798899.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 23/07/2025, 9:07:51 am. Not opened directly; the text copy was used.
3. **Ticket folders:** `_reference/tickets/EAINT-8081/` and `_reference/tickets/Studying/EAINT-8081/` held no earlier files.
4. **lib/ticketStudies.ts:** no entry for 8081.
5. **knowledge/:** `cr-test-scenario-catalogue.md` rows 058 and 410, `flow-company-profile-einvoice.md` line 77, `business-rules-from-test-scenarios.md` §16, `flow-ucd-shell.md`, `flow-ucd-to-ucd.md` line 94.
6. **Related study:** `_reference/tickets/EAINT-8620/EAINT-8620-qa-team-ts-study.md` (the later, wider hotline roll-out).
7. **Not read:** Jira ticket, SRD, Teams. Scheduled unattended study; no connector calls made.
8. **Cannot be read:** the **Before** and **After** columns. They are empty in the text copy (staging-preprod1) or show formula errors (prod). The expected values were most likely **screenshots**, which the text copy drops [unconfirmed].

## 1. Header

1. **Ticket:** EAINT-8081, title "🔴[eAuto-UCD] To update Hotline to 03-27798899" `[both sheets, R2]`.
2. **Portal:** **UCD** only (Main UCD and Sub UCD roles).
3. **Workbook:** "EAINT-8081 - [eAuto - UCD] To update Hotline to 03-27798899.xlsx".
4. **Sheets (2):**
   a. "staging-preprod1": "Test environment: staging/preprod1" `[R4]`.
   b. "prod": "Test environment: prod" `[R4]`.
5. **Columns:** "TS No | UCD Role | Browser | Affected Page | Before | After | Test Result" `[both sheets, R6]`.
6. **Scenarios per sheet:** 16 rows (R7-R22), **14 distinct TS ids**.
   a. Main UCD: 8081_MAIN_TS1 to TS8 (8 ids).
   b. Sub UCD: 8081_SUB_TS1 to TS6 (6 ids).
   c. R8 has no TS id (login page "With announcement message" under MAIN_TS1).
   d. R16 repeats the id "8081_MAIN_TS8" (login page with announcement message, Sub UCD).
7. **Total:** 28 distinct scenario ids across both sheets (32 result rows). Matches the catalogue count of 28 `[cr-test-scenario-catalogue.md row 058]`.
8. **Results:** every row "PASS" on both sheets. **32 PASS, 0 Fail, 0 N/A.**
9. **Tester:** not written in the sheet. The catalogue names one QA engineer `[cr-test-scenario-catalogue.md row 058]`.
10. **Dates:** none in the sheet. Workbook modified 23/07/2025.

## 2. What the ticket changed, as the TS shows it

1. The UCD **hotline number** was changed to **03-27798899** on seven UCD pages (list in §3).
2. The **login page** has a second check "- With announcement message" `[staging-preprod1, R8 and R16, After column]`. This points to a login announcement about the new number [unconfirmed].
3. The later EAINT-8620 TS removed a login notice: "Our new hotline number is 03-27798899. The old number 1700-816-186 will be discontinued effective August 2025" `[EAINT-8620 study, §2 item 2, sheet EAINT-8620 R4]`. So 8081 most likely **added** that notice and 8620 **removed** it [unconfirmed].
4. The old number is not written in this workbook. From EAINT-8620 it was **1700-816-186** `[EAINT-8620 study, §2 item 1]`.

## 3. Scenarios

### a. Main UCD — Firefox v36 (same on both sheets)

1. **8081_MAIN_TS1** — Login page. Expected: new hotline (Before/After not readable). PASS.
2. **(R8, no id)** — Login page, "- With announcement message". PASS.
3. **8081_MAIN_TS2** — UCD Homepage. PASS.
4. **8081_MAIN_TS3** — Contact Us page. PASS.
5. **8081_MAIN_TS4** — Contact Us footer. PASS.
6. **8081_MAIN_TS5** — STMS Module dashboard page. PASS.
7. **8081_MAIN_TS6** — eSTM Module dashboard page. PASS.
8. **8081_MAIN_TS7** — Homepage - Change Address Popup. PASS.

### b. Sub UCD — Chrome (same on both sheets)

1. **8081_MAIN_TS8** — Login page, role "Sub UCD", browser "Chrome" `[R15]`. PASS. Id says MAIN but role is Sub.
2. **8081_MAIN_TS8 (repeat)** — Login page, "- With announcement message" `[R16]`. PASS.
3. **8081_SUB_TS1** — UCD Homepage. PASS.
4. **8081_SUB_TS2** — Contact Us page. PASS.
5. **8081_SUB_TS3** — Contact Us footer. PASS.
6. **8081_SUB_TS4** — STMS Module dashboard page. PASS.
7. **8081_SUB_TS5** — eSTM Module dashboard page. PASS.
8. **8081_SUB_TS6** — Homepage - Change Address Popup. PASS.

## 4. Business rules and system behaviour

1. **New hotline value:** "To update Hotline to 03-27798899" `[both sheets, R2]`.
2. **Pages that show the hotline in UCD** (as listed in "Affected Page"): "Login page", "UCD Homepage", "Contact Us page", "Contact Us footer", "STMS Module dashboard page", "eSTM Module dashboard page", "Homepage - Change Address Popup" `[staging-preprod1, R7-R14]`.
3. **Same pages for Main and Sub UCD.** The Sub UCD rows repeat the Main list one for one `[staging-preprod1, R15-R22]`. No page is role-specific in this TS.
4. **Login announcement:** "- With announcement message" `[staging-preprod1, R8 and R16, After column]`. Text of the message is not in the copy.
5. **Browser split:** Main UCD on "Firefox v36", Sub UCD on "Chrome" `[staging-preprod1, R7 and R15]`. Firefox v36 is likely the eAuto FF36 build for thumbprint pages [unconfirmed].
6. **Prod sheet After column is broken:** every row shows "{"error":"#VALUE!"}" `[prod, R7-R22, After column]`. The prod results still say "PASS".

### Notes against knowledge/

1. **flow-company-profile-einvoice.md line 77** files EAINT-8081 under the Company Profile flow: "Hotline number text on pages including Change Address popup". The ticket is **UCD-wide** (login, homepage, Contact Us, STMS, eSTM). Only the Change Address popup ties it to that flow.
2. **cr-test-scenario-catalogue.md row 058** says environments "staging, preprod1". The workbook also has a **prod** sheet `[prod, R4]`: "Test environment: prod".
3. **flow-ucd-to-ucd.md line 94** says "The STMS landing shows [hotline number omitted]. Possible stale text." 8081 checked the "STMS Module dashboard page" and passed in July 2025. If the STMS landing now shows a different number, it is a later change or a regression [unconfirmed].
4. **business-rules-from-test-scenarios.md §16** cites only EAINT-8620 for the hotline. EAINT-8081 is the **earlier** source of the same number.
5. **flow-ucd-shell.md** documents `#contact-link` (CONTACT US) and the footer `[line 198, 224]`, but has no hotline text. Nothing contradicts.

## 5. Test data, environments, accounts, setup

1. **Environments:** staging, preprod1 (one combined sheet) and prod `[R4 on each sheet]`.
2. **Accounts:** one Main UCD and one Sub UCD login. No company or user names in the sheet.
3. **Credentials:** none present in the sheet.
4. **Browsers:** Firefox v36 (Main UCD), Chrome (Sub UCD).
5. **Data setup:** none needed; display-only checks. The Change Address popup needs a homepage state that opens it [unconfirmed].

## 6. Gaps and risks for regression

1. **Expected results are not readable as text.** Before/After are empty or "#VALUE!". A regression cannot tell the exact label or format (e.g. "Hotline: 03-27798899") from this workbook. Use the EAINT-8620 wording instead.
2. **Prod evidence is broken.** The prod After column holds "#VALUE!" errors, so the PASS results have no visible proof in the text copy.
3. **Mis-numbered row:** "8081_MAIN_TS8" is a Sub UCD row, and is used twice `[R15, R16]`. Cross-references to TS8 are ambiguous.
4. **Browser coverage is crossed, not full.** Main UCD only on Firefox, Sub UCD only on Chrome.
5. **Not covered here** (later found in EAINT-8620): BackOffice login and Contact Us, homepage "Need Help?", SSM error popups, eSerahan error, Step 5 RE countdown banner, Privacy and T&C, Hak Milik PDF footer, failed eLKM message `[EAINT-8620 study, §3]`.
6. **Not covered anywhere in these two TS:** emails, eDereg, eMOVE, Service Hub, ePreCheck messages. Other knowledge files show these use 03-27798899 from later tickets.
7. **Old-number sweep:** a text search for "1700-816-186", "1700816186" and "1 700 816 186" on UCD and BO pages is the safer regression check [unconfirmed].
8. **Login announcement** was later removed (EAINT-8620). A regression should expect **no** old-number notice on the login page.

## Knowledge candidates

1. **EAINT-8081 is the first hotline change (UCD only, July 2025);** EAINT-8620 is the wider follow-up (UCD + BO, documents). Source: `[from SharePoint TS EAINT-8081, both sheets, R2-R22]`, workbook modified 23/07/2025. Target: `business-rules-from-test-scenarios.md` §16.
2. **UCD pages carrying the hotline:** "Login page", "UCD Homepage", "Contact Us page", "Contact Us footer", "STMS Module dashboard page", "eSTM Module dashboard page", "Homepage - Change Address Popup". Source: `[from SharePoint TS EAINT-8081, sheet staging-preprod1, R7-R14]`. Target: `flow-ucd-shell.md`.
3. **Catalogue row 058 environments** should read "staging, preprod1, prod". Source: `[sheet prod, R4]` "Test environment: prod".
4. **flow-company-profile-einvoice.md line 77:** EAINT-8081 is a UCD-wide hotline change, not a Company Profile change; consider moving it to `flow-ucd-shell.md` ticket history. Source: "Affected Page" column `[sheet staging-preprod1, R7-R22]`.
5. **flow-ucd-to-ucd.md line 94** ("Possible stale text" on the STMS landing): EAINT-8081 passed the "STMS Module dashboard page" check in July 2025 `[sheet staging-preprod1, R12]`. Re-check live which number shows there now [unconfirmed].
