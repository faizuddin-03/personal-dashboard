# EAINT-9209 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-9209 - [eAuto-Insurance] To Blast WhatsApp message to Used Car dealer by 21.11.2025.md` (generated 28/10/2026, 9:41:41 am). It holds "Cell text only, row by row; formatting and images are not kept." Colours, comments and screenshots were not available.
2. **knowledge/cr-test-scenario-catalogue.md** rows 108 and 446 — the only prior mention of EAINT-9209 in `knowledge/`.
3. **knowledge/README.md** — module index, checked for UCD / insurance / WhatsApp context.
4. **Not found:** `_reference/tickets/EAINT-9209/` (empty before this study), `_reference/tickets/Studying/EAINT-9209/`, any entry in `lib/ticketStudies.ts`. No SRD, Jira text or Teams discussion was available. Everything about intent below is read from the TS alone.

## 1. Header

1. **Ticket:** EAINT-9209 — "[eAuto-Insurance] To Blast WhatsApp message to Used Car dealer by 21.11.2025".
2. **Module / portal:** eAuto Insurance, one-off WhatsApp blast to **UCD** (Used Car Dealer) companies. No portal page is tested; the check is whether the dealer's WhatsApp receives the right message template.
3. **Workbook:** "EAINT-9209 - [eAuto-Insurance] To Blast WhatsApp message to Used Car dealer by 21.11.2025.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 21/11/2025, 11:05:18 am.
4. **Sheets (2):**
   1. "UCD Criterias" — 6 scenarios (R2–R7).
   2. "9209_TS3" — one note, no scenarios.
5. **Scenarios:** 6 (9209_TS1 – 9209_TS6).
6. **Results:** no Pass/Fail column. An unlabelled column holds **5 × "✅"** (TS1, TS2, TS4, TS5, TS6) and **1 × "No message received"** (TS3). TS3's expected result is "-", so "No message received" matches it [unconfirmed: read as a pass].
7. **Tester / dates:** none written in the sheet. The catalogue lists the owner as "Nabila Syafiqah Binti Mohd Hanafi" with date "2025-11-21" (`knowledge/cr-test-scenario-catalogue.md` row 108); that name also appears in the sheet as a test company director.

## 2. What the ticket changed, as the TS shows it

1. A **one-off WhatsApp blast** to UCD companies, due by **21.11.2025** (ticket title).
2. Each UCD is sorted into one of two message templates — "Active UCD" or "New Registered UCD" — or gets **no message**. A UCD matching both groups gets **both messages**.
3. The sorting uses four inputs, taken from the column headers ("UCD Criterias" R1):
   1. "Newly registered this year? ⏎ (2025)"
   2. "eSTM Permission"
   3. "Successful Transaction (eSTM)"
   4. "Successful Transaction (Insurance)"
4. The blast targets the **company's director**; the "Director's Name" column is filled for every row [unconfirmed: message goes to the director's phone number].

## 3. Scenarios

Columns: newly registered 2025 / eSTM permission / successful eSTM txn / successful insurance txn → expected template. All from sheet "UCD Criterias".

**A. Existing UCDs (not newly registered in 2025)**

1. **9209_TS1** (R2) — No / Yes / Yes / Yes → **"Active UCD"**. Result "✅".
2. **9209_TS2** (R3) — No / Yes / Yes / No → **"Active UCD"**. Result "✅"; extra cell "Aishah" under "Retest Template".
3. **9209_TS3** (R4) — No / Yes / No / No → expected **"-"** (no message). Result "No message received".

**B. Newly registered UCDs (2025)**

4. **9209_TS4** (R5) — Yes / Yes / No / No → **"New Registered UCD"**. Result "✅"; extra cell "Yi Link" under "Retest Template".
5. **9209_TS5** (R6) — Yes / Yes / Yes / Yes → **"1. Active UCD ⏎ 2. New Registered UCD"**. Result "✅".
6. **9209_TS6** (R7) — Yes / Yes / Yes / No → **"1. Active UCD ⏎ 2. New Registered UCD"**. Result "✅".

## 4. Business rules and system behaviour the TS reveals

