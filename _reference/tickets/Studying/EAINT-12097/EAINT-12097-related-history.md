# EAINT-12097 — related history (2026-10-27)

## Ticket brief

Same figures as `data/pipeline/work/EAINT-12097/brief.json`. No SRD yet; everything comes from the insurer's briefing PDF [unconfirmed].

1. **High-level scope**
   1. **New UBO section** on the Chubb **company** quote journey: auto-filled from the Chubb response, 1 to 4 records.
   2. **No UBO from Chubb:** user is asked to type UBO details; cannot go on without one complete record.
   3. **Mandatory fields** per record (Name; IC / Passport and Country pending a BA ruling) and the **max 4** limit.
   4. **Touchpoint 2:** user leaves after the quote, comes back via "Resubmit", Chubb is called again; new UBOs overwrite, empty refresh keeps the old ones.
   5. **UBO shown on screen** for the user to check (CTOS / B360 display); where else it shows (details pages, BO, CIBO) [unconfirmed].
   6. **Regression:** Individual + Chubb and Company + Takaful show no UBO section; Chubb TIN No field, price re-check popup, purchase to policy issued still work.
2. **Estimated testing time:** **6.5 man-days**, range **5.5 – 7.5**, confidence **low** [unconfirmed]. No official figure: Jira "[QA] Est Man-day (cf 10081)" is "—" `[EAINT-12097-jira.md line 11]`; no Miro board for this ticket.
3. **Modules / pages to cover**
   1. **Insurance (UCD):** Get A Free Quote, Insurance Quotation Step 1 – Step 4, new UBO section — changed by the ticket.
   2. **Insurance Transaction Listing + Details (UCD):** "Resubmit", details page — Touchpoint 2 entry; UBO display [unconfirmed].
   3. **eSTM (UCD):** eSTM Transaction Details insurance banner, redirect after eSTM approval, VEL000069E path — entry-point regression.
   4. **Insurance Transaction Listing / Details (BO) and (CIBO):** regression; UBO record-keeping [unconfirmed].
   5. **Quotation reminder email (UCD):** "Complete Purchase Now" link — another way back into the journey (regression).

## Header

1. **Module / portal:** UCD Insurance, **Chubb company (corporate) journey** — Get Free Quote, Steps 1–4, Insurance Transaction Listing "Resubmit". `[EAINT-12097-study.md §What changes #1, #8]`
2. **Past tickets kept:** **6** — EAINT-9641 (Chubb TIN mandatory), EAINT-9611 (insurer API re-call before payment), EAINT-11864 (quotation reminder email), EAINT-8467 (Get Quote insurer sequence), EAINT-9141 (Chubb MY CAR Plus UI), EAINT-11540 (Get Free Quote IC validation).
3. **Dropped (name-only matches):** EAINT-9713 (Free Quote top 2, Takaful counted as one), EAINT-9615 (BO Quote Enquiries, Tokio Marine motorbike), EAINT-9062 (Secarang-Lonpac renewal grace period), EAINT-11757 (JomCheck API with credit company), EAINT-9951 (Service Portal hire purchase listing).
4. **Own official TS:** **none** in the QA Team folder.
5. **Direct UBO / CTOS / B360 history:** **none.** `grep "UBO|CTOS|B360|beneficial owner|12424|12148|12336"` over `_reference/sharepoint/` = 0 hits. This is a new step with no past TS.
6. **Earlier TS studies:** 1 — `_reference/tickets/EAINT-11864/EAINT-11864-qa-team-ts-study.md` (quotation reminder email). Read 2026-10-27; adds two QA-Issues (see Past QA-Issues).

## Related past tickets

1. **EAINT-9641** — "⚪[eAuto-Insurance] To update Chubb API based on latest e-Cover Motor API Specifications V1.7 - Update TIN as Mandatory Field" (Done).
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-9641-⚪[eAuto-Insurance] To update Chubb API based on latest e-Cover Motor API Specifications V1.7 - Update TIN as Mandatory Field.md`
   2. Why: **closest precedent.** A new **Chubb-only mandatory input** driven by a Chubb API spec, tested on the **Company** category, with "cannot proceed" checks and display on UCD / BO / CIBO details pages. Scout study §Dependencies #1.
2. **EAINT-9611** — "⚪[eAuto-Insurance] To call API and policy inception date and premium updated before payment" (Done).
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-9611-⚪[eAuto-Insurance] To call API and policy inception date and premium updated before payment.md`
   2. Why: **Touchpoint 2 precedent.** Insurer API re-called **before payment**, after the user quits Step 3 and **resubmits from the listing**, including **Chubb Company** rows.
