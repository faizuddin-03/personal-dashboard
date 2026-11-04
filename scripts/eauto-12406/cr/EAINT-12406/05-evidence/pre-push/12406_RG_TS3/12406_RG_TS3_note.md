# 12406_RG_TS3 - BEFORE half, 28.10.2026 15:15 MYT

Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_12406_RG_TS3.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
Transaction ref: BR55004008.

| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = RHB, Search BR55004008 > Transaction Details insurer box; Receipt | Transaction Details Insurer "RHB Insurance Berhad" (no number). Receipt Insurer "RHB Insurance Berhad (38000-U)" on one line (agent Bintang Prospek Sdn Bhd, PIAM ID 192668-00) | `12406_RG_TS3_E1_01-listing-BR55004008.png`, `12406_RG_TS3_E1_02-transaction-details-BR55004008-blurred.png`, `12406_RG_TS3_E1_03-insurer-box-BR55004008.png`, `12406_RG_TS3_E1_05-receipt-BR55004008-insurer-block.png`, `12406_RG_TS3_E1_04-receipt-BR55004008-full_PERSONAL-DATA.png`, `downloadable (before)/BR55004008_receipt_PERSONAL-DATA.pdf` |

Also seen: this RHB receipt's footer shows an older Serba Sentral address (Mutiara Damansara, Petaling Jaya) where the
2026 receipts show Sunway Tower (existing data, not 12406).

Screenshots `...-blurred.png` and the listing row have the customer's name, IC, contact, car and payment details
blurred. `..._PERSONAL-DATA.png`, the receipt PDF in `downloadable (before)/` and the video show them unblurred: keep on
this PC, never commit or put on a board (`.gitignore` in the parent folder).

Run log (what the script read from the screen): `12406_RG_TS3_run-log-before.txt`.
