# EAINT-8608 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "⚪[Secarang][Insurance] To onboard Zurich Takaful under Pemaju Eksklusif Sdn. Bhd. "
2. **Jira status:** **Testing In 1st Env** (Task). Last updated 2026-07-20 14:59. No comments.
3. **Priority:** Medium. **Labels:** ProductBacklog.
4. **Fix versions:** "Latest Pending Listing" (2026-08-01) and "S29.X-20260513🌚" (2026-05-13). The 13 May deployment did **not** happen (`knowledge/flow-zurich-takaful.md` §1 #2).
5. **Exp. Deploy Date (cf 10087):** 2026-05-13 (stale). **ETA for Testing (cf 10057):** 2026-04-27.
6. **QA (Jira cf[10041]):** Muhammad Amirul Azfar Bin Kamarulazam, **Muhammad Faizuddin Bin Bidi**.
7. **BA:** Aishah Dhabitah Binti Nor Azman (Jira assignee + reporter; SRD V0.1–V1.1 author). SRD V1.2 revised by Chee Mei Jia.
8. **Parent:** EAINT-3221 "INSURANCE".
9. **Links:** relates to **EAINT-8606** (eAuto web, same onboarding) and **EAINT-8607** (eAuto Mobile App).
10. **Sub-tasks:** 27 bugs (EAINT-10968 … EAINT-11736). Capture has no statuses. Per `knowledge/flow-zurich-takaful.md` §1a (Jira 2026-10-22): "8608 has 27 sub-tasks; 26 are Done/Closed" — the open one is **EAINT-11505** "[Secarang - Insurance] UI issue" (Testing In 1st Env, Faizuddin).
11. **Est. mandays:** "15 md" — `knowledge/releases.md` row 2026-05-13 `[from appraisal proof pack 2026-10-15 §A]`.
12. **Test env:** **not stated** in Jira. Latest signal: Secarang **/preprod** carries the 8608 branch — `[Teams eAuto-Deployment-Notification.md, 2026-10-22 07:47]` "Secarang /preprod / Backend !258 … and frontend !676 via dev/feat/EAINT-8608 … Latest prod deployed; preprod keeps its own EAINT-8608 / EAINT-8669 work." [unconfirmed that /preprod is the agreed test env]
13. **Testing state:** manually tested before the automation shift, then paused. Per Faizuddin 2026-10-22 (`knowledge/flow-zurich-takaful.md` header): "everything is as expected up until this point".

## Sources read

1. `_reference/tickets/Studying/EAINT-8608/EAINT-8608-jira.md` — Jira capture 2026-10-27 15:25 (fields, description, 0 comments, 8 attachments, 27 sub-tasks).
2. **SRD V1.2, 15.05.2026** (PDF, 23 pages) — read in full. Main source for this study.
3. **SRD V1.1, 27.04.2026** (PDF, pages 4–18) — read to see what V1.2 added.
4. **SRD V1.0, 29.07.2025** (PDF, pages 4–11) and **SRD V0.1, 28.07.2025** (PDF, pages 4–10) — read for history.
5. **Not read:** the four `.docx` files (V0.1, V1.0, V1.1, V1.2). A PDF of the same version exists for each; content assumed the same [unconfirmed].
6. `knowledge/flow-zurich-takaful.md` (full), `knowledge/README.md` row for it, `knowledge/releases.md` row 2026-05-13.
7. Teams: `_reference/teams/DM-Charmain-Ea-Chiang.md` (2026-04-15, 2026-05-11, 2026-07-06), `_reference/teams/DM-May-Chin-Mei-Theng.md` (2026-07-03), `_reference/teams/eAuto-Deployment-Notification.md` (2026-10-07, 2026-10-20, 2026-10-22).
8. `_reference/miro-links.txt` line 5 (Zurich board link). Board itself **not opened** in this run.
9. **Not found:** `_reference/tickets/EAINT-8608/` does not exist; `lib/ticketStudies.ts` has no EAINT-8608 entry.

## What changes

1. **Portal:** **Secarang** only. SRD V1.2 §2.1.1 b: "Targeted Portal(s) a. Secarang". eAuto web + mobile are EAINT-8606 / 8607 — §2.1.1 d.a: "Requirements for eAuto web portal and mobile app will be on another SRD."
2. **What:** add **Zurich Takaful** as a Takaful provider on Secarang, distributed under **Pemaju Eksklusif Sdn. Bhd.**
3. **Why (SRD V1.2 §2.1.1 a):** "Currently, Syarikat Takaful Malaysia is the sole Takaful provider for motor insurance on the Secarang portal." Benefit: "greater insurer choice and access to Zurich Takaful's coverage".
4. **Affected pages (SRD V1.2 §2.2.2.1 + body):**
   1. 2.2.2.1.1 **Insurance Quotation Page** (sequence, cover type, TPFT eligibility, postcode).
   2. 2.2.2.1.2 **Plan Details** (Figma node 2389-2722).
   3. 2.2.2.1.3 **Add-Ons** (Figma node 2389-2390).
   4. 2.2.2.1.4 **Landing Page (Homepage)** — new in V1.2 (Figma nodes 3187-4882 car, 3187-5026 motorcycle). Not listed in the §2.2.2.1 index table, which still shows only 2.2.2.1.1.

## Requirements (SRD V1.2, verbatim)

### A. Insurance Quotation Page — Table 2.2.2.1.1.1

1. **#1 Insurance Quotation — current sequence** "As of 28.07.2025": "Tokio Marine", "Takaful (Comprehensive)", "Takaful (TPFT)", "Lonpac (Hidden from Secarang since 14.07.2025)", "RHB (Hidden from Secarang since 19.05.2025)", "Allianz (Hidden from Secarang since 19.05.2025)".
2. **#1 New sequence** "Insurance Quotation Sequence for 13.05.2026 (Wed) deployment": "Zurich Takaful (Comprehensive)", "Zurich Takaful (TPFT)", "Syarikat Takaful Malaysia (Comprehensive)", "Syarikat Takaful Malaysia (TPFT)", "Lonpac", "Tokio Marine".
3. **#1 Motorcycle sequence** "(Motorcycle) for 13.05.2026 (Wed) deployment": "Zurich Takaful (Comprehensive)", "Zurich Takaful (TP)", "Tokio Marine (Comprehensive)", "Tokio Marine (TPFT)".
4. **#2 Cover Type (V1.2):** "Car: Comprehensive (V-CO) + Third Party, Fire and Theft (V-FT / TPFT)" / "Motorcycle: Comprehensive (V-CO) + Third Party (V-TP)". Codes: "V-CO = MOTOR COMPREHENSIVE", "V-FT = MOTOR THIRD PARTY FIRE AND THEFT", "V-TP = MOTOR THIRD PARTY".
5. **#3 TPFT Eligibility (V1.2):** "TPFT (Third Party, Fire and Theft) will be triggered when any of the following conditions is met:"
   1. "Vehicle year is more than 20 years"
   2. "Vehicle year is less than or equal to 20 years, no quotation from all the insurers, and no hak milik (if got approved estm)"
   3. "Vehicle year is less than or equal to 20 years, sum insured less than RM20,000, and no hak milik (if got approved estm)"
6. **#4 Postcode Handling (V1.2):** "Only Lonpac will block Labuan postcode — user is unable to proceed to next step if Lonpac is selected for a Labuan postcode." / "For all other insurers and postcodes (including Sabah, Sarawak, Perhentian, Langkawi), the system shall allow user to proceed to the next step."

### B. Plan Details — Table 2.2.2.1.2.1 (all "New", "Display")

1. **#1 Coverage Inclusion** — Motor vehicle & EV: "Third Party Bodily Injury and Death", "Third Party Loss or Damage", "Loss/damage to your vehicle caused by theft or fire", "Damage to your vehicle due to accident". Motorcycle: "Third Party Coverages".
2. **#2 Towing Service** — all: "Unlimited towing & breakdown assistance nationwide".
3. **#3 Driver Coverage** — Motor vehicle & EV: "Cover all drivers", "Daily hospital income", "Inconvenience Allowance due to flood". Motorcycle: "Cover all riders".
4. **#4 Road Assistance Service** — Motor vehicle: "Unlimited towing & breakdown assistance nationwide", "Panel workshop referral services", "Courtesy car". EV: same three. Motorcycle: first two only.
5. **#5 Optional Coverage** — Motor Vehicle and EV: "All Drivers", "Legal Liability to Passengers", "CART (Compensation for Assessed Repair Time)", "Inclusion of Special Perils", "Legal Liability of Passengers for Negligent Acts", "Breakage of Glass in Windscreen, Window, or Sunroof". Motorcycle: "All Riders", "Inclusion of Special Perils", "Legal Liability to Pillion".
6. **#5 Note (v1.2):** "For Zurich Motorcycle, the 'All Riders' line item has been REMOVED from the Optional Coverage list under Motorcycle in this Plan Details view, as All Riders is now mandatory for motorcycle (refer to Section 2.2.2.1.3 — All Riders behaviour)."
7. **#6 More Info (Hyperlink)** — Motor Vehicle: "Z-Drive Assist Takaful Flyer", "Product Disclosure Sheet", "Certificate Wording". EV: "Z-Driver Comprehensive: EV Protect Flyer", "Product Disclosure Sheet", "Certificate Wording". Motorcycle: "Z-Rider (Plus) Takaful", "Product Disclosure Sheet", "Certificate Wording".

### C. Add-Ons — Table 2.2.2.1.3.1

1. **#1 Key Benefits** — checkbox per optional coverage with "+More Info" text. Examples: All Drivers "+More Info: This will allow any driver with your consent to drive your vehicle and have the same takaful protection extended to them."; Breakage of Glass "… Includes one free reinstatement for repairs of damaged glass. Your No Claim Discount (NCD) entitlement will not be affected if this additional coverage is extended."
2. **#1 Notes:** "For 'Breakage of Glass in Windscreen, Window, or Sunroof' will follow the current behaviour where user should be able to input sum covered amount." / "The sequence of the Optional Coverage will follow existing sequence from other insurance panel."
3. **#2 All Drivers (V1.2)** "(applies to both eAuto & Secarang)" — "To follow Chubb behaviour: 1. The All Drivers checkbox is pre-ticked by default upon entering the Add-Ons page. 2. A popup message will be displayed to the user." Popup: "Please be advised that if a customer does not wish to include All Drivers in their policy, it is essential to untick the All Drivers."
4. **#3 All Riders (V1.2, M)** — "To follow Tokio Marine behaviour: 1. The All Riders option is mandatory. 2. User is unable to untick this option."
5. **#4 Zurich TPFT — Coverage Exclusion (V1.2):** "Zurich TPFT does not cover the following Optional Coverages: i. All Drivers ii. Breakage of Glass in Windscreen, Window, or Sunroof iii. Inclusion of Special Perils" / "These options shall be hidden or disabled when Zurich TPFT is selected."

### D. Landing Page (Homepage) — Table 2.2.2.1.4.1 (all V1.2)

1. **#1 Landing Page Layout:** "To update Secarang landing page layout to support both Car Insurance and Motorcycle Insurance entry points." / "The landing page shall allow users to select the insurance type (Car or Motorcycle) and enter the corresponding vehicle information (Car Plate No. or Motorcycle Plate No., Owner IC No., Postal Code) to proceed to get a quotation."
2. **#2 Vehicle Number Handling (Validation, M):** "Both Car VN and Motorcycle VN can proceed through either the Car tab or the Motorcycle tab on the Secarang Homepage — the system shall NOT block users based on VN/tab mismatch." / "No error message or validation is required at the homepage entry step." / "Note: As existing insurer API did not cater the vehicle type."

### E. General notes (SRD V1.2 §2.1.1 d)

1. "c. For Zurich Takaful motorcycle category, the takaful coverage offered will be Comprehensive and Third Party."
2. "d. For Takaful coverages, to ensure the term use is suitable with its coverage type. (eg. sum insured (for insurance) = sum covered (for takaful))"

## New vs existing behaviour

1. **Existing:** STM is the only Takaful on Secarang; Tokio Marine first. `[SRD V1.2 Table 2.2.2.1.1.1 #1 "Current Handling"]`
2. **New:** Zurich Comp + TPFT shown **first**; STM kept at positions iii–iv. `[SRD V1.2 #1]`
3. **New:** motorcycle insurance on Secarang with its own sequence and landing-page tab. `[SRD V1.2 #1, §2.2.2.1.4]`
4. **New:** Lonpac appears in the new car sequence (position v), though "Hidden from Secarang since 14.07.2025" in the current list. Re-enabling Lonpac is implied [unconfirmed].
5. **New:** VN/tab mismatch is allowed; only Lonpac + Labuan is blocked. `[SRD V1.2 §2.2.2.1.1 #4, §2.2.2.1.4 #2]`

## SRD version history (what each version added)

1. **V0.1 (28.07.2025):** Zurich "for motorcycle, private, and company vehicles … **replacing** Syarikat Takaful Malaysia, while adhering to the existing insurer prioritisation sequence." Note d: only "Requirements for eAuto web portal and mobile app will be on another SRD."
2. **V1.0 (29.07.2025):** drops motorcycle; adds note "b. Introducing Zurich Takaful Motorbike Insurance will be on separate SRD."
3. **V1.1 (27.04.2026):** strikes "replacing Syarikat Takaful Malaysia" in §2.1.1 a; adds 13.05.2026 sequences (car + motorbike), Plan Details, Add-Ons, note c ("Comprehensive and Third Party") and d (sum covered terms).
4. **V1.2 (15.05.2026):** renames "Motorbike" → "Motorcycle"; adds Cover Type, TPFT Eligibility, Postcode Handling, All Drivers / All Riders behaviour, TPFT exclusions, All Riders Plan Details note, Landing Page section.

## Open questions / risks for testing

1. **Requirements after V1.2 are not in any SRD.** `[Teams DM-Charmain-Ea-Chiang.md, 2026-07-06 15:57, Faiz]` "Zurich API will return the upper and lower limit for agreed value and market value. Need to test scenarios that will cover Agreed Value and Market Value. There will be scenarios where Agreed Value is not eligible (will return 0) and can only choose Market Value." and "Changes in Secarang UI: ... Terminologies in insurance details need to change to follow Zurich terminologies. Example Premium/Price > Contribution; Sum Insured > Sum Covered; Insured > Participant". Ask the BA for V1.3.
2. **Terminology conflict:** July notes say "Insured > Participant"; the eAuto SRD uses "Person Covered" (`knowledge/flow-zurich-takaful.md` §2 #9). The 8608 SRD only says "sum insured (for insurance) = sum covered (for takaful)". Which word Secarang shows is open.
3. **Motorcycle scope contradicts itself:** V1.2 §2.1.1 d.b still says "Introducing Zurich Takaful Motorcycle Insurance will be on separate SRD.", yet V1.2 specifies motorcycle sequence, plan details, add-ons and a motorcycle landing tab.
4. **"Replacing STM" conflict:** §2.1.1 a strikes "replacing Syarikat Takaful Malaysia", but Table 2.2.2.1.1.1 #1 "New Handling" still reads "To onboard Zurich Takaful as the new Takaful provider for private and company vehicles, replacing Syarikat Takaful Malaysia". The sequence keeps STM. `knowledge/flow-zurich-takaful.md` §2 #1 states "Zurich Takaful replaces Syarikat Takaful Malaysia" — **contradicted** by the strikethrough and the sequence.
5. **Motorcycle sequence vs cover type:** sequence item iv "Tokio Marine (TPFT)" while §2.2.2.1.1 #2 says motorcycle = "Comprehensive (V-CO) + Third Party (V-TP)". Confirm whether that applies to Zurich only.
6. **All Riders listed twice:** Plan Details note says All Riders "REMOVED from the Optional Coverage list", but Plan Details #5 and Add-Ons #1 still list "All Riders" under Motorcycle. Board says All Riders shows "below NCD" on the payment page (`knowledge/flow-zurich-takaful.md` §6 #5).
7. **TPFT eligibility on Secarang:** conditions cite "no hak milik (if got approved estm)". Secarang has no eSTM step. How this is checked on Secarang is unknown [unconfirmed].
8. **EV scope:** SRD lists EV plan details and add-ons; board notes say "EV car won't be included in this phase" and "Deprio as there are no TPFT for EV" (`knowledge/flow-zurich-takaful.md` §6a #4). Confirm EV in or out.
9. **Sequence must be re-confirmed:** dated for "13.05.2026 (Wed) deployment", which did not happen. The eAuto SRD says "Will need to confirm with PO the insurance quotation sequence before deployment." (`knowledge/flow-zurich-takaful.md` §2 #3.4).
10. **Bug sub-tasks vs V1.2 rules:** EAINT-11210 "Able to use Car and Bike VN in both tabs when getting quotation" and EAINT-11209 "Able to proceed with invalid postcodes" describe behaviour V1.2 now **allows** (§2.2.2.1.4 #2, §2.2.2.1.1 #4). Earlier Teams reply `[DM-Charmain-Ea-Chiang.md, 2026-05-11 16:58]` "yes by right should behave like this" (car tab only car VN) is superseded by V1.2. Check how those bugs were closed.
11. **Old test data invalid:** Zurich asked to redo UAT; 8606 description "10.06.2026 (Wed) Zurich want to proceed the UAT again as the data last time not longer valid anymore." (`knowledge/flow-zurich-takaful.md` §1 #3). Rebuild data before retest.
12. **Quotation figure is outdated:** Figure 2.2.2.1.1.1 shows the old Takaful Malaysia card (red box), no Zurich card. Use the Figma links for UI.
13. **Test env not named.** Secarang /preprod holds the 8608 branch (Header #12). Confirm with QA lead.
14. **Miro board tables unread** (30 tables, incl. SC_E2E TS detail). `knowledge/flow-zurich-takaful.md` "Gap".
15. **Index table gap:** §2.2.2.1 lists only "2.2.2.1.1 Insurance Quotation Page"; Plan Details, Add-Ons and Landing Page are missing from it. No impact on scope.

## Suggested test focus

1. **Quotation order** — car (Individual + Company) and motorcycle; Zurich Comp then TPFT/TP at the top; STM, Lonpac, Tokio Marine after. Re-check order against the PO's current answer.
2. **TPFT eligibility** — three triggers: year > 20; ≤ 20 with no quotes; ≤ 20 with sum insured < RM20,000. Plus a negative (≤ 20, ≥ RM20,000, quotes exist → no TPFT).
3. **Cover type per vehicle** — car shows TPFT; motorcycle shows "Third Party", never TPFT.
4. **Add-ons** — All Drivers pre-ticked + exact popup text; untick allowed. All Riders ticked and locked. Zurich TPFT hides/disables All Drivers, Breakage of Glass, Special Perils. Breakage of Glass sum covered is typed.
5. **Plan Details + More Info** — text per vehicle type; each hyperlink opens the right document (past bugs EAINT-11064, EAINT-11173).
6. **Landing page** — Car and Motorcycle tabs; car VN in motorcycle tab and the reverse both proceed with no error.
7. **Postcode** — Labuan blocked only when Lonpac chosen; Sabah, Sarawak, Perhentian (22300), Langkawi (07000) proceed.
8. **Takaful wording** — "Sum Covered", "Contribution", and the Insured/Participant term once V1.3 settles it.
9. **Agreed vs Market Value** (July requirement) — Agreed Value = 0 case leaves only Market Value.
10. **Downstream (from board, `knowledge/flow-zurich-takaful.md` §6)** — Fiuu payment success + failed, receipt + WhatsApp/email, PIAM ID "MTA-J55282", CIBO Transaction Management (filter + listing, past bugs EAINT-10968/10969), e-Certificate email (EAINT-11727), gender re-price (EAINT-11729).
11. **Regression** — STM, Tokio Marine and Lonpac quotes still work on Secarang.
12. **Retest open sub-task** EAINT-11505.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-zurich-takaful.md` — §6 Secarang flow and SC_E2E_TS1–28 catalogue with pass marks; §2a July requirements; §7 confirm-before-resume list.
2. `knowledge/flow-secarang-insurance.md` + `scripts/secarang-insurance` — a quick Secarang transaction tool (default insurer Zurich), **not** TS coverage, per Faizuddin 2026-10-22.
3. Miro board "eAuto & Secarang - Zurich" — `_reference/miro-links.txt` line 5.

## Knowledge candidates

1. **Correct `knowledge/flow-zurich-takaful.md` §2 #1** — SRD 8608 V1.1/V1.2 §2.1.1 a strike out "replacing Syarikat Takaful Malaysia"; STM stays in the sequence at iii–iv. Source: SRD_EAINT-8608 V1.2 p.6 and Table 2.2.2.1.1.1 #1 (p.11).
2. **Secarang test env for 8608** — `[Teams eAuto-Deployment-Notification.md, 2026-10-22 07:47]` "Secarang /preprod … via dev/feat/EAINT-8608 … preprod keeps its own EAINT-8608 / EAINT-8669 work." Add to `flow-zurich-takaful.md` §3.
3. **Lonpac in the Secarang sequence** — current list says "Hidden from Secarang since 14.07.2025"; new sequence puts Lonpac at v and V1.2 #4 makes Lonpac the only Labuan block. Source: SRD 8608 V1.2 Table 2.2.2.1.1.1 #1, #4.
4. **SRD history line** — V0.1 included motorcycle, V1.0 moved it to "separate SRD", V1.1/V1.2 added it back while keeping the "separate SRD" note. Source: SRD 8608 V0.1 p.6–7, V1.0 p.7, V1.2 p.7.
5. **Landing page VN rule reason** — "Note: As existing insurer API did not cater the vehicle type." Source: SRD 8608 V1.2 Table 2.2.2.1.4.1 #2 (p.23).
