# EAINT-12406 — issue drafts

This is the running list of findings for this ticket. Nothing on this page has been raised in Jira until a ticket number shows in the **Jira** column.
Ids: D = defect, U = UI, N = needs a question, Q = question, S = test-script problem (not for Jira).

| Id | TS | Summary | State | Jira |
|---|---|---|---|---|
| D1 | 12406_RC_TS8 (E3), 12406_RC_TS1 (E2, E4, E7), 12406_RC_TS2 (E2) | Receipt (Secarang Success page and CIBO): the Allianz company number comes straight after "Berhad" instead of starting on its own line | **final 29.10 evening, ready to post** (Low; Azfar posts it 30.10 under his own login) | – |
| D2 | 12406_E2E_TS1–TS5 (receipt), 12406_RC_TS2; found by verify runs fx4 / fx5 | Receipt (Secarang and CIBO) and e-receipt email: Allianz "Premium after NCD" RM 882.16, RM 20.00 (the All Drivers amount) too high; should be RM 862.16 | **drafted 29.10 evening, ready to post** (Medium; Azfar posts it 30.10 under his own login) | – |
| N1 | 12406_RC_TS1 (E9) | Success page [Print] view has no Insurer block: does that view count as a receipt for REQ-010? | question for the QA, not raised | – |
| S1 | 12406_RC_TS8 (E5) | The script could not get back to the CIBO sidebar from Transaction Details, so E5 was not recorded | for cr-author, not a defect | – |
| N2 | 12406_E2E_TS10, 12406_RG_TS1 | Tokio Marine receipt: the Add-ons section is empty but Gross Premium is RM 375.00 above Premium after NCD (HXA0004A and BR69005852, both RM 1,075.20 vs RM 700.20) | noted 29.10 evening, **not raised**: the same on the BEFORE copy of BR69005852 (28.10), so unchanged by 12406 (rule B); Tokio Marine, not Allianz. Ask Azfar if he wants it as a separate production question | – |

Not raised on purpose (questions, not defects; instruction of 29.10 evening): Q44 cover note / policy no. / e-Certificate, the Allianz document dates, the RC_TS9 badge, the Success page [Print] view (N1).

Duplicate check, 29.10.2026 evening, for D2 and again for D1 (read-only Jira search, connector account 712020:fcdff45d…):
- `parent = EAINT-12406 OR issue in linkedIssues(EAINT-12406)`: still only CCB-992 (DEV IN PROGRESS). No QA-Issues under the ticket.
- Project-wide "Premium After NCD" / "All Drivers" / "Gross Premium": closest are EAINT-11675 (Zurich, CIBO details + receipt, All Drivers shown twice as RM0.00, Done, under EAINT-8608), EAINT-11653 (Zurich Confirmation price pop-up, All Drivers placement, Done), EAINT-11526 (Lonpac Confirmation NCD 2% and Gross Premium RM30, Done, under EAINT-8669), EAINT-11219 / 11216 (motorbike All Riders wording, Done). Different insurer, page or symptom: none is an Allianz receipt whose "Premium after NCD" carries All Drivers twice.
- QA-Issues of the last 60 days on Allianz / Secarang / CIBO / NCD: 30 found (EAINT-12022 Insurance Cancellation, EAINT-12218 / 11759 Macrokiosk, EAINT-12566 Payment Mode). None on the receipt amount or the Allianz number. **No duplicate for D1 or D2.**

Duplicate check, re-run 29.10.2026 18:10 for the RC_TS1 findings: `parent = EAINT-12406 OR issue in linkedIssues(EAINT-12406)` still returns only CCB-992. QA-Issues of the last 30 days mentioning Allianz / Secarang receipt / 735426 are all EAINT-12022 Insurance Cancellation tickets (a different page). Secarang / CIBO / EAINT-148 tickets of the last 60 days on receipt or Allianz: only EAINT-12422 (Lonpac name, a separate CR) and EAINT-12343 (Macrokiosk message). **Still no duplicate.**

