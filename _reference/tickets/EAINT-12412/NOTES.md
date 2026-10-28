# EAINT-12412 — study notes (2026-10-01)

## Files in this folder

| File | Source | Note |
|---|---|---|
| `EAINT-12412-SRD-v1.0-20260930.pdf` (+ `.txt`) | Jira attachment 158619, `SRD_EAINT-12412_v1.0_20260930.pdf` | Baseline SRD, 17 pages. Text extracted with `pdftotext -layout`. |
| `EAINT-12412-sample-invoice-20260930.pdf` (+ `.txt`) | Jira attachment 158617 | Sample invoice, dated 30 Sep. |
| `EAINT-12412-sample-einvoice-20260930.pdf` (+ `.txt`) | Jira attachment 158620 | Sample e-Invoice, dated 30 Sep. |

Study page: `EAINT-12412-study.html`, published at https://claude.ai/artifact/HpGQcVFtaZYQKs6K3R63cn (private).

Not downloaded: SRD v0.1/v0.2/v0.3 and v1.0 `.docx`, the 29 Sep samples, and the duplicate 30 Sep samples (attachments 158621, 158623 — same size as 158620/158617).

Download method: navigate Chrome to `https://mfservices.atlassian.net/secure/attachment/<id>/<filename>`; files land in `Downloads\Chrome\`.

## Teams — CR group chat "EAINT-12412 [eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge ..."

1. Mei Jia Chee, 28/09/2026 09:13: "requestor wan to split the items in invoice i believe it will affect e-invoice too. i wan to understand when submit to LHDN, we need to enhance too ya?"
2. Goh Kai Jiaeh, 28/09/2026 11:44: "ya true. einvoice submission will be changed also." Links a Claude Doc, "JomCheck invoice split (EAINT-12412): points to confirm".
3. Mei Jia Chee, 29/09/2026 15:32: posted the BA answer table (screenshot of the same doc's question table).
4. Mei Jia Chee, 29/09/2026 16:01: "now pending confirmation with Marie on the e-invoice classification code ya"
5. Mei Jia Chee, 30/09/2026 15:53: "SRD v0.3 & SRD v1.0 + samples are ready yaa."
6. Mei Jia Chee, 01/10/2026 14:27: "also to update that requestor given green light for SRD v1.0 ya"
7. Mei Jia Chee, 01/10/2026 14:32: "hmm, no one joining the session. then we reschedule it to next Monday 11am" (briefing moved to Mon 05/10/2026 11:00).

## Dev analysis doc (Goh Kai Jiaeh, 28/09/2026)

`https://claude.ai/artifact/EZMpdafNRnYRXHY8Wm7ZbC`, read via the Claude Docs connector. Verbatim answer table:

| # | Question | Status | BA answer |
|---|---|---|---|
| 1 | Option A (invoice wording only) or Option B (revenue split changes)? | Agreed | "Option A. Invoice wording only. Revenue split stays eAuto RM6 / ezAUTO Asia RM14." |
| 2 | Finance sign-off | Agreed | "Nurul will update Marie that invoice will show RM18 + RM2." |
| 3 | Exact wording of the two lines | Agreed | "Line 1 "JomCheck service charge", line 2 "eAuto service charge"." |
| 4 | Should both lines use the same e-Invoice classification as today? | Open | "Pending." |
| 5 | Cutover: paid before go-live, approved after | Agreed | "Yes. Approval date decides. Approved after go-live gets 2 lines, even if paid before go-live." |
| 6 | Should UCD or BackOffice screens also show the breakdown? | Agreed | "No. Only invoice and e-Invoice change. Screens stay as today." |

Other dev statements in the doc:

