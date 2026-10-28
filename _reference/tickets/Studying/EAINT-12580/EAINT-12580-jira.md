# EAINT-12580 — Jira capture (27/10/2026, 11:41:45 am)

Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.

1. **Summary:** [eAuto - Insurance Cancellation] Copy of IC split saves watermark pieces instead of the IC as Front IC / Back IC
2. **Type:** Bug · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Boo Jin Siang · **QA (cf 10041):** Muhammad Amirul Azfar Bin Kamarulazam
4. **Fix versions:** S34.16-20261027🌞 (2026-10-27)
5. **Labels:** —
6. **Created:** 2026-10-21T20:24:28.675+0800 · **Updated:** 2026-10-27T10:54:04.073+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-27 · **ETA for Testing (cf 10057):** 2026-10-23
8. **Links:** Relates: EAINT-12022 🔴[eAuto-UCD] STMS - Insurance Cancellation (MyKad & MyPR)
9. **Sub-tasks:** EAINT-12647 [eAuto - UCD] STMS Step 5 Insurance Cancellation Pop-up - Copy of IC with the back above the front is split with the sides swapped (MyTentera card)
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | eAuto > STMS > Insurance Cancellation add-on |
| 2 | Affected Module | Copy of IC upload and the Front IC / Back IC images saved from it |
| 3 | Environment | Production |
| 4 | Browser | Not browser-specific (the IC is split after upload) |
| 5 | Related Ticket | - |
What is happening
When a seller uploads a Copy of IC with a watermark across the page (e.g. "For proton use only"), the system can save two pieces of the watermark as the Front IC and Back IC instead of the card. The upload is accepted with no error, and these wrong images are sent to the insurance partner.
Why it happens (in plain terms)
The system cuts the front and back out of the upload by looking for card-shaped areas. Watermark text can look like two cards, and nothing checks that the cut-out pieces are really the IC. The IC check reads the full upload, which is a genuine IC, so it passes.
Steps to reproduce
- Start an Insurance Cancellation and go to the Copy of IC upload.
- Upload one PDF with the IC front and back on one page and a text watermark repeated across it.
- Submit the documents.
- Open the saved Front IC and Back IC images for the case.
Actual result
The upload is accepted. The saved Front IC and Back IC show watermark text on blank paper instead of the IC.
Expected result
The Front IC shows the full photo side and the Back IC the full back, with nothing cut off. If both sides cannot be found with certainty, the upload is rejected with "Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy." Wrong images are never saved.
Impact
The partner receives unusable IC images, so the cancellation can be held up while the seller believes the upload succeeded. Staff must find these cases by hand. No amount is charged wrongly.
Additional Note
Testing also showed a card photographed on a table and a sideways photocopy are not found at all. An improved splitting method is being evaluated.
Reference for QA
Accuracy study, 294 test images: https://claude.ai/artifact/1tdcTq7Sre6bekTmDsZKWw
Key point for testing: a successful upload proves nothing - open the saved Front IC and Back IC and check they show the real card.

## Comments (0)

## Attachments
