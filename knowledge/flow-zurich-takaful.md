# Flow: Zurich Takaful onboarding — EAINT-8606 (eAuto) + EAINT-8608 (Secarang)

Written 2026-10-22 from a read-only study. Nothing was changed in Jira, Miro or
any environment. Faizuddin tested both tickets **manually** before the
automation shift; per Faizuddin 2026-10-22, *"everything is as expected up until
this point"* — treat the board's pass marks as the true state, not as claims to
re-check.

Sources:

1. **Miro board "eAuto & Secarang - Zurich"** — link in
   [`_reference/miro-links.txt`](../_reference/miro-links.txt). Read through
   Miro's read-only accessibility outline, 2026-10-22. Tag: `[miro outline]`.
2. **SRD_EAINT-8606 V1.2 (15.05.2026)** and **SRD_EAINT-8608 V1.2 (15.05.2026)**,
   Jira attachments 146002 / 147118, read 2026-10-22. Tags: `[SRD 8606 v1.2 §x]`,
   `[SRD 8608 v1.2 §x]`.
3. Jira EAINT-8606 / 8608 fields and sub-tasks, read 2026-10-22. Tag: `[jira]`.
4. Teams DM exports under `_reference/teams/`. Tag: `[teams <file> <date>]`.

**Gap — the board's 30 tables were NOT read.** Miro's outline exposes sticky
notes, shapes and text, but table cells come back empty (`aria-label="Grid, n of
8"`, no text). The tables hold the Insurance API Response TS (`IE_RRE_TS1`…),
Refer Risk / API-down error TS, UI Testing, Regression, Cron Job and Insurance
Sequence scripts — **1,923 cells across 30 tables**. To read them: connect the
claude.ai Miro connector (`/mcp` → "claude.ai Miro") and read each table, or
screenshot them. `[verified: miro.board.get() 2026-10-22 — 30 table, 1923 table_text items]`

## 1. Status (as of 2026-10-22)

1. Both parents: **Testing In 1st Env**, assignee Aishah Dhabitah (BA), QA =
   Faizuddin, fix versions `Latest Pending Listing` + `S29.X-20260513`. Last
   updated 2026-07-20. `[jira]`
2. The 13/14 May 2026 deployment did **not** happen. Board header: *"Target
   Deployment Date: 14th May 2026 … (UAT session: 29 & 30 April)"*. `[miro outline]`
3. **Zurich asked to redo UAT** — 8606 description, Test Data row 1:
   *"10.06.2026 (Wed) Zurich want to proceed the UAT again as the data last time
   not longer valid anymore."* New test data = attachment `DATA E AUTO.xlsx`
   (2026-06-10). `[jira]`
4. Dev code still moving: SIT3 deploy 2026-10-07 *"Includes prod/master
   f0ebe44091 (EAINT-12438 …) + EAINT-8606 (!4816)"*. `[teams eAuto-Deployment-Notification.md 2026-10-07 18:57]`
5. Linked, not started: EAINT-8607 (mobile app, REQ GATHERING), EAINT-8817 (API
   doc study, To Do), EAINT-8818 (Serbasentral API integration, To Do). `[jira]`

### 1a. Open sub-tasks (not Done/Closed)

| Key | Summary (short) | Status | Assignee |
|---|---|---|---|
| 11022 | Update Plan Details titles/description, all vehicle types | Testing In 1st Env | Xiwei Lim |
| 11042 | Unable to retrieve quotation for Zurich | Testing In 1st Env | Faizuddin |
| 11060 | Missing documents in disclaimer section | In Development | Xiwei Lim |
| 11147 | Zurich insurer name inconsistent (details, receipt, Secarang) | Ready in 1st Env | Xiwei Lim |
| 11153 | Pre-tick All Drivers & All Riders + disclaimer popup | To Do | – |
| 11159 | Cover Note/Policy No. not on Official Receipt | Ready in 1st Env | Goh Kai Jiaeh |
| 11160 | Download E-Certificate fails to load PDF | Ready in 1st Env | Goh Kai Jiaeh |
| 11256 | After payment, insurance not created | Ready in 1st Env | Faizuddin |
| 11661 | HP record stays Active after BER/TL | Ready in 1st Env | Goh Kai Jiaeh |
| 11725 | Refer risk other than BER/TL returns T record status (Service Portal) | Ready in 1st Env | – |
| 11770 | Extended decimal in windshield | Ready in 1st Env | Faizuddin |
| 11775 | CIBO Invoice button dead for eAuto transactions | To Do | – |
| 11505 | [8608] Secarang UI issue | Testing In 1st Env | Faizuddin |

