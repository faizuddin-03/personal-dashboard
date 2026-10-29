# EAINT-8595 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8595 - [eAuto - Insurance] To change control sequence based on Hire Purchase Islamic.md` (cell text only; colours and images not kept). All three sheets read.
2. **Knowledge:** `knowledge/eauto-insurance.md` § "Quote sequence (control sequence)"; `knowledge/business-rules-from-test-scenarios.md` § 6.1; `knowledge/cr-test-scenario-catalogue.md` row 069; `knowledge/flow-insurance-purchase.md` (entry points).
3. **Flows data:** `lib/eautoFlows/modules/insurance.ts` lines 81, 481, 498, 513.
4. **Not found:** no `_reference/tickets/EAINT-8595/` folder before this study, no `_reference/tickets/Studying/EAINT-8595/`, no entry in `lib/ticketStudies.ts`.
5. **Not read:** Jira ticket and SRD (not in the repo; this is an unattended run).

## 1. Header

1. **Ticket:** EAINT-8595 — "[eAuto - Insurance] To change control sequence based on Hire Purchase Islamic".
2. **Module / portal:** UCD portal, Insurance — Quotes page (insurer card order).
3. **Workbook:** "EAINT-8595 - [eAuto - Insurance] To change control sequence based on Hire Purchase Islamic.xlsx", library "eAuto - CR Test Scenarios", modified 13/08/2025, 10:05:35 am.
4. **Sheets:**
   1. **"Insurance Sequence TS"** — the live sheet. 49 scenarios, **8595_TS1 – 8595_TS49**.
   2. **"Islamic Hire Purchase"** — list of Islamic hire purchase (HP) names. No scenarios.
   3. **"Draft 1"** — older draft. 20 scenarios, 8595_TS1 – 8595_TS20.
5. **Scenario split (Insurance Sequence TS):**
   1. **TS1–TS39** — "Hire Purchase with 'Islamic' wording" (sheet Insurance Sequence TS, R2).
   2. **TS40–TS49** — "Hire Purchase without 'Islamic' wording" (sheet Insurance Sequence TS, R80).
6. **Results:** the "QA" and "Test Result (P/F)" columns are **empty** in every row. No Pass/Fail recorded.
7. **Tester / dates in sheet:** none named in the sheet. Sheet "Islamic Hire Purchase" R2: "Uploaded to Jira on 06/08" and "Uploaded to Jira on 11/08". R1: "Not final - To be updated/added more by Dura". The catalogue lists the author as a QA engineer, date 2025-08-13 (`knowledge/cr-test-scenario-catalogue.md` row 069).

## 2. What the ticket changed, as the TS shows it

1. **Islamic HP adds Takaful to the sequence.** Islamic HP rows list four providers: "1. Chubb ✅ ⏎ 2. TMIM ✅ ⏎ 3. Takaful > Comprehensive ✅ ⏎ 4. Takaful > TPFT ✅" (sheet Insurance Sequence TS, R4). Non-Islamic rows list only "1. Chubb ✅ ⏎ 2. TMIM ✅" (R82).
2. **Priority order for Islamic HP** [unconfirmed, inferred from expected results]: **Chubb → TMIM → Takaful Comprehensive → Takaful TPFT**; the Quotes page shows the first two that are available.
3. **Takaful Comprehensive and TPFT count as two separate slots here.** TS7 expects "1. Takaful > Comprehensive ⏎ 2. Takaful > TPFT" as the Top 2 (R32).
4. **Trigger = HP name on a fixed list.** The "Islamic Hire Purchase" sheet holds 26 names (uploaded 06/08) then 39 names (uploaded 11/08). TS1–TS26 use the first 26; TS27–TS39 cover the 13 added spellings.
5. **Unchanged parts re-checked on every row:** timestamp and disclaimer, same text as EAINT-8467.

## 3. Scenarios

**Entry points (5), reused in every block:**

1. "After eSTM Transaction Approved" — create eSTM until "completed & Approved", redirect to Quotes page.
2. "Hit VEL00069E eLKM error code" — "set JPJ Enquiry to hit VEL000069E when proceed from Step 4 to Step 5".
3. "Insurance Banner in eSTM Transaction Details page" — "click on Insurance Banner - GET FREE QUOTE FOR [Vehicle No]".
4. "Get Quote Page – after eSTM Transaction Approved)" — GET A FREE QUOTE with a vehicle that "has Approved eSTM".
5. "[Get A Free Quote] before creating eSTM Transaction (not able to purchase insurance)" — vehicle that "has no Approved eSTM".

