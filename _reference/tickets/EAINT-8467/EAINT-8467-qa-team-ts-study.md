# EAINT-8467 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8467 - [eAuto] [Insurance] To set the control quotation sequence logic on Get Quote page.md` (captured 28/10/2026, 10:11:52 am). Cell text only. Formatting, colours and images are not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8467/EAINT-8467-jira.md` (captured 27/10/2026).
3. **Knowledge:** `knowledge/eauto-insurance.md` § "Quote sequence (control sequence)"; `knowledge/business-rules-from-test-scenarios.md` § 6.1; `knowledge/cr-test-scenario-catalogue.md` row 060; `knowledge/flow-insurance-purchase.md`; `knowledge/flow-zurich-takaful.md` §3; `knowledge/esim.md`.
4. **Not read:** the SRD attachments (V0.1 to V1.2, .docx and .pdf). No local copy exists in `_reference/tickets/EAINT-8467/` or `_reference/tickets/Studying/EAINT-8467/`. Only the file names in the Jira capture are known.
5. **lib/ticketStudies.ts:** no entry for EAINT-8467, EAINT-8468 or EAINT-7563.

## 1. Header

1. **Ticket:** EAINT-8467 — "⚪[eAuto][Insurance]To set the control quotation sequence logic on Get Quote page" (Jira Summary).
2. **Jira status:** "Closed". Type "Task". Parent "EAINT-7563 [INS] Insurance Quotation Display Arrangement". Related "EAINT-8468 ⚪[eAuto][Mobile App][Insurance]To set the control quotation sequence logic on Get Quote page" (Jira capture, lines 5-14).
3. **ETA for Testing (cf 10057):** "2025-08-14" (Jira capture, line 11).
4. **Module / portal:** UCD portal, **Insurance → Get a Free Quote → Quotes page**. Also eSTM entry points (69E redirect, Insurance Banner, after eSTM completion).
5. **Workbook:** "EAINT-8467 - [eAuto] [Insurance] To set the control quotation sequence logic on Get Quote page.xlsx", library "eAuto - CR Test Scenarios", modified 11/08/2025, 12:59:51 pm.
6. **Sheets:** one — "Insurance Sequence TS". Two blocks: "CR Test Scenarios" (R2) and "Regression Test Scenarios" (R21).
7. **Scenarios:** **14 TS ids** over **50 step rows**.
   1. CR block: 6 ids (INSSEQ_GFQ_NOESTM_TS1 to TS6), rows R4-R19.
   2. Regression block: 8 ids (ESTM 2, 69E 2, IB 2, AFTESTM 2), rows R23-R54.
8. **Results:** the "QA" and "Test Result (P/F)" columns are **empty** in the text copy. No Pass/Fail recorded.
9. **Tester / dates:** none written in the sheet. The catalogue lists a QA engineer and date "2025-08-11" (`knowledge/cr-test-scenario-catalogue.md` row 060). That comes from SharePoint metadata, not the sheet.

## 2. What the ticket changed, as the TS shows it

1. **Quotes page shows only the top 2 insurers** from those available: "Sequence should display the Top 2 of available insurance providers" (Insurance Sequence TS, R4).
2. **Fixed priority order** between insurers. The order is not written as a list. From the cases it is **Chubb → Tokio Marine → Takaful → Lonpac** [unconfirmed — inferred from R4, R6, R8, R10; see §4.3].
3. **New timestamp** at the bottom of the page: "Quotation retrieved on: DD/MM/YYYY, HH:MMam/pm" (R4).
4. **New disclaimer** top right: "(icon) Disclaimer ⏎ The quotations shown are retrieved from live insurer APIs and may vary based on insurer availability, final premiums, coverage, and additional information provided." (R4).
5. **Order stays fixed** after the user changes postcode, variant, sum insured, or goes Back (R5, R7, R9, R11, R12).
6. **SRD history** (Jira description): "V0.3 | To update new requirement related to timestamp & disclaimer display"; "V1.2 | To exclude RHB on the insurer priority order list – problem statement".

## 3. Scenarios

### A. CR — Get a Free Quote, no Approved eSTM (R4-R19)

| # | TS id | Category | Available | What it checks | Expected top 2 |
|---|---|---|---|---|---|
| 1 | INSSEQ_GFQ_NOESTM_TS1 | Individual | Chubb, Tokio Marine, Takaful, Lonpac | Initial load; then change postcode + Transmission & Variant, Apply Changes (R4-R5) | "1. Chubb ⏎ 2. Tokio Marine" |
| 2 | INSSEQ_GFQ_NOESTM_TS2 | Individual | Chubb, Takaful, Lonpac | Initial load; then select insurer, click Back (R6-R7) | "1. Chubb ⏎ 2. Takaful" |
| 3 | INSSEQ_GFQ_NOESTM_TS3 | Individual | Tokio Marine, Takaful, Lonpac | Initial load; then change Sum Insured via dropdown (R8-R9) | "1. Tokio Marine ⏎ 2. Takaful" |
| 4 | INSSEQ_GFQ_NOESTM_TS4 | Individual | Tokio Marine, Lonpac | Initial load; postcode change; variant change (R10-R12) | "1. Tokio Marine ⏎ 2. Lonpac" |
| 5 | INSSEQ_GFQ_NOESTM_TS5 | Company | Chubb, Takaful | Initial load; Back; postcode; variant (R13-R16) | "1. Chubb ⏎ 2. Takaful" |
| 6 | INSSEQ_GFQ_NOESTM_TS6 | Company | Takaful | Initial load; Sum Insured; Back (R17-R19) | "1. Takaful" — "(In this case will be only one insurance displayed as only one provider available)" |