3. **EAINT-11864** — "⚪[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase" (Done; QA = Faizuddin).
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase.md`
   2. Why: **"break in the journey" entry points** — stop at Step 1/2/3, resume from the listing or the "Complete Purchase Now" email link, incl. Chubb rows. Scout study §Dependencies #4.
4. **EAINT-8467** — "⚪[eAuto][Insurance]To set the control quotation sequence logic on Get Quote page" (Closed).
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-8467 - [eAuto] [Insurance] To set the control quotation sequence logic on Get Quote page.md`
   2. Why: maps **every entry point × Company category** and when the **Chubb card** shows for a company. Needed to place UBO capture on each path.
5. **EAINT-9141** — "⚪[eAuto][Insurance][Web] Update UI for Chubb MY CAR – Standard Plan to Plus Plan" (Done; workbook marked "(OUTDATED)").
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-9141 - ⚪[eAuto][Insurance][Web] Update UI for Chubb MY CAR – Standard Plan to Plus Plan (OUTDATED).md`
   2. Why: **Chubb UI on Steps 1–4**, Company rows, back-navigation checks. SRD V1.4 note "To add BNM requirements from Chubb feedback" `[EAINT-9141-jira.md, Description row 8]`. Results all "Not Started" — structure only.
6. **EAINT-11540** — "⚪[eAuto-UCD] Add NRIC 12-digit validation to Get Free Quote" (Done).
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-11540 - [eAuto-UCD] Add NRIC 12-digit validation to Get Free Quote.md`
   2. Why: **field validation on the Get Free Quote form** (IC number, Company Reg. No regression). Pattern for UBO **IC / Passport** checks.

## What was tested before

1. **EAINT-9641 — Chubb TIN mandatory** (sheet "Sheet1")
   1. **9641_E2E_TS1 — Chubb Company after eSTM approval** (R3): "Ensure TIN NO field is MANDATORY, where when TIN NO = blank: - An error message \"This field is required\" will be displayed under the TIN NO field. - Users SHOULD not be able to make payment and proceed to Step 4 when TIN NO is not input."
   2. **9641_E2E_TS2 — Takaful Company on Get a Free Quote** (R5): "Ensure TIN NO field is OPTIONAL"; blank TIN shows "\"-\"" on UCD / BO / CIBO details pages.
   3. **9641_E2E_TS3 — Chubb Individual, VEL000069E** (R6): "Ensure TIN NO field is NOT Displayed".
   4. **9641_E2E_TS4 — Lonpac Individual, Insurance Page banner** (R7): "Ensure TIN NO field is NOT Displayed".
2. **EAINT-9611 — insurer API re-call before payment** (sheets "Gross Premium change TS - eSIM", "Date Change TS - Insurance API")
   1. **9611_PRICE_E2E_TS1 — Chubb Individual, 69E, price change on resubmit** (Gross Premium R3–R6): "Quit step 3 page > Ask Dev to change Premium Amount on eSIM ⏎ 7. Resubmit from insurance trx listing page > Verify Premium Amount Price change" (R4).
   2. **9611_PRICE_E2E_TS6 — Chubb Company, existing transaction** (Gross Premium R24–R30): "Proceed until Step 3 > Quit Step page" (R25), then "Resubmit from insurance trx listing page" (R27).
   3. **Pay Now re-check rows** (R5, R11 and siblings): "Ensure Price Update Notification pop up is displayed, with content \"Price has changed. Click OK to reload and view the updated pricing\" with [OK] button".
   4. **9611_DATE_E2E_TS1 — Chubb Company, pay 1 day later** (Date Change R3–R5): "Proceed until Step 3 > Wait for 1 day (Natural case)" (R3), "Click Resubmit from Insurance Transaction Listing" (R4).
   5. **9611_DATE_E2E_TS2 – TS6 — other insurers, pay later** (Date Change R6–R23): break simulated by "Ask dev to patch Created Date to 1 day before today's date" (R6).