**Follow-up steps** (TS1–TS10 and TS40–TS49 only): select an insurer then "Click Back"; "Input a different valid postcode into Change Postcode field" then "Click Apply Changes"; "Select a different value for Transmission & Variant (Series)" then "Click Apply Changes". **TS1–TS4 only** add "Complete Insurance purchase until Successful". Expected order stays the same after each step.

### 3a. Islamic HP — full flow (TS1–TS10)

| TS | Entry | Cat. | HP name | Available (C / T / TK-C / TK-T) | Expected Top 2 |
|---|---|---|---|---|---|
| 8595_TS1 | eSTM Approved | Individual | AFFIN ISLAMIC BANK BERHAD | ✅ ✅ ✅ ✅ | "1. Chubb ⏎ 2. TMIM" |
| 8595_TS2 | 69E | Individual | AL RAJHI BANKING & INVESTMENT CORPORATION (M) BHD | ✅ ❌ ✅ ❌ | "1. Chubb ⏎ 2. Takaful > Comprehensive" |
| 8595_TS3 | Banner | Company | AL RAJHI BANKING & INVESTMENT CORPORATION (MALAYSIA) BERHAD | ✅ ❌ ❌ ✅ | "1. Chubb ⏎ 2. Takaful > TPFT" |
| 8595_TS4 | GFQ, approved eSTM | Company | ALLIANCE ISLAMIC BANK BERHAD | ✅ ✅ ❌ ✅ | "1. Chubb ⏎ 2. TMIM" |
| 8595_TS5 | GFQ, no eSTM | Individual | AMBANK ISLAMIC BERHAD | ✅ ✅ ✅ ✅ | "1. Chubb ⏎ 2. TMIM" |
| 8595_TS6 | eSTM Approved | Company | AMISLAMIC BANK BERHAD | ❌ ✅ ✅ ✅ | "1. TMIM ⏎ 2. Takaful > Comprehensive" |
| 8595_TS7 | 69E | Individual | AM ISLAMIC BANK BERHAD | ❌ ❌ ✅ ✅ | "1. Takaful > Comprehensive ⏎ 2. Takaful > TPFT" |
| 8595_TS8 | Banner | Company | BANK ISLAM MALAYSIA BERHAD | ❌ ✅ ❌ ✅ | "1. TMIM ⏎ 2. Takaful > TPFT" |
| 8595_TS9 | GFQ, approved eSTM | Individual | BANK ISLAMIC (M) BERHAD | ✅ ❌ ✅ ✅ | "1. Chubb ⏎ 2. Takaful > Comprehensive" |
| 8595_TS10 | GFQ, no eSTM | Company | BANK MUAMALAT MALAYSIA BERHAD | ✅ ✅ ✅ ✅ | "1. Chubb ⏎ 2. TMIM" |

C = Chubb, T = TMIM, TK-C = Takaful > Comprehensive, TK-T = Takaful > TPFT. Rows R4–R47.

### 3b. Islamic HP — first check only (TS11–TS39)

One row each (steps 1–3 only). The same five entry points and availability patterns repeat; expected Top 2 follows the order in § 2.2.

1. **TS11–TS26** (R48–R63): remaining names from the 26-name list, e.g. TS12 "CIMB ISLAMIC BANK BERHAD" → "1. Chubb ⏎ 2. Takaful > Comprehensive" (R49); TS17 "KOPERASI TABUNG HAJI BERHAD" → "1. Takaful > Comprehensive ⏎ 2. Takaful > TPFT" (R54); TS26 "TAKAFUL IKHLAS BERHAD" → "1. Chubb ⏎ 2. Takaful > Comprehensive" (R63).
2. **TS27–TS39** (R64–R76): the 13 spellings added on 11/08, e.g. "AL RAJHI BANKING & INVESTMENT" (TS27), "BANK ISLAM (M) BHD" (TS28), "BANK ISLAM M SIA BHD" (TS29), "BANK ISLAM" (TS30), "BANK ISLAM M'SIA BHD" (TS31), "Bank Kerjasama Rakyat M. Bhd" (TS34), "HONG LEONG ISLAMIN BANK BERHAD" (TS35), "RHB ISLAMIC BANK BHD" (TS38), "STANDARD CHARTERED SAADIQ BHD" (TS39).

### 3c. Non-Islamic HP (TS40–TS49)