### B. Regression — Get a Free Quote, with Approved eSTM (R23-R30)

| # | TS id | Category | Available | What it checks | Expected top 2 |
|---|---|---|---|---|---|
| 1 | INSSEQ_GFQ_ESTM_TS1 | Individual | Chubb, Tokio Marine, Takaful, Lonpac | Load; Back; postcode; variant | "1. Chubb ⏎ 2. Tokio Marine" |
| 2 | INSSEQ_GFQ_ESTM_TS2 | Company | Chubb, Takaful | Load; Back; postcode; variant | "1. Chubb ⏎ 2. Takaful" |

### C. Regression — VEL000069E redirect (R31-R38)

| # | TS id | Category | Available | What it checks | Expected top 2 |
|---|---|---|---|---|---|
| 1 | INSSEQ_GFQ_69E_TS1 | Individual | Chubb, Takaful, Lonpac | "Create eSTM Transaction and set JPJ Enquiry to hit VEL000069E when proceed from Step 4 to Step 5"; then Back, postcode, variant | "1. Chubb ⏎ 2. Takaful" |
| 2 | INSSEQ_GFQ_69E_TS2 | Company | Takaful | Same path | "1. Takaful" (only one available) |

### D. Regression — Insurance Banner on Approved eSTM (R39-R46)

| # | TS id | Category | Available | What it checks | Expected top 2 |
|---|---|---|---|---|---|
| 1 | INSSEQ_GFQ_IB_TS1 | Individual | Tokio Marine, Takaful, Lonpac | eSTM Transaction Details, Approved, click "Insurance Banner - GET FREE QUOTE FOR [Vehicle No]"; then Back, postcode, variant | "1. Tokio Marine ⏎ 2. Takaful" |
| 2 | INSSEQ_GFQ_IB_TS2 | Company | Chubb | Same path | "1. Chubb" (only one available) |

### E. Regression — after completing eSTM (R47-R54)

| # | TS id | Category | Available | What it checks | Expected top 2 |
|---|---|---|---|---|---|
| 1 | INSSEQ_GFQ_AFTESTM_TS1 | Individual | Tokio Marine, Lonpac | "Create eSTM Transaction and proceed until transaction is completed & Approved"; then Back, postcode, variant | "1. Tokio Marine ⏎ 2. Lonpac" |
| 2 | INSSEQ_GFQ_AFTESTM_TS2 | Company | Chubb, Takaful | Same path | "1. Chubb ⏎ 2. Takaful" |

## 4. Business rules and system behaviour

1. **Top 2 only.** "Sequence should display the Top 2 of available insurance providers" (Insurance Sequence TS, R4; same wording in every scenario row).
2. **Fewer than 2 available → show what exists.** "(In this case will be only one insurance displayed as only one provider available)" (R17, R35, R43).
3. **Priority order (inferred)** [unconfirmed]. The four-provider case gives "1. Chubb ⏎ 2. Tokio Marine" (R4). Without Tokio Marine it gives "1. Chubb ⏎ 2. Takaful" (R6). Without Chubb it gives "1. Tokio Marine ⏎ 2. Takaful" (R8). With only Tokio Marine + Lonpac it gives "1. Tokio Marine ⏎ 2. Lonpac" (R10). All consistent with **Chubb > Tokio Marine > Takaful > Lonpac**.
4. **RHB excluded** from the priority list: "V1.2 | To exclude RHB on the insurer priority order list – problem statement" (Jira description, row 6). RHB appears in no scenario.
5. **Order is locked after edits.** "Sequence should remain on displaying the Top 2 of previous available insurance providers" (R5, R7, R9, R11, R12). Triggers covered: Change Postcode + Apply Changes, Transmission & Variant (Series) + Apply Changes, Sum Insured dropdown, select insurer then Back.
6. **Timestamp refreshes on edits.** "Latest timestamp displayed at bottom of page" (R5, R7, R9, R11, R12). Format "Quotation retrieved on: DD/MM/YYYY, HH:MMam/pm" (R4).
7. **Disclaimer stays.** "Disclaimer section remain displayed on top right" (R5, R7, R9, R11, R12).
8. **Same rule on every entry point.** No Approved eSTM, Approved eSTM, VEL000069E, Insurance Banner, after eSTM completion (R4-R54, "Entry Point" column).
9. **Company category** cases only list Chubb and/or Takaful as available (R13, R17, R27, R35, R43, R51). Matches "company will only have Chubb & Takaful" from EAINT-9564 (`knowledge/eauto-insurance.md` line 198-199).
10. **Insurance Banner text:** "Insurance Banner - GET FREE QUOTE FOR [Vehicle No]" on eSTM Transaction Details with "Transaction Status as Approved and valid for insurance" (R39).

