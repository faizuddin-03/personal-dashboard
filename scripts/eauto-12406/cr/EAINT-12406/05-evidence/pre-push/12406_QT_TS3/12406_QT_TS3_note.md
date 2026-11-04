# 12406_QT_TS3 - BEFORE half, 28.10.2026 15:21 MYT

Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_12406_QT_TS3.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
Transaction ref: none (pop-up; no transaction).

| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | Secarang > Company Car: plate HXA0002A, Company SSM No. 202501999999 (made up), postcode 55000 > Get quotation | Pop-up: "Sorry, we're unable to retrieve your vehicle information. Try again. Do reach out to us via email or chat if you find this particular to be inaccurate." No All Quotations page | `12406_QT_TS3_E1_01-home-form-filled-company-car.png`, `12406_QT_TS3_E1_02-popup-after-get-quotation.png` |

Not as the TS wording: the TS precondition asks for a REAL company SSM (Q12). With a made-up SSM the answer is the
"unable to retrieve" pop-up, as the team doc says for a fake SSM (sec. 3, 13). So this records today's answer for a
made-up company, not for a real company-owned car; it does not answer Q40. The site password page shows first (video).

Run log (what the script read from the screen): `12406_QT_TS3_run-log-before.txt`.
