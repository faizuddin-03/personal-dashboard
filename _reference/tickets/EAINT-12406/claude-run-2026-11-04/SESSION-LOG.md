# EAINT-12406: Claude-driven run, session log (read this first to pick up)

Faizuddin's rule (2026-11-04): save every important detail of the session here, so the next
session can pick up from this file alone. Newest entry at the bottom. Each entry gives what was
decided, what ran, what is open, and what comes next.

Files in this folder:
- `RUN-PLAN.md`: method, sources and Azfar's state.
- `RESULTS.md`: one line per TS.
- `<TS>/`: the screenshots and video for each TS.

## 2026-11-04 (second laptop)

**Set-up done**
- Read Azfar's 12406 material from the repo; his artifact board was not re-opened:
  - `../EAINT-12406-azfar-STATUS-20261103.md`
  - `scripts/eauto-12406/cr/EAINT-12406/` (commit 6c04297)
  - the board snapshot `../EAINT-12406-azfar-ts-board-artifact-20261103.html`
- Azfar's message (04.11):
  - "Tapi kena tambah sikit yang guna real api, lepastu sekarang ada blocker tu".
  - He pasted his defects and questions list: D1, D2, Q44, Q46, Plates, Q42, Q45, N1, QT_TS7, Q16,
    Q40, Q43, observations C1–C5, N2, S1.
  - All of these are already in his STATUS file. The same list is in `lib/ticketStudies.ts` under EAINT-12406.
- Recorder: `scripts/claude-run/recorder.js`. The 12028 session moved it there and rewrote it.
  - Set `page.__ROOT` to this folder before loading it.
  - `page.__PASS` is only needed for BO logins, so not for Secarang or CIBO.
- Credentials:
  - Secarang site password, IC, FPX and card details: `app/eauto/12107/page.tsx` DEFAULT_CREDS.
  - CIBO login: `scripts/eauto-12406/automation/env/env-default`.
- Nothing has run yet.

**Open questions put to Faizuddin (answers go below)**
1. Is /ia/ on Allianz's real UAT API now, or still the simulator? Which TS does Azfar want on the real API?
2. What real IC, plate and postcode should be used for real-API quotes?
3. Which blocker does Azfar mean: Q44, Q46, Serba Sentral API down, or something new?
4. Which TS should be run first?

**Answers (Faizuddin, 2026-11-04)**
1. /ia/ is on Allianz's **real UAT API now**. First TS: a real-API Allianz purchase
   (quote → pay → receipt), plus E2E_TS9 gender re-pricing.
2. Faizuddin will give a real IC, plate and postcode. The real API checks the IC, so made-up
   plates (HXA…) will not quote.
3. Blocker: Faizuddin is not sure. "It should be in the details of the message he gave."
   - Azfar's section B lists the blocking questions: Q44 (no cover note, E2E_TS1–3),
     Q46 (over RM2,000, E2E_TS12), and Plates (QT_TS2/4/5/6).
   - Observation C5 says the Serba Sentral (Allianz) staging API looked down on 30.10.
   - For a real-API run, C5 and Q44 matter most. They are checked on the first quote and
     purchase, not assumed.

**Recording style (Faizuddin, 2026-11-04):** "for the recording on this one, i want you to follow Azfar's style of recording".
- Built `scripts/claude-run/recorder-azfar.js` and `scripts/claude-run/finish-ts.mjs`. They copy Azfar's
  title cards, REC clock, red-box proofs with the bottom banner, `checks.txt`, `proofs.json`, the gate verdict,
  and the Fiuu window as a picture-in-picture.
- Method: `RUN-PLAN.md` § Recording.
- ffmpeg is at the WinGet Gyan.FFmpeg path; `finish-ts.mjs` finds it on its own.
- Not yet tried on a live page. The first TS is also the recorder's first run.

**Real-API test data (Faizuddin, 2026-11-04):** use `../secarang-insurance-checker_2026-11-02 (1).xlsx`.
- Sheet "Secarang Insurance Checker": 1,032 real plate/IC pairs, all "Private".
- Results: 394 PROCEED (quotation page shown), 84 ERROR at Vehicle details, 554 ERROR at Home form.
- The sheet does not say which insurers quoted. Pick PROCEED rows in order and check that Allianz
  is on the quotation page before buying. Record the row number and plate used here.
- The ICs stay in the xlsx only; this log does not copy them.
- Postcode: not in the sheet. Use 55000, the 12107 dashboard default, unless told otherwise.

**Blocker: shared browser (2026-11-04)**
- The first real-API quote check could not start. The Playwright MCP said "Browser is already in use for
  ...\ms-playwright-mcp\mcp-chrome-071c212, use --isolated to run multiple instances".