All 13 above are 8606 children except 11505 (8608). 8608 has 27 sub-tasks; 26
are Done/Closed. `[jira 2026-10-22]`

## 2. Requirement — what the SRDs say (V1.2, 15.05.2026)

1. **Zurich Takaful replaces Syarikat Takaful Malaysia** as the Takaful
   provider, for private car, company car and motorcycle, including EV.
   `[SRD 8606 v1.2 §2.2.2.1.2 #1]`
2. **Distributor:** Pemaju Eksklusif Sdn. Bhd. (not Bintang Prospek — that
   mapping was bug EAINT-10971, Done). `[jira]`
3. **eAuto quotation sequence for the 13.05.2026 deployment** `[SRD 8606 v1.2 §2.2.2.1.2 #1]`:
   1. Default: Chubb → Zurich (Comprehensive) → Zurich (TPFT) → Syarikat Takaful
      (Comprehensive) → Syarikat Takaful (TPFT) → Lonpac → Tokio Marine.
   2. East Coast (Pahang, Terengganu, Kelantan): Zurich (Comp) → Zurich (TPFT) →
      STM (Comp) → STM (TPFT) → Chubb → Lonpac → Tokio Marine.
   3. Motorcycle: Zurich (Comp) → Zurich (TP) → Tokio Marine (Comp) → Tokio
      Marine (TPFT).
   4. SRD note: *"Will need to confirm with PO the insurance quotation sequence
      before deployment."* — the order must be re-confirmed for any new date.
4. **Secarang sequence** is the same minus Chubb at the top (Zurich Comp → Zurich
   TPFT → STM Comp → STM TPFT → Lonpac → Tokio Marine); motorcycle identical to
   eAuto. `[SRD 8608 v1.2 §2.2.2.1.1 #1]`
5. **Cover types** `[SRD 8606/8608 v1.2 #2]`: Car = Comprehensive (V-CO) + TPFT
   (V-FT). Motorcycle = Comprehensive (V-CO) + Third Party (V-TP). Motorcycle's
   second card is labelled **"Third Party" / "TP"**, never TPFT.
6. **TPFT eligibility** — shown when any is true `[SRD v1.2 #3, both]`:
   1. vehicle year **> 20 years**;
   2. ≤ 20 years, **no quotation from all insurers**, and no hak milik (if approved eSTM);
   3. ≤ 20 years, **sum insured < RM20,000**, and no hak milik (if approved eSTM).
7. **Optional coverage** `[SRD 8606 v1.2 §2.2.2.1.4]`:
   1. Car: All Drivers, Legal Liability to Passengers, CART, Inclusion of Special
      Perils, Legal Liability of Passengers for Negligent Acts, Breakage of Glass
      (sum covered is typed by user).
   2. Motorcycle: All Riders, Inclusion of Special Perils, Legal Liability to Pillion.
   3. **All Drivers** follows Chubb: pre-ticked + popup *"Please be advised that if
      a customer does not wish to include All Drivers in their policy, it is
      essential to untick the All Drivers."*
   4. **All Riders** follows Tokio Marine: mandatory, cannot untick.
   5. **Zurich TPFT excludes** All Drivers, Breakage of Glass, Inclusion of
      Special Perils — hidden or disabled when TPFT is selected.
8. **MPA Coverage** — *"As per 24.04.2026, MPA Coverage will be excluded in this
   deployment"*. `[SRD 8606 v1.2 §2.2.2.1.5]`
9. **Takaful wording** (Step 3 Payment Summary): Insured → **Person Covered**;
   Period of Insurance → **Period of Takaful**; Sum Insured → **Sum Covered**;
   Basic Premium → **Basic Contribution**; Premium → **Contribution**.
   `[SRD 8606 v1.2 §2.2.2.1.7]`
