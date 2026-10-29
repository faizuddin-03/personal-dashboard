# EAINT-12327 — study notes (2026-10-15)

## Files in this folder

| File | Source | Note |
|---|---|---|
| `EAINT-12327-SRD-v1.0-20260917.pdf` (+ `.txt`) | Jira attachment 157178, `SRD_EAINT-12327_v1.0_20260917.pdf` | Baseline SRD, 16 pages, author Lim Yi Link. Text extracted with `pdftotext -layout`. The 7 format strings in §2.2.4 did not survive text extraction; they are in the Jira description, row 3. |

Not downloaded: `SRD_EAINT-12327_v0.1_20260917.docx` (157179), `SRD_EAINT-12327_v1.0_20260917.docx` (157177).

Download method: navigate Chrome to `https://mfservices.atlassian.net/secure/attachment/<id>/<filename>`; files land in `Downloads\Chrome\`.

## Jira (2026-10-15)

1. Status Ready For Development. Assignee and reporter Lim Yi Link. No comments. Fix version "S34.X-20261020/21 🌞 TBC", release date 2026-10-20. Links: "relates to" EAINT-12107.
2. Description row 3, Request (verbatim): "Enhance the Payment Mode column in the transaction listing and Payment Report to display the payment management format as below: BoldPay | eWallet – TouchNGo BoldPay | Online Banking – FPX-Bank Name BoldPay | Credit/Debit Card – MBBMGATE_MS Fiuu | eWallet – ShopeePay – Full Amount – Single Payment Fiuu | eWallet – ShopeePay – BNPL – Installment Fiuu | eWallet – GrabPay – Full Amount – Single Payment Fiuu | eWallet – GrabPay – BNPL – Installment".
3. Description row 5, Expected (verbatim): "Add a new Payment Mode column to item 1 and item 2. Place the new column after the Payment column and before the Discount Code column, following the same column order in the exported file. Update the existing Payment Mode display value in item 3 and item 4."
4. Description row 6: "Key reason for the request: to analyse which group of users the payment under Secarang comes from. Refer to source ticket ESI-355."

## Teams — CR group chat "EAINT-12327 ⚪[CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report"

1. Yi Link Lim, 18/09/2026 21:35: "Since no one is joining the session, we will reschedule the session to next Monday 1045AM ya".
2. Yi Link Lim, 24/09/2026 14:22: "Hi Everyone lets have the briefing session later around 330PM ya".
3. Yi Link Lim, 25/09/2026 10:00: "hi all, lets have a briefing session on this ticket later at 11am ya. if no one is attending, will record the session for reference as this is a small ticket."
4. 25/09/2026 11:43–11:51: briefing recorded (7m 37s, saved to Yi Link Lim's OneDrive, transcript available in the chat).
5. Mei Jia Chee, 28/09/2026 09:02: "bcz no one joining the briefing and she on leave this whole week."
6. Goh Kai Jiaeh, 28/09/2026 09:32: "hi Kasheng Liew, I think this ticket you somehow already done when working on EAINT-12107. Could help to cross check?"
7. Kasheng Liew, 28/09/2026 13:21: "cross checked 12327, not done yet. transaction listing and payment report both untouched on latest staging, need frontend and backend. 12107 got some parts can reuse, will share with dev in charge"
8. Goh Kai Jiaeh, 28/09/2026 14:09: "Fyi, Kar Kin will help on this ticket." (Wong Kar Kin added to the chat.)
9. Kasheng Liew, 01/10/2026 10:35: "hi, i will takeover this ticket from Kar Kin ya, he handled over to me". Last message in the chat as of 2026-10-15.

## Teams — EAINT-12107 chat (deployment slot for both tickets)

1. Mei Jia Chee, 07/10/2026 11:54: "hii Kasheng Liew, can help to advise this CR & EAINT-12327 can deploy in morning session or must proceed night deployment ya?"
2. Kasheng Liew, 07/10/2026 12:55: "can deploy in morning ya".

## Teams — eAuto QAs chat (the testing ask)

May Chin Mei Theng, 15/10/2026 10:11 (verbatim): "Muhammad Faizuddin Bin Bidi as discussed, please study the following tickets and let me know if the estimated testing mandays work for you and if we're able to target these tickets to deploy on 20th or 21st Oct next week / EAINT-12107 - 1 + 1 = 2 days / EAINT-12327 - test together with 12107 / EAINT-12412 - 1 + 1 = 2 days / Note: you can refer the high level test scope in the QA Portal for reference".

## Open points

1. Staging build date: unknown. Dev not started as of 28/09; Kasheng took over 01/10; Jira still Ready For Development.
2. Historical rows: REQ-001 says "Existing and new transactions display the Payment Mode value in the format below" but gives no back-fill rule.
3. Test data: 7 payment modes need one transaction each. Only GrabPay Full Amount is live-testable in the Fiuu sandbox (EAINT-12107 SRD §2.2.8); the rest need dev data patching.
4. QA Portal high-level test scope: not read this session (no URL in the repo).

## Combined with EAINT-12107 — 2026-10-15

Execution copy is the combined workbook in `_reference/tickets/EAINT-12107/` (`EAINT-12107 + EAINT-12327 - Combined TS - ...xlsx`), rows 20-27 = 12327_TS01..TS08 mapped onto the 12107 transactions (TS01 GrabPay Full Amount, TS03-05 patched ShopeePay / SPayLater / PayLater by Grab, existing BoldPay rows for TouchNGo / FPX / Card). The generated 7-column workbook in this folder is the standalone copy. See the 12107 NOTES for the row-by-row mapping.