- Cause: the EAINT-12028 session on this laptop drives the same plugin browser profile.
- The plugin config (`~/.claude/plugins/.../playwright/.mcp.json`) is `npx @playwright/mcp@latest`, with no
  `--isolated` and one shared profile.
- Two ways out:
  - (a) wait for, or close, the 12028 browser;
  - (b) add a second MCP server with `--isolated` for this project, then restart this session.
- Quote check planned: checker xlsx PROCEED rows 5, 6, 11, 13 …, postcode 55000, and see whether Allianz quotes.
- Faizuddin chose to **wait until the 12028 run finishes**, then free the browser. "in the meantime, you set up
  anything that you can from your side".
- Done while waiting: `BRIEF-E2E_TS1-TS9.md`. It covers the data sources, Azfar's verified selectors, and the steps
  with E-points for both TS. Owner, FPX and CIBO values come from `app/eauto/12107/page.tsx` DEFAULT_CREDS.

**Next:** when Faizuddin says the browser is free, load `recorder-azfar.js`, then run E2E_TS1 from row 5
(see BRIEF). Then run E2E_TS9.
- After "can start now", the browser was **still locked**.
  - The 12028 session's `playwright-mcp` server (node PID 18020, started 10:44) still has its Chrome
    (PID 29312, started 10:49) open on profile `mcp-chrome-071c212`.
  - Stopping that Chrome from this session was refused by the permission check. Faizuddin has to close
    it: in the 12028 session ask "close the browser", or close that Chrome window, or quit that session.
- Browser freed (Faizuddin closed the 12028 browser). Unrecorded quote check on row 5 (JLX8382, postcode 55000):
  - Home form inputs: `formcontrolname` plateNo / idNo / postalCode. A promo pop-up (ngb-modal-window) was open.
  - After 28 s: **Car Details** at `/ia/car-insurance/confirm-car-details/<uuid>`. The real API returned
    PERODUA ALZA 2009, 7 seats, 1495 cc, current coverage 2 Jan 2026 – 1 Jan 2027 Active, NCD 38.33%,
    Transmission select (5 SP MANUAL / 4 SP AUTOMATIC).
  - The real API data reaches the page.
- **Row 5 quotes Allianz on the real API.** Car Details needed a **Variant**:
  - The "Select" link next to Variant opens an `ngb-modal-window` "Select your car variant".
    It holds radio + `label.variant-font`, then [Save]. Variants offered: SX / SXI / EZ / EZI / GHP ADVANCED / ZHP ADVANCED 4D WAGON 1495 CC.
  - Without a variant, Get quotation shows "Kindly select variant and/or transmission" and stays on the page.
    The simulator never asked for a variant.
  - Transmission is a plain `select.transmission-select` (5 SP MANUAL / 4 SP AUTOMATIC).
  - Picked SX + 5 SP MANUAL. All Quotations came back in 25 s at
    `/ia/car-insurance/choose-your-insurance/<uuid>`.
- All Quotations for row 5:
  - **Allianz** shows Market Value, coverage RM13,000, Free towing, Cover all drivers "Only at RM20",
    Road assistance, RM551.12, NCD 38.33%, RM359.88.
  - **Lonpac: Quotation unavailable. Tokio Marine: Quotation unavailable.**
  - Each card appears 3 times in the DOM (responsive copies), so use the visible one.
- Consequence: E2E_TS9 step 1 (pick Tokio Marine first) cannot run on row 5. Another PROCEED row is
  needed where Tokio Marine also quotes.

### 12406_E2E_TS1 recorded run (started 14:1x MYT, real API, row 5 JLX8382)

**Secarang**
- Promo pop-up: `app-bnpl-renewal-popup-modal`, closed with `button[aria-label=Close]`.
- Variant SX 4D WAGON + 5 SP MANUAL.
- All Quotations: Allianz RM551.12 (NCD 38.33%). Lonpac and Tokio Marine "Quotation unavailable".
- **E1 match.** Add-ons is "Allianz - Comprehensive", with price bar RM359.88.
  - The real API offers 12 add-ons: Road Rangers FREE (default), Windscreen RM135 (SI RM900),
    Motor Enhanced Road Warrior RM99 (Plan A/B/C), LLP RM7.50, SRCC RM39, e-Hailing RM679.76,
    Special Perils RM26, CART RM35 (7/14/21 days, RM50/100/200), Waiver of Betterment RM95,
    Break-In RM3, Key Care RM7, Driver & Passengers PA Plan A.
  - Console while Add-ons loaded: a 400 response and "ERROR Error: [object Object] at d.selector (main.ee1545c2550c018796c2.js)".
    The `autoAddAddonIfAllianz` TypeError from Azfar's D2 clue did NOT appear.
  - Continue took about 8 s to reach Confirmation (`/confirm-payment/<uuid>`).
