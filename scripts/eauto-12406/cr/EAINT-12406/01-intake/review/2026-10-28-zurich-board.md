# EAINT-12406 draft v3 against the team's Zurich board (EAINT-8606 / 8608)

28.10.2026. Board https://miro.com/app/board/uXjVGih1g4s=/ ("eAuto & Secarang - Zurich"), copied read-only to
`cr/EAINT-12406/00-input/miro-zurich-8608/` (README there). Compared with `01-intake/scenarios.yaml` v3 (44 TS,
RG_TS4 deprioritised by Azfar 28.10), STATUS.md, the team doc `00-input/secarang-cibo-qa-knowledge-doc.txt`, the SA
brief and SRD v1.1 (`01-intake/raw/srd.md`).

Ground rules for this review:
- Zurich was a **new insurer onboarding** on eAuto and Secarang. 12406 is a **re-activation of Allianz on Secarang only**
  (off May 2025, removed from screens Sept 2025). eAuto rows do not carry over (Azfar 28.10: "eAuto and Secarang are
  different systems").
- The board decides **what** to look at. Expected results come only from SRD v1.1. Where the SRD is silent the item
  says "highlight for the QA" and names the question. Board text is never an expected result (rule 1).
- Nothing in scenarios.yaml, the workbook or the TS board was changed.

---

## 1. How the team tested Zurich

### Who, when, where
- Tickets: "EAINT-8606 (eAuto), EAINT-8608 (Secarang)" (overview frame). Board created 14.04.2026, last edited 03.08.2026.
- "UAT session: 29 & 30 April"; "Target Deployment Date: 14th May 2026". Cron rows say "To monitor on 04-06-2026".
  A Teams screenshot on the board is dated 05/05/2026. So testing ran about mid-April to early June 2026.
- QAs (colour table t04 / t05): **Azfar** (Chrome, Main UCD), **Faiz** (Faizuddin; Firefox 36.0.4, Sub UCD),
  **Teck Yung** (Chrome, Main UCD). Secarang functional and UI rows were run mostly by Faiz; CIBO rows (CIB_TS1–7),
  cron jobs and most insurance-sequence rows by Azfar.
- Environments: eAuto before / after on **staging/eauto** vs **staging/sit3** (the Zurich branch; EXT_TS1–6).
  Secarang: the board does not name the path; the team doc §2 says "The EAINT-8608 Zurich branch was on /preprod".
- The team doc §14 puts EAINT-8608 at 15 QA man-days; STATUS of 8608 in Jira is still "Testing In 1st Env" (study).

### Sheets / sections and TS counts

| Portal | Section (board strip / table) | TS | Result on the board |
|---|---|---|---|
| **eAuto** | Directory t02 (E2E Comprehensive 10, TPFT 10, Get A Free Quote 2, Plan Details & More Info 6, Optional Coverage 8, UCD Homepage 2, UCD Insurance Transaction Listing 14, Insurance Payment Report 21, Monthly Handling Fee Report 2, BO Insurance Transaction Listing 13, BO Insurance Quote Enquiry 8, Refer Risk Error 8, Insurance API Down 4, Insurance Sequence Car 6 / Motorbike 4, Cron Jobs 4, Regression 5, Existing Insurance Transactions 4, Hire Purchase Record B / T 3 + Active 1) | **133** | 83 passed (51.13%) at the board's last count |
| **Secarang** | Directory t03 (E2E Comprehensive 12, TPFT 12, Optional Coverage Car 6 / Motorbike 2, Home Page Car 4 / Motorbike 4, Plan Details & Excess Info 4 × 3, Additional Functions 11, Text Display Car 6 / Motor 6). On the board: SC_E2E_TS1–28 texts, t17 Optional Coverage (9), t19 Additional Functions (11), t22 Home Page (8), t23 Plan Details & Excess Info (15 rows), t27 / t28 UI text (6 + 6) | **75** | 49 passed. SC_E2E: 9 ✅, 1 ❌ (TS9 "All Add-Ons"), 18 unmarked |
| **CIBO** | t06 Transaction Management listing (CIB_TS1–7) + the "REMEMBER" list (CRM, Transaction Management, Payment Report, Commission Report) checked inside each Secarang E2E | **7** | 7 Pass (Azfar) |

### Test data and set-up
- **eAuto**: eSim. Usage code / body type set per vehicle (AB / MKR fuel car, AA / MSL motorbike, EV / EV); eSTM Step 4→5
  JPJ enquiry forced to fail with **VEL000069E** to enter the FI flow (all insurers) vs non-FI (top two, 10% discount);
  RHB payment response code **IF** for a failed payment; VN prefixes **ZA** (cover note failed), **ZB** (JPJ pending),
  ZV (Total Loss, Service Portal); "Check with dev on how to simulate" for cover note / JPJ rejected; some rows
  "Need to patch IC". Plates seen: JVJ6453, AKP9515, QRJ6589, QAB7519D, CDY6816, QTN5213, QRL9787 (NCD).
- **Secarang**: home form (Private / Company tab, plate, IC or SSM, postcode); failed payments "choose the appropriate
  response in the Fiuu sandbox"; payment options "Credit/Debit Card or FPX" (mind map); discount code YEAY7;
  invalid postcodes 00000, Sabah 88000–91309, Sarawak 93000–98859, Pulau Perhentian 22300, Langkawi 07000 ("West
  Malaysia only"). No Secarang plates are recorded. Simulator vs real Zurich API is not stated for Secarang.
- RHB e-Certificate (eAuto/Secarang, old): retrieved through an RHB UAT mailbox / "request developer to obtain softcopy".
- Scope cuts by chat (images on the board): "EV car won't be included in this phase. Can skip the testing for this part"
  (Goh Kai Jiaeh, Dev); Secarang "car" wording changed to vehicle-type + category for Zurich motorbike (05/05/2026).

### Payment channels, cover note, JPJ, WhatsApp
- eAuto: RHB payment (PAY NOW), failed → Step 4 [Try Again] → Step 3 (COM_TS7/8, TPFT_TS7/8, "hit fail multiple
  times"); cover note failed → "Ensure that Policy not generated in both UCD and BO" (COM_TS9/10, TPFT_TS9/10);
  JPJ rejected → "Submission Status to JPJ = Failed, JPJ = Rejected, Status = Insurance Created" (COM_TS11/12,
  TPFT_TS11/12); cron jobs t15: quotation expired after 24 h, JPJ status enquiry every 2 min (9 am–11.59 pm), cover
  note resubmission every 30 min when "Insurance status = failed but payment = Paid".
- Secarang: Fiuu sandbox, failed then successful ("Unsuccessful payment. You may try again") in SC_E2E_TS10, 12, 24, 26.
  After payment: "Download the receipt to verify the details are correct; Check email and WhatsApp to verify the
  details are correct; Ensure the PIAM ID is MTA-J55282" (Zurich's agent). Mind map Step 6: WhatsApp, Email
  (downloadable + email receipt) and CIBO (CRM, Transaction Management, Payment Report, Commission Report) must match
  the Success page. No cover-note-failed or JPJ-rejected row on the Secarang side.

---

## 2. Secarang / CIBO checklist from the Zurich board vs 12406 v3

Legend: **(a)** covered by a 12406 TS · **(b)** missing and applies to a re-activation (proposal) · **(c)** onboarding-only
or eAuto-only, does not carry over.

### Home form and vehicle details (t22, t27, t28, mind map)
| Zurich item | Mark | 12406 / why |
|---|---|---|
| Home popups: VN / IC mismatch, active insurance > 2 months ("You may renew as early as 2 months"), invalid postcode, invalid VN (TS_SHP_1–8) | (c) | Insurer-independent home-form checks, not changed by 12406; Home is compared before / after in CP_TS8 |
| UI text Car / Motorbike (TS_SUIC / TS_SUIM: titles, progress bar, footer, back button) | (c) | Onboarding-only: the "car" → "vehicle" wording was a Zurich-motorbike change (Teams 05/05/2026 on the board) |
| Car plate through the motorbike tab and back (SC_E2E_TS14, TS28) | (c) | Insurer-independent |
| Invalid postcodes Sabah / Sarawak / Perhentian / Langkawi, change back to West Malaysia (SC_E2E_TS11, 25) | (c) | Postcode validation happens before any insurer; unchanged |

### All Quotations (Step 2)
| Zurich item | Mark | 12406 / why |
|---|---|---|
| Insurer cards displayed, in order | (a) | QT_TS1–TS6, QT_TS9 (REQ-003 / REQ-004) |
| Card content per insurer (coverage type, "Your coverage" highlights, Plan Details link) — the board's Secarang frame still holds an old **Allianz** card text: "Coverage type = 'Market Value' … Free towing 24-hour breakdown towing of up to 150KM (round trip) · Cover all drivers Only at RM20 · Road assistance Ready to help · Plan Details" | **(b)** | QT_TS1 checks order + logo only. Propose a check of the Allianz card body (see B1). REQ-005 gives the logo only and REQ-002b "existing flow and options remain unchanged": the SRD is silent on the card text → **highlight for the QA, Q38** (send the BA the board's old text; it also says "Market Value" where the SA brief says "agreed value") |
| Sum insured dropdown: min / middle / max changes the price (SC_E2E_TS17, 18, 20) | (a) partly | E2E_TS9 step 1 changes it once (observed). Min / max not tried: low value, leave |
| Change postcode on the quotation page, price changes (SC_E2E_TS1, TS15) | **(b)** | Not in 12406. Allianz premium is re-quoted from a dormant journey (SA brief risk "final-premium logic … changed since May 2025"). Propose a step in QT_TS1 (B6). SRD silent → observed only, **highlight** (no SRD rule that the price must change) |
| PIDM disclaimer and links on the quotation page (mind map) | (c) | Insurer-independent text, unchanged |
| "If some insurances are not showing up, check the refer risk log" | (a) | QT_TS10 (orange Q36), QT_TS9 (Q35) |
| Insurer sequence by UCD state / user type / entry point (t24, t25) | (c) | eAuto-only (the Secarang order is REQ-004, no state rule) |

### Plan Details, Excess info, documents (t23, t19 SAF_9–11)
| Zurich item | Mark | 12406 / why |
|---|---|---|
| [Plan Details] from the quotation card AND from Confirmation; content per cover type and vehicle type (TS_PDEI_1–15) | **(b)** | No 12406 TS opens Plan Details (0 hits in scenarios.yaml). Propose B2 |
| Excess Info ('i' on the Excess row on Confirmation) | **(b)** | Not in 12406. Part of B2 |
| More Info links open in a new tab and show the insurer's own flyer / PDS / certificate wording (driver vs rider versions differ) | (a) partly | QT_TS7 opens the four REQ-006 documents "where Secarang offers it (Q15)". Add "from Plan Details and from the Confirm and Pay section, each opens Allianz's document in a new tab" (B2) |
| Insurer's PDS and Privacy Policy links in the Confirm and Pay section (SAF_9–11) | (a) | QT_TS7 (REQ-006 names product disclosure sheet, privacy notice) |

### Add-ons (t17, t19, Secarang frame add-on lists)
| Zurich item | Mark | 12406 / why |
|---|---|---|
| Add-on list per insurer — the board's Secarang frame holds an old **Allianz** list: Road Tax (West Malaysia only) · Allianz Road Rangers (Mandatory & unremovable) · Windscreen, Windows and Sunroof, Sum Insured (editable) · Motor Enhanced Road Warrior Plan A 5 / B 6 / C 7 days · Legal Liability of Passengers for Negligent Acts · SRCC · Legal Liability to Passengers · Private Hire Car (e-Hailing) · Inclusion of Special Perils · CART, Assessment Period 7 / 14 / 21 days, Daily Compensation 50 / 100 / 200 · Waiver of Betterment Contribution · Car Break-in/Robbery · Key Care · Driver and Passengers' Personal Accident Plan A / B | (a) partly | E2E_TS9 records every add-on offered (Q32). The old list is **not** an expected result; give it to the BA with Q32 |
| Mandatory add-on cannot be removed (Zurich: All Riders for motorbike; RHB MPA for SI < 20K; Allianz Road Rangers on the old list) | **(b)** | Not in 12406 (E2E_TS9 ticks / unticks freely). Propose B1. REQ-002b "options remain unchanged" is the only source → **highlight for the QA, Q32** (is Road Rangers still mandatory and free) |
| Editable sum insured on windscreen: within range re-prices; below min / above max → red outline, range in red, [Apply] disabled (TS_SAF_1–3; remark "No min max value for sum insured") | **(b)** | Not in 12406. Propose B1. SRD silent → observed / recorded, **highlight Q32** |
| Add-on with options re-prices (CART assessment period, daily compensation: TS_SAF_4–5) | **(b)** | Same: B1 (Allianz CART, Road Warrior plan A/B/C, PA Plan A/B if offered) |
| More Info text per add-on (TS_SOC_1–9) | (c) | Zurich's texts were new content; Allianz's are existing. Screenshot only inside B1, no text expected |
| Pre-ticked add-on with a reminder popup (Zurich All Drivers; remark "This functionality is not implemented yet") | (c) | Zurich-specific rule |
| Purchase with **no** add-ons / **partial** / **all** add-ons (SC_E2E_TS7, 8, 9, 21–23) | (a) partly / **(b)** | Default (E2E_TS1) and two-ticked (E2E_TS9) are covered. **All add-ons** is not, and it is the one Zurich purchase marked ❌ (SC_E2E_TS9). Propose B1 |

### Confirmation (Step 4) and options
| Zurich item | Mark | 12406 / why |
|---|---|---|
| Change gender on Confirmation → price changes ("REMEMBER" list; team doc §3 "Changing gender must re-price") | **(b)** | 0 hits for gender in 12406. Allianz premium logic is the stale part. Propose B4. SRD silent → observed (team doc §3), **highlight** |
| [Edit] on the insurance plan → popup "Change your insurance plan?" Change / Cancel; [Edit] on add-ons → back to Step 3 (mind map) | **(b)** | E2E_TS9 / TS10 go back from Add-ons, not from the Confirmation [Edit] buttons. Propose B4 (switching away from Allianz from Confirmation). Popup text is old board text → recorded only, **highlight** |
| PIAM ID line with 'i' info popup naming the agent and its contact (TS_SAF_8: Zurich → "Pemaju Eksklusif Sdn Bhd is a licensed agent …"); "Ensure the PIAM ID is MTA-J55282"; "Verify with dev for the commission rate displayed under PIAM ID" | **(b)** | 12406 records the agent line on the receipt (RC_TS1/2) and asks Q37 for Confirmation, but nobody opens the 'i' popup. For Allianz it must not show another agency's text (team doc §13 trap, EAINT-10971). Propose B4. SRD silent → **highlight, Q37** |
| Discount code valid / invalid (TS_SAF_6–7) | (a) / (c) | E2E_TS2 tries a code on Allianz (Q25); the invalid-code message is insurer-independent |
| Company vehicle: road tax delivery address, invalid road-tax postcodes (SC_E2E_TS4–6, 8, 12, 13, 18–20, 26, 27) | (a) as question | QT_TS3 (Q40). NB: the board shows **Zurich company purchases ticked ✅ on Secarang** (SC_E2E_TS4, 6, 8, 12) in Apr–May 2026, which is relevant to Q40 (team doc 20.10: "no insurance in secarang that supports company"); Zurich was on a /preprod branch and is not live, so it does not settle Q40 |
| Road Tax add-on (West Malaysia only) | (a) | E2E_TS11 (orange Q25) |

### Payment, Success, messages
| Zurich item | Mark | 12406 / why |
|---|---|---|
| Fiuu: success, failed then success ("Unsuccessful payment. You may try again") | (a) | E2E_TS1–TS5 (four tiles, failed + cancel in TS5) |
| Success page → receipt download, email receipt, WhatsApp match the Success page | (a) | E2E_TS1, RC_TS1, RC_TS7 |
| [Print receipt] on the Success page ("Vehicle owner details / Vehicle details", t27/t28) | **(b)** small | RC_TS1 opens the downloaded receipt only. Add the print view's Insurer block to RC_TS1 (B5). REQ-010 Example 1 ("Customer … opens receipt") is the source; whether print uses the same template → **highlight** |
| Receipt label "Car plate number" vs "Vehicle Plate No." (TS_SUIC_6 / SUIM_6 remark) | (a) partly | RC_TS1 checks the plate value; add the label wording to the Allianz-vs-Tokio Marine comparison (B5, trap T2) |
| JPJ status / cover note after payment (eAuto COM/TPFT rows; cron t15) | (a) | E2E_TS1 step 8 records JPJ after the job; E2E_TS6 (Q18) cover note failed / JPJ rejected |
| Cover-note **resubmission** cron when "failed but paid" (TS_CJ_04, eAuto) | (b) as question | Only if Secarang has the same job: add to E2E_TS6 "record whether the failed cover note is resubmitted and when" (part of Q18). Not a new TS |
| Quotation expired after 24 h (TS_CJ_01/02, eAuto) | (a) | RC_TS9 (Q39 asks the Secarang timing; the eAuto 24 h is not evidence for Secarang) |

### CIBO
| Zurich item | Mark | 12406 / why |
|---|---|---|
| Transaction Management: Platform + insurer + date, vehicle no + status Failed / Insurance Created, Print & Export, details (CIB_TS1–7) | (a) | RC_TS4, RC_TS10, RC_TS3, E2E_TS5 (Failed row) |
| Payment Report, Commission Report | (a) | RC_TS5, RC_TS6 |
| **CRM** ("Verify the transaction details are captured accordingly for … CRM", REMEMBER list + mind map) | **(b)** | 0 hits for CRM in 12406. Propose B3 |
| Referred Risk Log | (a) | QT_TS10 (Q36) |

### eAuto-only (all (c))
eAuto E2E COM_TS1–12 / TPFT_TS1–12, Get A Free Quote, UCD Homepage, UCD / BO Insurance Transaction Listing, Insurance
Payment Report, Monthly Handling Fee Report, BO Insurance Quote Enquiry, Refer Risk error codes (t29), Insurance API
Down (t30), Insurance Sequence (t24/t25), Hire Purchase / BER / Total Loss on the Service Portal (t07/t10), regression
of other eAuto insurers (t16), eAuto cron jobs (t15). Reason: Azfar 28.10 "eAuto and Secarang are different systems";
SA brief "eAuto (UCD) insurance unaffected: the Allianz switch is per tenant". 12406 keeps only RG_TS4 (deprioritised).

### Onboarding-only (c)
- Existing-transaction before / after deploy (EXT_TS1–6: "All insurers displayed except Zurich" before, "including Zurich"
  after): the Secarang analogue is a quote started before the deploy and continued after. Secarang has no customer
  listing to resume from, except the MacroKiosk link (E2E_TS7, Q7). Old Allianz transactions: RC_TS8. Nothing to add.
- Motorbike and EV: Zurich added motorbike on Secarang and Dev dropped EV "in this phase". 12406 has motorcycle as
  QT_TS8 (orange Q19); **EV has no row and no question** → add to Q19: "does Allianz quote EVs on Secarang?" (B7).

---

## 3. Zurich defects and traps a re-enabled insurer is likely to hit again

Ranked by how likely they are to hit Allianz and how cheap they are to check.

1. **T1 — A purchase with ALL add-ons failed** (SC_E2E_TS9 ❌, individual car, Comprehensive; the board does not say why).
   Allianz had the longest add-on list of any Secarang insurer (14 on the old card list), so the all-add-ons
   premium and cover-note request is the riskiest payload in a journey dormant since May 2025.
2. **T2 — Plan Details / More Info showing the wrong content or document**: motorbike Plan Details showed "Driver Coverage
   without any details" instead of Rider Coverage (TS_PDEI_10/11; t08 "Raised in EAINT-11047, Retest Pass"); the study
   lists 11064 (More Info links opening wrong documents). For Allianz: 2022 documents (REQ-006) behind links nobody has
   clicked since 2025.
3. **T3 — Agent / distributor text from the wrong agency**: Zurich's PIAM 'i' popup and card had to name Pemaju
   Eksklusif, not the Takaful Malaysia distributor (team doc §13, EAINT-10971); "Ensure the PIAM ID is MTA-J55282".
   Allianz is the only Serba Sentral insurer on Secarang now; a shared template could show Pemaju Eksklusif or the
   Lonpac / Tokio Marine PIAM ID on Confirmation, receipt or CIBO More Info.
4. **T4 — Receipt wording**: "Receipt is showing Car Plate No. It should be Vehicle Plate No." (TS_SUIC_6, TS_SUIM_6); the
   study lists 11204 / 11219 (receipt wording). The Allianz receipt template has not printed since May 2025, so it may
   miss later label changes besides the REQ-010 company number.
5. **T5 — Add-on rules not built / range not enforced**: "This functionality is not implemented yet" (All Drivers popup,
   TS_SOC_1) and "No min max value for sum insured" (windscreen, TS_SAF_1–3), both passed with remarks. For Allianz:
   mandatory Road Rangers removable, or sum insured accepting any value.
6. **T6 — Insurers silently missing**: "If some insurances are not showing up, check the refer risk log". Covered by
   QT_TS9 / QT_TS10, plus the SA brief "only 3 quotations shown" risk (Q31).
7. **T7 — Stale board text**: the board's Secarang frame (April 2026) still lists RHB and Allianz cards and add-ons, which
   had been off since 2025. Old team text cannot be taken as today's expected result; use it only as a question to the BA.
8. **T8 — CIBO filter missing a new insurer** (study: 10968 / 10969 on Zurich). Not a risk for Allianz: the walk of 28.10
   already shows Allianz under Serba Sentral (RC_TS4 covers it).

---

## 4. What I'd add or change in the 12406 draft (ranked)

**B1 (new TS, P2) — Allianz add-on options and an all-add-ons purchase.** Situation: Allianz quotation, Add-ons page.
Steps: screenshot every add-on and its price; try to remove each mandatory add-on (e.g. Road Rangers); windscreen sum
insured within range, below min and above max; change each option (CART period / daily compensation, Road Warrior plan,
PA plan) and note the price; then tick **every** add-on and pay by FPX; CIBO Transaction Details Add-ons. Expected
(source REQ-002 Example 1b "can complete purchase using existing Allianz flow", REQ-002b "options remain unchanged"):
the all-add-ons purchase completes with a receipt and the same add-ons on Confirmation, receipt and CIBO. Everything
else (which add-ons are mandatory, ranges, option prices) is **recorded, highlight for the QA → Q32**. Covers T1, T5.
Could be folded into E2E_TS9 instead of a new row if Azfar prefers fewer TS.

**B2 (extend QT_TS7, P2) — Plan Details and Excess info.** Add: open [Plan Details] from the Allianz card and from
Confirmation; open the Excess 'i'; click each link inside (new tab). Expected: each link opens an Allianz document
(REQ-006 Example 1a "Existing Allianz documents in system are displayed"), not another insurer's. Plan Details / Excess
content recorded → **highlight Q15** (add "Plan Details and Excess info" to it). Covers T2.

**B3 (extend E2E_TS1 or RC_TS4, P2) — CIBO CRM.** Add: CIBO > CRM, search the E2E_TS1 owner; screenshot the record.
SRD silent (CRM is not in §2.2.3 affected pages) → **observed regression, highlight for the QA** (new question: "Should
an Allianz Secarang buyer appear in CIBO CRM like a Lonpac buyer?"). The Zurich board checked CRM on every Secarang E2E.

**B4 (extend E2E_TS9 / E2E_TS10, P2) — Confirmation behaviour on Allianz.** Add to E2E_TS9: change gender and record the
premium before / after (observed, team doc §3); open the PIAM ID 'i' popup and screenshot it. Add to E2E_TS10: from
Confirmation use [Edit] on the insurance plan (record the popup, choose Change) and [Edit] on add-ons. Expected for the
popup agent text: **highlight Q37** (must it name Serba Sentral and Allianz's own PIAM ID?). Covers T3.

**B5 (extend RC_TS1, P2) — receipt labels and print view.** Add: [Print receipt] on the Success page, screenshot the
Insurer block; compare every label of the Allianz receipt with the Tokio Marine receipt of RG_TS1 (e.g. "Vehicle Plate
No."). Expected: Insurer block as REQ-010 in both the PDF and the print view; labels the same as on the Tokio Marine
receipt (**highlight**: the SRD does not say the print view uses the same template). Covers T4.

**B6 (extend QT_TS1, P3) — postcode change re-quotes Allianz.** Add: [Edit] the postcode on All Quotations to another
West Malaysia state; record the Allianz price before / after and that the order stays Lonpac, Allianz, Tokio Marine
(order: REQ-004 Example 1a; price change: observed only, **highlight**).

**B7 (questions only, no TS)**:
- Q19 add: "Does Allianz quote **EVs** on Secarang?" (Zurich dropped EV per Dev; no 12406 row or question covers EV).
- Q32 / Q38: attach the board's old Allianz card text and add-on list (Secarang frame, board.md) so the BA can confirm or
  correct them; note it says "Market Value" where the SA brief says "agreed value".
- Q40: note that the Zurich board ticked Zurich **company** purchases on Secarang (/preprod branch, Apr–May 2026), so
  "no insurer supports company" (team doc, 20.10) may be about live insurers only; the SRD REQ-003 Example 1 card still
  stands as the expected result.
- Q18: add "is there a cover-note resubmission job on Secarang (eAuto: every 30 min when failed but paid)?".

Not proposed (checked and left out): home-form popups, UI wording, invalid postcodes, discount-code error, PIDM text,
motorbike-tab entry (all insurer-independent and unchanged); every eAuto section; min / max sum insured on the card.