3. **EAINT-11864 — quotation reminder email** (sheets "11864", "Regression")
   1. **11864_TS02 — Chubb, Sub UCD, stop at Step 2** (11864 R3): "Stopping Point = Step 2".
   2. **11864_TS05 — Chubb, no approved eSTM** (11864 R6): "User can proceed up to step 2 only".
   3. **11864_TS10 — Chubb, resume from email as Sub UCD** (11864 R11): "Complete Insurance purchase from email using Sub UCD"; "New page opens up the insurance transaction step 1".
   4. **11864_RG_TS03 — Banner, Chubb regression** (Regression R4): "Regression on Insurance Purchase Flow".
4. **EAINT-8467 — Get Quote insurer sequence** (sheet "Insurance Sequence TS")
   1. **INSSEQ_GFQ_NOESTM_TS5 — Company, no approved eSTM** (R13–R16): "1. Chubb ⏎ 2. Takaful".
   2. **INSSEQ_GFQ_NOESTM_TS6 — Company, Takaful only** (R17–R19): "only one insurance displayed as only one provider available ⏎  ⏎ 1. Takaful".
   3. **INSSEQ_GFQ_ESTM_TS2 — Company, with approved eSTM** (R27–R30): "1. Chubb ⏎ 2. Takaful".
   4. **INSSEQ_GFQ_69E_TS2 — Company, VEL000069E** (R35–R38): "1. Takaful" only.
   5. **INSSEQ_GFQ_IB_TS2 — Company, Insurance Banner** (R43–R46): "1. Chubb" only.
   6. **INSSEQ_GFQ_AFTESTM_TS2 — Company, after eSTM** (R51–R54): "1. Chubb ⏎ 2. Takaful".
5. **EAINT-9141 — Chubb MY CAR Plus UI** (sheets "E2E Flow (TY)", "UI Change (Insurance Quotation)")
   1. **9141_E2E_TS1 — Chubb back-navigation** (E2E R5): "Go back to Step 2 > Verify everything is the same as before proceeding to Step 3."
   2. **9141_E2E_TS5 / TS7 — Chubb Company, existing transactions** (E2E R14–R15, R18–R19).
   3. **9141_VD_TS4 / TS5 — Chubb Step 3 and Step 4 wording** (UI Change R14–R18).
6. **EAINT-11540 — Get Free Quote IC validation** (sheet "Sheet1")
   1. **11540_TS_01 — blank IC** (R4): "\"This field is required\"".
   2. **11540_TS_09 – TS_13 — Company Reg. Number regression** (R12–R16): "Regression Company" — blank, 12 / 13 alphanumeric, special characters, auto-capitalisation.

## Reusable scenarios