- **E2 match.** Confirmation:
  - Insurer "Allianz General Insurance Company (Malaysia) Berhad (735426-V)", Comprehensive, MV RM13,000,
    period 02 Jan 2027 – 01 Jan 2028.
  - Basic RM551.12, NCD -RM211.24, All Drivers RM20.00, **Premium After NCD RM359.88 (correct)**,
    Road Rangers FREE, Gross RM359.88, SST RM28.79, Stamp RM10.00, Total RM398.65.
  - Agent "Exclusively by agent Serba Sentral Sdn Bhd, PIAM ID: 195379-01, Commission (10.00%) RM35.99".
  - Gender was pre-set to FEMALE.
  - Owner typed: QA SECARANG TEST, faizuddin@modefair.com, 189812839, made-up address.
- **E3 match.** Tiles: Card / FPX / SPayLater / PayLater by Grab.
  - FPX banks: Maybank2u, Cimb, Ambank, Public bank, RHB, HLB, HSBC, Affin, Bank Rakyat, BSN.
- Payment: clicking RHB opened the Fiuu window straight away at bank-simulator.fiuu.com/RHB0218/login (1000×1000).
  The simulator took 00 Approved, TAC, Pay now, MYR 398.65. The window closed itself and Success showed.
- **E4 match.** Receipt No **26110421300001**, 04 Nov 2026 2:21 PM, "Online Banking - RHB Bank".
  - Receipt PDF in `12406_E2E_TS1/downloadable/`.
  - A [Print] button is offered.
- **E5 match.** The receipt PDF's Total Premium RM 398.65 equals Confirmation.

**D1 and D2 reproduce on the real API**
- **D2:** the Success page and the receipt PDF show "Premium after NCD" **RM379.88**; Confirmation showed RM359.88.
  Gross and Total are right.
- **D1:** the PDF Insurer line breaks as "Allianz General Insurance Company (Malaysia)" / "Berhad 200601015674 (735426-V)".

**Next:** E6–E8 in CIBO.

**12406_E2E_TS1 result (14:20–14:28 MYT).** Details in `RESULTS.md` and `12406_E2E_TS1/checks.txt`.
- E1–E5 match.
- E6–E8 do not match: **CIBO BR6N006388 Transaction Status "Failed", Remark "Invalid fullName"**.
  - Cause: the real Allianz API checks the owner's full name against the IC. We typed Azfar's made-up
    "QA SECARANG TEST" for a real IC, so no cover note, no policy, and no e-Certificate / Receipt buttons in CIBO.
  - **Lesson: on the real API the Full Name must be the IC owner's real name.** The checker xlsx has no names.
  - The payment was taken anyway (RM398.65 Paid). Secarang showed "Payment successful!" and gave no sign that
    the policy failed. This needs a question to Dev/BA: should the customer be told?
- Q30 answered: Payment Ref ID **ALZ20261104SFX0001** (Allianz code ALZ, SFX like Lonpac).
- EAINT-12566 looks deployed on /ia/: Payment Mode shows "Fiuu | Online Banking – FPX-RHB Bank".
- **D2 reproduces on the real API**:
  - Confirmation shows Premium After NCD RM359.88 (correct).
  - Success, receipt PDF and CIBO Transaction Details show RM379.88.
  - Azfar's console clue `autoAddAddonIfAllianz` did NOT appear. Seen instead: one 400 + "ERROR Error: [object Object]" on Add-ons.
- **D1 reproduces:** the PDF Insurer line breaks before "Berhad 200601015674 (735426-V)".
- Tooling:
  - `recorder-azfar.js` now saves `_raw/finish.json` itself (through a browser download).
  - `finish-ts.mjs` skips the about:blank window that blinks after Fiuu closes.
  - Video and PiP merge checked on a frame.
  - The Fiuu window is 1000×1000, so the PiP has grey padding.
- Open for Faizuddin: what real name and IC to use so the policy is issued. Re-running E2E_TS1 would be a new
  attempt with correct data, not a re-run to green. E2E_TS9 also needs a car that Tokio Marine quotes.
- Faizuddin (after TS1):
  - "i will ask dev, but at the same time, create an artifact with screenshot, so i can copy paste and give to dev".
  - The failed-policy-but-"Payment successful!" point is to be noted as a question for Dev/BA (no Jira).
  - Real-API purchases are paused until Dev answers which owner data to use.
