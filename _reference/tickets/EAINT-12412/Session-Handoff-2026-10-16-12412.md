# Session handoff — 2026-10-16 (EAINT-12412)

Scratch note for resuming later. Not part of the knowledge base; safe to
delete once picked back up. First handoff for this ticket (nothing superseded).

Source: session `5bc476be-b14d-4ce5-8000-15e7460f4168` (2026-10-15 06:41 to
2026-10-16 10:21 UTC), plus `git status`. Nothing was committed; all 12412
files are uncommitted/untracked on branch `staging-local`.

## One-liner

JomCheck invoice and e-Invoice split the RM20 fee into two lines: "JomCheck
report" 18.00 / SST 1.44 / 19.44 and "JomCheck service charge" 2.00 / 0.16 /
2.16, both classification code 022. Totals unchanged (20.00 / 1.60 / 21.60).
Cut-off is the approval date (SRD REQ-001).

## Status as of 2026-10-16

1. Faizuddin picked up the ticket on 2026-10-15 ("study 12412. another agent has done it. can check. i want you to pick this ticket up").
2. Jira: Ready For Development, QA field empty (checked 2026-10-15). Release S34.X 20/21 Oct. Estimate "1 + 1 = 2 days" (May Chin, eAuto QAs, 15/10 10:11).
3. Automation built for TS01, TS03, TS06, TS07 plus two setups. Not run live. Type, lint and Playwright test-listing checks pass (6 "12412_" tests listed).
4. Dev change is not on staging yet. Test environment not given.

## What was done (2026-10-15)

1. **Study refreshed** in `lib/ticketStudies.ts` (studiedAt 2026-10-15). Line names and code 022 settled from the 2026-10-09 SRD re-upload. Open items: environment, MyInvois login, Wholesale chatbot. Related now includes EAINT-12386.
2. **Specs** in `scripts/eauto-jomcheck/tests/`:
   1. `invoice-split-12412-setup.spec.ts`: `12412_SETUP_APPROVED` (fresh vehicle, saves the 1-line "before" PDFs) and `12412_SETUP_FAILED` (eSim Result = Failed, VPN, restored after).
   2. `invoice-split-12412.spec.ts`: TS01, TS03, TS06, TS07.
3. **Utils**:
   1. `utils/invoicePdf.ts`: downloads Invoice / e-Invoice, parses PDF text, checks line names, nine amounts, code 022 per line, UCD-vs-BO match.
   2. `utils/pdfHighlight.ts`: saves `<label>-checked.png` beside each PDF with red boxes on checked items. Verified on the SRD sample PDFs: 13/13 (invoice) and 14/14 (e-Invoice).
4. **Page objects**: UCD and BO JomCheck details pages gained download, e-Invoice wait and LHDN status methods. `BoJomCheckTransactionEnquiryPage` gained `resubmitLink()` (`a.to-resubmit`) and `resubmitRow()`. The earlier BO details-page `resubmit()` guess was removed.
5. **Config** (`data/config.ts`): `eInvoiceApprovalTimeout` 10 min, `eInvoicePollInterval` 15 s, `invoiceDownloadTimeout` 60 s, `resubmitProcessingTimeout` 5 min.
6. **Dashboard** `app/eauto/12412/page.tsx` with routes `app/api/eauto-12412/{run,download-all,history}`. Has a "How this works" guide, a test data pool (setups add records; TS rows pick one), and "How many" fields using new `components/NumericTextInput.tsx`. Catalogued in `lib/ticketAutomations.ts` (coverage 4/7).
7. **Resubmit location corrected**: Faizuddin pasted the BO page: "the resubmit button is here, not after BO user click 'View'". It is in the BO Transaction Enquiry listing Action column. Saved at `_reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html`. `knowledge/flow-jomcheck.md` §9e, §9f, §9g updated.
8. **Standing rules added** (knowledge/automation-testing.md, skill eauto-automation-scaffold, memory):
   1. Test-data setups fill a pool; the record is picked on the TS row, never auto-linked.
   2. Never inject values; act like a person. Existing violators listed only, not fixed.
   3. Number fields are plain text, digits only, clearable.
9. **EOD (other work in the same session)**: EOD page for 12107 / 12327 / 12412 at https://claude.ai/artifact/H4FvDVH5QbUQALNh8zgWaT, statuses left blank for Faizuddin. Template saved 2026-10-16 to `knowledge/eod-update.md`. 12107 and 12327 had no other work this session.

## Not automated

1. TS02: Wholesale chatbot, no UI flow known.
2. TS04: SST Payment Report, page never captured.
3. TS05: MyInvois, no sandbox login known. TS06 / TS07 print the e-Invoice UIN and Submission Date for the manual check.

## Open items (waiting on Faizuddin unless stated)

1. Environment base URL for 12412. Faizuddin: "i will give the environment latet".
2. What appears after clicking Resubmit. `resubmitRow()` handles a native confirm, a jQuery UI confirm and an OK dialog, and logs them as "Prompts after Resubmit". `[unconfirmed]`
3. Whether the resubmitted row keeps its transaction no. (assumed) or a new row appears. `[unconfirmed]`
4. Which environment the `/eauto` capture came from (earlier captures used `/uat1`).
5. Whether non-HubAdmin BO roles see Resubmit. Capture was HubAdmin "Ong Hong Kee". Ask dev (Sia Zhong Tai) or Mei Jia.
6. TS07 stays marked `unconfirmed` on the dashboard until items 2 to 5 are answered.
7. `[unconfirmed]` pdf-parse may place "JOMCHECK REPORT" elsewhere on a 1-line invoice, which would fail TS06 wrongly. Check the first TS06 PDF text in the log.
8. Carried from the study: MyInvois sandbox login (TS05), Wholesale chatbot env (TS02).

## Next steps

1. Run `12412_SETUP_APPROVED` and `12412_SETUP_FAILED` BEFORE the dev push. Records approved before deployment cannot be made afterwards (REQ-001).
2. Set the base URL once Faizuddin gives the environment.
3. After the push, run TS01, TS03, TS06, TS07 from `/eauto/12412`, picking pool records on each TS row.
4. On the first TS07 run, capture the page after Resubmit and save the HTML.
5. Review the `-checked.png` evidence on the first live PDFs.