1. "Today, each RM20 JomCheck fee is recorded as RM6 for eAuto and RM14 for ezAUTO Asia ... It became RM6 after the September price increase (EAINT-10089); before that it was RM4 + RM14 = RM18."
2. "the e-Invoice system already sends multi-line e-Invoices today (for example, Service Hub)."
3. "Before go-live: we will test a two-line JomCheck e-Invoice in the LHDN sandbox."
4. "Cancellations and refunds: JomCheck cancellations keep working as they do now."
5. "Other products: eSTM, insurance, APT and others share some e-Invoice code, but they will not change."
6. "Invoices before July 2025: these older printed invoices keep their one-line layout."
7. "the UCD screen still shows "RM20.00 + 8% Service Tax"."

## CONFLICT — line item names

| Source | Line 1 (RM18.00) | Line 2 (RM2.00) |
|---|---|---|
| SRD v1.0 PDF §2.2.2 item 2, REQ-002, REQ-003 | JomCheck service charge | eAuto service charge |
| BA answer table Q3 (29/09) | JomCheck service charge | eAuto service charge |
| Jira summary | JomCheck Service Charge | eAuto Service Charge |
| Jira description, row 5 (current) | JomCheck report | JomCheck service charge |
| Sample invoice 30/09 | JomCheck report | JomCheck service charge |
| Sample e-Invoice 30/09 | 022 JomCheck report | 022 JomCheck service charge |

The Jira SRD table says v0.3 (30/09) "Updated line item names and classification code". The SRD v1.0 PDF revision history lists only 0.1, 0.2, 1.0, with no v0.3 row. Likely cause: the v1.0 PDF was not regenerated after v0.3's renaming. This needs BA confirmation (Chee Mei Jia).

## CONFLICT — classification code

1. SRD v1.0 REQ-006: "Classification code for each line item follows existing JomCheck e-Invoice classification code. Pending confirmation from Finance."
2. Sample e-Invoice 30/09: both lines carry classification `022`.
3. Jira v0.3 row: "Updated ... classification code".

## Update 2026-10-15

1. New file: `EAINT-12412-SRD-v1.0-20260930-reupload-20261009.pdf` (+ `.txt`), Jira attachment 159431, re-uploaded by Chee Mei Jia 2026-10-09 09:35. Diff against the 2026-10-01 copy: adds the v0.3 revision row; §2.1.1 / §2.2.2 / REQ-002 / REQ-003 now read "JomCheck report" and "JomCheck service charge"; REQ-006 now reads "Both line items use classification code 022." 16 pages instead of 17.
2. Both CONFLICT sections above are resolved by that PDF: line 1 "JomCheck report", line 2 "JomCheck service charge", classification 022 on both lines. The Jira summary and BA answer Q3 are stale.
3. Teams since 01/10: briefing held 05/10 11:01–11:09 (recorded); Sia Zhong Tai is the dev PIC (added 06/10); ETA "will be done on Fri before EOD" (07/10 09:42), code review included (07/10 10:37); PDF re-upload notice 09/10 09:41.
4. Jira 2026-10-15: status Ready For Development, fix version "S34.X-20261020/21 🌞 TBC" (release 2026-10-20), QA field empty, no comments.
5. May Chin Mei Theng, eAuto QAs, 15/10 10:11: "EAINT-12412 - 1 + 1 = 2 days", target deploy 20 or 21 Oct.

## TS v2 — "New 19_10_26" workbook (2026-10-19)

Checked the 2026-10-15 TS against the legacy-CR knowledge study (finished 2026-10-16). New file: `New 19_10_26 - EAINT-12412 - ....xlsx` (also in OneDrive "20-21 October Items"). Original untouched. TS numbers kept; new rows TS08-TS10.

