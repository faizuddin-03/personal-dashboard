# 12406_CP_TS8 - BEFORE half, 28.10.2026 15:22 MYT

Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_12406_CP_TS8.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
Transaction ref: none (the quotation stopped at a pop-up; no transaction).

| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | Secarang > Home (`/ia/car-insurance`): insurer logos, left to right | **Lonpac, Tokio Marine**; no Allianz, no other insurer | `12406_CP_TS8_E1_home-insurer-logos.png`, `12406_CP_TS8_E1_home-full-page.png` (`12406_CP_TS8_E1_00-site-password-page.png`: the site password page shown first) |
| E2 | Private Car: plate HXA0001A, IC 900101-14-5671 (made up), postcode 55000 > Get quotation | **Not reached.** Pop-up: "Ops, there is no instant quotation available from our insurers for your car at the moment. Thank you for considering us for your car insurance needs. We look forward to serve you in future." No All Quotations page | `12406_CP_TS8_E2_01-home-form-filled-private-car.png`, `12406_CP_TS8_E2_02-popup-after-get-quotation.png` |
| E3 | About Us > Our partnership | "At SeCarang, Serba Sentral Sdn Bhd proudly presents offerings from various leading insurance providers. Additionally, to cater to diverse consumer needs, Serba Sentral Sdn Bhd collaborates with other partners for products from several key insurers, including Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad." | `12406_CP_TS8_E3_about-us-our-partnership.png`, `12406_CP_TS8_E3_about-us-full-page.png` |
| E4 | FAQs: all 20 questions of Topics 1-3 opened; "Which insurers can I get instant quotation from?" | Bulleted list: Lonpac Insurance Bhd; Tokio Marine Insurans (Malaysia) Berhad | `12406_CP_TS8_E4_faq-which-insurers-instant-quotation.png`, `12406_CP_TS8_E4_faq-all-questions-open-full-page.png` |
| E5 | Support > Need to contact insurance company?: every section opened | Two sections only. **Lonpac Insurance Bhd**: Road Assistance Hotline (24 Hours) 1300 88 1138; Customer Service 03 2262 8666; General Line 03 2262 8688 / 03 2723 7888. **Tokio Marine Insurans (Malaysia) Berhad**: Road Assist Hotline (24 Hours) 1800 88 1301 / 03 2053 5800; Customer Service Hotline 1800 88 0812 | `12406_CP_TS8_E5_support-need-to-contact-insurance-company-all-open.png`, `12406_CP_TS8_E5_support-full-page-all-open.png` |

Saved page texts for the AFTER comparison (E6): `12406_CP_TS8_page-texts-before.json` (Home, About Us, FAQ and Support
texts; logo order; open states; insurer names per page). Insurer names on Home / About Us / FAQ / Support: only Lonpac and
Tokio Marine (no Allianz, RHB, Chubb, Zurich, Takaful, Etiqa).

Not as the TS wording: step 2 says "Car tab"; the home form has Private Car / Company Car tabs only.
**E2 is blocked**: the same "no instant quotation" pop-up came back with a second team plate (HXA0003A, one diagnostic
try, not kept as evidence). The team doc (sec. 13) says these plates quote "with a real IC"; with the made-up IC the
simulator gives no quotation. Stopped as instructed; E2 needs the real-format IC the team uses on /ia/.

Run log (what the script read from the screen): `12406_CP_TS8_run-log-before.txt`.