First duplicate check, 29.10.2026 (Jira connector account 712020:fcdff45d…; check this is Azfar's own login before posting anything):
- `parent = EAINT-12406 OR issue in linkedIssues(EAINT-12406)` returned only CCB-992 (the dev task, DEV IN PROGRESS). There are no QA-Issues under EAINT-12406 yet.
- EAINT-148 children mentioning Secarang / CIBO / receipt: only EAINT-9461 (Vehicle Use field in CIBO), which is a different problem.
- Project-wide search on receipt + Allianz / insurer / Tokio Marine: EAINT-11675 (Zurich, CIBO receipt with no insurer, Done, under EAINT-8608), EAINT-11204 / 11219 (Zurich receipt wording, Done), EAINT-12422 (Lonpac name on the Secarang receipt, a separate CR). None covers how the Allianz number is laid out. **No duplicate found.**

Latest SRD, re-listed on Jira 29.10.2026: SRD_EAINT-12406_v1.1_20261026 (pdf + docx). This is the copy in `00-input/`.

---

## D1 — Receipt: the Allianz number is on the same line as "Berhad" (Secarang and CIBO)

Merged 29.10 18:10: RC_TS1 (E2, E4, E7) found the same layout on the four new Allianz receipts on the Secarang side, so they go into this one ticket, not a second one.

- **Finding 1, new purchases (Secarang Success page > [Receipt] PDF):** 12406_RC_TS1, runs eaint-12406-run-sRC-20261029-1545-c1 / -c2, staging /ia/, 29.10.2026 17:05 MYT, reading the receipts that the purchases of 12406_E2E_TS1 to TS4 downloaded at 16:29-16:45 MYT.
  - BR60006349 / HXA0011A, FPX (RHB), receipt no. 26102921300027, RM 941.13
  - BR60006350 / HXA0012A, credit or debit card, receipt no. 26102921300028
  - BR60006351 / HXA0013A, PayLater by Grab, receipt no. 26102921300029
  - BR60006352 / HXA0014A, SPayLater, receipt no. 26102921300030
  - All four read `Allianz General Insurance Company (Malaysia)` / `Berhad 200601015674 (735426-V)` (checked again with pdftotext at 18:10). The HXA0011A receipt was rendered as the PDF looks (Chrome PDF viewer) for screenshot 1: the same two lines.
- **Finding 2, older transaction (CIBO > Transaction Details > [Receipt]):** 12406_RC_TS8 E3, run eaint-12406-run-sRC-20261029-1330-c2, 29.10.2026 13:48 MYT, Ref. No BR55004010, DAX0900, Allianz Serba Sentral, paid 04-05-2025 (Fiuu). Same two lines, checked against the rendered PDF. RC_TS8 was not changed after its run.
- **CIBO receipt of a NEW purchase (added 29.10 evening):** 12406_RC_TS2 E2 (rerun eaint-12406-rerun-sRC-20261029-1545, 17:53 MYT) opened BR60006349 / HXA0011A from CIBO > Transaction Details > [Receipt]: the same two lines (checked again in the PDF). The earlier "not covered" note is closed; row 2 of the ticket now says so in one line.
- **e-receipt email:** the HXA0006A email shows "Allianz General Insurance Company (Malaysia) Berhad 200601015674 (735426-V)" on one line (`04-explore/2026-10-29-receipt-emails.md`). In the ticket as one line under the table.
- **Expected:** `Allianz General Insurance Company (Malaysia) Berhad`, then `200601015674 (735426-V)` on its own line. Source: **SRD v1.1 §2.2.9 EAINT-12406-REQ-010** (p.15-16): New Expected "Follow Tokio Marine format: insurer name, then new BRN with old number in brackets"; the "Allianz (new)" sample has the number on its own line; Example 1a "same layout as Tokio Marine"; Example 1 covers "Customer or CIBO user". Tokio Marine on this build: HXA0004A (12406_E2E_TS10) and BR69005852 both read `Tokio Marine Insurans (Malaysia) Berhad` / `198601000381 (149520-U)`.
- **Points that passed in RC_TS1:** E1 (name line), E3 (old one-line form gone), E5 (plate, owner, total), E6 (Serba Sentral agent line, PIAM ID 195379-01), E8 (labels same as Tokio Marine). In RC_TS8: E1, E2, E4.
- **Note for the QA (unchanged):** the Tokio Marine name fills the column (182.8 pt; the Allianz first line is 208.9 pt), so the Allianz number may sit after "Berhad" only because the long name wraps, and the PDF cannot tell a wrap from a line break. Dev may answer "same code as Tokio Marine". The SRD sample is still clear. Q42 asks a similar layout question for CIBO Transaction Details, so you may want to ask the BA (Lim Yi Link) about both before raising, or raise this On Hold for the BA.

### Draft ticket (eauto-qa-issue-ticket format)

**FINAL 29.10.2026 evening (ready to post; Azfar posts it 30.10 under his own Jira login).**

- **Type / parent:** QA-Issue under **EAINT-12406** (a new-CR issue)
- **Title (final):** `[Secarang - Homepage Flow & CIBO] Receipt - Allianz company number shows after "Berhad" instead of on its own line`
  (the bracket covers both rows: Homepage Flow for the customer's Secarang receipt, CIBO for the admin receipt; same shape as `[eAuto - UCD & BackOffice]` on EAINT-9436 / 9421. The shorter `[Secarang & CIBO] Receipt - ...` drops the platform-role shape of the skill, so it was not used.)
- **Priority:** Low · **Developer:** Mong Guo Hao (assignee) · **QA:** Amirul Azfar · status To Do (Low, so not forced On Hold)
- **Panel:** Testing Environment `staging/ia (Secarang)` · Browser Google Chrome · Module `Secarang > Success page > Receipt; Secarang > CIBO > Transaction Management > Transaction Details > Receipt`
- **Staging Test:** (Ref. No = BR60006349, Vehicle No = HXA0011A, Receipt No = 26102921300027, bought 29-10-2026; also BR60006350 / HXA0012A, BR60006351 / HXA0013A, BR60006352 / HXA0014A; older Ref. No = BR55004010, Vehicle No = DAX0900, bought 04-05-2025) New Allianz purchases on Secarang (FPX, card, PayLater by Grab, SPayLater) and one Allianz transaction made before this change all show the same layout.
- **Row 1, new purchase, Secarang receipt > Insurer:** 1. On Secarang Home, get quotations for a car and choose Allianz. 2. Pay (any method) and reach the Success page. 3. Click [Receipt] and open the PDF. 4. Look at the Insurer block. **Actual:** line 1 "Allianz General Insurance Company (Malaysia)"; line 2 "Berhad 200601015674 (735426-V)": the number **is on the same line as "Berhad"**. Same on all 4 receipts. See screenshot 1. **Expected:** "Allianz General Insurance Company (Malaysia) Berhad", then **"200601015674 (735426-V)" on its own line**, same as Tokio Marine. Per SRD v1.1, Section 2.2.9, EAINT-12406-REQ-010. See screenshots 3 and 4.
- **Row 2, older transaction, CIBO receipt > Insurer:** 1. In CIBO, go to Transaction Management. 2. Search Ref. No BR55004010 and open Transaction Details. 3. Click [Receipt] and open the PDF. 4. Look at the Insurer block. **Actual:** the same line 2; same on the CIBO receipt of a new purchase (BR60006349, HXA0011A). See screenshot 2. **Expected:** as row 1.
- **Line under the table (added 29.10 evening):** "Note: the e-receipt email shows the same: "Allianz General Insurance Company (Malaysia) Berhad 200601015674 (735426-V)" on a single line. A question to the BA is still open: is a long name that wraps acceptable, or must the number start on its own line?" (Q42 in our list; Q42 as written asks about CIBO Transaction Details, so add the receipt wrap-vs-line-break point when it goes to the BA.)
- **Full ADF:** `issues/D1/description.adf.json` (rebuilt 29.10 18:10; 29.10 evening: row 2 line + the note added). Captions at the end, images pasted under them (Jira will not keep images in table cells).
- **Earlier open points:** priority Low, Developer **Mong Guo Hao** (assigned 22.10 by Tan Yi Fung, `00-input/teams-chat-2026-10-28.md`), QA Amirul Azfar: set in the 29.10 evening drafting instruction; Azfar confirms when he posts. **Still for Azfar at posting:** raise it straight to To Do, or On Hold for the BA first (wrap vs line break)? The note under the table works either way. Jira login: the connector account is 712020:fcdff45d…; post only from his own login.

### Evidence (`issues/D1/`, in the order to attach; renumbered 29.10 18:10)

1. `Screenshot 1 - Secarang receipt HXA0011A - Insurer block.png`: NEW. Rendered from the Secarang receipt PDF of BR60006349 in Chrome's PDF viewer (not the text dump), red box on "Berhad 200601015674 (735426-V)". **Masked:** the crop starts at "Vehicle Plate No.", below the "For" (customer name) row. Source: `FAILED/12406_E2E_TS1/2026-10-29T08-36-31_DEFECT/downloadable (after)/secarang-receipt-HXA0011A-PERSONAL-DATA.pdf` (not changed).
2. `Screenshot 2 - CIBO receipt BR55004010 - Insurer block.png`: was screenshot 1. Rendered, red box, masked below "For".
3. `Screenshot 3 - Expected - SRD v1.1 section 2.2.9 REQ-010.png`: was 2. Green dashed box on the "Allianz (new)" sample.
4. `Screenshot 4 - Expected - Tokio Marine receipt BR69005852 - Insurer block.png`: was 3. No personal data.
5. `Screenshot 5 - Context - BEFORE deploy receipt BR55004010 28-10.png`: was 4. No personal data.
6. *(optional, leave out)* `Screenshot 6 - Context - AFTER Transaction Details BR55004010.png`: was 5. Its red box marks a point that passed and may confuse Dev.

Not attached: the full receipt PDFs (customer name), the RC_TS1 gate screenshots 03 / 05 / 08-10 (text dumps, not the rendered receipt), and the videos (the order of steps does not matter for this defect). The originals stay unchanged in `05-evidence/FAILED/12406_RC_TS1/2026-10-29T09-06-48_DEFECT/` and `FAILED/12406_RC_TS8/2026-10-29T05-48-58_DEFECT/`.

---

## D2 — Receipt: Allianz "Premium after NCD" is RM 20.00 too high (All Drivers added twice)

- **Found by:** verify runs fx4 / fx5 (29.10, HXA0006A, `automation/src/flows/README.md` Secarang row, "nothing raised"), then every Allianz receipt of the day: 12406_E2E_TS1–TS5 (run eaint-12406-run-sE2E-20261029-1545-c1 and rerun), 12406_RC_TS2 (CIBO receipt of BR60006349), and the e-receipt email (`04-explore/2026-10-29-receipt-emails.md`, HXA0006A, read in Azfar's Gmail).
- **Actual (checked in each PDF 29.10 evening):** Basic Premium RM 1,203.08 · NCD 30.0% − RM 360.92 · All Drivers RM 20.00 · **Premium after NCD RM 882.16** · Allianz Road Rangers FREE · Gross Premium RM 862.16 · Service Tax 8% RM 68.97 · Stamp Duty RM 10.00 · Total Premium RM 941.13. 1,203.08 − 360.92 + 20.00 = 862.16, so the line is RM 20.00 (the All Drivers amount) too high. **All 13 Allianz receipts of 29.10** read RM 882.16: 26102921300003 / 015 / 017 / 020 (HXA0006A), 027 and 036 (HXA0011A), 028 and 037 (HXA0012A), 029 and 038 (HXA0013A), 030 and 035 (HXA0014A), 033 (HXA0015A). CIBO receipt of BR60006349 (RC_TS2): the same.
- **Also seen, not in the ticket:** the Success page [Print] view of HXA0011A shows "Premium After NCD RM882.16" too (E2E_TS1 `checks.txt`, printView text). Its screenshot `06-success-print-receipt-view-PERSONAL-DATA.png` carries Azfar's real email, so it is not attached. Add a line if Azfar wants Dev to fix the print view in the same ticket.
- **Expected:** RM 862.16. Sources: (1) the receipt's own lines; (2) Confirmation of the same purchase shows "Premium After NCD RM862.16" (E2E_TS1 `checks.txt` 16:29:51 and `03-confirmation-allianz.png`); (3) SRD v1.1 §2.1.3a: "Existing Allianz journey (quote, add-ons, payment, cover note, callbacks, receipt) … full end-to-end test is required". The SRD does not give the formula itself; internal consistency and the Confirmation page are the basis.
- **Allianz only:** Tokio Marine HXA0004A (new purchase 29.10 16:54, Secarang and CIBO receipts): 1,522.66 − 837.46 + 15.00 = 700.20, shown RM 700.20. RHB BR55004008: 1,145.67 − 0.00 + 25.00 = 1,170.67, shown RM 1,170.67. Lonpac BR60006309 has no All Drivers line (809.07 = 809.07). **Older Allianz BR55004010 (paid 04-05-2025)**, same figures, opened on this build before and after the deploy: RM 862.16, correct. So only purchases made on the new build are wrong.
- **Clue for Dev:** browser console during an Allianz purchase, before the Payment page: `TypeError: Cannot read properties of undefined (reading 'amount') at M.autoAddAddonIfAllianz … at M.ngOnInit`. Source: probe run `04-runs/EAINT-12406-probe-fpxclick-20261029-1139/results.json` (HXA0006A, the only saved console log; the console was not captured on the other runs). It is not written in `automation/src/flows/README.md`; the README only notes the RM 882.16 sum.

### Draft ticket (eauto-qa-issue-ticket format) — ready to post

- **Type / parent:** QA-Issue under **EAINT-12406**
- **Title:** `[Secarang - Homepage Flow & CIBO] Receipt - Allianz "Premium after NCD" is RM20.00 too high because All Drivers is added twice`
- **Priority:** Medium · **Developer:** Mong Guo Hao (assignee) · **QA:** Amirul Azfar · status To Do
- **Panel:** staging/ia (Secarang) · Google Chrome · `Secarang > Success page > Receipt; Secarang > CIBO > Transaction Management > Transaction Details > Receipt`
- **Staging Test:** (Ref. No = BR60006349, Vehicle No = HXA0011A, Receipt No = 26102921300027, bought 29-10-2026; same on HXA0006A, HXA0012A, HXA0013A, HXA0014A, HXA0015A) Every Allianz receipt made on 29-10-2026 (13 receipts, 6 cars) shows the same wrong amount. Tokio Marine and RHB receipts add up.
- **Row 1, Secarang receipt:** steps Home > Allianz > note Confirmation's Premium After NCD > pay > [Receipt]. **Actual:** the lines, then **Premium after NCD RM 882.16**; **RM 20.00 too high**, Gross and Total right; same on all 13 receipts and the e-receipt email (screenshot 1). **Expected:** **RM 862.16**, as on Confirmation (screenshot 3); Tokio Marine and RHB add up this way, per SRD v1.1 §2.1.3a (screenshots 4, 5, 7).
- **Row 2, CIBO receipt BR60006349:** **Actual** RM 882.16 (screenshot 2). **Expected** RM 862.16.
- **Notes for Dev (under the table):** older Allianz BR55004010 is fine (screenshot 6); the console error above, in a code line.
- **Full ADF:** `issues/D2/description.adf.json`.

### Evidence (`issues/D2/`, in the order to attach) — all crops, customer name masked

1. `Screenshot 1 - Secarang receipt HXA0011A - Receipt Summary.png`: rendered from the Secarang receipt PDF (`FAILED/12406_E2E_TS1/2026-10-29T08-36-31_DEFECT/downloadable (after)/`), red box on "Premium after NCD RM 882.16". **Masked:** the "For" name (made-up "QA SECARANG TEST", masked anyway). No IC, phone or email on the receipt.
2. `Screenshot 2 - CIBO receipt BR60006349 - Receipt Summary.png`: from `FAILED/12406_RC_TS2/2026-10-29T09-54-04_DEFECT/downloadable (after)/`, red box. Name masked.
3. `Screenshot 3 - Expected - Confirmation HXA0011A - Premium After NCD.png`: price panel cropped from `FAILED/12406_E2E_TS1/…/03-confirmation-allianz.png`, green dashed box on "Premium After NCD RM862.16". The crop leaves out the address fields and the gate's own red boxes.
4. `Screenshot 4 - Expected - Tokio Marine receipt HXA0004A - Receipt Summary.png`: top of the summary only (Basic to Premium after NCD), from `post-push/12406_E2E_TS10/`. Cropped above the name and above the empty Add-ons rows (N2) so they do not distract.
5. `Screenshot 5 - Expected - RHB receipt BR55004008 - Receipt Summary.png`: from `post-push/12406_RG_TS3/`. **Masked: a real colleague's name** in "For".
6. `Screenshot 6 - Context - older Allianz receipt BR55004010 - Receipt Summary.png`: from `FAILED/12406_RC_TS8/2026-10-29T09-12-41_DEFECT/`. **Masked: a real colleague's name** in "For".
7. `Screenshot 7 - Expected - SRD v1.1 section 2.1.3a.png`: SRD v1.1 p.7, green dashed box on 2.1.3a.

Not attached: the full PDFs (names), the e-receipt email (no screenshot exists; it is in Azfar's Gmail and shows his address: take one masked shot if Dev asks), the videos (the order of steps does not matter; the E2E_TS1 video also shows the print view with Azfar's email). Originals unchanged.

---

## N1 — Success page [Print] view: no Insurer block (question for the QA)

- **TS:** 12406_RC_TS1 E9 (run -c1). The Success page [Print] view of 12406_E2E_TS1 (HXA0011A) shows the Allianz logo and "Allianz Insurance - Comprehensive" only. There is no "Insurer" label and no company number, so the script read nothing.
- **Question for the QA:** does the [Print] view count as a "receipt" for REQ-010 (Example 1: "Customer or CIBO user")? If yes, it becomes a question for the BA (should the print view carry the Insurer block?), not a defect yet, because the SRD does not say what the print view shows. If no, E9 is not applicable and the TS row should say so.
- **Privacy:** `FAILED/12406_RC_TS1/2026-10-29T09-06-48_DEFECT/12-E9-print-receipt-view-from-e2e-ts1.png` shows the QA's own email and IC, not blurred, and its file name has no PERSONAL-DATA label. Do not attach or upload it as it is; blur or crop it first if it is ever needed. (cr-defect does not edit evidence files.)

---

## S1 — the script did not reach E5 (not a defect)

After E3 the run stopped: `Could not find "CIBO sidebar transaction-management"` on `/cibo/transaction-management/transaction-details/b41dabc4-…`. Because of that, E5 (BR44003678 / BR3D003430 AFTER, Q20) was never recorded. This is for cr-author: fix how the script gets back to Transaction Management from Transaction Details, then re-run RC_TS8 so E5 is recorded. It does not go to Jira.

---

## Retest comments

None. There are no QA-Issues under EAINT-12406 (checked again 29.10.2026 18:10), so Dev has not marked anything as fixed.