1. **UBO Name mandatory (Chubb, Company)** — adapt **9641_E2E_TS1 — Chubb TIN mandatory**: blank field → error + cannot proceed; value shown on UCD / BO / CIBO details pages.
2. **No UBO section for Individual** — adapt **9641_E2E_TS3 — Chubb Individual "NOT Displayed"**.
3. **No UBO section for Takaful Company** — adapt **9641_E2E_TS2 — Takaful Company** [unconfirmed scope — Scout open question #15].
4. **Non-Chubb individual regression** — adapt **9641_E2E_TS4 — Lonpac banner**.
5. **Touchpoint 2 refresh after a break** — adapt **9611_PRICE_E2E_TS6 — Chubb Company, quit Step 3 + Resubmit** and **9611_DATE_E2E_TS1 — Chubb Company, wait 1 day + Resubmit**.
6. **Refresh at Pay Now** — adapt the **9611 Pay Now re-check rows** (R5, R29) if the SRD puts the UBO refresh on Pay Now [unconfirmed].
7. **Resume via email link** — adapt **11864_TS10 — Chubb "Complete Purchase Now"** [unconfirmed whether it counts as "a break"].
8. **Entry-point matrix for Company + Chubb** — reuse **8467 INSSEQ_GFQ_NOESTM_TS5, GFQ_ESTM_TS2, GFQ_IB_TS2, GFQ_AFTESTM_TS2** to pick paths where the Chubb card shows.
9. **UBO kept on Back** — adapt **9141_E2E_TS1 — Chubb back-navigation**.
10. **IC / Passport validation** — adapt **11540_TS_01 – TS_08 — IC field checks** once the SRD fixes the format; **11540_TS_09 – TS_13** as Company Reg. No regression.
11. **End-to-end regression per insurer / entry** — reuse the shape of **11864_RG_TS01 – RG_TS04 — purchase-flow regression**.

## Known traps

1. **Company may not get a Chubb card.** "In this case will be only one insurance displayed as only one provider available ⏎  ⏎ 1. Takaful" `[EAINT-8467, sheet Insurance Sequence TS, R17 and R35]`. Use a company vehicle that returns Chubb.
2. **UBO test data is set by the developer, not QA.**
   1. **Rule:** "because the API page is dev territory, so i need to ask them to change anything" `[Faizuddin, dashboard chat to Scout, 2026-10-27; knowledge/esim.md §Insurance API and Insurance Quotation pages #4]`.
   2. **Correction (2026-10-27):** an earlier version of this file said "QA could do it" (seed per-vehicle UBO rows on eSIM). That was wrong — eSIM Insurance API rows are changed by the developer on QA's request.
   3. **Precedent:** "Ask Dev to change Premium Amount on eSIM" `[EAINT-9611, sheet Gross Premium change TS - eSIM, R4 step 6, R5 step 8]`.
   4. **eSIM page facts:** "Insurance API Resps", columns "ID", "Vehicle Reg No", "Insurance Plan Code", "Insurance Request Type", "Response", "Is TPFT", "Delay Milliseconds" `[_reference/tickets/EAINT-12097/EAINT-12097-pasted-20261027-174951.html, lines 289–295]`. Chubb request types today: "VEH", "BASEPREM", "BENECODE", "FINALPREM", "CONFIRM", "JPJENQ". **No UBO / CTOS / B360 element** in any Chubb row.
   5. **Developer build item:** eSIM needs a UBO-capable Chubb response once the API spec exists [unconfirmed].
   6. **Do not modify the Chubb UAT prefix:** "CHUBB UAT ON 30.3.2026 (DO NOT DELETE OR MODIFY THIS PREFIX UNTIL FURTHER" `[knowledge/esim.md line 74]`.
   7. **Chubb "Quotation Display" = "No"** on eSIM Insurance Quotation Controls (meaning unknown). Check Chubb quotes still show on Step 1 before testing `[knowledge/esim.md §Insurance API and Insurance Quotation pages #5]` [unconfirmed].
   8. **eSIM edit form** not captured; deferred: "i will give you this later. dwarf can ask me again later when he needs it" [answered by Faizuddin on 2026-10-27, dashboard chat].
3. **"Break" simulated by date patch.** "Wait for 1 day (Ask dev to patch Created Date to 1 day before today's date)" `[EAINT-9611, sheet Date Change TS - Insurance API, R6]`.
4. **Resubmit behaviour was not settled in 9611.** "Pending dev and BA side to confirm whether we want the Resubmit button to trigger and show the price change or not" `[EAINT-9611, sheet Gross Premium change TS - eSIM, R27, Remarks]`. Ask the same for the UBO refresh.
5. **Some data needs a dev patch.** "9611_DATE_E2E_TS3 ⏎ (Need dev to patch IC to get the quotation)" `[EAINT-9611, sheet Date Change TS - Insurance API, R9]`.
6. **JPJ submission stuck in Pending.** "Submission Status to JPJ keeps staying at Pending status for long time" `[EAINT-9641, Sheet1, R5, Remarks]`; "Insurance not displayed in Service Portal since Submission status to JPJ keeps remaining in Pending status." `[EAINT-9611, Date Change sheet, R8, Remarks]`.
7. **Downloadables are dummy on staging.** "Downloadables are returning dummy data so cannot be viewed as well." `[EAINT-9611, Date Change sheet, R5, Remarks]`.
8. **Insurance missing on eSTM details.** "Insurance is not displaying in eSTM" `[EAINT-9611, Date Change sheet, R10, Remarks]`.
9. **Email link goes to prod.** "Link redirects to prod environment - Existing behaviour" `[EAINT-11864, sheet 11864, R10, Remarks]`. Do not use it for a Touchpoint 2 test on staging.
10. **TIN "optional" row is Takaful, not Chubb.** The optional case is "Takaful (Comprehensive)" on Get a Free Quote `[EAINT-9641, Sheet1, R5]`. Whether a Chubb-only input depends on **entry point** or **insurer** was never tested for Chubb + Get Free Quote [unconfirmed]. Cover both for UBO.
11. **Quotations expire after 24 hours.** "Wait for 24 hours > Payment = \" - \" > Insurance Trx Status = Quotation Expired" `[EAINT-9141, sheet E2E Flow (TY), R10]`. A "1 day" natural wait can expire the quote before Resubmit.
12. **eSIM has no environment.** "eSim have no environment. it is only a simulator to simulate the outcomes of certain scenarios in the eauto/secarang website" [answered by Faizuddin on 2026-10-27, dashboard chat].

## Past QA-Issues mentioned

1. **EAINT-12199 — "[eAuto - Insurance] Mailtrap not receiving email after cronjob runs"**, sub-task of EAINT-11864 (quotation reminder email) `[EAINT-11864-jira.md line 13, "Sub-tasks"]`. Added 2026-10-27 from the 11864 TS study.
2. **EAINT-12213 — "[eAuto - Insurance] Email is generated for insurance that does not have eSTM"**, sub-task of EAINT-11864 `[same line]`. The 11864 study notes "Regression should recheck TS05 because of 12213" `[EAINT-11864-qa-team-ts-study.md line 107]`.
3. **No QA-Issue keys** in the other 5 workbooks or their Jira captures.
4. **EAINT-11864 Remarks** carry "HX071" … "HX083" `[sheet 11864, R9–R14; sheet Regression, R2–R5]` — evidence / transaction refs, not QA-Issues [unconfirmed].
5. **Defects seen in remarks (no ticket in the sheet):** "Unable to to open Invoice in CIBO" `[EAINT-9611, Date Change sheet, R10]`; "Insurance invoice cannot be downloaded." `[EAINT-9611, Date Change sheet, R8]`.

## Estimated testing effort

Faizuddin, 2026-10-27. **[unconfirmed]** — the official figure lives in the QA Portal, which agents do not open.

1. **Comparable tickets:**

| Ticket | Unique TS ids in workbook | Workbook rows (catalogue) | [QA] Est Man-day (cf 10081) | Source |
|---|---|---|---|---|
| EAINT-9641 — Chubb TIN mandatory | 4 | 6 | **2** | `EAINT-9641-jira.md` line 11, fetched 2026-10-27 |
| EAINT-9611 — API re-call before payment | 12 (PRICE TS1–6, DATE TS1–6) | 16 | — (blank) | `EAINT-9611-jira.md` line 11 |
| EAINT-11864 — quotation reminder email | 17 (TS01–13, RG_TS01–04) | 31 | **2.5** | `EAINT-11864-jira.md` line 11 |
| EAINT-8467 — Get Quote insurer sequence | 14 | 14 | — (blank) | `EAINT-8467-jira.md` line 11 |
| EAINT-9141 — Chubb MY CAR Plus UI | 17 (E2E 7, VD 7, INSH 3) | 23 | — (blank) | `EAINT-9141-jira.md` line 11 |
| EAINT-11540 — Get Free Quote IC validation | 13 | 13 | — (blank) | `EAINT-11540-jira.md` line 11 |

   1. **Own figure:** "[QA] Est Man-day (cf 10081): —" `[EAINT-12097-jira.md line 11, captured 2026-10-27 7:57 pm]`. Scout study: "all **blank**" `[EAINT-12097-study.md §Header #8]`. No Miro link for 12097 in `_reference/miro-links.txt`.
2. **Expected TS count for EAINT-12097:** **18 – 26.**
   1. Why: about **9641 (4) + 9611 Chubb rows (4) + new UBO logic** (0 / 1 / 4 records, max 4, mandatory fields, manual entry, refresh / retain, screening not clear) plus Individual / Takaful / entry-point regression. Bigger than 9641, close to 9141 and 11864.
3. **Estimate in man-days:** **6.5** (range **5.5 – 7.5**).
   1. **TS drafting:** 1 – 1.5 (no SRD; PDF conflicts need BA rulings first).
   2. **Test execution:** 2.5 – 3 (every UBO case needs the developer to set the Chubb response on eSIM; Touchpoint 2 needs a quit / Resubmit or date patch).
   3. **Retest / QA-Issue buffer:** 1 – 1.5 (each rerun waits on the developer).
   4. **Automation build:** **1 – 1.5, partial** (revised 2026-10-27).
      1. **Automatable:** no-UBO-section regression (Individual, Takaful Company), entry-point checks, and quote-stage UBO cases **if the developer sets fixed vehicles once** (vehicle A = 0 UBO, B = 1, C = 4) [unconfirmed].
      2. **Stays manual:** Touchpoint 2 refresh — needs the developer to change the response mid-run.
      3. **Correction:** earlier versions gave 1.5 – 2.5 for full automation on the idea that QA could seed eSIM. Wrong: the eSIM Insurance API page is the developer's (Known traps #2).
      4. Base code: `scripts/eauto-e2e` and `scripts/eauto-quotation-reminder` `[EAINT-12097-study.md §Existing repo knowledge #3]`.
4. **Confidence: low.**
   1. Would rise with: the **SRD**, the **Chubb API spec** (fields, formats, error codes), confirmed **UBO placement** in the eAuto journey, and the developer confirming eSIM can return UBO records.
   2. BO / CIBO display ruled in or out adds or removes about 3 – 5 TS.

## Knowledge candidates

For the Sage; Scribe does not edit `knowledge/`.

1. **No past TS covers UBO / CTOS / B360** — searched all SharePoint text copies 2026-10-27, 0 hits. Target: `knowledge/cr-test-scenario-catalogue.md` note for EAINT-12097 once it has a TS.
2. **Chubb-only input pattern** — EAINT-9641 tested Chubb TIN on Company (mandatory), Individual 69E (hidden), Takaful Company (optional). Chubb + Get Free Quote was never tested `[EAINT-9641, Sheet1, R3–R7]`. Target: `knowledge/eauto-insurance.md` §Quotation inputs #1.
3. **EAINT-11864 sub-tasks** EAINT-12199 (Mailtrap not receiving email) and EAINT-12213 (email for insurance without eSTM) `[EAINT-11864-jira.md line 13]`. Already listed as a candidate in the 11864 TS study.

## Sources read

1. `_reference/tickets/Studying/EAINT-12097/EAINT-12097-study.md` (Scout study, re-read 2026-10-27 incl. §Suggested test focus #11.1–#11.8 and §Existing repo knowledge #5–#6).
2. `_reference/tickets/Studying/EAINT-12097/EAINT-12097-jira.md` (captured 2026-10-27 7:57 pm).
3. `_reference/sharepoint/qa-team-ts/` text copies, read in full: EAINT-9641, EAINT-9611, EAINT-11864, EAINT-8467, EAINT-9141, EAINT-11540.
4. `_reference/tickets/EAINT-11864/EAINT-11864-qa-team-ts-study.md` (QA-Issues, Chubb rows).
5. `knowledge/cr-test-scenario-catalogue.md` — rows 015, 021, 060, 092, 105, 108.
6. `knowledge/eauto-insurance.md` §Quote order #5, §Quotation inputs and price re-check #1–#2.
7. `knowledge/flow-insurance-purchase.md` — Chubb / company / expiry lines 248, 312–325, 549–558, 766.
8. `knowledge/esim.md` line 74 and §Insurance API and Insurance Quotation pages (lines 551–577).
9. eSIM captures: `_reference/tickets/EAINT-12097/EAINT-12097-pasted-20261027-174951.html` (Insurance API Resps) and `…-174716.html` (Insurance Quotation Controls).
10. Jira captures refreshed 2026-10-27: `_reference/tickets/Studying/EAINT-9641/`, `EAINT-9611/`, `EAINT-11864/`, `EAINT-8467/`, `EAINT-9141/`, `EAINT-11540/` (`<KEY>-jira.md`).
11. Searches with **0 hits:** `UBO|CTOS|B360|beneficial owner|12424|12148|12336` in `_reference/sharepoint/`; "12097" in `_reference/miro-links.txt`.
12. **Not found:** `_reference/sharepoint/qa-team-ts/INDEX.md`.
13. **Not read:** linked tickets EAINT-12424 (Chubb Address Line 1 "NO." prefix), EAINT-12148 (Chubb duplicate-record errors), EAINT-12336 (other new CR group) — no past TS exist for them.
14. **Dropped after reading the title / catalogue only:** EAINT-9713, EAINT-9615, EAINT-9062, EAINT-11757, EAINT-9951.