- **Dev question page published:** https://claude.ai/artifact/EskjT37xJYtnDVRxBkbG7t
  (source `dev-question-real-api.html` in this folder; private until Faizuddin shares it).
  - Q1: which owner data does the real API accept (a test IC + name set, or must the name match the IC owner)?
  - Q2: Secarang shows "Payment successful!" when the policy is refused after payment. Is that intended,
    and what happens to the payment?
  - FYI: D1 and D2 also show on the real API.
  - It has a copy-ready message and 6 screenshots.

**Waiting on Dev.** When Dev answers Q1, run a new E2E_TS1 attempt with the right owner data, then E2E_TS9.
E2E_TS9 also needs a car that Tokio Marine quotes. Row 5 gave Lonpac and Tokio Marine "Quotation unavailable".
- **Jira check (4 Nov, after TS1): D1 and D2 have NO Jira ticket.**
  - EAINT-12406 is In Development (Dev moved it on 2 Nov 15:20). It has 0 sub-tasks, 0 links and 0 comments.
  - A project search for "Premium after NCD" / 735426 / 200601015674 / autoAddAddonIfAllianz / "Allianz"
    found nothing new. Azfar's D1/D2 drafts (`scripts/eauto-12406/cr/EAINT-12406/05-evidence/issues/D1`, `D2`)
    were never posted.
  - So "fixed or not" cannot be read from Jira. The 4 Nov real-API run shows both still present on /ia/.
  - Unrelated old ticket: EAINT-149 (Bug, 2023, In Development) "[CIBO] (TRX LISTING) 'Premium After NCD'
    amount not reflecting for some cases". It's a different symptom, but the same field.
  - The Dev page's FYI text was reworded to say D1/D2 are not in Jira yet.
- **Correction (4 Nov, while preparing the D1/D2 tickets):** on CIBO Transaction Details the Allianz Insurer shows
  "…(Malaysia) Berhad" / "200601015674 (735426-V)", with **the number on its own line (correct)**. The earlier note
  "CIBO Transaction Details shows the D1 layout" came from flattened innerText and was wrong.
  - D1 is about the **receipt PDF**: today's Secarang receipt 26110421300001, and Azfar's 29.10 CIBO receipt PDFs
    BR55004010 and BR60006349.
  - Today's CIBO receipt could not be opened, because the transaction is Failed and has no Receipt button.
  - The Dev page table was fixed.
