# Writes the per-TS notes and the folder README for the BEFORE halves of 28.10.2026 (values read from the run logs).
import os

ROOT = 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/05-evidence/pre-push'

COMMON = """Staging: Secarang staging /ia/ (https://staging.secarang.com/ia/car-insurance) and CIBO staging
(https://staging.secarang.com/cibo), 28.10.2026, BEFORE Dev deploys EAINT-12406 (not deployed: Azfar, 28.10.2026).
One tab, one continuous video: `video_{ts}.webm` (1920x1080). Run by Claude for Azfar; QA: Azfar.
This is the BEFORE half only: **no result is given** (the TS result comes after the AFTER half).
"""
CIBO_PD = """Screenshots `...-blurred.png` and the listing row have the customer's name, IC, contact, car and payment details
blurred. `..._PERSONAL-DATA.png`, the receipt PDF in `downloadable (before)/` and the video show them unblurred: keep on
this PC, never commit or put on a board (`.gitignore` in the parent folder)."""

NOTES = {
"12406_CP_TS8": ("15:22 MYT", "none (the quotation stopped at a pop-up; no transaction)", """| Point | What was checked | Value seen | Evidence |
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
"""),
"12406_QT_TS3": ("15:21 MYT", "none (pop-up; no transaction)", """| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | Secarang > Company Car: plate HXA0002A, Company SSM No. 202501999999 (made up), postcode 55000 > Get quotation | Pop-up: "Sorry, we're unable to retrieve your vehicle information. Try again. Do reach out to us via email or chat if you find this particular to be inaccurate." No All Quotations page | `12406_QT_TS3_E1_01-home-form-filled-company-car.png`, `12406_QT_TS3_E1_02-popup-after-get-quotation.png` |

Not as the TS wording: the TS precondition asks for a REAL company SSM (Q12). With a made-up SSM the answer is the
"unable to retrieve" pop-up, as the team doc says for a fake SSM (sec. 3, 13). So this records today's answer for a
made-up company, not for a real company-owned car; it does not answer Q40. The site password page shows first (video).
"""),
"12406_RC_TS8": ("15:16 MYT", "BR55004010, BR44003678, BR3D003430", """| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = Allianz, Platform = Secarang, Search BR55004010 > Transaction Details > Receipt | Receipt Insurer: "Allianz General Insurance Company (Malaysia) Berhad (735426-V)" (the name wraps onto a second line inside the field; agent line "Exclusively by agent Serba Sentral Sdn Bhd, PIAM ID: 195379-01") | `12406_RC_TS8_E1_05-receipt-BR55004010-insurer-block.png`, `12406_RC_TS8_E1_04-receipt-BR55004010-full_PERSONAL-DATA.png`, `downloadable (before)/BR55004010_receipt_PERSONAL-DATA.pdf` |
| E2 | Transaction Details insurer box of BR55004010 (Insurance created, 09-05-2025), BR44003678 (Pending payment, 22-04-2024), BR3D003430 (Pending payment, 27-12-2023) | All three: Insurer "Allianz General Insurance Company (Malaysia) Berhad", **no company number**. BR44003678 and BR3D003430 have no Receipt button | `12406_RC_TS8_E2_01-listing-<ref>.png`, `12406_RC_TS8_E2_02-transaction-details-<ref>-blurred.png`, `12406_RC_TS8_E2_03-insurer-box-<ref>.png` for each ref |

Also seen: BR55004010 Cover Note No / Policy No "-"; BR3D003430 is "Pending payment" but the listing shows Payment
"Paid", cover note VQ732402, policy V6872750 and JPJ Accepted (existing data, not 12406).
"""),
"12406_RG_TS1": ("15:14 MYT", "BR69005852", """| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = TokioMarine, Search BR69005852 > Transaction Details insurer box | Insurer "Tokio Marine Insurans (Malaysia) Berhad 198601000381 (149520-U)": the number on the **same line** as the name, "(149520-U)" wrapping to a second line | `12406_RG_TS1_E1_01-listing-BR69005852.png`, `12406_RG_TS1_E1_02-transaction-details-BR69005852-blurred.png`, `12406_RG_TS1_E1_03-insurer-box-BR69005852.png` |
| E2 | Receipt of BR69005852 | Insurer on two lines: "Tokio Marine Insurans (Malaysia) Berhad" / "198601000381 (149520-U)" | `12406_RG_TS1_E2_05-receipt-BR69005852-insurer-block.png`, `12406_RG_TS1_E2_04-receipt-BR69005852-full_PERSONAL-DATA.png`, `downloadable (before)/BR69005852_receipt_PERSONAL-DATA.pdf` |
"""),
"12406_RG_TS2": ("15:15 MYT", "BR60006309", """| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = Lonpac, Platform = Secarang, Search BR60006309 > Transaction Details insurer box; Receipt | Transaction Details Insurer "Lonpac Insurance Berhad" (no number). Receipt Insurer "Lonpac Insurance Berhad (307414-T)" on one line | `12406_RG_TS2_E1_01-listing-BR60006309.png`, `12406_RG_TS2_E1_02-transaction-details-BR60006309-blurred.png`, `12406_RG_TS2_E1_03-insurer-box-BR60006309.png`, `12406_RG_TS2_E1_05-receipt-BR60006309-insurer-block.png`, `12406_RG_TS2_E1_04-receipt-BR60006309-full_PERSONAL-DATA.png`, `downloadable (before)/BR60006309_receipt_PERSONAL-DATA.pdf` |
"""),
"12406_RG_TS3": ("15:15 MYT", "BR55004008", """| Point | What was checked | Value seen | Evidence |
|---|---|---|---|
| E1 | CIBO > Transaction Management, Insurance Company = RHB, Search BR55004008 > Transaction Details insurer box; Receipt | Transaction Details Insurer "RHB Insurance Berhad" (no number). Receipt Insurer "RHB Insurance Berhad (38000-U)" on one line (agent Bintang Prospek Sdn Bhd, PIAM ID 192668-00) | `12406_RG_TS3_E1_01-listing-BR55004008.png`, `12406_RG_TS3_E1_02-transaction-details-BR55004008-blurred.png`, `12406_RG_TS3_E1_03-insurer-box-BR55004008.png`, `12406_RG_TS3_E1_05-receipt-BR55004008-insurer-block.png`, `12406_RG_TS3_E1_04-receipt-BR55004008-full_PERSONAL-DATA.png`, `downloadable (before)/BR55004008_receipt_PERSONAL-DATA.pdf` |

Also seen: this RHB receipt's footer shows an older Serba Sentral address (Mutiara Damansara, Petaling Jaya) where the
2026 receipts show Sunway Tower (existing data, not 12406).
"""),
}