1. TS01, TS02, TS03, TS07: step "Wait until [e-Invoice] is shown" before clicking it [flow-jomcheck.md §9f item 4].
2. TS01 expected: e-Invoice totals use the e-Invoice labels (Subtotal / Total Excluding Tax / Tax Amount / Total Including Tax / Total Payable Amount) [sample e-Invoice 2026-09-30].
3. TS02 Wholesale rewritten: no login, chatbot as served dealer, match card "Book here or purchase JomCheck report", payment page, chatbot price "RM20 excluding SST" [flow-jomcheck.md §2; 14 Sep regression workbook "12279 JomCheck RM20"].
4. TS04 SST Payment Report rewritten to the legacy columns: Finance login, tick JomCheck, [Generate]; Amount 20.00 / Total Service Tax 1.60 / Total Amount 21.60 / EAUTO 6.00 / SST (8%) 0.48 + Grand Total [EAINT-10089 TS-008]. "ezAUTO Asia RM14.00" dropped — no such column in any legacy script (BA answer Q1 is the revenue split, not a report column).
5. TS06 expected 4: "Same UIN and Submission Date as the existing e-Invoice" (no negation).
6. TS07 steps: HubAdmin, Jomcheck Transaction Enquiry, Resubmit on the listing row, search until Approved, [View]; expected adds Approved + Action shows [View] only [flow-jomcheck.md §9g; EAINT-9203 v2 row 9].
7. New TS08 e-Invoice / Consolidated e-Invoice Listing totals [EAINT-10089 TS-009]; new TS09 Download Payment Document zip carries the 2-line PDFs [EAINT-7496; EAINT-10089 TS-011 — needed a dev patch to show the Download link, past weeks only]; new TS10 invalid-TIN UCD gets [Invoice] only, still 2 lines [EAINT-8550].

Not added (reported for review): Wholesale own e-invoice split (open), eSTM e-Invoice regression ([unconfirmed] dev statement), cancelled/refunded transactions (open in cr-ledger).