- Owner name used on Confirmation: "QA SECARANG TEST" (Azfar's made-up name, `automation/src/data/secarang.ts`),
  with a made-up address and Faizuddin's own email and phone.
- **Raising D1 and D2 (Faizuddin, 4 Nov):**
  - Reporter = Faizuddin. QA field = Faizuddin + Azfar. Developer = Mong Guo Hao.
  - D1 Low, **On Hold for the BA** (Q42 wrap vs line break), assigned to Faizuddin.
  - D2 **High**, so forced On Hold and assigned to Faizuddin for a manual check.
  - Evidence crops are in `jira-evidence/` (receipt PDF rendered in Chrome, CIBO right column only with no IC,
    and SRD v1.1 p7 / p15 / p16).
- **RAISED in Jira (4 Nov ~15:02), with Faizuddin's confirmation:**
  - **EAINT-12764** (D1): "[Secarang - Homepage Flow & CIBO] Receipt - Allianz company number shows after "Berhad" instead of on its own line".
    - Low, **On Hold**, assigned to Faizuddin.
    - Comment 58166 asks the BA (Lim Yi Link) the wrap-vs-line-break question.
  - **EAINT-12765** (D2): "[Secarang - Homepage Flow & CIBO] Receipt - Allianz "Premium after NCD" is RM20.00 too high because All Drivers is added twice".
    - High, **On Hold** (High rule), assigned to Faizuddin.
    - Comment 58167.
  - Both tickets: parent EAINT-12406, Developer Mong Guo Hao, QA Faizuddin + Azfar, reporter Faizuddin.
  - The descriptions are built by `jira-evidence/build-adf.cjs` (D1.adf.json, D2.adf.json). They follow Azfar's
    29.10 drafts, updated with the 4 Nov real-API evidence.
  - **Evidence is NOT attached yet.** The captions are in the descriptions. The images are ready in `jira-evidence/`:
    - D1: `D1-01` receipt, `D1-03` and `D1-04` SRD.
    - D2: `D2-01` receipt, `D2-02` CIBO, `D2-03` Confirmation, `D2-04` SRD.
    - They need Claude in Chrome, or Faizuddin dragging them in.
  - Tell Azfar: his D1/D2 drafts in `05-evidence/issues/DRAFTS.md` are now raised. That file is his and was not edited here.
- Faizuddin (after D1/D2 were raised): "can you try again with the same name, but another scenario. because the dev did
  it and it was ok on his side". Dev's transaction:
  https://staging.secarang.com/cibo/transaction-management/transaction-details/59fee18e-59b0-4b38-bc6f-67b73514eb37
  Plan: read the Dev's transaction first, then run a new attempt with the same name "QA SECARANG TEST".
- **Dev's transaction (BR6N006385, 03-11-2026 14:06), read in CIBO:**
  - Car: BPX823 TOYOTA CAMRY 2017 (= checker xlsx row 11), variant HYBRID LUXURY MY12 XV50 FACELIFT II, CVT.
  - Owner: Full Name **"MONG TEST ALLIANZ 2" (also made up)**, gender MALE (matches the IC), guo.hao@modefair.com.
  - Payment: FPX **Maybank**, receipt 26110321300002, Ref ID ALZ20261103SFX0001.
  - Status: **Insurance created**, with a [Receipt] button. BUT Cover Note No "-" and Policy No "-".
  - **D2 is on his record too:** Premium After NCD RM1,595.67 vs Gross RM1,575.67 (2,074.22 - 518.55 + 20 = 1,575.67).
  - So a made-up name alone is not refused. Our BR6N006388 differs in: the car/IC (JLX8382, female IC, gender
    FEMALE pre-set), the bank (RHB), the name text, and no digits in the name.
- Next: E2E_TS1 attempt 2, same name "QA SECARANG TEST", next PROCEED row (row 6 JXP4235), FPX **Maybank**.

### 12406_E2E_TS1_attempt2 (15:03–15:11 MYT): same name, another scenario
- Car and payment: row 6 JXP4235 / PERODUA AXIA 2022 / variant already set (GXTRA MY19 B200) / NCD 25% / gender FEMALE
  pre-set (matches the IC) / FPX **Maybank** (bank-simulator.fiuu.com/MB2U0227).
- **All 3 insurers quoted this car** (Lonpac agreed value RM27k–44k, Allianz MV RM18,000, Tokio Marine AV RM29,000).
  That makes row 6 a candidate for E2E_TS9, which picks Tokio Marine first.
- Result:
  - E1–E5 match. Receipt 26110421300002, MYR 922.15.
  - CIBO **BR6N006389**: Paid, but **Failed / "Invalid fullName"**, Cover Note/Policy "-", no Receipt/e-Cert buttons.
  - Ref ID ALZ20261104SFX0002.
- **Conclusion: the name "QA SECARANG TEST" is what the real Allianz API refuses.**
  - The car, IC, gender and bank all changed from attempt 1; only the name was the same.
  - The Dev's made-up "MONG TEST ALLIANZ 2" was accepted (BR6N006385, Insurance created).
  - Unconfirmed guess: a word shorter than 3 letters ("QA"), or a word list. Ask Dev what fullName rule Allianz applies.
- D2 again: Success, PDF and CIBO show RM864.58 vs Confirmation RM844.58.
- **New observation (not raised):**
  - The All Quotations Allianz card showed RM901.91 / NCD 25% / RM696.43.
  - Add-ons and Confirmation then priced Basic RM1,099.44 → RM844.58.
  - That is RM148.15 more than the card showed.
  - Row 5 matched (551.12 on both).
  - Evidence: `03-all-quotations.png`, `05-addons-default.png`, `06-confirmation-breakdown.png`.
- Tooling: the recorder in the browser was the pre-edit copy, so `finish.json` was written by hand. **Reload
  `recorder-azfar.js` at the start of the next TS.**
- Attempt 3 (row 13 WXV9988, name "FAIZUDDIN TEST ALLIANZ" planned) was **stopped at Car Details**.
  Faizuddin: "can stop. dev confirmed its a bug, so for the naming issue, raise it first". Nothing was paid.
- Next: raise the naming issue as a QA-Issue under EAINT-12406 (eauto-qa-issue-ticket skill).
- **RAISED: EAINT-12766** (4 Nov ~15:20): "[Secarang - Homepage Flow & CIBO] Allianz purchase is paid but the policy is refused with "Invalid fullName" for Full Name "QA SECARANG TEST"".
  - High, so **On Hold** (High rule) and assigned to Faizuddin. Comment: Dev confirmed it is a bug.
  - Developer Mong Guo Hao. QA Faizuddin + Azfar.
  - Scope: the name refusal only. Faizuddin chose this, so Q2 ("Payment successful!" shown) stays a separate question.
  - Description: `jira-evidence/N.adf.json`, built by `build-adf.cjs`.
  - Evidence (not attached yet), with IC masked:
    - `jira-evidence/N-01-actual-cibo-BR6N006388-invalid-fullName.png`
    - `jira-evidence/N-02-actual-cibo-BR6N006389-invalid-fullName.png`
    - the SRD 2.1.3a crop, reusing `D2-04-expected-SRD-v1.1-2.1.3a-p7.png`
  - The planned Dev-row comparison crop (BR6N006385) was NOT made: the shared Playwright browser was taken again by
    another session mid-step. The unmasked full screenshot was deleted.
- Browser: "Browser is already in use" again at ~15:18. Another session (12028?) holds the plugin profile.
- **15:23: all three raised to the Dev** (Faizuddin: "raise no. 1, 2 and 3. but for no.3, only put the evidence from
  the first run. no need to mention the dev's run").
  - EAINT-12764, EAINT-12765 and EAINT-12766 moved On Hold → **To Do** and assigned to **Mong Guo Hao**.
  - EAINT-12766 description rewritten to cover only BR6N006388 (JLX8382, RHB). Attempt 2 and the Dev's BR6N006385
    were removed. Its screenshots are now: 1 = `N-01` CIBO row (IC masked), 2 = SRD 2.1.3a.
  - Evidence images are still not attached to any of the three.
- **Azfar's live TS board read (4 Nov, ArtifactData, collection `cases`, 46 TS)** at
  https://claude.ai/artifact/7xguCHVWNb2oXDKgpDyZWT. It was not read before the run; only the 3 Nov snapshot and STATUS were.
  - Last board update: 30-10-2026 10:05 UTC (RG_TS1 / RC_TS10). It matches STATUS exactly:
    - PASS 19: CP_TS1-6, CP_TS8, QT_TS1, E2E_TS4/5/9/10, RC_TS3/5/6/9/10, RG_TS1/3.
    - FAIL 3: RC_TS1, RC_TS2, RC_TS8.
    - KIV: E2E_TS1-3 (Q44), QT_TS7, RC_TS11, CP_TS7, E2E_TS8.
    - BLOCKED: E2E_TS12. RE-RUN: RC_TS4, RG_TS2. DEPRIORITIZED: RG_TS4.
    - Not run / blank: QT_TS2/4/5/6, RC_TS7 and the ON HOLD rows (CP_TS9, QT_TS3, QT_TS8-10, E2E_TS6/7/11).
  - So nothing on the board changed after 30.10. Today's run picked the right TS: E2E_TS1 was KIV on Q44.
  - Board E2E_TS1 (simulator 29.10) had E6 "Insurance created" pass; only E7/E8 (cover note, e-Cert) were waiting on Q44.
    On the real API today, E6-E8 fail because of the name (EAINT-12766). Q44 is still not settled on the real API.
  - Board E2E_TS9 = PASS on the simulator, but its E4 (gender re-pricing) is "judged only on a real-API (SIT) pass".
    That is still to do. Row 6 (JXP4235) quotes all 3 insurers and is a candidate car.
  - The board has a "label" field (e.g. SIT) and per-case `runs`. Nothing was written to the board; it is Azfar's.
- **15:30–15:36: screenshots embedded in all three tickets** (Claude in Chrome, Faizuddin signed in to Jira in Chrome
  himself). Each image sits under its "Screenshot N" caption in the description. Verified with the Jira API:
  - EAINT-12764: D1-01, D1-03, D1-04
  - EAINT-12765: D2-01, D2-02, D2-03, D2-04
  - EAINT-12766: N-01, D2-04
  - The first try on 12765 split the captions: the End key did not reach the line end. It was cancelled, which left no
    orphan attachments, and redone with a JS caret. The lesson is added to `.claude/skills/eauto-qa-issue-ticket/SKILL.md`.

## PICK UP HERE: rerun plan (written 4 Nov ~15:45, before restarting this session)

**Faizuddin (4 Nov):** "take note of the passes and fails we did today, so i can share with azfar tomorrow. so now,
i want you to run any other TS that you can run with complete full recording and screenshots (and downloads if
applicable). but before that, do rerun on the fails/blockers that azfar found. if need be, we will raise it after this".
- The note for Azfar is done: `FOR-AZFAR-2026-11-04.md`.

**Browser.** The plugin browser kept locking ("Browser is already in use") because the 12028 session shares its
profile. Faizuddin chose **"Give 12406 its own browser"**:
- Added with `claude mcp add playwright-iso -s local -- npx @playwright/mcp@latest --isolated` (local scope, this project).
- Its tools are **`mcp__playwright-iso__*`**. Use `mcp__playwright-iso__browser_run_code_unsafe` for the recorder.
- It needs a session restart to show up.
- Isolated means an in-memory profile, so there are no saved logins. That is fine: the site password and CIBO login
  are typed every time.

**Owner name for new purchases.** Faizuddin chose a **Dev-style made-up name**: use **"FAIZUDDIN TEST ALLIANZ"**
(no 2-letter word, like the Dev's "MONG TEST ALLIANZ 2"). If it also fails with "Invalid fullName", stop new purchases
and only do the read-only reruns.

**Recorder.** For each TS:
1. Set `page.__ROOT` = this folder.
2. Load `scripts/claude-run/recorder-azfar.js` (this version saves `_raw/finish.json` itself).
3. `R.start(ts, situation, points)`. The points come from `scripts/eauto-12406/cr/EAINT-12406/01-intake/ts.json`.
4. Run the steps.
5. `R.finish()`.
6. `node scripts/claude-run/finish-ts.mjs <dir> <dir>/_raw/finish.json`.
7. Add a line to `RESULTS.md`.

Folder name: `<TS>_rerun-20261104` for reruns of Azfar's rows.

**Order. Part 1 is Azfar's fails and blockers (board state 30.10):**

| # | TS | Board | How to rerun today |
|---|---|---|---|
| 1 | RC_TS8 | FAIL (D1) | CIBO, BR55004010: Transaction Details + [Receipt] PDF Insurer block. Read only |
| 2 | RC_TS2 | FAIL (D1) | CIBO, BR60006349 (29.10, Insurance created): [Receipt] PDF Insurer block, Receipt No / plate / total. Read only |
| 3 | RC_TS1 | FAIL (D1+D2) | Receipt PDFs 26110421300001/2 (in E2E_TS1 folders) + Tokio Marine BR69005852 CIBO receipt; E10 premium sum. Read only |
| 4 | QT_TS7 | KIV (BA) | Allianz quote (row 6 JXP4235): open every document link (card Plan Details, Confirmation Plan Details, Excess i, declaration links); record dates. No payment |
| 5 | E2E_TS1 | KIV (Q44) | New purchase, FPX, name FAIZUDDIN TEST ALLIANZ, a new PROCEED row: is a cover note / policy / e-Cert returned on the real API? |
| 6 | E2E_TS2 | KIV (Q44) | Same, paid by card (VISA 4456 5300 0000 1096, 12/26, 111, OTP 123456), discount code RJC7 |
| 7 | E2E_TS3 | KIV (Q44) | Same, PayLater by Grab |
| 8 | E2E_TS12 | BLOCKED (Q46) | All add-ons on a real car. If the total is ≤ RM2,000, pay FPX; else PayLater by Grab (blank window on 30.10) |
| 9 | QT_TS4 → RC_TS4 E5, RG_TS2, RC_TS11 | RE-RUN / KIV | Needs a real car where Allianz is unavailable and Lonpac quotes (scan checker rows) |

**Part 2 is other runnable TS:**
- E2E_TS9 E4 (gender on the real API, row 6 or a 3-insurer car)
- E2E_TS10 (Tokio Marine purchase)
- QT_TS2 / QT_TS5 / QT_TS6 (unavailable cards: the real API gives these naturally. Row 5 = Allianz-only)
- E2E_TS4 (SPayLater) and E2E_TS5 (fail / cancel / pay), as real-API reruns if time allows

Each new purchase uses a new PROCEED row from the checker xlsx. Rows used so far: 5 (JLX8382), 6 (JXP4235),
13 (WXV9988, not paid). The Dev used row 11. Next free rows: 14 JPX1030, 15 BJX6968, 17 PLX9927, 18 CDX9196, 22 JXH1451 …
- **Part 1 started (≈15:50).** The plugin browser was still locked, so the runs now go through
  **`scripts/claude-run/run-ts.mjs`** (local Playwright 1.63 from `scripts/eauto-12406/automation`, its own Chrome)
  together with `scripts/claude-run/secarang-steps.mjs` (shared steps) and step files in `scripts/claude-run/12406/`.
  - Needed `npx playwright install ffmpeg` once, run in `scripts/eauto-12406/automation`.
  - Run with: `node scripts/claude-run/run-ts.mjs scripts/claude-run/12406/<file>.mjs`. It does finish.json, finish-ts,
    and prints the proofs.
- RC_TS8 rerun: FAIL E3 (D1). The first try stopped on a script fault (CIBO navigation); it was fixed and run clean.

### Part 1 results (4 Nov, 15:50–17:05, `run-ts.mjs`, own browser)
- RC_TS8 / RC_TS2 / RC_TS1 reruns: **FAIL**, same as Azfar (D1 EAINT-12764, D2 EAINT-12765).
- QT_TS7: **KIV (BA)**, the same document dates (PDS 2020, Privacy 2020, Policy Wording 2022, Claim Guide image-only).
- E2E_TS1/2/3 on the real API with "FAIZUDDIN TEST ALLIANZ": the name is accepted and the status is **Insurance created**.
  All three still have **no cover note / policy / e-Cert** after waiting (Q44 still open on the real API).
  Refs: BR6N006394 (FPX), BR6N006396 (card, SCC), BR6N006397 (Grab, SEW). D2 is on all three.
- E2E_TS12: still **BLOCKED** (RM6,219.60, Grab window blank; a cheaper car hits the 2-month renewal rule).
- QT_TS4 (→ RC_TS4 E5, RG_TS2, RC_TS11) not run yet: it needs a real car where Allianz does not quote. Look for one
  during Part 2's quote checks.
- Price-jump observation, now seen on 3 cars:
  - JXP4235: card RM696.43 → RM844.58
  - JPX1030: card RM902.86 → RM982.20
  - BJX6968: card RM734.29 (it matched)
  So it is not every car. Check more in Part 2 before raising.
- A car that has just been bought gets the 2-month visitor form. Every new purchase needs a fresh row.

### Part 2 data scan (17:10, `scripts/claude-run/quote-scan.mjs`, unrecorded, quotes only)
- Row 22 JXH1451 (Perodua Alza 2014): Lonpac RM575.04, Allianz RM523.93, Tokio Marine RM582.08. **All three** → QT_TS1, E2E_TS9.
- Row 28 DDX7331 (Honda Civic 2021): all three; Allianz RM1,832.53, Tokio Marine RM2,079.04.
- Row 29 WA7788X (Perodua Ativa 2022): Lonpac + Allianz; **Tokio Marine unavailable** → QT_TS6.
- Row 32 SD3367X (2024, make blank): only Tokio Marine, priced **RM0.00 / RM50.00** (odd, observe); Lonpac and Allianz unavailable.
- Row 33 BQX1858 (Proton X50 2022): Lonpac + Tokio Marine; **Allianz unavailable** → QT_TS2, QT_TS4 (buy Lonpac).
- Rows 24 and 30: timeout / script click fault, not used.
- None yet for QT_TS5 (Lonpac unavailable, Allianz + Tokio Marine quote).

### Part 2 results (17:10–18:10)
- **PASS:** QT_TS1, QT_TS2, QT_TS4, QT_TS5, QT_TS6, RG_TS2, E2E_TS9, E2E_TS10 (try c, row 44), E2E_TS4. Details are in RESULTS.md.
- **E2E_TS10 tries a/b:** a = Type R variant (Allianz only); b = RM2,224.06, blank Grab window. Both kept.
- **Purchases made today:**

  | Ref | Plate | Insurer | Status |
  |---|---|---|---|
  | BR6N006388 | JLX8382 | Allianz | Failed (name) |
  | BR6N006389 | JXP4235 | Allianz | Failed (name) |
  | BR6N006394 | JPX1030 | Allianz | Insurance created |
  | BR6N006396 | BJX6968 | Allianz (card) | Insurance created |
  | BR6N006397 | PLX9927 | Allianz (Grab) | Insurance created |
  | BR6N006399 | BQX1858 | Lonpac | Insurance created, cover note |
  | BR6N006401 | JXH1451 | Allianz | Insurance created |
  | BR6N006404 | WXQ3008 | Tokio Marine | Insurance created |
  | BR6N006405 | WA7788X | Allianz (SPayLater) | Insurance created |

  These cars now show the 2-month renewal form, so don't reuse them.
- **Not run yet / next:**
  - E2E_TS5 (FPX fail 51 → SPayLater cancel → FPX pay).
  - RC_TS4 E5 (Insurance Company filter Lonpac / TokioMarine + agency; data now exists: BR6N006399, BR6N006404).
  - RC_TS11 E2 (CRM record of the Lonpac buyer BQX1858).
  - RC_TS7 (e-receipt email: check faizuddin@modefair.com inbox / Spam, sender noreplyiatest@bintangprospek.com).
  - QT_TS3 / CP_TS7 / E2E_TS8 and the orange rows stay ON HOLD.
- **Possible defects to decide with Faizuddin** (not raised):
  1. The price jump from the All Quotations card to Add-ons (2 of 4 cars).
  2. Grab blank above ~RM2,000 (part of Q46).
  3. Row 32 Tokio Marine quoting RM0.00 / RM50.00.