1. **Active UCD needs a successful eSTM transaction; insurance is not required.** TS2 has "Successful Transaction (Insurance)" = "No" and still expects "Active UCD" ("UCD Criterias" R3).
2. **No transactions + not new = no message.** TS3 expected result is "-" ("UCD Criterias" R4).
3. **The Dev confirmed TS3's company was excluded from both lists:** "From Dev's query, this Company ID is not listed in both Active UCD & New Registered UCD" (sheet "9209_TS3", R1). The recipient list was built by a **developer query**, not by a screen in the portal [unconfirmed: one-off data pull].
4. **New Registered UCD does not need any transaction.** TS4 has both transaction columns "No" and expects "New Registered UCD" ("UCD Criterias" R5).
5. **A UCD can get two messages.** TS5 and TS6 expect "1. Active UCD ⏎ 2. New Registered UCD" ("UCD Criterias" R6, R7). The template groups overlap; they are not exclusive.
6. **"Newly registered" means registered in 2025** — header "Newly registered this year?  ⏎ (2025)" ("UCD Criterias" R1).
7. **Special characters in company names were included.** "AUTOCORE 123 & CAR (M) SDN. BHD. ' < >" (R2) and "NH 21 CYCLE & CARRIAGE (M') <> LLP." (R6) [unconfirmed: chosen to test that `&`, `'`, `<`, `>` render correctly in the WhatsApp text]. Both passed ("✅").
8. **A retest happened for at least two templates.** Two columns are headed "Retest Template" (R1); names appear for TS2 ("Aishah") and TS4 ("Yi Link") [unconfirmed: who received or checked the retest message].

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet [unconfirmed].
2. **Test companies** (Company ID / ROC / name), "UCD Criterias":
   1. TS1 — "1149366" / "123789-D" / "AUTOCORE 123 & CAR (M) SDN. BHD. ' < >", director "NICHOLAS LIM KIN WENG".
   2. TS2 — "1110038" / "20000210-K" / "CHAR MAIN BHD", director "CHARMAIN EA CHIANG".
   3. TS3 — "1109690" / "7854366-A" / "NH ROYALE AUTOMOTIVE BHD.".
   4. TS4 — "1051119" / "980805-D" / "NH PREMIUM MOTORS".
   5. TS5 — "1109633" / "18148-K" / "NH 21 CYCLE & CARRIAGE (M') <> LLP.".
   6. TS6 — "1080442" / "210699-E" / "NH CAR COMPANY".
   7. Directors for TS3–TS6: "NABILA SYAFIQAH BINTI MOHD HANAFI".
3. **"Remarks" column** holds "nlim3", "ucdcharr", "nhroyale" (TS1–TS3) [unconfirmed: UCD login IDs]. **No passwords** in the sheet.
4. **Unlabelled column after Remarks** holds "nick", "charmain", "ty", "nadh", "nabila", "azfar" [unconfirmed: team member whose WhatsApp number was set as the director's phone, i.e. who received the message].
5. **Setup implied:** each test company was given a team member's WhatsApp number so the blast could be seen [unconfirmed].

## 6. Gaps or risks a regression should still cover

1. **eSTM Permission = "No" is never tested.** Every row is "Yes", so its effect on the lists is unknown.
2. **Insurance-only transaction is never tested** (eSTM "No", Insurance "Yes"). Whether that counts as "Active UCD" is unknown.
3. **Newly registered + insurance only** (Yes / Yes / No / Yes) is not tested.
4. **No case for a UCD registered before 2025 with no eSTM permission**, or for inactive / suspended / terminated accounts.
5. **No check of message content** is recorded — only "✅". Template wording, placeholders (company name, director name) and the special-character rendering are not quoted anywhere.
6. **No duplicate-send check** beyond the expected two messages for TS5/TS6 (e.g. one director linked to several companies — TS3–TS6 share a director name).
7. **One-off blast:** if the same lists are reused for a later blast, the "this year (2025)" rule needs a new year boundary [unconfirmed].

## Knowledge candidates

1. **EAINT-9209 WhatsApp blast grouping (2025-11):** "Active UCD" = successful eSTM transaction (insurance not required); "New Registered UCD" = registered in 2025, no transaction needed; a UCD in both groups gets both messages; no transactions + not new = no message. Source: "UCD Criterias" R2–R7, EAINT-9209 workbook, SharePoint "eAuto - CR Test Scenarios", modified 21/11/2025. Candidate home: `knowledge/flow-platform.md` (next to EAINT-12234 inactive UCD) or `knowledge/eauto-insurance.md`.
2. **Recipient lists came from a developer query:** "From Dev's query, this Company ID is not listed in both Active UCD & New Registered UCD" (sheet "9209_TS3", R1). Useful lead for any future blast ticket: ask the developer for the list query, there is no portal screen [unconfirmed].
3. **Catalogue row 108 can be enriched** with the result counts (5 "✅", 1 "No message received" as expected) and the untested eSTM-Permission = "No" branch. Source: this study.
