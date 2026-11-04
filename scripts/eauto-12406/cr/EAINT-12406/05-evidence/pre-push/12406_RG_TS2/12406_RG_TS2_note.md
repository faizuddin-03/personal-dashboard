# 12406_RG_TS2 - BEFORE half, 28.10.2026 15:15 MYT

Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_12406_RG_TS2.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
Transaction ref: BR60006309.

| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = Lonpac, Platform = Secarang, Search BR60006309 > Transaction Details insurer box; Receipt | Transaction Details Insurer "Lonpac Insurance Berhad" (no number). Receipt Insurer "Lonpac Insurance Berhad (307414-T)" on one line | `12406_RG_TS2_E1_01-listing-BR60006309.png`, `12406_RG_TS2_E1_02-transaction-details-BR60006309-blurred.png`, `12406_RG_TS2_E1_03-insurer-box-BR60006309.png`, `12406_RG_TS2_E1_05-receipt-BR60006309-insurer-block.png`, `12406_RG_TS2_E1_04-receipt-BR60006309-full_PERSONAL-DATA.png`, `downloadable (before)/BR60006309_receipt_PERSONAL-DATA.pdf` |

Screenshots `...-blurred.png` and the listing row have the customer's name, IC, contact, car and payment details
blurred. `..._PERSONAL-DATA.png`, the receipt PDF in `downloadable (before)/` and the video show them unblurred: keep on
this PC, never commit or put on a board (`.gitignore` in the parent folder).

Run log (what the script read from the screen): `12406_RG_TS2_run-log-before.txt`.
