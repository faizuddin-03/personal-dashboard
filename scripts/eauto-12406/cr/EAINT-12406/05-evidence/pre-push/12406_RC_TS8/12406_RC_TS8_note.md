# 12406_RC_TS8 - BEFORE half, 28.10.2026 15:16 MYT

Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_12406_RC_TS8.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
Transaction ref: BR55004010, BR44003678, BR3D003430.

| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = Allianz, Platform = Secarang, Search BR55004010 > Transaction Details > Receipt | Receipt Insurer: "Allianz General Insurance Company (Malaysia) Berhad (735426-V)" (the name wraps onto a second line inside the field; agent line "Exclusively by agent Serba Sentral Sdn Bhd, PIAM ID: 195379-01") | `12406_RC_TS8_E1_05-receipt-BR55004010-insurer-block.png`, `12406_RC_TS8_E1_04-receipt-BR55004010-full_PERSONAL-DATA.png`, `downloadable (before)/BR55004010_receipt_PERSONAL-DATA.pdf` |
| E2 | Transaction Details insurer box of BR55004010 (Insurance created, 09-05-2025), BR44003678 (Pending payment, 22-04-2024), BR3D003430 (Pending payment, 27-12-2023) | All three: Insurer "Allianz General Insurance Company (Malaysia) Berhad", **no company number**. BR44003678 and BR3D003430 have no Receipt button | `12406_RC_TS8_E2_01-listing-<ref>.png`, `12406_RC_TS8_E2_02-transaction-details-<ref>-blurred.png`, `12406_RC_TS8_E2_03-insurer-box-<ref>.png` for each ref |

Also seen: BR55004010 Cover Note No / Policy No "-"; BR3D003430 is "Pending payment" but the listing shows Payment
"Paid", cover note VQ732402, policy V6872750 and JPJ Accepted (existing data, not 12406).

Screenshots `...-blurred.png` and the listing row have the customer's name, IC, contact, car and payment details
blurred. `..._PERSONAL-DATA.png`, the receipt PDF in `downloadable (before)/` and the video show them unblurred: keep on
this PC, never commit or put on a board (`.gitignore` in the parent folder).

Run log (what the script read from the screen): `12406_RC_TS8_run-log-before.txt`.