| TS | Entry | Cat. | Available (C / T) | Expected (verbatim) |
|---|---|---|---|---|
| 8595_TS40 | eSTM Approved | Individual | ✅ ✅ | "Sequence should display the selected insurance providers - ⏎ 1. Chubb ⏎ 2. TMIM" (R82) |
| 8595_TS41 | 69E | Individual | ✅ ❌ | "… selected insurance providers - ⏎ 1. Chubb" (R86) |
| 8595_TS42 | Banner | Individual | ❌ ✅ | "… selected insurance providers - ⏎ 1. TMIM" (R90) |
| 8595_TS43 | GFQ, approved eSTM | Individual | ✅ ✅ | "1. Chubb ⏎ 2. TMIM" (R94) |
| 8595_TS44 | GFQ, no eSTM | Individual | ❌ ❌ | "To display “Vehicle does not meet Insurer's requirements. Sorry, unable to proceed.” popup message." (R98) |
| 8595_TS45 | eSTM Approved | Company | ❌ ✅ | "Top 2 of available insurance providers - ⏎ 1. TMIM" (R102) |
| 8595_TS46 | 69E | Company | ✅ ✅ | "1. Chubb ⏎ 2. TMIM" (R106) |
| 8595_TS47 | Banner | Company | ✅ ❌ | "1. Chubb" (R110) |
| 8595_TS48 | GFQ, approved eSTM | Company | ❌ ❌ | same popup as TS44 (R114) |
| 8595_TS49 | GFQ, no eSTM | Company | ✅ ✅ | "Sequence should display all available insurance providers - ⏎ 1. Chubb ⏎ 2. TMIM" (R118) |

## 4. Business rules and system behaviour

1. **Top 2 rule:** "Sequence should display the Top 2 of available insurance providers" (sheet Insurance Sequence TS, R4).
2. **Unavailable insurer is skipped, next one moves up.** TS6, Chubb ❌: "1. TMIM ⏎ 2. Takaful > Comprehensive" (R28).
3. **Takaful Comprehensive and TPFT fill two slots.** TS7: "1. Takaful > Comprehensive ⏎ 2. Takaful > TPFT" (R32).
4. **Only one insurer available → one card.** TS41: "1. Chubb" (R86).
5. **No insurer available → popup:** "Vehicle does not meet Insurer's requirements. Sorry, unable to proceed." (R98, R114).
6. **Order holds after Back, postcode change, variant change and purchase.** Same expected text on R5–R8 (TS1).
7. **Timestamp:** "Quotation retrieved on: DD/MM/YYYY, HH:MMam/pm" at the bottom of the page (R4).
8. **Disclaimer** top right: "The quotations shown are retrieved from live insurer APIs and may vary based on insurer availability, final premiums, coverage, and additional information provided." (R4).
9. **Get Free Quote without approved eSTM cannot buy:** entry label "[Get A Free Quote] before creating eSTM Transaction (not able to purchase insurance)" (R24). TS5/TS10 have no purchase step.
10. **Company category gets TMIM in this CR.** TS4 (Company) expects "1. Chubb ⏎ 2. TMIM" (R19); TS8 (Company) expects "1. TMIM ⏎ 2. Takaful > TPFT" (R36).

## 5. Test data, environments, accounts

1. **Environment:** not named in the sheet.
2. **Accounts / credentials:** none present.
3. **Data needed:**
   1. Vehicles with eSTM in **Approved** status ("valid for insurance", R14).
   2. Vehicles set in eSIM / JPJ Enquiry to hit **VEL000069E** between Step 4 and Step 5 (R9).
   3. Vehicles with **no** approved eSTM (R24).
   4. Individual (Identification Number) and Company (Company Reg. Number) owners.
   5. An HP from the "Islamic Hire Purchase" list per scenario (39 names, sheet Islamic Hire Purchase R4–R42, right-hand column).
   6. A way to make each insurer available or not (✅ / ❌ pattern). The sheet does not say how [unconfirmed — likely insurer API stubs or vehicle choice].
4. **Islamic HP list (11/08, 39 names)** — full list in sheet "Islamic Hire Purchase" R4–R42. It includes names with **no "Islamic" word**, e.g. "BANK MUAMALAT MALAYSIA BERHAD", "MBSB BANK BERHAD", "OCBC AL-AMIN BANK BERHAD", "STANDARD CHARTERED SAADIQ BERHAD", "KUWAIT FINANCE HOUSE (M) BERHAD", "BANK ISLAM".

## 6. Gaps and risks for regression

1. **No results recorded.** QA and P/F columns are blank; cannot tell what passed.
2. **TS11–TS39 check only the first landing.** No Back / postcode / variant / purchase steps for 29 of 39 Islamic names.
3. **Purchase completed only in TS1–TS4.** Nothing proves a Takaful-first order can be bought through to success for Company.
4. **Category vs input mismatch:**
   1. TS9, TS19, TS35 are "Individual" but step says "Company Reg. Number" (R40, R56, R72).
   2. TS4, TS14, TS30, TS10 are "Company" but step says "Identification Number" (R19, R51, R67, R44).