10. **Disclaimer** — Zurich's Declarations & Authorisations still *"pending
    confirmation from the Zurich team"*. `[SRD 8606 v1.2 §2.2.2.1.7 Note (v1.2)]`
11. **Step 4 Refund and Cancellation** text is new. `[SRD 8606 v1.2 §2.2.2.1.8]`
12. **Insurance menu contact info**: roadside hotline 1300 88 5566 / 03-7989 0345,
    other assistance 1300 888 622, callcentre@zurich.com.my, plus Z-Driver PDS,
    Z-Rider PDS, Duty of Disclosure links. `[SRD 8606 v1.2 §2.2.2.1.1]`
13. **Plan names** `[SRD 8606 v1.2 §2.2.2.1.3]`: Car = *Z-Drive Assist Takaful*;
    EV = *Z-Driver Comprehensive: EV Protect*; Motorcycle = *Z-Rider (Plus) Takaful*.
14. **Secarang only** `[SRD 8608 v1.2]`:
    1. Postcode: *"Only Lonpac will block Labuan postcode"*; Sabah, Sarawak,
       Perhentian, Langkawi all proceed (§2.2.2.1.1 #4).
    2. Car VN and motorcycle VN may go through **either** homepage tab; no block,
       no error (§2.2.2.1.4 #2). This reverses Charmain's 2026-05-11 reply *"Car
       tab only accepts car VN … yes by right should behave like this"*
       `[teams DM-Charmain-Ea-Chiang.md 2026-05-11 16:58]` — SRD V1.2 is later and wins.
    3. New landing page with Car and Motorcycle entry points (§2.2.2.1.4 #1).

### 2a. Requirements agreed AFTER SRD V1.2 (no newer SRD on Jira)

From Faizuddin's Zurich meeting notes `[teams DM-Charmain-Ea-Chiang.md 2026-07-06 15:57]`:

1. *"Zurich API will return the upper and lower limit for agreed value and market
   value. Need to test scenarios that will cover Agreed Value and Market Value.
   There will be scenarios where Agreed Value is not eligible (will return 0) and
   can only choose Market Value."*
2. eAuto UI: add the BRN after *'Zurich General Takaful Malaysia Berhad'*; rename
   *'Zurich Takaful Malaysia Berhad'* → *'Zurich General Takaful Malaysia
   Berhad'*; Payment Page disclaimer change.
3. Secarang UI: Zurich terminology — *"Premium/Price > Contribution; Sum Insured >
   Sum Covered; Insured > Participant"*.
4. These are **not in any SRD version** attached to Jira (latest = V1.2,
   15.05.2026). Ask the BA for V1.3 before re-drafting TS. `[jira attachments 2026-10-22]`

### 2b. Secarang SRD 8608 — extra detail (added 2026-10-27)

All from SRD_EAINT-8608 PDFs V0.1–V1.2 read in the 2026-10-27 study. Tag:
`[from ticket EAINT-8608, SRD <ver> §x]`.

1. **SRD version history:**
   1. V0.1 (28.07.2025): Zurich for motorcycle, private and company vehicles,
      *"replacing Syarikat Takaful Malaysia, while adhering to the existing insurer
      prioritisation sequence."* `[from ticket EAINT-8608, SRD V0.1 §2.1.1 a]`
   2. V1.0 (29.07.2025): motorcycle dropped — *"b. Introducing Zurich Takaful
      Motorbike Insurance will be on separate SRD."* `[from ticket EAINT-8608, SRD V1.0 §2.1.1 d]`
   3. V1.1 (27.04.2026): *"replacing Syarikat Takaful Malaysia"* is struck out in
      §2.1.1 a; adds the 13.05.2026 car and motorbike sequences, Plan Details,
      Add-Ons. `[from ticket EAINT-8608, SRD V1.1 §2.1.1 a]`
   4. V1.2 (15.05.2026): "Motorbike" renamed "Motorcycle"; adds Cover Type, TPFT
      Eligibility, Postcode Handling, All Drivers / All Riders behaviour, TPFT
      exclusions and the Landing Page section. `[from ticket EAINT-8608, SRD V1.2]`
2. **Secarang keeps Syarikat Takaful Malaysia.** The strike-out (item 1.3) and the
   new sequence (STM at positions iii–iv) both keep STM. SRD V1.2 Table
   2.2.2.1.1.1 #1 "New Handling" still reads *"To onboard Zurich Takaful as the new
   Takaful provider for private and company vehicles, replacing Syarikat Takaful
   Malaysia"* — a leftover the SRD contradicts itself on. `[from ticket EAINT-8608, SRD V1.2 §2.1.1 a + Table 2.2.2.1.1.1 #1]`
3. **Secarang sequence before Zurich** ("As of 28.07.2025"): *"Tokio Marine",
   "Takaful (Comprehensive)", "Takaful (TPFT)", "Lonpac (Hidden from Secarang since
   14.07.2025)", "RHB (Hidden from Secarang since 19.05.2025)", "Allianz (Hidden
   from Secarang since 19.05.2025)"*. The new car sequence lists Lonpac at
   position v, so Lonpac comes back on Secarang. `[from ticket EAINT-8608, SRD V1.2 Table 2.2.2.1.1.1 #1]` Re-enabling Lonpac is implied, not stated. `[unconfirmed]`
4. **Motorcycle scope note left in:** V1.2 §2.1.1 d.b still says *"Introducing
   Zurich Takaful Motorcycle Insurance will be on separate SRD."* while the same
   SRD specifies the motorcycle sequence, plan details, add-ons and landing tab.
   Treat the tables as the requirement. `[from ticket EAINT-8608, SRD V1.2 §2.1.1 d]` `[unconfirmed which wins]`
5. **Landing page VN rule — reason:** *"Note: As existing insurer API did not
   cater the vehicle type."* `[from ticket EAINT-8608, SRD V1.2 Table 2.2.2.1.4.1 #2]`
6. **Plan Details "More Info" links** `[from ticket EAINT-8608, SRD V1.2 Table 2.2.2.1.2.1 #6]`:
   1. Motor Vehicle: *"Z-Drive Assist Takaful Flyer", "Product Disclosure Sheet", "Certificate Wording"*.
   2. EV: *"Z-Driver Comprehensive: EV Protect Flyer", "Product Disclosure Sheet", "Certificate Wording"*.
   3. Motorcycle: *"Z-Rider (Plus) Takaful", "Product Disclosure Sheet", "Certificate Wording"*.
7. **Plan Details — All Riders:** *"For Zurich Motorcycle, the 'All Riders' line
   item has been REMOVED from the Optional Coverage list under Motorcycle in this
   Plan Details view, as All Riders is now mandatory for motorcycle"*. Plan Details
   #5 and Add-Ons #1 still list "All Riders" — check which the build follows.
   `[from ticket EAINT-8608, SRD V1.2 Table 2.2.2.1.2.1 #5 note]`
8. **All Drivers rule applies to both portals:** *"(applies to both eAuto &
   Secarang)"*. `[from ticket EAINT-8608, SRD V1.2 Table 2.2.2.1.3.1 #2]`
9. **Takaful term rule:** *"For Takaful coverages, to ensure the term use is
   suitable with its coverage type. (eg. sum insured (for insurance) = sum covered
   (for takaful))"*. Secarang's word for "Insured" is still open: July notes say
   "Participant" (§2a #3), the eAuto SRD says "Person Covered" (§2 #9). `[from ticket EAINT-8608, SRD V1.2 §2.1.1 d.d]`
10. **TPFT eligibility on Secarang** cites *"no hak milik (if got approved estm)"*;
    Secarang has no eSTM step, so how this is checked there is unknown. `[unconfirmed]`
11. **Old bugs now allowed by V1.2:** EAINT-11210 *"Able to use Car and Bike VN in
    both tabs when getting quotation"* and EAINT-11209 *"Able to proceed with
    invalid postcodes"* describe behaviour V1.2 permits (§2 #14). Check how they
    were closed before a retest. `[source: Studying EAINT-8608 study, 2026-10-27]`
12. **Figure is outdated:** SRD Figure 2.2.2.1.1.1 shows the old Takaful Malaysia
    card, no Zurich card. Use the Figma nodes for UI: Plan Details 2389-2722,
    Add-Ons 2389-2390, Landing car 3187-4882, Landing motorcycle 3187-5026.
    `[from ticket EAINT-8608, SRD V1.2 §2.2.2.1.1–2.2.2.1.4]`

## 3. Environments and the before/after trick

1. **staging/eauto = without Zurich; staging/sit3 = with Zurich.** The EXT TS
   create data on staging/eauto, then resubmit on staging/sit3 and expect Zurich
   to appear. `[miro outline — EXT_TS1..6]`
2. Staging moved to the `/eauto` instance on 2026-10-21 (see memory
   `staging-instance-eauto`). Re-confirm which env carries !4816 before
   resuming; SIT3 had it on 2026-10-07.
3. **Before resuming, rebuild test data** — Zurich invalidated the old data
   (§1 item 3).
4. **Secarang /preprod holds the 8608 branch.** *"Secarang /preprod / Backend !258
   (pipeline #17140 succeeded) and frontend !676 via dev/feat/EAINT-8608 (pipeline
   #17141 succeeded). Latest prod deployed; preprod keeps its own EAINT-8608 /
   EAINT-8669 work."* `[from Teams eAuto Deployment Notification, 2026-10-22 07:47, Workflows]`
   Whether /preprod is the agreed 8608 test env is not stated. `[unconfirmed]`

## 4. eAuto flow (UCD) — from the board

### 4a. Entry points

1. **Get a Free Quote**: Home → [INSURANCE] → [Get a Free Quote] → Individual (VN +
   IC) or Company (VN + Company Reg. No.) → [SHOW MY RESULTS]. Default =
   Individual; blank fields show *"This field is required"* + red border.
2. **From eSTM, FI flow**: eSTM Step 4→5 JPJ enquiry fails with **VEL000069E**
   (needs an Active Hire Purchase record) → system lands on Insurance Step 1
   showing **all** insurers.
3. **From eSTM, non-FI flow**: eSTM Approved → eSTM details page → ad banner or
   [GET FREE QUOTE FOR {veh_no}] → Step 1 shows **only the top two** insurers.
   Board: *"If eSTM is approved, only the top two insurance options will be displayed."*
4. **Resubmit**: Insurance Transaction Listing → status Pending Payment →
   [Resubmit] → Step 3.

### 4b. Steps

1. **Step 1 Quotes** — vehicle details from API (Vehicle, Year, Capacity,
   Transmission, Variant), NCD default 0.0%, Transfer NCD, Change Postcode,
   [Apply Changes] re-quotes. Cards show coverage type, Sum Insured/Agreed value
   dropdown, [SELECT {insurer}], [More Info]. [BACK] keeps previous inputs; [START
   OVER] clears.
2. **Step 2 Optional Coverage** — vehicle details (read-only), Insurance Plan
   ([View Plan Details]), optional coverage, Quotation block:
   1. Contribution After NCD = Basic Contribution − NCD Discount + All Drivers
   2. Gross Contribution = Contribution After NCD + optional coverage
   3. Service Tax = Gross Contribution × 6%
   4. Stamp Duty = RM 10.00
   5. Total Contribution = Gross + Service Tax + Stamp Duty
   6. Non-FI flow adds a **10% Gross Contribution Discount** line; FI flow has
      **HP Loan and no 10% discount**. `[miro outline — COM_TS1/TS2]`
   7. Disclaimer line on the newer card: *"Pemaju Eksklusif Sdn. Bhd. is the
      authorized distributor of Zurich General Takaful Malaysia Berhad."* An
      older card on the board still reads *"underwritten by Zurich Takaful
      Malaysia Berhad … Commission (10%)"* — the newer wording matches §2a.
3. **Step 3 Payment** — Reference No, Insured section (Mobile, Email, Address 1
   mandatory; postcode locked from Step 1), Vehicle details, Hire Purchase Loan
   dropdown, Dealer section, Authorised Representative. [MAKE PAYMENT] → RHB
   popup *"Are you sure you want to proceed with this payment? Please ensure that
   there is sufficient fund in your RHB account."* (BM + Chinese lines follow).
4. **Step 4 Confirmation** — success: *"Thank you! Your payment has been
   successfully made. Your insurance is now created."* + E-certificate No,
   Confirmation of Payment, Refund and Cancellation. Failed: *"Error Code -
   {rhb_error_code} - {rhb_error_description}"* + [Try Again] → Step 3, or [Save &
   Continue Later] → listing.
5. **Permission**: Main UCD or Sub-UCD **with Insurance permission** (BO → Manage
   Company). `[miro outline]`
6. **BO Insurance Quote Enquiry** lists cards per category: Car = Chubb, Lonpac,
   Takaful Comp/TPFT, Zurich Comp/TPFT, Tokio Marine; **Motorbike = Zurich
   Comp/TPFT + Tokio Marine; EV = Zurich Comp/TPFT only**. `[miro outline]`

### 4c. Test-data levers (from the board)

1. FI flow: create an **Active Hire Purchase record** (Service Portal) and set the
   eSTM Step 4 response to **VEL000069E**. Board: *"DONT FORGET TO CHANGE THE
   RESPONSE CODE 69E"*; also *"ZBF006"* listed next to it.
2. Vehicle type via eSIM: **Motorbike = Usage AA, Body MSL; Fuel car = AB, MKR;
   EV = Usage EV, Body EV.** (EXT_TS2 and TS4 say "EV" but set AB/MKR — check
   before reuse.)
3. RHB payment failure: eSIM RHB response code **IF**.
4. Cover Note Failed: **VN prefix ZA**. JPJ Pending/Rejected: **VN prefix ZB**.
5. Board checklist: *"Check Insurance availability at BO · Check VN Response Code
   at eSIM · Change email at insurance step 3 · Check Service Portal, CIBO, UCD, BO"*.
6. BER/TL special handling: HP record status **Active** before; **B / T** after
   (bug 11661 says it stays Active).

## 5. eAuto test-scenario catalogue (board state, 2026-10-22)

✅ pass · ❌ fail · 🚧 in progress · – unmarked. Sticky notes on the board sit
next to TS but their link to a specific TS cannot be read from the outline.

### 5a. ZURICH (COMPREHENSIVE) — COM_TS1–12

| TS | Scenario | Mark |
|---|---|---|
| COM_TS1 | MyKad > Motorbike, FI, ALL optional coverage | ✅ |
| COM_TS2 | MyPR > Fuel car, non-FI, max sum covered, selective coverage, Step 3→2 price check | ✅ |
| COM_TS3 | MyKad > EV, FI, exit at Step 3 → Resubmit | – |
| COM_TS4 | Company > Motorbike, non-FI, change postcode | ✅ |
| COM_TS5 | Company > Fuel car, non-FI, max→min sum covered, no coverage, Resubmit | ✅ |
| COM_TS6 | Company > EV, non-FI via Get a Free Quote (VN + BRN) | – |
| COM_TS7 | MyKad > FI, payment failed (IF) → Try Again → success | ✅ |
| COM_TS8 | Company > non-FI, payment failed repeatedly | ✅ |
| COM_TS9 | MyPR > FI, Cover Note failed | – |
| COM_TS10 | Company > non-FI, Cover Note failed → Status Failed | ✅ |
| COM_TS11 | MyKad > FI, JPJ Rejected | ✅ |
| COM_TS12 | Company > non-FI, JPJ Rejected | ✅ |

### 5b. ZURICH (THIRD PARTY, FIRE AND THEFT) — TPFT_TS1–12

Same 12-row shape as COM. ✅ on TS1, 2, 4, 5, 7, 8, 10, 11, 12; unmarked TS3
(MyKad EV via Get a Free Quote), TS6 (Company EV), TS9 (MyPR FI Cover Note failed).

### 5c. Existing Insurance Transaction (before + after deployment) — EXT_TS1–6

| TS | Scenario | Mark |
|---|---|---|
| EXT_TS1 | MyKad > Fuel car, FI: 69E on staging/eauto (no Zurich) → resubmit eSTM on sit3 (Zurich shows) → buy | ✅ |
| EXT_TS2 | MyPR > EV, FI, same pattern | – |
| EXT_TS3 | MyKad > Motorbike, non-FI: approved on staging/eauto → Get a Free Quote on sit3 | ✅ |
| EXT_TS4 | MyKad > EV, non-FI: Pending Payment on staging/eauto → resubmit on sit3 → back to Step 1 | – |
| EXT_TS5 | MyKad > Motorbike, non-FI: payment failed on staging/eauto → resubmit on sit3 | ✅ |
| EXT_TS6 | MyKad > Fuel car, non-FI: insurance patched to Quotation Expired → new quote on sit3 | 🚧 |

### 5d. Board "To add" list (not yet written as TS)

*"1. Cronjob TS 2. Refer Risk code TS* (Char) 3. insurance api down scenarios
(Char) 4. jpj api down scenarios (deprio) 5. Regression TS 6. Secarang high level
7. TS Get free quote w/o estm (Individual ONLY) 8. MPA Coverage (To confirm w BA)
9. NCD & Over-insured amount scenario"*. Items 1–3 and 5 appear as table sections
(Cron Job, Refer Risk Error, API Down, Regression) — content unread, see Gap.
Another note: *"1. To add optional coverage on Happy Flow 2. Over-insured amount
scenario"*. `[miro outline]`

### 5e. Affected pages listed on the board (regression scope)

1. **UCD**: Insurance Homepage (logo), Insurance Transaction Listing (columns,
   SnF), Purchase flow, Insurance Payment Report (columns, SnF, export), Monthly
   Handling Fee Report, CP58, eSerahan FI / non-FI flow.
2. **BO**: Insurance Transaction Listing + Details, Endorsement, Payment
   Transaction, Upload e-Certificate, Quote Inquiry, **Refer Risk Log**, Payment
   OTP Log.
3. **Service Portal**: Ownership Claim Listing, Hire Purchase Record Creation
   Listing, Create New Hire Purchase Record.
4. **CIBO**: Transaction Management listing + Export CSV + Print, Insurance
   Details page. Email.
5. Report note: *"The report only display data within one month of the selected
   date only"*.

## 6. Secarang flow (EAINT-8608) — from the board

1. Homepage → Car / Motorcycle tab → Private or Company → Plate No., Owner IC /
   SSM No., Postal Code → [Get quotation] → "Bear with us" loader.
2. Step 1 Car Details (Plate, Make, Model, Year, Seat, CC, Variant, Transmission,
   Current Coverage, NCD) → Step 2 All Quotations (Zurich card: *"Market Value …
   All Drivers, Free towing, Road assistance, Plan Details"*) → Step 3 Add-ons →
   Step 4 Confirmation (gender change must re-price) → Step 5 Payment (Fiuu: card
   or FPX) → Step 6 Success → WhatsApp + email receipt.
3. Zurich add-on cards: All Drivers, All Rider, Legal Liability to Passengers,
   Passenger Liability Cover, CART, Inclusion of Special Perils, Legal Liability of
   Passengers for Negligent Acts, Breakage of Glass (sum insured editable).
4. Board checklist: *"Ensure the PIAM ID is MTA-J55282"*; verify commission under
   PIAM ID **before payment** with dev; CIBO modules CRM, Transaction Management,
   Payment Report, Commission Report.
5. Car add-ons: All Drivers pre-ticked + popup. Motorbike: All Riders mandatory,
   not in the optional list, shown **below NCD** on the payment page.

### 6a. Secarang TS catalogue — SC_E2E_TS1–28

Car/EV/Motorbike × Individual/Company × Comprehensive (TS1–14) and TPFT/Third
Party (TS15–28). Covers: change postcode, invalid postcode (Sabah 88000–91309,
Sarawak 93000–98859, Perhentian 22300, Langkawi 07000), payment failed (Fiuu
sandbox → *"Unsuccessful payment. You may try again"*), min/middle/max sum
insured, no / partial / all add-ons, car VN in motorbike tab.

1. ✅: TS1, 3, 4, 6, 7, 8, 10, 12, 14
2. ❌: **TS9** (Individual car, all add-ons). Nearby note: *"Failed - Windscreen
   add-ons not displaying the same price"* → matches EAINT-11736 (Done).
3. Unmarked: TS2, 5, 11, 13, 15–28.
4. Board notes that cut scope (verbatim): *"Deprio - Roadtax delivery not
   applicable in secarang anymore"*, *"Deprio - All postcode can be used"*, *"EV
   car won't be included in this phase"*, *"Deprio as there are no TPFT for EV"*,
   *"Deprio. All Riders is now mandatory"*, *"Removed - Latest SRD 27/4/26"*,
   *"As per discussed w BA Both Car and Motorcycle VN can go through either Car or
   Vehicle tab in the Secarang Homepage."* So the invalid-postcode and road-tax TS
   (11, 13, 25, 27) are de-prioritised, not failed.

## 7. Things to confirm before picking this back up

1. SRD V1.3 for the July requirements (§2a) — Agreed vs Market Value, BRN, name change.
2. Current quotation sequence with the PO (SRD says confirm before deployment).
3. Which env has !4816 now, and new Zurich test data (`DATA E AUTO.xlsx`).
4. Board wording to check before reuse as automation input (not defects — the
   manual runs passed): TPFT_TS6 selects *"ZURICH (COMPREHENSIVE)"*; COM_TS9 /
   TPFT_TS9 expect *"Status Insurance Created"* on Cover Note failed while the
   board note says *"Insurance cannot be created if Cover Note failed Insurance
   Status = Failed"*; SC_E2E_TS12 is Company > Motorbike but says *"Ensure the
   details are for Fuel Car"*; board note *"TP Will be removed as motorcycle will
   ONLY have Comprehensive"* conflicts with SRD V1.2 (motorcycle = Comp + TP).
5. Read the 30 tables (see Gap).
6. **No VN prefix in 8608 scenarios.** Faizuddin, 2026-10-27, dashboard chat:
   *"Do not set any VN Prefix yet, cus insurance is a big module, so different
   prefix is used for different situations"*. Past prefixes (8536 "VB" / "VF",
   board "ZA" / "ZB") are history only, not inputs for 8608.
   `[source: Studying EAINT-8608 related-history, Known traps #4.1, 2026-10-27]`
7. **eSIM may not show TPFT.** Past Takaful CR remark: *"Tested by e-sim, in e-sim
   not show the TPFT"* — use live API data for TPFT cases. `[source: Studying EAINT-8608 related-history, Known traps #3, citing EAINT-9214 TS sheet "Takaful UI changes" R4–R9 Remarks]` `[unconfirmed for Zurich]`
8. **Zurich card must not reuse STM distributor text.** The STM disclaimer reads
   *"This product is underwritten by Takaful Malaysia and Bintang Prospek is the
   authorized distributor of Takaful Malaysia"*; Zurich must name Pemaju Eksklusif
   (same mix-up as bug EAINT-10971). `[source: Studying EAINT-8608 related-history, Known traps #11, citing EAINT-9215 TS R15]`

## 8. Related

1. [flow-insurance-purchase.md](flow-insurance-purchase.md) — UCD insurance purchase DOM.
2. [flow-secarang-insurance.md](flow-secarang-insurance.md) — Secarang purchase automation.
   The dashboard's "Regression - Secarang" tab (`scripts/secarang-insurance`,
   default insurer Zurich) is **a tool to create a Secarang transaction quickly
   for other purposes, not TS coverage** — per Faizuddin 2026-10-22. Its gaps
   against SC_E2E_TS1–28 (TPFT disabled, motorcycle unproven, no CIBO / PIAM /
   gender checks) are by design. Zurich TS automation, if built, is a separate
   project that reuses its page objects.
3. [eauto-insurance.md](eauto-insurance.md), [esim.md](esim.md), [flow-estm.md](flow-estm.md).
4. `EAINT-8606.xlsx` in the CR TS library actually holds the **EAINT-8534** script,
   not Zurich — see [cr-test-scenario-catalogue.md](cr-test-scenario-catalogue.md) row 070.