Automation (backend only): TS07 asserts Resubmit hidden after Approved; new TS10 spec (env `JOMCHECK_12412_TS10_VEHICLE_NO`, `JOMCHECK_12412_TS10_UCD_USERNAME`, `JOMCHECK_12412_TS10_UCD_PASSWORD`, passed through the route's generic vehicleEnvVars map). TS04, TS08, TS09 NOT automated: SST Payment Report, e-Invoice / Consolidated e-Invoice Listing and Download Payment Document pages have never been captured (not in the HubAdmin menu captures).

**Update 2026-10-19 (system chatbot answer, prod code — flows only, values ignored per Faizuddin):** added TS11 (paid JomCheck that ends Failed / Cancelled still issues an [Invoice] — check it splits) and TS12 (other products sharing the invoice builder, eSTM + Insurance, keep their layout); TS08 now also covers the Payment Breakdown Report (one row per transaction, not per line). Rows kept short (guide, not spec). Questions for BA/dev from the chatbot: which date is the cut-off (code decides by payment date; SRD says approval date — drives TS06/TS07); does the legacy in-house Tax Invoice (pre-cut-over) change; do re-downloads / resubmits of old transactions regenerate in 2 lines; is the change JomCheck-only or in the shared builder; credit notes; forward-only or back-fill.

**Update 2026-10-19 (Faizuddin: "yes make both changes"):** TS01 expected 6 is now "e-Invoice -> Total Payable Amount RM21.60" [SRD REQ-006 b] — the e-Invoice total labels/values from the sample PDF could not be read reliably. TS04 has "SST Payment Report -> ezAUTO Asia RM14.00" back [SRD out-of-scope item 3, line 125: "Revenue split recorded in system stays eAuto RM6 and ezAUTO Asia RM14."]. Status column follows the 12107 style (Not Started default, Pass / Fail / Not Started / In Progress dropdown, coloured).

**Faizuddin edited TS v2, 2026-10-19 (OneDrive copy is the master; repo copy synced):** TS02 expected now only the invoice / e-Invoice split (chatbot price, payment page, confirmation message removed); TS10 expected only the invoice split ("Only [Invoice]" and the TIN notation removed); rows auto-fitted. Rule recorded in knowledge/test-scripts.md "A TS is a guide". The TS10 automation still checks the missing e-Invoice button and the notation — now beyond the TS.

**Automation synced to the edited TS, 2026-10-19:** 12412_TS10 now checks only the 2-line invoice (no [e-Invoice]-absent wait, no TIN notation; timeout 15 min). New 12412_TS11 spec: Failed half automated (env `JOMCHECK_12412_TS11_FAILED_VEHICLE_NO`, a NEW Payment OK / Tx Failed transaction — make it with 12412_SETUP_FAILED after the push); Cancelled half runs only if `JOMCHECK_12412_TS11_CANCELLED_VEHICLE_NO` is given, else logged "not covered". No dashboard fields yet.

**First live run on uat1, 2026-10-19:** 12412_TS01 J600008537 / HXA0281A — invoice and e-Invoice both 2 lines, all amounts found (13/13, 14/14). Failed only on our own check: pdf-parse prints "022JOMCHECK REPORT" (code glued to the description), so `\b022\b` counted 0. Fixed in `utils/invoicePdf.ts` (`(?<!\d)022(?!\d)`, counts 2 on that e-Invoice, 0 on the invoice). Earlier run on `/eauto` (J600008536 / HXA0280A) was the wrong environment — 1-line invoice there.

**Run 3, uat1, 2026-10-19 (J600008538 / HXA0282A):** failed on our Invoice-vs-e-Invoice "same document" check; fixed to compare lines only, payment-reference pattern fixed, 022 checks removed per Faizuddin. See flow-jomcheck.md §9h item 5.

**022 restored, per line (2026-10-19):** "if its from the SRD, include it in the checking, but make sure the automation is able to check it properly". Each e-Invoice line must read 022 + its own description. Verified on 5 saved PDFs (right pass/fail on all).

**TS07 run, uat1, 2026-10-19:** J600008505 / HXA0250A (paid 15 Oct, resubmitted today → Approved). e-Invoice 2 lines, Invoice still 1 line — SRD REQ-001 Example 3 expects both 2 lines. Possible defect; to raise with dev. TS01, TS03, TS06 passed (J600008540, J600008539, J600008525).

## TS renumbered ascending — 2026-10-19

Faizuddin asked why the TS numbers were not in order (rows had kept their numbers and new rows were grouped by section). Renumbered in sheet order in the workbook (OneDrive master: `EAINT-12412 - … .xlsx`, the "New 19_10_26" name dropped by Faizuddin; QA "Faiz", TS01 Pass copied in from his pasted version), the automation test titles and env vars (`JOMCHECK_12412_TSnn_*`), and `/eauto/12412` (12 rows, section E, TS03 / TS04 input fields; UI ticks / picks key bumped to v2, test-data pool kept). Run folders and evidence from before the change keep the OLD names.

| Old | New | What |
|---|---|---|
| TS01 | TS01 | UCD new purchase |
| TS02 | TS02 | Wholesale |
| TS10 | TS03 | Invalid TIN |
| TS11 | TS04 | Paid, then Failed / Cancelled |
| TS03 | TS05 | BackOffice copies match UCD |
| TS04 | TS06 | SST Payment Report |
| TS05 | TS07 | MyInvois |
| TS06 | TS08 | Existing approved keeps 1 line |
| TS07 | TS09 | Existing failed, resubmitted |
| TS08 | TS10 | Finance reports |
| TS09 | TS11 | Download Payment Document |
| TS12 | TS12 | Other products |

**Update 2026-10-19:** TS03 expected item 4 "e-Invoice -> Not generated" added (invalid TIN = no e-Invoice; automation checks it). TS04 automation now creates its own Failed transaction through eSim (fresh vehicle no., VPN) — no typed Failed vehicle no.

**Update 2026-10-19:** Cancelled vehicle no. field removed from TS04 on the dashboard; the Cancelled case is manual (no known way to make a paid, cancelled JomCheck — open question for dev). A Failed JomCheck gets no e-Invoice even with a valid TIN — TS04 checks the Invoice only (no TS row / automation check added, per Faizuddin). flow-jomcheck.md §9h items 11–12.

**Cancelled settled 2026-10-19 (system chatbot, prod code):** a JomCheck transaction is never Cancelled (only New / Pending / Approved / Failed); the only cancel is Cancel Invoice in the SST Payment Report (finance users; reversal row; filter hides cancelled rows). TS04 = paid-then-Failed only: spec title, dashboard and (pending — workbook was open in Excel) workbook objective + step 7 updated. flow-jomcheck.md §9h item 12.
**Workbook done 2026-10-19:** TS04 objective now "…that ends Failed shows the fee in 2 lines on the invoice"; step 7 (Cancelled) removed. Dashboard: TS rows that drive eSim (TS04) now show the "eSim · VPN" tag and violet tint; the Run configuration VPN note names the eSim tests selected.

**Update 2026-10-19 (finance reports automated):** TS06 (BO SST Payment Report (JomCheck)), TS10 (BO e-Invoice / Consolidated e-Invoice Listing + UCD Payment Breakdown Report PDF) and TS11 (UCD Download Payment Document zip) now automated in `invoice-split-12412.spec.ts`; each takes a "New purchase, after deployment" record (env `JOMCHECK_12412_TS06/10/11_VEHICLE_NO`). TS11 skips while the purchase's week has not ended. New page objects `BoSstPaymentReportPage`, `BoEInvoiceListingPage`, `UcdReportsPage`; utils `zipReader.ts`, `datepicker.ts`. Not run live yet. Workbook TS12: Insurance has no e-Invoice, so step 3 split into eSTM Invoice + e-Invoice and Insurance Invoice / Receipt; expected result split the same way. flow-jomcheck.md §9h items 13–14.

**Update 2026-10-19 (TS12 eSTM automated):** `scripts/eauto-jomcheck/tests/estm-invoice-12412.spec.ts` (own project `estm-emulator`, Chrome local-network checks off) buys a new eSTM through the MyKad emulator (no URL bypass; Faizuddin: "use the emulator method"), random buyer email + mobile, eLKM + eVOC ticked, then downloads Invoice and e-Invoice and checks each document keeps one line as on the 28 Sep samples: eSTM 35.00/2.80/37.80, eLKM 2.75/0.22/2.97, eVOC 10.00/0.80/10.80, 022 on the e-Invoice. Dashboard TS12 row: vehicle no. (typed), MyKad NRIC / name (default 030217141005 / MUHAMMAD FAIZUDDIN BIN BIDI, from the step-3 capture). Insurance half stays manual. Not run live yet. Captures: `_reference/html/eauto/estm-step1-buyer-mykad-auth.html`, `estm-step3-seller-mykad-auth.html`.

**Update 2026-10-19 (eAuto Account login):** TS06 and TS10 log in to BackOffice with their own "eAuto Account username / password" row fields (default `eautoaccount`, env `JOMCHECK_12412_EAUTO_ACCOUNT_USERNAME/_PASSWORD`), not the shared BO login, so a bulk run keeps the BO login for TS05/TS08/TS09. Shared BO login default back to blank.

**Run status 2026-10-19 (from Faizuddin / run logs):** Passed — TS01, TS04, TS05, TS06, TS08, TS10. Failed — TS09 (EAINT-12554). Skipped — TS11 (week 18-24 Oct not ended; run from 25 Oct). TS12 eSTM — purchase + Invoice pass, e-Invoice not generated (UCD account TIN not updated). Not seen run — TS03.

**TS09 deprioritised 2026-10-20 (Faizuddin: "TS09 deprio"):** dashboard row blurred and cannot be ticked (`deprio: true` in `app/eauto/12412/page.tsx`). Spec and EAINT-12554 unchanged.

**TS12 MyKad by hand 2026-10-20 (Faizuddin: "just wait until the pages show next button. I will put my finger in the biometric and let it read it manually"):** TS12 only. Emulator removed from the run; Buyer and Seller Authentication wait up to 10 min each for `#continueButton` to be enabled, then click it. NRIC/name fields removed from the dashboard row. `pages/estm/mykadEmulator.ts` kept, unused.