for ts, (t, refs, body) in NOTES.items():
    txt = f"# {ts} - BEFORE half, 28.10.2026 {t}\n\n" + COMMON.format(ts=ts) + f"Transaction ref: {refs}.\n\n" + body
    if ts.startswith("12406_R"):
        txt += "\n" + CIBO_PD + "\n"
    txt += f"\nRun log (what the script read from the screen): `{ts}_run-log-before.txt`.\n"
    with open(os.path.join(ROOT, ts, f"{ts}_note.md"), "w", encoding="utf-8") as f:
        f.write(txt)

README = """# EAINT-12406 - BEFORE halves, 28.10.2026

BEFORE half of the pre-deploy TS, run on Secarang staging /ia/ and CIBO staging /cibo before Dev deploys EAINT-12406
(Azfar 28.10.2026: "for any of ts that you need to run before deployment you may run it now"). One folder per TS, each
with its note (`<TS>_note.md`), screenshots `<TS>_<point>_<what>.png`, one video `video_<TS>.webm`, a run log, and
receipts in `downloadable (before)/`. No result is given here: the TS result comes after the AFTER half.

| TS | Points captured | Blocked |
|---|---|---|
| 12406_CP_TS8 | E1, E3, E4, E5 (+ page texts for E6) | E2: no quotation with the made-up IC |
| 12406_QT_TS3 | E1 (made-up SSM: "unable to retrieve" pop-up) | real-company answer (Q12 / Q40) |
| 12406_RC_TS8 | E1, E2 | - |
| 12406_RG_TS1 | E1, E2 | - |
| 12406_RG_TS2 | E1 | - |
| 12406_RG_TS3 | E1 | - |

12406_RG_TS4 is deprioritised (Azfar, 28.10.2026) and was not run.

Personal data: `*PERSONAL-DATA*` files and the four CIBO videos (RC_TS8, RG_TS1-TS3) show customers' details and are
kept out of git by `.gitignore`. Never put them on a board or Jira as they are.

Scripts: `cr/EAINT-12406/03-spec/before-run/ts-before.mjs <TS>`; AFTER half: `PHASE=after EVID_DIR=<new folder>`.
"""
with open(os.path.join(ROOT, "README.md"), "w", encoding="utf-8") as f:
    f.write(README)
print("ok")
