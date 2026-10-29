# EAINT-12647 — Jira capture (27/10/2026, 9:06:56 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** [eAuto - UCD] STMS Step 5 Insurance Cancellation Pop-up - Copy of IC with the back above the front is split with the sides swapped (MyTentera card)
2. **Type:** QA-Issue · **Status:** Done · **Priority:** Medium
3. **Assignee:** Muhammad Amirul Azfar Bin Kamarulazam · **Reporter:** Muhammad Amirul Azfar Bin Kamarulazam · **QA (cf 10041):** Muhammad Amirul Azfar Bin Kamarulazam
4. **Fix versions:** —
5. **Labels:** —
6. **Created:** 2026-10-26T14:05:56.882+0800 · **Updated:** 2026-10-26T16:25:41.376+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** EAINT-12580 [eAuto - Insurance Cancellation] Copy of IC split saves watermark pieces instead of the IC as Front IC / Back IC

## Description

Testing Environment: staging/uat3 (IC split service 172.30.202.23:8000, called directly)
Browser: Google Chrome
Module: eAuto > UCD > STMS > Create STMS > Step 5 > Insurance Cancellation pop-up > Copy of IC
Staging Test: (file "Tentera S06 - Back ABOVE front (reversed order).pdf" from Dev's own test set, request_id efe1ddf3-393b-4363-8f9b-e159fce2c1e5, 26-10-2026 10:20am) One page with the back of the MyTentera card above the front, sent to the IC split the way the UCD sends it.
| Item / Step to Simulate | Actual Result | Expected Result |
| Back above front, MyTentera card  - Take the file "Tentera S06 - Back ABOVE front" (back of the card on top, front below, one page). - Send it to the IC split (POST /v1/split/identity-card, output_format empty). - Open the two images returned. | - Two sides found, confidence 0.99, no error. - The "front" image is the back of the card and the "back" image is the front. - See screenshot 1 below. | - The front image shows the photo side and the back image shows the back, whatever order they are on the page. Per EAINT-12580 "Expected result": wrong images are never saved. - The same layout with a MyKad comes back correct (screenshot 2, and paid end to end on staging/uat3). - See screenshot 2 below. |
Note: the front box was placed on the top card, so the side looks decided by position on the page, not by what the card shows. Only seen with the MyTentera card.
Screenshot 1 - Actual: Tentera S06 (back above front) - the image returned as FRONT is the back of the card, the image returned as BACK is the front

Screenshot 2 - Expected: the same layout with a MyKad (MyKad S06) - the front image shows the photo side, the back image shows the back

## Comments (1)

### Muhammad Amirul Azfar Bin Kamarulazam — 2026-10-26T16:04:28.693+0800

Tested and verified on staging/uat3: 
- Retested on 26-10-2026 on the IC split (file "Tentera S06 - Back ABOVE front", request 0db92ba9-415d-4627-bbbf-6a48ba09057e).
- Tentera S06: front image = front of the card, back image = back. Fixed.
- MyKad S06: same layout, still correct.
- Regression: plain copy, watermark page, tiled watermark, stamp over the corner, side by side, crooked and upside down still split correctly on both card sets; front only and two people's cards still refused.
- Whole flow: MyKad back above front paid end to end on staging/uat3 (ON000204). Kept Copy of IC: page 1 front, page 2 back.
Screenshots in Attachments: "Retest 1 - Tentera S06 back above front - sides correct after the fix", "Retest 2 - MyKad S06 back above front - still correct", "Retest 3 - regression sample - 7 shapes on both sets still split correctly", "Retest 4 - whole flow uat3 ON000204 - kept Copy of IC page 1 front, page 2 back".

## Attachments

1. Retest 1 - Tentera S06 back above front - sides correct after the fix.png — 617564 bytes, 2026-10-26T16:25:09.003+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Retest 2 - MyKad S06 back above front - still correct.png — 852686 bytes, 2026-10-26T16:25:09.860+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Retest 3 - regression sample - 7 shapes on both sets still split correctly.png — 1640426 bytes, 2026-10-26T16:25:10.874+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Retest 4 - whole flow uat3 ON000204 - kept Copy of IC page 1 front, page 2 back.png — 255997 bytes, 2026-10-26T16:25:11.726+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Screenshot 1 - Actual - Tentera S06 back above front - sides swapped.png — 608945 bytes, 2026-10-26T14:09:10.178+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Screenshot 2 - Expected - MyKad S06 same layout - sides correct.png — 856747 bytes, 2026-10-26T14:09:10.330+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Tentera S06 - API answer.json — 2301 bytes, 2026-10-26T14:09:28.863+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Tentera S06 - image returned as BACK.jpg — 74422 bytes, 2026-10-26T14:09:28.869+0800, by Muhammad Amirul Azfar Bin Kamarulazam
1. Tentera S06 - image returned as FRONT.jpg — 83589 bytes, 2026-10-26T14:09:28.873+0800, by Muhammad Amirul Azfar Bin Kamarulazam