5. **Draft 1 vs live sheet disagree on Get Free Quote without eSTM:**
   1. Draft 1 TS5: "Sequence should display all available insurance providers - ⏎ 1. Chubb ⏎ 2. TMIM ⏎ 3. Takaful > Comprehensive ⏎ 4. Takaful > TPFT" (sheet Draft 1, R20). Its step also says "has Approved eSTM".
   2. Live sheet TS5: "Top 2 … 1. Chubb ⏎ 2. TMIM" (sheet Insurance Sequence TS, R24).
   3. Live sheet TS49 (non-Islamic Company) still says "all available insurance providers" (R118). Mixed rule inside one sheet.
6. **Name-matching risk.** The list holds typos and short forms ("HONG LEONG ISLAMIN BANK BERHAD", "BANK ISLAM", "BANK ISLAM M SIA BHD"). Regression should test exact-match vs partial-match, case ("Bank Kerjasama Rakyat M. Bhd") and an HP **not** on the list that contains "Islamic" [unconfirmed which rule the code uses].
7. **List marked not final:** "Not final - To be updated/added more by Dura" (sheet Islamic Hire Purchase, R1).
8. **Superseded.** Later CRs changed the sequence (EAINT-9023, 9214, 9564, 9713, 11977 per `lib/eautoFlows/modules/insurance.ts:509-514`). Use this TS for the Islamic-HP trigger idea, not for today's order.

## 7. Contradictions with current knowledge

1. **"Name contains Islamic" is too narrow.** `knowledge/eauto-insurance.md:200-203` and `knowledge/business-rules-from-test-scenarios.md:377-379` say an HP "whose name contains "Islamic"" triggers the sequence. The list includes names without the word (§ 5.4). The trigger looks like **list membership** [unconfirmed — needs SRD or code].
2. **Takaful counted as one vs two.** Knowledge (from EAINT-9713) says "Takaful - Comprehensive & TPFT is counted as one insurance". In EAINT-8595 they take **two** Top-2 slots (TS7, R32). The 9713 rule is newer and replaces this one [unconfirmed that 9713 applies to Islamic HP].
3. **Company category.** Knowledge says "company will only have Chubb & Takaful" (from EAINT-9564). EAINT-8595 expects **TMIM** for Company (TS4 R19, TS8 R36, TS45 R102). Older rule; later CR changed it.
4. **Get Free Quote without approved eSTM.** Knowledge says it "shows all insurers" (from EAINT-9023). EAINT-8595 live sheet says Top 2 for Islamic HP (TS5 R24), all for non-Islamic Company (TS49 R118).
5. **Flows data scenario range.** `lib/eautoFlows/modules/insurance.ts:81` cites "EAINT-8595 8595_TS1-TS15"; the live sheet has **TS1–TS49**.
6. **Catalogue count.** `knowledge/cr-test-scenario-catalogue.md` row 069 says "Draft 1:20" and points the "all providers" rule to "Draft 1!R20" — that is the draft, not the live sheet.

## Knowledge candidates

1. **Islamic HP trigger is a list, not a word match** [unconfirmed]. Source: sheet "Islamic Hire Purchase", R4–R42 (39 names incl. "MBSB BANK BERHAD", "BANK MUAMALAT MALAYSIA BERHAD", "OCBC AL-AMIN BANK BERHAD"). Target: `knowledge/eauto-insurance.md` § Quote sequence item 6.
2. **EAINT-8595 Islamic order (Aug 2025, legacy):** Chubb → TMIM → Takaful Comprehensive → Takaful TPFT, Top 2 available, Takaful parts in separate slots. Source: sheet Insurance Sequence TS, R4, R28, R32. Target: same section, marked superseded.
3. **No-insurer popup text:** "Vehicle does not meet Insurer's requirements. Sorry, unable to proceed." Source: sheet Insurance Sequence TS, R98 and R114. Target: `knowledge/eauto-insurance.md` or `knowledge/flow-insurance-purchase.md`.
4. **One available insurer → one card only.** Source: sheet Insurance Sequence TS, R86 ("1. Chubb"), R90 ("1. TMIM"). Target: `knowledge/eauto-insurance.md` § Quote sequence.
5. **Fix flows source range** "8595_TS1-TS15" → "8595_TS1-TS49". Source: sheet Insurance Sequence TS, R4–R121. Target: `lib/eautoFlows/modules/insurance.ts:81`.
6. **Catalogue row 069 note:** the "all providers on Get Free Quote" claim comes from sheet "Draft 1" R20; the live sheet R24 says Top 2. Target: `knowledge/cr-test-scenario-catalogue.md` row 069.