### Compared with knowledge/

1. **Matches** `knowledge/eauto-insurance.md` § Quote sequence, rule 1 (Top 2, timestamp, disclaimer, order kept). The citation there gives "rows 4-9"; the same rules also hold in R10-R54.
2. **Newer CRs override the order.** EAINT-9713 counts "Takaful - Comprehensive & TPFT ... as one insurance", so top 2 can show three cards (`knowledge/eauto-insurance.md` line 188-191). EAINT-8606 (13.05.2026) sets "Chubb → Zurich (Comprehensive) → Zurich (TPFT) → Syarikat Takaful (Comprehensive) → Syarikat Takaful (TPFT) → Lonpac → Tokio Marine" (`knowledge/flow-zurich-takaful.md` §3.1). That puts **Tokio Marine last**, which contradicts this TS's 2nd place [unconfirmed whether "top 2" still applies after 8606]. This TS is a historical baseline, not the current order.
3. **69E trigger point differs.** This TS triggers 69E "when proceed from Step 4 to Step 5" (R31, R35). The project memory "69E redirect fires after full eSTM completion" and `knowledge/flow-insurance-purchase.md` line 56 record the redirect after eSTM completion. `knowledge/eauto-insurance.md` line 36 (FI-Flow) says "at step 4, after the JPJ enquiry and before proceeding to payment". Which is correct on today's build is [unconfirmed].
4. **Missing from the disclaimer/timestamp detail** in `knowledge/flow-insurance-purchase.md`: no selector or wording for the timestamp or disclaimer is recorded there.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Jira has no environment field filled.
2. **Credentials:** none in the sheet.
3. **Data needed per scenario:**
   1. Vehicle Number + IC Number with **no Approved eSTM** (R4) or **with Approved eSTM** (R23).
   2. Vehicle Number + **Company Reg. Number**, with or without Approved eSTM (R13, R27).
   3. eSTM transaction steered to **VEL000069E** at the JPJ enquiry (R31) — eSIM setup [unconfirmed which eSIM code path the tester used].
   4. eSTM transaction **Approved and valid for insurance** for the banner (R39).
4. **Available-provider mix per case** (the "Available Insurance Providers" column) depends on live insurer APIs per vehicle. The sheet does not say how the tester forced each mix [unconfirmed — likely chosen vehicles or insurer stubs].

## 6. Gaps or risks a regression should still cover

1. **No result recorded.** QA and P/F columns are empty, so there is no evidence of execution in this workbook.
2. **Order source not stated.** The priority list is never written in full; it must be inferred. A regression needs the current list from the newest CR (8606 / 9713 / 9564 / 8595).
3. **RHB exclusion** is not tested (no case with RHB available).
4. **Two-card Takaful** (Comprehensive + TPFT) is not in this TS; added later by EAINT-9713.
5. **East Coast, Islamic HP, X-Star** sequences are not covered here (later CRs 9564, 8595).
6. **Timestamp correctness** is not checked against real time, only format and "latest".
7. **Mobile App** twin EAINT-8468 is a separate ticket; not covered here.
8. **Inconsistent wording** in NOESTM_TS5/TS6 and all regression rows: after edits they say "Sequence should display" and repeat the full disclaimer, not "remain" (e.g. R14 vs R7). Same intent [unconfirmed].
9. **Motorcycle** and **Renewal** not covered.

## Knowledge candidates

1. **Fewer than two insurers → one card.** "(In this case will be only one insurance displayed as only one provider available)" — `[from SharePoint TS EAINT-8467, sheet Insurance Sequence TS, R17, R35, R43]`. Add to `knowledge/eauto-insurance.md` § Quote sequence rule 1.
2. **Timestamp refreshes, order does not.** "Latest timestamp displayed at bottom of page" with "Sequence should remain on displaying the Top 2 of previous available insurance providers" — `[same sheet, R5, R7, R9, R11, R12]`.
3. **Full disclaimer wording:** "The quotations shown are retrieved from live insurer APIs and may vary based on insurer availability, final premiums, coverage, and additional information provided." — `[same sheet, R4]`. Not yet verbatim in knowledge/.
4. **2025 baseline order** Chubb > Tokio Marine > Takaful > Lonpac, RHB excluded — `[inferred from same sheet R4, R6, R8, R10; RHB from Jira description SRD V1.2 row]` [unconfirmed]. Mark as superseded by EAINT-8606.
5. **Entry points that reach the Quotes page:** Get a Free Quote, VEL000069E redirect, Insurance Banner "GET FREE QUOTE FOR [Vehicle No]", after eSTM completion — `[same sheet, Entry Point column, R4-R54]`.
6. **69E trigger point conflict** to resolve: "when proceed from Step 4 to Step 5" `[same sheet, R31]` vs. memory/flow-insurance-purchase "after full eSTM completion".
7. **Ticket links:** parent EAINT-7563 "[INS] Insurance Quotation Display Arrangement"; Mobile App twin EAINT-8468 — `[Jira capture, lines 8, 10]`.
