# 12406_RG_TS1 - BEFORE half, 28.10.2026 15:14 MYT

Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_12406_RG_TS1.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
Transaction ref: BR69005852.

| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = TokioMarine, Search BR69005852 > Transaction Details insurer box | Insurer "Tokio Marine Insurans (Malaysia) Berhad 198601000381 (149520-U)": the number on the **same line** as the name, "(149520-U)" wrapping to a second line | `12406_RG_TS1_E1_01-listing-BR69005852.png`, `12406_RG_TS1_E1_02-transaction-details-BR69005852-blurred.png`, `12406_RG_TS1_E1_03-insurer-box-BR69005852.png` |
| E2 | Receipt of BR69005852 | Insurer on two lines: "Tokio Marine Insurans (Malaysia) Berhad" / "198601000381 (149520-U)" | `12406_RG_TS1_E2_05-receipt-BR69005852-insurer-block.png`, `12406_RG_TS1_E2_04-receipt-BR69005852-full_PERSONAL-DATA.png`, `downloadable (before)/BR69005852_receipt_PERSONAL-DATA.pdf` |

Screenshots `...-blurred.png` and the listing row have the customer's name, IC, contact, car and payment details
blurred. `..._PERSONAL-DATA.png`, the receipt PDF in `downloadable (before)/` and the video show them unblurred: keep on
this PC, never commit or put on a board (`.gitignore` in the parent folder).

Run log (what the script read from the screen): `12406_RG_TS1_run-log-before.txt`.
